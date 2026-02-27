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
  onSwap?: (dragFilename: string, dropFilename: string) => void;
}

export default function AdminItemOverlay({ item, filename, categories, children, onSwap }: Props) {
  const { editingFilename, setEditingFilename, showToast } = useAdmin();
  const [hovering, setHovering] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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
      className={`relative break-inside-avoid${dragOver ? " ring-2 ring-amber-400 rounded-xl" : ""}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", filename);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const dragFilename = e.dataTransfer.getData("text/plain");
        if (dragFilename && dragFilename !== filename) {
          onSwap?.(dragFilename, filename);
        }
      }}
      onDragEnd={() => setDragOver(false)}
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
