import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface AdminContextValue {
  editingFilename: string | null;
  setEditingFilename: (f: string | null) => void;
  toasts: Toast[];
  showToast: (message: string, type?: Toast["type"]) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

let toastId = 0;

export function AdminProvider({ children }: { children: ReactNode }) {
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        editingFilename,
        setEditingFilename,
        toasts,
        showToast,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed right-4 top-16 z-[10000] flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all ${
                t.type === "success"
                  ? "bg-green-600 text-white"
                  : t.type === "error"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-white"
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
