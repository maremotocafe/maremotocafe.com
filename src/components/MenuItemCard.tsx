import { useState } from "react";

interface MenuItemCardProps {
  nombre: string;
  thumbnailSrc?: string;
  thumbAspectRatio?: number;
  disponible?: boolean;
  onClick: () => void;
}

export default function MenuItemCard({
  nombre,
  thumbnailSrc,
  thumbAspectRatio,
  disponible,
  onClick,
}: MenuItemCardProps) {
  const [loaded, setLoaded] = useState(false);
  const aspectRatio = thumbAspectRatio || 4 / 3;

  const isUnavailable = disponible === false;

  if (isUnavailable) {
    return (
      <button
        type="button"
        className="group w-full cursor-pointer text-left"
        onClick={onClick}
      >
        <div className="flex items-center justify-between rounded-lg bg-white/80 px-4 py-2.5">
          <span className="text-lg text-gray-400">{nombre}</span>
          <i className="las la-search shrink-0 text-lg text-gray-300 transition-colors group-hover:text-accent" />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="group w-full cursor-pointer text-left"
      onClick={onClick}
    >
      <div className="overflow-hidden rounded-lg">
        {thumbnailSrc ? (
          <div className="relative overflow-hidden">
            {!loaded && (
              <div className="shimmer w-full" style={{ aspectRatio }} />
            )}
            <img
              src={thumbnailSrc}
              alt={nombre}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={`w-full transition-opacity duration-300 ${loaded ? "opacity-100" : "absolute inset-0 opacity-0"}`}
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-white/5 text-text/30">
            <i className="las la-image text-4xl" />
          </div>
        )}
        <div className="flex min-h-[70px] items-center justify-between bg-white px-4 py-2.5">
          <span className="text-xl text-gray-600">{nombre}</span>
          <i className="las la-search shrink-0 text-xl text-gray-400 transition-colors group-hover:text-accent" />
        </div>
      </div>
    </button>
  );
}
