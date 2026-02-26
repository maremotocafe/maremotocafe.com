interface MenuItemCardProps {
  nombre: string;
  thumbnailSrc?: string;
  disponible?: boolean;
  staggerDelay?: number;
  onClick: () => void;
}

export default function MenuItemCard({
  nombre,
  thumbnailSrc,
  disponible,
  staggerDelay = 0,
  onClick,
}: MenuItemCardProps) {
  return (
    <button
      type="button"
      className="animate-fade-in group cursor-pointer text-left"
      style={{
        animationDelay: `${staggerDelay}ms`,
      }}
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-lg bg-white/5">
        {disponible !== false && thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={nombre}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-white/5 text-text/30">
            <i className="las la-image text-4xl" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
          <span className="text-sm font-medium text-white">{nombre}</span>
          <i className="las la-search ml-2 text-sm text-white/70 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </button>
  );
}
