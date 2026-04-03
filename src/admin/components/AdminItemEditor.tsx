import { useState, useEffect, useRef, useCallback } from "react";
import type { MenuItem, MenuCategory } from "../../data/types";
import { useAdmin } from "./AdminProvider";
import { createItem, updateItem, uploadImage, getImages } from "../api-client";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
// @ts-ignore — no type declarations for the JSON locale data
import esEmojiData from "emoji-picker-react/dist/data/emojis-es.json";

interface Props {
  item?: MenuItem;
  filename?: string;
  categories: MenuCategory[];
  onClose: () => void;
  onDelete?: () => void;
}

/** Fields that get an emoji picker button. */
const EMOJI_FIELDS: { key: keyof MenuItem; label: string }[] = [
  { key: "nombre", label: "Nombre" },
  { key: "ingredientes", label: "Ingredientes" },
];

/** Single-column text fields (rendered as wrapping textareas). */
const REGULAR_FIELDS: { key: keyof MenuItem; label: string }[] = [
  { key: "alergenos", label: "Alérgenos" },
  { key: "txt_aclaraciones", label: "Aclaraciones" },
  { key: "txt_temporal", label: "Temporalidad" },
  { key: "grad_alcoholica", label: "Graduación" },
];

/** PVP fields rendered side by side. */
const PVP_FIELDS: { key: keyof MenuItem; label: string }[] = [
  { key: "pvp", label: "PVP" },
  { key: "pvp_local", label: "PVP Local" },
  { key: "pvp_terraza", label: "PVP Terraza" },
];

/** Volume/sweetener fields rendered side by side. */
const VOLUME_FIELDS: { key: keyof MenuItem; label: string }[] = [
  { key: "vol_ml", label: "Volumen (ml)" },
  { key: "edul_gr", label: "Edulcorantes (gr)" },
];

const EMPTY_ITEM: MenuItem = { nombre: "", imagen: "", categorias: [] };

