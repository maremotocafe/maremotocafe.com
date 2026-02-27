import { useState } from "react";

interface MenuItemCardProps {
  nombre: string;
  thumbnailSrc?: string;
  thumbAspectRatio?: number;
  disponible?: boolean;
  staggerDelay?: number;
  onClick: () => void;
}

export default function MenuItemCard({
  nombre,
  thumbnailSrc,
  thumbAspectRatio,
  disponible,
  staggerDelay = 0,
  onClick,
}: MenuItemCardProps) {
  const [loaded, setLoaded] = useState(false);
  const aspectRatio = thumbAspectRatio || 4 / 3;

  return (
    <button
      type="button"
      className="animate-fade-in group mb-4 w-full cursor-pointer break-inside-avoid text-left"
      style={{
        animationDelay: `${staggerDelay}ms`,
      }}
      onClick={onClick}
    >
      <div className="overflow-hidden rounded-lg">
        {disponible !== false && thumbnailSrc ? (
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
