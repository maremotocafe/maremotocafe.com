import { useState } from "react";
import type { MenuItem, MenuCategory } from "../../data/types";
import { useAdmin } from "./AdminProvider";
import { createItem, uploadImage } from "../api-client";

interface Props {
  categories: MenuCategory[];
  onClose: () => void;
}

const EMPTY_ITEM: MenuItem = {
  nombre: "",
  imagen: "",
  categorias: [],
};

export default function AdminNewItemDialog({ categories, onClose }: Props) {
  const { showToast } = useAdmin();
  const [draft, setDraft] = useState<MenuItem>({ ...EMPTY_ITEM });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const allCatNames = categories.flatMap((c) => [
    c.nombre,
    ...(c.subcategorias?.map((s) => s.nombre) || []),
  ]);

  const setField = (key: keyof MenuItem, value: string) => {
    setDraft((d) => {
      const next = { ...d, [key]: value || undefined };
      if (!value && key !== "nombre" && key !== "imagen") {
        delete (next as Record<string, unknown>)[key];
      }
      if (key === "nombre") (next as Record<string, unknown>).nombre = value;
      if (key === "imagen") (next as Record<string, unknown>).imagen = value;
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setDraft((d) => {
      const cats = d.categorias.includes(cat)
        ? d.categorias.filter((c) => c !== cat)
        : [...d.categorias, cat];
      return { ...d, categorias: cats };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { filename } = await uploadImage(file);
      setDraft((d) => ({ ...d, imagen: filename }));
      showToast(`Imagen subida: ${filename}`, "success");
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : err}`, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!draft.nombre) {
      showToast("El nombre es obligatorio", "error");
      return;
    }
    if (draft.categorias.length === 0) {
      showToast("Selecciona al menos una categoría", "error");
      return;
    }
    setSaving(true);
    try {
      const result = await createItem(draft);
      showToast(`"${draft.nombre}" creado como ${result.filename}`, "success");
      onClose();
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : err}`, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            <i className="las la-plus-circle mr-1" />
            Nuevo Item
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="las la-times text-xl" />
          </button>
        </div>

        <div className="grid gap-3">
          <div>
            <label className="mb-0.5 block text-xs font-medium text-gray-500">
              Nombre *
            </label>
            <input
              type="text"
              value={draft.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-0.5 block text-xs font-medium text-gray-500">
              Imagen
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft.imagen}
                onChange={(e) => setField("imagen", e.target.value)}
                placeholder="filename.jpg"
                className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
              />
              <label className="cursor-pointer rounded bg-amber-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-400">
                {uploading ? "..." : "Subir"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Categorías *
            </label>
            <div className="flex flex-wrap gap-1">
              {allCatNames.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded px-2 py-0.5 text-xs transition-colors ${
                    draft.categorias.includes(cat)
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Optional fields */}
          {[
            { key: "ingredientes" as const, label: "Ingredientes" },
            { key: "alergenos" as const, label: "Alérgenos" },
            { key: "pvp" as const, label: "PVP" },
            { key: "pvp_local" as const, label: "PVP Local" },
            { key: "pvp_terraza" as const, label: "PVP Terraza" },
            { key: "grad_alcoholica" as const, label: "Graduación" },
            { key: "vol_ml" as const, label: "Volumen (ml)" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-0.5 block text-xs font-medium text-gray-500">
                {label}
              </label>
              <input
                type="text"
                value={(draft[key] as string) || ""}
                onChange={(e) => setField(key, e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleCreate}
            disabled={saving}
            className="rounded bg-green-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
          >
            {saving ? "Creando..." : "Crear"}
          </button>
          <button
            onClick={onClose}
            className="rounded bg-gray-200 px-5 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
