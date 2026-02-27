import { useState, useEffect, useCallback } from "react";
import type { MenuCategory } from "../../data/types";
import { useAdmin } from "./AdminProvider";
import { getCategories, updateCategories } from "../api-client";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AdminCategoryEditor({ open, onClose }: Props) {
  const { showToast } = useAdmin();
  const [cats, setCats] = useState<MenuCategory[]>([]);

  useEffect(() => {
    if (open) {
      getCategories()
        .then(setCats)
        .catch((e) => showToast(`Error: ${e.message}`, "error"));
    }
  }, [open]);

  const save = useCallback(
    async (next: MenuCategory[]) => {
      setCats(next);
      try {
        await updateCategories(next);
      } catch (e: unknown) {
        showToast(`Error: ${e instanceof Error ? e.message : e}`, "error");
      }
    },
    [showToast],
  );

  const addCategory = () => {
    save([...cats, { nombre: "", icono: "las la-utensils", color: "#cccccc" }]);
  };

  const updateCat = (idx: number, field: keyof MenuCategory, value: string) => {
    save(cats.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const removeCat = (idx: number) => {
    if (!confirm(`¿Eliminar la categoría "${cats[idx].nombre}"?`)) return;
    save(cats.filter((_, i) => i !== idx));
  };

  const moveCat = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= cats.length) return;
    const next = [...cats];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    save(next);
  };

  const addSubcategory = (catIdx: number) => {
    save(
      cats.map((c, i) =>
        i === catIdx
          ? {
              ...c,
              subcategorias: [...(c.subcategorias || []), { nombre: "" }],
            }
          : c,
      ),
    );
  };

  const updateSubcategory = (catIdx: number, subIdx: number, value: string) => {
    save(
      cats.map((c, i) =>
        i === catIdx
          ? {
              ...c,
              subcategorias: c.subcategorias?.map((s, j) =>
                j === subIdx ? { nombre: value } : s,
              ),
            }
          : c,
      ),
    );
  };

  const removeSubcategory = (catIdx: number, subIdx: number) => {
    const name =
      cats[catIdx].subcategorias?.[subIdx]?.nombre || "esta subcategoría";
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    save(
      cats.map((c, i) =>
        i === catIdx
          ? {
              ...c,
              subcategorias: c.subcategorias?.filter((_, j) => j !== subIdx),
            }
          : c,
      ),
    );
  };

  const moveSubcategory = (catIdx: number, subIdx: number, dir: -1 | 1) => {
    save(
      cats.map((c, i) => {
        if (i !== catIdx || !c.subcategorias) return c;
        const newIdx = subIdx + dir;
        if (newIdx < 0 || newIdx >= c.subcategorias.length) return c;
        const subs = [...c.subcategorias];
        [subs[subIdx], subs[newIdx]] = [subs[newIdx], subs[subIdx]];
        return { ...c, subcategorias: subs };
      }),
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-start justify-center overflow-y-auto bg-black/50 py-8"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            <i className="las la-list mr-1" />
            Gestión de Categorías
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <i className="la la-times text-xl" />
          </button>
        </div>

        <div className="space-y-4">
          {cats.map((cat, catIdx) => (
            <div key={catIdx} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveCat(catIdx, -1)}
                    className="cursor-pointer rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                  >
                    <i className="la la-angle-up" />
                  </button>
                  <button
                    onClick={() => moveCat(catIdx, 1)}
                    className="cursor-pointer rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                  >
                    <i className="la la-angle-down" />
                  </button>
                </div>
                <input
                  type="text"
                  value={cat.nombre}
                  onBlur={(e) => updateCat(catIdx, "nombre", e.target.value)}
                  onChange={(e) =>
                    setCats((prev) =>
                      prev.map((c, i) =>
                        i === catIdx ? { ...c, nombre: e.target.value } : c,
                      ),
                    )
                  }
                  placeholder="Nombre"
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm text-gray-700"
                />
                <input
                  type="text"
                  value={cat.icono}
                  onBlur={(e) => updateCat(catIdx, "icono", e.target.value)}
                  onChange={(e) =>
                    setCats((prev) =>
                      prev.map((c, i) =>
                        i === catIdx ? { ...c, icono: e.target.value } : c,
                      ),
                    )
                  }
                  placeholder="las la-icon"
                  className="w-36 rounded border border-gray-300 px-2 py-1 text-sm text-gray-700"
                />
                <input
                  type="color"
                  value={cat.color}
                  onChange={(e) => updateCat(catIdx, "color", e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border-0"
                />
                <button
                  onClick={() => removeCat(catIdx)}
                  className="cursor-pointer rounded bg-red-50 p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700"
                >
                  <i className="la la-trash text-sm" />
                </button>
              </div>

              {/* Subcategories */}
              <div className="ml-6 mt-2 space-y-1">
                {cat.subcategorias?.map((sub, subIdx) => (
                  <div key={subIdx} className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveSubcategory(catIdx, subIdx, -1)}
                        className="cursor-pointer rounded bg-gray-100 px-0.5 text-[10px] text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                      >
                        <i className="la la-angle-up" />
                      </button>
                      <button
                        onClick={() => moveSubcategory(catIdx, subIdx, 1)}
                        className="cursor-pointer rounded bg-gray-100 px-0.5 text-[10px] text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                      >
                        <i className="la la-angle-down" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={sub.nombre}
                      onBlur={(e) =>
                        updateSubcategory(catIdx, subIdx, e.target.value)
                      }
                      onChange={(e) =>
                        setCats((prev) =>
                          prev.map((c, i) =>
                            i === catIdx
                              ? {
                                  ...c,
                                  subcategorias: c.subcategorias?.map((s, j) =>
                                    j === subIdx
                                      ? { nombre: e.target.value }
                                      : s,
                                  ),
                                }
                              : c,
                          ),
                        )
                      }
                      placeholder="Subcategoría"
                      className="flex-1 rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600"
                    />
                    <button
                      onClick={() => removeSubcategory(catIdx, subIdx)}
                      className="cursor-pointer rounded bg-red-50 p-1 text-xs text-red-400 hover:bg-red-100 hover:text-red-600"
                    >
                      <i className="la la-times" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addSubcategory(catIdx)}
                  className="cursor-pointer rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                >
                  <i className="las la-plus mr-0.5" />
                  Subcategoría
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={addCategory}
            className="cursor-pointer rounded bg-amber-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-400"
          >
            <i className="las la-plus mr-1" />
            Nueva Categoría
          </button>
        </div>
      </div>
    </div>
  );
}
