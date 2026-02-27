import { createPortal } from "react-dom";
import { AdminProvider } from "./AdminProvider";
import AdminBanner from "./AdminBanner";
import { useState, useEffect, type ReactNode } from "react";

export default function AdminShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <AdminProvider>
      {mounted && createPortal(<AdminBanner />, document.body)}
      {children}
    </AdminProvider>
  );
}