export default function AdminItemEditor({
  item,
  filename,
  categories,
  onClose,
  onDelete,
}: Props) {
  const isNew = !filename;
  const { showToast } = useAdmin();
  const initialItem = item ?? EMPTY_ITEM;
  const [draft, setDraft] = useState<MenuItem>({ ...initialItem });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [emojiPickerFor, setEmojiPickerFor] = useState<keyof MenuItem | null>(
    null,
  );
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const original = useRef(JSON.stringify(initialItem));

  const isDirty = JSON.stringify(draft) !== original.current;

  const downloadImage = async (imgFilename: string) => {
    try {
      const res = await fetch(`/src/assets/carta/${imgFilename}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = imgFilename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Error descargando imagen", "error");
    }
  };

  // Close emoji picker on click outside
  useEffect(() => {
    if (!emojiPickerFor) return;
    const handler = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setEmojiPickerFor(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [emojiPickerFor]);

  const handleEmojiClick = useCallback(
    (emojiData: EmojiClickData) => {
      if (!emojiPickerFor) return;
      setLocal(emojiPickerFor, ((draft[emojiPickerFor] as string) || "") + emojiData.emoji);
      setEmojiPickerFor(null);
    },
    [emojiPickerFor, draft],
  );

  useEffect(() => {
    getImages()
      .then(setAvailableImages)
      .catch(() => {});
  }, []);

  // Warn on tab close with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Subcategories for enabled categories only
  const enabledCategories = categories.filter((c) =>
    draft.categorias.includes(c.nombre),
  );
  const availableSubcategories = enabledCategories.flatMap(
    (c) => c.subcategorias?.map((s) => s.nombre) || [],
  );

  // Update local draft only (for text inputs while typing)
  const setLocal = (key: keyof MenuItem, value: string) => {
    setDraft((d) => {
      const next = { ...d, [key]: value || undefined };
      if (!value) delete (next as Record<string, unknown>)[key];
      if (key === "nombre") (next as Record<string, unknown>).nombre = value;
      return next;
    });
  };

  const toggleCategory = (catName: string) => {
    if (draft.categorias.includes(catName)) {
      setDraft({ ...draft, categorias: [] });
    } else {
      setDraft({ ...draft, categorias: [catName] });
    }
  };

  const toggleSubcategory = (subName: string) => {
    const cats = draft.categorias.includes(subName)
      ? draft.categorias.filter((c) => c !== subName)
      : [...draft.categorias, subName];
    setDraft({ ...draft, categorias: cats });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { filename: imgFilename } = await uploadImage(file);
      setAvailableImages((prev) =>
        prev.includes(imgFilename) ? prev : [...prev, imgFilename].sort(),
      );
      setDraft((d) => ({ ...d, imagen: imgFilename }));
      showToast(`Imagen subida: ${imgFilename}`, "success");
    } catch (err: unknown) {
      showToast(
        `Error subiendo imagen: ${err instanceof Error ? err.message : err}`,
        "error",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (isNew) {
      if (!draft.nombre) {
        showToast("El nombre es obligatorio", "error");
        return;
      }
      if (draft.categorias.length === 0) {
        showToast("Selecciona al menos una categoría", "error");
        return;
      }
    }
    const trimmed = { ...draft, nombre: draft.nombre.trim() };
    setSaving(true);
    try {
      if (isNew) {
        const result = await createItem(trimmed);
        showToast(
          `"${trimmed.nombre}" creado como ${result.filename}`,
          "success",
        );
      } else {
        await updateItem(filename!, trimmed);
        original.current = JSON.stringify(trimmed);
        showToast("Cambios guardados", "success");
      }
      onClose();
    } catch (e: unknown) {
      showToast(`Error: ${e instanceof Error ? e.message : e}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (!confirm("Hay cambios sin guardar. ¿Descartar cambios?")) return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-start justify-center overflow-y-auto bg-black/50 py-8"
      onClick={handleClose}
    >
      <div
        className="mx-4 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">
            <i className={`las ${isNew ? "la-plus-circle" : "la-pen"} mr-1`} />
            {isNew ? "Nuevo Item" : `Editando: ${filename}`}
          </h3>
          <button
            onClick={handleClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <i className="la la-times text-lg" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Fields with emoji picker */}
          {EMOJI_FIELDS.map(({ key, label }) => (
            <div key={key} className="relative">
              <label className="mb-0.5 block text-xs font-medium text-gray-500">
                {label}
              </label>
              <div className="flex items-start gap-1">
                <textarea
                  rows={1}
                  value={(draft[key] as string) || ""}
                  onChange={(e) => setLocal(key, e.target.value)}
                  className="field-sizing-content w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
                  style={{ resize: "none" }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setEmojiPickerFor(emojiPickerFor === key ? null : key)
                  }
                  className="shrink-0 cursor-pointer rounded border border-gray-300 px-1.5 py-1 text-sm hover:bg-gray-50"
                  title="Insertar emoji"
                >
                  😀
                </button>
              </div>
              {emojiPickerFor === key && (
                <div
                  ref={emojiPickerRef}
                  className="absolute right-0 z-50 mt-1"
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    emojiData={esEmojiData as any}
                    width={300}
                    height={400}
                    searchPlaceholder="Buscar emoji..."
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Regular text fields (wrapping) */}
          {REGULAR_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label className="mb-0.5 block text-xs font-medium text-gray-500">
                {label}
              </label>
              <textarea
                rows={1}
                value={(draft[key] as string) || ""}
                onChange={(e) => setLocal(key, e.target.value)}
                className="field-sizing-content w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
                style={{ resize: "none" }}
              />
            </div>
          ))}

          {/* PVP fields side by side */}
          <div className="grid grid-cols-3 gap-3">
            {PVP_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="mb-0.5 block text-xs font-medium text-gray-500">
                  {label}
                </label>
                <input
                  type="text"
                  value={(draft[key] as string) || ""}
                  onChange={(e) => setLocal(key, e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* Volumen & Edulcorantes side by side */}
          <div className="grid grid-cols-2 gap-3">
            {VOLUME_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="mb-0.5 block text-xs font-medium text-gray-500">
                  {label}
                </label>
                <input
                  type="text"
                  value={(draft[key] as string) || ""}
                  onChange={(e) => setLocal(key, e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* Image fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-0.5 block text-xs font-medium text-gray-500">
                Imagen principal
              </label>
              <div className="flex gap-1">
                <select
                  value={draft.imagen || ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, imagen: e.target.value }))
                  }
                  className="min-w-0 flex-1 cursor-pointer rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
                >
                  <option value="">— Sin imagen —</option>
                  {availableImages.map((img) => (
                    <option key={img} value={img}>
                      {img}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!draft.imagen}
                  onClick={() => draft.imagen && downloadImage(draft.imagen)}
                  className="shrink-0 cursor-pointer rounded border border-gray-300 px-1.5 py-1 text-sm text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Descargar imagen"
                >
                  <i className="la la-download" />
                </button>
              </div>
              {draft.imagen && (
                <img
                  src={`/src/assets/carta/${draft.imagen}`}
                  alt={draft.imagen}
                  className="mt-1.5 h-20 w-full rounded border border-gray-200 object-cover"
                />
              )}
            </div>
            <div>
              <label className="mb-0.5 block text-xs font-medium text-gray-500">
                Imagen portada (pequeña)
              </label>
              <div className="flex gap-1">
                <select
                  value={draft.imagen_pequenya || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((d) => {
                      const next = { ...d };
                      if (val) next.imagen_pequenya = val;
                      else
                        delete (next as Record<string, unknown>).imagen_pequenya;
                      return next;
                    });
                  }}
                  className="min-w-0 flex-1 cursor-pointer rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
                >
                  <option value="">— Sin portada —</option>
                  {availableImages.map((img) => (
                    <option key={img} value={img}>
                      {img}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!draft.imagen_pequenya}
                  onClick={() => draft.imagen_pequenya && downloadImage(draft.imagen_pequenya)}
                  className="shrink-0 cursor-pointer rounded border border-gray-300 px-1.5 py-1 text-sm text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Descargar imagen"
                >
                  <i className="la la-download" />
                </button>
              </div>
              {draft.imagen_pequenya && (
                <img
                  src={`/src/assets/carta/${draft.imagen_pequenya}`}
                  alt={draft.imagen_pequenya}
                  className="mt-1.5 h-20 w-full rounded border border-gray-200 object-cover"
                />
              )}
            </div>
          </div>
          <div>
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 ${uploading ? "opacity-50" : ""}`}
            >
              <i
                className={`${uploading ? "la la-spinner la-spin" : "la la-cloud-upload-alt"} text-xl`}
              />
              {uploading ? "Subiendo..." : "Subir nueva imagen"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Categories */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Categorías
            </label>
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.nombre}
                  type="button"
                  onClick={() => toggleCategory(cat.nombre)}
                  className={`cursor-pointer rounded px-2 py-0.5 text-xs transition-colors ${
                    draft.categorias.includes(cat.nombre)
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategories (only for enabled categories) */}
          {availableSubcategories.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Subcategorías
              </label>
              <div className="flex flex-wrap gap-1">
                {availableSubcategories.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubcategory(sub)}
                    className={`cursor-pointer rounded px-2 py-0.5 text-xs transition-colors ${
                      draft.categorias.includes(sub)
                        ? "bg-amber-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Flags */}
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-1 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={draft.disponible !== false}
                onChange={(e) => {
                  setDraft((d) => {
                    const next = { ...d };
                    if (e.target.checked)
                      delete (next as Record<string, unknown>).disponible;
                    else next.disponible = false;
                    return next;
                  });
                }}
              />
              Disponible
            </label>
          </div>

          {/* Footer: Delete left, Cancelar + Confirmar right */}
          <div
            className={`mt-2 flex items-center border-t border-gray-200 pt-3 ${isNew ? "justify-end" : "justify-between"}`}
          >
            {!isNew && (
              <button
                type="button"
                onClick={onDelete}
                className="cursor-pointer rounded-lg bg-red-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-red-500"
              >
                <i className="la la-trash mr-1" />
                Eliminar item
              </button>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  isNew
                    ? !draft.nombre || draft.categorias.length === 0 || saving
                    : !isDirty || draft.categorias.length === 0 || saving
                }
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${isNew ? "bg-green-600 text-white hover:bg-green-500" : "bg-amber-500 text-black hover:bg-amber-400"}`}
              >
                {isNew
                  ? saving
                    ? "Creando..."
                    : "Crear"
                  : saving
                    ? "Guardando..."
                    : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
