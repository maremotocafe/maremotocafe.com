import { useEffect, useRef } from "react";
import type { MenuItem, MenuConfig } from "../data/types";

interface MenuItemPopupProps {
  item: MenuItem | null;
  config: MenuConfig;
  imageSrc?: string;
  onClose: () => void;
}

export default function MenuItemPopup({
  item,
  config,
  imageSrc,
  onClose,
}: MenuItemPopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (item) {
      dialog.showModal();
      // Push a hash so back button closes the popup
      if (!location.hash.includes("#item")) {
        history.pushState(null, "", `${location.pathname}#item`);
      }
    } else {
      dialog.close();
    }
  }, [item]);

  // Close on back button
  useEffect(() => {
    function onPopState() {
      if (item && !location.hash.includes("#item")) {
        onClose();
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [item, onClose]);

  // Determine if item is standalone (no data fields)
  const isStandalone = item
    ? config.nombres_datos.every(
        (key) => !item[key as keyof MenuItem],
      )
    : true;

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    // Close when clicking the backdrop (outside the inner content)
    if (e.target === dialogRef.current) {
      handleClose();
    }
  }

  function handleClose() {
    if (location.hash.includes("#item")) {
      history.back();
    }
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={handleClose}
      className="m-0 mx-auto my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-bg p-0 text-text"
    >
      {item && (
        <div className="relative">
          {/* Close button — sticky container with no height so it doesn't affect layout */}
          <div className="sticky top-0 z-10 h-0">
            <button
              onClick={handleClose}
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <i className="las la-times" />
            </button>
          </div>

          {isStandalone ? (
            /* Standalone: just the image, click to close */
            <button
              type="button"
              onClick={handleClose}
              aria-label={`Cerrar ${item.nombre}`}
              className="w-full"
            >
              <img
                src={imageSrc}
                alt={item.nombre}
                className="w-full"
              />
            </button>
          ) : (
            /* Full popup with details */
            <div className="md:flex">
              <div className="md:w-1/2">
                <img
                  src={imageSrc}
                  alt={item.nombre}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6 md:w-1/2">
                <h1 className="mb-4 text-2xl font-bold">{item.nombre}</h1>
                <div className="space-y-3">
                  {config.nombres_datos.map((key) => {
                    const value = item[key as keyof MenuItem] as
                      | string
                      | undefined;
                    if (!value) return null;

                    const title = config.titulos_datos[key];
                    const icon = config.iconos_datos[key];

                    return (
                      <div key={key}>
                        <p className="text-sm">
                          {icon && (
                            <i className={`field-icon ${icon} text-accent`} />
                          )}
                          {title && (
                            <span className="font-semibold">{title}: </span>
                          )}
                          <span className="text-text/80">{value}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
