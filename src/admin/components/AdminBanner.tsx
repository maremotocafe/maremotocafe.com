import { useState, useEffect, lazy, Suspense } from "react";
import { useAdmin } from "./AdminProvider";
import {
  gitStatus,
  gitPull,
  gitPush,
  gitReset,
  gitCheckRemote,
  getCategories,
  type GitChange,
} from "../api-client";
import type { MenuCategory } from "../../data/types";
import AdminCategoryEditor from "./AdminCategoryEditor";

const AdminItemEditor = lazy(() => import("./AdminItemEditor"));

interface StatusData {
  branch: string;
  changes: GitChange[];
}

export default function AdminBanner() {
  const { showToast } = useAdmin();
  const [loading, setLoading] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [catEditorOpen, setCatEditorOpen] = useState(false);
  const [behind, setBehind] = useState(0);
  const [showNewItem, setShowNewItem] = useState(false);
  const [categories, setCategories] = useState<MenuCategory[]>([]);

  useEffect(() => {
    gitCheckRemote()
      .then((r) => setBehind(r.behind))
      .catch(() => {});
  }, []);

  const run = async (label: string, fn: () => Promise<void>) => {
    setLoading(label);
    try {
      await fn();
    } catch (e: unknown) {
      showToast(`Error: ${e instanceof Error ? e.message : e}`, "error");
    } finally {
      setLoading(null);
    }
  };

  const handleStatus = () =>
    run("Estado", async () => {
      const s = await gitStatus();
      setStatusData(s);
    });

  const handlePull = () => {
    if (!confirm("¿Bajar los últimos cambios del servidor?")) return;
    run("Bajar", async () => {
      const r = await gitPull();
      setBehind(0);
      showToast(`Pull: ${r.result}`, "success");
      setTimeout(() => location.reload(), 1500);
    });
  };

  const handlePush = () => {
    if (!confirm("¿Subir los cambios al servidor?")) return;
    run("Subir", async () => {
      await gitPush();
      showToast("Cambios subidos correctamente", "success");
    });
  };

  const handleReset = () => {
    if (
      !confirm(
        "¿Descartar TODOS los cambios locales y volver a la versión del servidor?",
      )
    )
      return;
    run("Reset", async () => {
      await gitReset();
      showToast("Reset completado — se recargará la página", "success");
      setTimeout(() => location.reload(), 1500);
    });
  };

  return (
    <>
      <div className="fixed top-0 right-0 left-0 z-[9999] flex items-center justify-between bg-amber-500 px-4 py-1.5 text-sm font-bold text-black shadow-md">
        <span className="text-base tracking-wide">MODO JESÚS ACTIVADO</span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCatEditorOpen(true)}
            className="rounded bg-amber-700/30 px-2.5 py-1 text-xs font-normal transition-colors hover:bg-amber-700/50"
          >
            <i className="las la-list mr-1" />
            Cambiar Categorías
          </button>
          <button
            onClick={async () => {
              if (categories.length === 0) {
                try {
                  setCategories(await getCategories());
                } catch {}
              }
              setShowNewItem(true);
            }}
            className="rounded bg-amber-700/30 px-2.5 py-1 text-xs font-normal transition-colors hover:bg-amber-700/50"
          >
            <i className="las la-plus mr-1" />
            Nuevo Item
          </button>
          <div className="mx-1 h-4 w-px bg-amber-700/30" />
          <button
            onClick={handleStatus}
            disabled={!!loading}
            className="rounded bg-amber-700/30 px-2.5 py-1 text-xs font-normal transition-colors hover:bg-amber-700/50 disabled:opacity-50"
          >
            <i
              className={`${loading === "Estado" ? "las la-spinner la-spin" : "las la-info-circle"} mr-1`}
            />
            Mostrar Cambios
          </button>
          <button
            onClick={handlePull}
            disabled={!!loading}
            className="rounded bg-blue-600 px-2.5 py-1 text-xs font-normal text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            <i
              className={`${loading === "Bajar" ? "las la-spinner la-spin" : "las la-download"} mr-1`}
            />
            Bajar Cambios
          </button>
          <button
            onClick={handlePush}
            disabled={!!loading}
            className="rounded bg-green-600 px-2.5 py-1 text-xs font-normal text-white transition-colors hover:bg-green-500 disabled:opacity-50"
          >
            <i
              className={`${loading === "Subir" ? "las la-spinner la-spin" : "las la-upload"} mr-1`}
            />
            Subir Cambios
          </button>
          <button
            onClick={handleReset}
            disabled={!!loading}
            className="rounded bg-red-600/80 px-2.5 py-1 text-xs font-normal text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            <i
              className={`${loading === "Reset" ? "las la-spinner la-spin" : "las la-undo"} mr-1`}
            />
            Resetear Cambios
          </button>
        </div>
      </div>

      {/* Status modal */}
      {statusData !== null && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
          onClick={() => setStatusData(null)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">
                <i className="las la-info-circle mr-1" />
                Estado de cambios
              </h3>
              <button
                onClick={() => setStatusData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="las la-times" />
              </button>
            </div>

            {statusData.changes.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                <i className="las la-check-circle mr-1 text-green-500" />
                No hay cambios pendientes
              </p>
            ) : (
              <ul className="max-h-[50vh] space-y-1.5 overflow-auto">
                {statusData.changes.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        c.action === "nuevo" || c.action === "añadido"
                          ? "bg-green-100 text-green-700"
                          : c.action === "eliminado"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {c.action}
                    </span>
                    <span className="text-gray-700">{c.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Remote changes popup */}
      {behind > 0 && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
            <i className="las la-cloud-download-alt text-5xl text-blue-500" />
            <h3 className="mt-3 text-lg font-bold text-gray-800">
              Hay cambios nuevos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {behind === 1
                ? "Hay 1 actualización disponible en el servidor."
                : `Hay ${behind} actualizaciones disponibles en el servidor.`}
            </p>
            <div className="mt-5 flex gap-3 justify-center">
              <button
                onClick={() => setBehind(0)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Ahora no
              </button>
              <button
                onClick={handlePull}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
              >
                <i className="las la-download mr-1" />
                Bajar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminCategoryEditor
        open={catEditorOpen}
        onClose={() => setCatEditorOpen(false)}
      />

      {showNewItem && categories.length > 0 && (
        <Suspense fallback={null}>
          <AdminItemEditor
            categories={categories}
            onClose={() => setShowNewItem(false)}
          />
        </Suspense>
      )}
    </>
  );
}
