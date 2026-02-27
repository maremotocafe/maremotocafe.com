import { useState, useEffect, useCallback } from "react";
import type { MenuItem, MenuCategory } from "../../data/types";
import { useAdmin } from "./AdminProvider";
import { updateItem, uploadImage, getImages } from "../api-client";

interface Props {
  item: MenuItem;
  filename: string;
  categories: MenuCategory[];
  onClose: () => void;
}

/** All editable text fields on a menu item. */
const TEXT_FIELDS: { key: keyof MenuItem; label: string }[] = [
  { key: "nombre", label: "Nombre" },
  { key: "ingredientes", label: "Ingredientes" },
  { key: "alergenos", label: "Alérgenos" },
  { key: "txt_aclaraciones", label: "Aclaraciones" },
  { key: "txt_temporal", label: "Temporalidad" },
  { key: "grad_alcoholica", label: "Graduación" },
  { key: "vol_ml", label: "Volumen (ml)" },
  { key: "edul_gr", label: "Edulcorantes (gr)" },
  { key: "pvp", label: "PVP" },
  { key: "pvp_local", label: "PVP Local" },
  { key: "pvp_terraza", label: "PVP Terraza" },
];

export default function AdminItemEditor({ item, filename, categories, onClose }: Props) {
  const { showToast } = useAdmin();
  const [draft, setDraft] = useState<MenuItem>({ ...item });
  const [uploading, setUploading] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);

  useEffect(() => {
    getImages().then(setAvailableImages).catch(() => {});
  }, []);

  // All available category names (flattened: categories + subcategories)
  const allCatNames = categories.flatMap((c) => [
    c.nombre,
    ...(c.subcategorias?.map((s) => s.nombre) || []),
  ]);

  const save = useCallback(async (next: MenuItem) => {
    setDraft(next);
    try {
      await updateItem(filename, next);
    } catch (e: unknown) {
      showToast(`Error: ${e instanceof Error ? e.message : e}`, "error");
    }
  }, [filename, showToast]);

  // Update local draft only (for text inputs while typing)
  const setLocal = (key: keyof MenuItem, value: string) => {
    setDraft((d) => {
      const next = { ...d, [key]: value || undefined };
      if (!value) delete (next as Record<string, unknown>)[key];
      if (key === "nombre") (next as Record<string, unknown>).nombre = value;
      return next;
    });
  };

  // Save on blur for text fields
  const saveField = (key: keyof MenuItem, value: string) => {
    const next = { ...draft, [key]: value || undefined };
    if (!value) delete (next as Record<string, unknown>)[key];
    if (key === "nombre") (next as Record<string, unknown>).nombre = value;
    save(next);
  };

  const toggleCategory = (cat: string) => {
    const cats = draft.categorias.includes(cat)
      ? draft.categorias.filter((c) => c !== cat)
      : [...draft.categorias, cat];
    save({ ...draft, categorias: cats });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { filename: imgFilename } = await uploadImage(file);
      setAvailableImages((prev) => prev.includes(imgFilename) ? prev : [...prev, imgFilename].sort());
      save({ ...draft, imagen: imgFilename });
      showToast(`Imagen subida: ${imgFilename}`, "success");
    } catch (err: unknown) {
      showToast(`Error subiendo imagen: ${err instanceof Error ? err.message : err}`, "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-start justify-center overflow-y-auto bg-black/50 py-8" onClick={onClose}>
      <div className="mx-4 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">
          <i className="las la-pen mr-1" />
          Editando: {filename}
        </h3>
        <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600">
          <i className="la la-times text-lg" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Text fields */}
        {TEXT_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="mb-0.5 block text-xs font-medium text-gray-500">{label}</label>
            <input
              type="text"
              value={(draft[key] as string) || ""}
              onChange={(e) => setLocal(key, e.target.value)}
              onBlur={(e) => saveField(key, e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
            />
          </div>
        ))}

        {/* Image fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-0.5 block text-xs font-medium text-gray-500">Imagen principal</label>
            <select
              value={draft.imagen || ""}
              onChange={(e) => save({ ...draft, imagen: e.target.value })}
              className="w-full cursor-pointer rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
            >
              <option value="">— Sin imagen —</option>
              {availableImages.map((img) => (
                <option key={img} value={img}>{img}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium text-gray-500">Imagen portada (pequeña)</label>
            <select
              value={draft.imagen_pequenya || ""}
              onChange={(e) => {
                const val = e.target.value;
                const next = { ...draft };
                if (val) next.imagen_pequenya = val;
                else delete (next as Record<string, unknown>).imagen_pequenya;
                save(next);
              }}
              className="w-full cursor-pointer rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
            >
              <option value="">— Sin portada —</option>
              {availableImages.map((img) => (
                <option key={img} value={img}>{img}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 ${uploading ? "opacity-50" : ""}`}>
            <i className={`${uploading ? "la la-spinner la-spin" : "la la-cloud-upload-alt"} text-xl`} />
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
          <label className="mb-1 block text-xs font-medium text-gray-500">Categorías</label>
          <div className="flex flex-wrap gap-1">
            {allCatNames.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`cursor-pointer rounded px-2 py-0.5 text-xs transition-colors ${
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

        {/* Flags */}
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-1 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={draft.prioridad || false}
              onChange={(e) => {
                const next = { ...draft };
                if (e.target.checked) next.prioridad = true;
                else delete (next as Record<string, unknown>).prioridad;
                save(next);
              }}
            />
            Prioritario
          </label>
          <label className="flex cursor-pointer items-center gap-1 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={draft.disponible !== false}
              onChange={(e) => {
                const next = { ...draft };
                if (e.target.checked) delete (next as Record<string, unknown>).disponible;
                else next.disponible = false;
                save(next);
              }}
            />
            Disponible
          </label>
        </div>

        {/* Orden */}
        <div>
          <label className="mb-0.5 block text-xs font-medium text-gray-500">Orden (menor = primero)</label>
          <input
            type="number"
            value={draft.orden ?? ""}
            onChange={(e) => {
              setDraft((d) => {
                const next = { ...d };
                if (e.target.value === "") delete (next as Record<string, unknown>).orden;
                else next.orden = parseInt(e.target.value, 10);
                return next;
              });
            }}
            onBlur={(e) => {
              const next = { ...draft };
              if (e.target.value === "") delete (next as Record<string, unknown>).orden;
              else next.orden = parseInt(e.target.value, 10);
              save(next);
            }}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>
      </div>
    </div>
  );
}
