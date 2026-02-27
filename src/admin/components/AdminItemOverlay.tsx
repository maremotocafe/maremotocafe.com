import { useState } from "react";
import { createPortal } from "react-dom";
import type { MenuItem, MenuCategory } from "../../data/types";
import { useAdmin } from "./AdminProvider";
import { deleteItem } from "../api-client";
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

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;
    try {
      await deleteItem(filename);
      showToast(`"${item.nombre}" eliminado`, "success");
      setEditingFilename(null);
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
      {/* Edit button on hover */}
      {hovering && !isEditing && (
        <button
          onClick={(e) => { e.stopPropagation(); setEditingFilename(filename); }}
          className="absolute top-2 right-2 z-50 cursor-pointer rounded-lg bg-blue-600 px-2.5 py-1.5 text-white shadow-lg hover:bg-blue-500"
          title="Editar"
        >
          <i className="la la-pen text-base" />
        </button>
      )}

      {children}

      {/* Modal editor */}
      {isEditing && createPortal(
        <AdminItemEditor
          item={item}
          filename={filename}
          categories={categories}
          onClose={() => setEditingFilename(null)}
          onDelete={handleDelete}
        />,
        document.body,
      )}
    </div>
  );
}
