import { useEffect, useRef, useState } from "react";
import type { MenuItem, MenuConfig } from "../data/types";

/** Parse *italic* markers into <em> elements */
function formatInline(text: string) {
  const parts = text.split(/\*([^*]+)\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : part));
}

interface MenuItemPopupProps {
  item: MenuItem | null;
  config: MenuConfig;
  imageSrc?: string;
  thumbnailSrc?: string;
  imageWidth?: number;
  imageHeight?: number;
  onClose: () => void;
}

export default function MenuItemPopup({
  item,
  config,
  imageSrc,
  thumbnailSrc,
  imageWidth,
  imageHeight,
  onClose,
}: MenuItemPopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset image loaded state when item changes
  useEffect(() => {
    setImageLoaded(false);
  }, [item]);

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
    ? config.nombres_datos.every((key) => !item[key as keyof MenuItem])
    : true;

  const aspectRatio =
    imageWidth && imageHeight ? imageWidth / imageHeight : 4 / 3;

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
      className="m-0 h-dvh w-dvw max-h-none max-w-none overflow-y-auto bg-bg p-0 text-text md:m-auto md:h-fit md:w-full md:max-h-[90vh] md:max-w-3xl md:rounded-xl"
    >
      {item && (
        <div className="relative">
          {/* Close button — sticky container with no height so it doesn't affect layout */}
          <div className="sticky top-0 z-10 h-0">
            <button
              onClick={handleClose}
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition-colors hover:bg-black/90"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
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
              <div className="relative">
                {thumbnailSrc ? (
                  <img
                    src={thumbnailSrc}
                    alt=""
                    className="w-full"
                    style={{ aspectRatio }}
                  />
                ) : (
                  <div className="shimmer w-full" style={{ aspectRatio }} />
                )}
                <img
                  src={imageSrc}
                  alt={item.nombre}
                  width={imageWidth}
                  height={imageHeight}
                  onLoad={() => setImageLoaded(true)}
                  className={`absolute inset-0 w-full transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                />
              </div>
            </button>
          ) : (
            /* Full popup with details */
            <div className="md:flex">
              <div className="md:w-1/2">
                <div className="relative md:h-full">
                  {thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt=""
                      className="h-full w-full object-cover"
                      style={{ aspectRatio }}
                    />
                  ) : (
                    <div className="shimmer w-full" style={{ aspectRatio }} />
                  )}
                  <img
                    src={imageSrc}
                    alt={item.nombre}
                    width={imageWidth}
                    height={imageHeight}
                    onLoad={() => setImageLoaded(true)}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                  />
                </div>
              </div>
              <div className="p-6 pr-16 md:w-1/2">
                <h1 className="mb-4 text-3xl font-bold">{item.nombre}</h1>
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
                        <p className="text-base">
                          {icon && (
                            <i className={`field-icon ${icon} text-accent`} />
                          )}
                          {title && (
                            <span className="font-semibold">{title}: </span>
                          )}
                          <span className="text-text">
                            {formatInline(value)}
                          </span>
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
