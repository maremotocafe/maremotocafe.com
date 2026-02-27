import { useState } from "react";
import { createPortal } from "react-dom";
import type { MenuItem, MenuCategory } from "../../data/types";
import { useAdmin } from "./AdminProvider";
import { updateItem, deleteItem } from "../api-client";
import AdminItemEditor from "./AdminItemEditor";

interface Props {
  item: MenuItem;
  filename: string;
  categories: MenuCategory[];
  children: React.ReactNode;
}

export default function AdminItemOverlay({ item, filename, categories, children }: Props) {
  const { editingFilename, setEditingFilename, showToast } = useAdmin();
  const [hovering, setHovering] = useState(false);
  const isEditing = editingFilename === filename;

  const togglePriority = async () => {
    try {
      const updated = { ...item, prioridad: !item.prioridad };
      await updateItem(filename, updated);
      showToast(updated.prioridad ? "Marcado prioritario" : "Prioridad quitada", "success");
    } catch (e: unknown) {
      showToast(`Error: ${e instanceof Error ? e.message : e}`, "error");
    }
  };

  const toggleAvailable = async () => {
    try {
      const updated = { ...item, disponible: item.disponible === false ? undefined : false };
      if (updated.disponible === undefined) delete (updated as Record<string, unknown>).disponible;
      await updateItem(filename, updated);
      showToast(
        item.disponible === false ? "Marcado disponible" : "Marcado no disponible",
        "success",
      );
    } catch (e: unknown) {
      showToast(`Error: ${e instanceof Error ? e.message : e}`, "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;
    try {
      await deleteItem(filename);
      showToast(`"${item.nombre}" eliminado`, "success");
    } catch (e: unknown) {
      showToast(`Error: ${e instanceof Error ? e.message : e}`, "error");
    }
  };

  return (
    <div
      className="relative break-inside-avoid"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Overlay buttons */}
      {hovering && !isEditing && (
        <div className="absolute top-2 right-2 z-50 flex gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingFilename(filename); }}
            className="cursor-pointer rounded-lg bg-blue-600 px-2.5 py-1.5 text-white shadow-lg hover:bg-blue-500"
            title="Editar"
          >
            <i className="la la-pen text-base" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); togglePriority(); }}
            className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-white shadow-lg ${item.prioridad ? "bg-yellow-500 hover:bg-yellow-400" : "bg-gray-600 hover:bg-gray-500"}`}
            title="Prioridad"
          >
            <i className="la la-star text-base" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleAvailable(); }}
            className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-white shadow-lg ${item.disponible === false ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"}`}
            title="Disponibilidad"
          >
            <i className={`la ${item.disponible === false ? "la-eye-slash" : "la-eye"} text-base`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="cursor-pointer rounded-lg bg-red-700 px-2.5 py-1.5 text-white shadow-lg hover:bg-red-600"
            title="Eliminar"
          >
            <i className="la la-trash text-base" />
          </button>
        </div>
      )}

      {children}

      {/* Modal editor */}
      {isEditing && createPortal(
        <AdminItemEditor
          item={item}
          filename={filename}
          categories={categories}
          onClose={() => setEditingFilename(null)}
        />,
        document.body,
      )}
    </div>
  );
}
