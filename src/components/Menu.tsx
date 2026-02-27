import { useState, useMemo, useCallback, useRef } from "react";
import type { MenuItem, MenuCategory, MenuConfig } from "../data/types";
import MenuFilterBar from "./MenuFilterBar";
import MenuItemCard from "./MenuItemCard";
import MenuItemPopup from "./MenuItemPopup";

interface ResolvedImage {
  thumbnail: string;
  full: string;
  width: number;
  height: number;
  thumbAspectRatio: number;
}

interface MenuProps {
  config: MenuConfig;
  categories: MenuCategory[];
  items: MenuItem[];
  /** Map of image filename → { thumbnail, full } URLs (pre-resolved by Astro). */
  images: Record<string, ResolvedImage>;
}

/** Sort items: priority first, unavailable last, alphabetical within groups. */
function sortItems(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => {
    // Bucket: priority=0, normal=1, unavailable=2
    const bucketA = a.prioridad ? 0 : a.disponible === false ? 2 : 1;
    const bucketB = b.prioridad ? 0 : b.disponible === false ? 2 : 1;
    if (bucketA !== bucketB) return bucketA - bucketB;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

export default function Menu({
  config,
  categories,
  items,
  images,
}: MenuProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(
    null,
  );
  const [visibleCount, setVisibleCount] = useState(config.items_iniciales);
  const [popupItem, setPopupItem] = useState<MenuItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sorted items (stable)
  const sortedItems = useMemo(() => sortItems(items), [items]);

  // (activeCategoryObj available for future use by Jesús mode)

  // Filter items based on active filters
  const filteredItems = useMemo(() => {
    return sortedItems.filter((item) => {
      if (!activeCategory) return false; // No category selected → show nothing (like original)
      if (!item.categorias.includes(activeCategory)) return false;
      if (activeSubcategory && !item.categorias.includes(activeSubcategory))
        return false;
      return true;
    });
  }, [sortedItems, activeCategory, activeSubcategory]);

  // Items to display (paginated)
  const displayedItems = filteredItems.slice(0, visibleCount);
  const hasMore = filteredItems.length > visibleCount;

  // Category selection handler
  const handleCategorySelect = useCallback(
    (value: string) => {
      setActiveCategory(value);
      setActiveSubcategory(null);
      setVisibleCount(config.items_iniciales);
      // Scroll to show subcategories/items below the category bar
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      });
    },
    [config.items_iniciales],
  );

  // Subcategory selection handler
  const handleSubcategorySelect = useCallback(
    (value: string) => {
      // If selecting the "all" for this category, clear subcategory
      if (value === activeCategory) {
        setActiveSubcategory(null);
      } else {
        setActiveSubcategory(value);
      }
      setVisibleCount(config.items_iniciales);
    },
    [activeCategory, config.items_iniciales],
  );

  const handleClosePopup = useCallback(() => {
    setPopupItem(null);
  }, []);

  // Build category filter options (stable unless categories change)
  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat.nombre,
        label: cat.nombre,
        icon: cat.icono,
        color: cat.color,
      })),
    [categories],
  );

  return (
    <div>
      {/* Level 1: Categories */}
      <MenuFilterBar
        message={config.paso1}
        options={categoryOptions}
        activeValue={activeCategory || ""}
        visible={true}
        onSelect={handleCategorySelect}
      />

      {/* Scroll target — below categories, above subcategories/items */}
      <div ref={scrollRef} />

      {/* Level 2: Subcategories (only if active category has them) */}
      {categories.map((cat) => {
        if (!cat.subcategorias || cat.subcategorias.length === 0) return null;
        const isVisible = activeCategory === cat.nombre;

        return (
          <MenuFilterBar
            key={cat.nombre}
            message={config.paso2}
            options={cat.subcategorias.map((sub) => ({
              value: sub.nombre,
              label: sub.nombre,
              icon: cat.icono,
              color: cat.color,
            }))}
            activeValue={activeSubcategory || cat.nombre}
            visible={isVisible}
            resetOption={{
              value: cat.nombre,
              label: "Todo",
              icon: config.icono_todo,
              color: config.color_todo,
            }}
            onSelect={handleSubcategorySelect}
          />
        );
      })}

      {/* Screen reader announcement for filter changes */}
      <div className="sr-only" aria-live="polite" role="status">
        {activeCategory &&
          `Mostrando ${displayedItems.length} de ${filteredItems.length} items`}
      </div>

      {/* Item Grid */}
      {activeCategory && (
        <>
          {displayedItems.length > 0 ? (
            <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3">
              {displayedItems.map((item, i) => {
                const img = images[item.imagen];
                return (
                  <MenuItemCard
                    key={`${item.nombre}-${item.categorias.join("-")}`}
                    nombre={item.nombre}
                    thumbnailSrc={img?.thumbnail}
                    thumbAspectRatio={img?.thumbAspectRatio}
                    disponible={item.disponible}
                    staggerDelay={i < config.items_iniciales ? i * 30 : 0}
                    onClick={() => setPopupItem(item)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-8 text-center text-text">
              <i className={`${config.no_items_icono} mr-2`} />
              <span>{config.no_items_mensaje}</span>
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <button
              onClick={() =>
                setVisibleCount((prev) => prev + config.items_incremento)
              }
              className="mx-auto mt-6 block w-full rounded-lg bg-accent py-3 text-lg uppercase text-white transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]"
            >
              Cargar más
            </button>
          )}
        </>
      )}

      {/* Popup */}
      <MenuItemPopup
        item={popupItem}
        config={config}
        imageSrc={popupItem ? images[popupItem.imagen]?.full : undefined}
        imageWidth={popupItem ? images[popupItem.imagen]?.width : undefined}
        imageHeight={popupItem ? images[popupItem.imagen]?.height : undefined}
        onClose={handleClosePopup}
      />
    </div>
  );
}
