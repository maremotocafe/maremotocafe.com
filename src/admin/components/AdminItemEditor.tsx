import { useState } from "react";
import type { MenuItem, MenuCategory } from "../../data/types";
import { useAdmin } from "./AdminProvider";
import { updateItem, uploadImage } from "../api-client";

interface Props {
  item: MenuItem;
  filename: string;
  categories: MenuCategory[];
  onClose: () => void;
}

/** All editable fields on a menu item. */
const TEXT_FIELDS: { key: keyof MenuItem; label: string }[] = [
  { key: "nombre", label: "Nombre" },
  { key: "imagen", label: "Imagen" },
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
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // All available category names (flattened: categories + subcategories)
  const allCatNames = categories.flatMap((c) => [
    c.nombre,
    ...(c.subcategorias?.map((s) => s.nombre) || []),
  ]);

  const setField = (key: keyof MenuItem, value: string) => {
    setDraft((d) => {
      const next = { ...d, [key]: value || undefined };
      if (!value) delete (next as Record<string, unknown>)[key];
      // Keep nombre always present
      if (key === "nombre") (next as Record<string, unknown>).nombre = value;
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
      const { filename: imgFilename } = await uploadImage(file);
      setDraft((d) => ({ ...d, imagen: imgFilename }));
      showToast(`Imagen subida: ${imgFilename}`, "success");
    } catch (err: unknown) {
      showToast(`Error subiendo imagen: ${err instanceof Error ? err.message : err}`, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!draft.nombre) {
      showToast("El nombre es obligatorio", "error");
      return;
    }
    setSaving(true);
    try {
      await updateItem(filename, draft);
      showToast(`"${draft.nombre}" guardado`, "success");
      onClose();
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : err}`, "error");
    } finally {
      setSaving(false);
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
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <i className="las la-times text-lg" />
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
              onChange={(e) => setField(key, e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
            />
          </div>
        ))}

        {/* Image upload */}
        <div>
          <label className="mb-0.5 block text-xs font-medium text-gray-500">Subir imagen</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="w-full text-sm text-gray-500"
          />
          {uploading && <span className="text-xs text-amber-600">Subiendo...</span>}
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

        {/* Flags */}
        <div className="flex gap-4">
          <label className="flex items-center gap-1 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={draft.prioridad || false}
              onChange={(e) =>
                setDraft((d) => {
                  const next = { ...d };
                  if (e.target.checked) next.prioridad = true;
                  else delete (next as Record<string, unknown>).prioridad;
                  return next;
                })
              }
            />
            Prioritario
          </label>
          <label className="flex items-center gap-1 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={draft.disponible !== false}
              onChange={(e) =>
                setDraft((d) => {
                  const next = { ...d };
                  if (e.target.checked) delete (next as Record<string, unknown>).disponible;
                  else next.disponible = false;
                  return next;
                })
              }
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
            onChange={(e) =>
              setDraft((d) => {
                const next = { ...d };
                if (e.target.value === "") delete (next as Record<string, unknown>).orden;
                else next.orden = parseInt(e.target.value, 10);
                return next;
              })
            }
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-green-600 px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button
          onClick={onClose}
          className="rounded bg-gray-200 px-4 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
      </div>
    </div>
  );
}
