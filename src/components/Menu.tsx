import { useState, useMemo, useCallback } from "react";
import type { MenuItem, MenuCategory, MenuConfig } from "../data/types";
import MenuFilterBar from "./MenuFilterBar";
import MenuItemCard from "./MenuItemCard";
import MenuItemPopup from "./MenuItemPopup";

interface ResolvedImage {
  thumbnail: string;
  full: string;
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
  const high: MenuItem[] = [];
  const normal: MenuItem[] = [];
  const low: MenuItem[] = [];

  for (const item of [...items].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es"),
  )) {
    if (item.prioridad === true) high.push(item);
    else if (item.disponible === false) low.push(item);
    else normal.push(item);
  }

  return [...high, ...normal, ...low];
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

  // Build category filter options
  const categoryOptions = categories.map((cat) => ({
    value: cat.nombre,
    label: cat.nombre,
    icon: cat.icono,
    color: cat.color,
  }));

  return (
    <div>
      {/* Level 1: Categories */}
      <MenuFilterBar
        level={1}
        message={config.paso1}
        options={categoryOptions}
        activeValue={activeCategory || ""}
        visible={true}
        onSelect={handleCategorySelect}
      />

      {/* Level 2: Subcategories (only if active category has them) */}
      {categories.map((cat) => {
        if (!cat.subcategorias || cat.subcategorias.length === 0) return null;
        const isVisible = activeCategory === cat.nombre;

        return (
          <MenuFilterBar
            key={cat.nombre}
            level={2}
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

      {/* Item Grid */}
      {activeCategory && (
        <>
          {displayedItems.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedItems.map((item, i) => {
                const img = images[item.imagen];
                return (
                  <MenuItemCard
                    key={`${item.nombre}-${item.categorias.join("-")}-${i}`}
                    nombre={item.nombre}
                    thumbnailSrc={img?.thumbnail}
                    disponible={item.disponible}
                    staggerDelay={i < config.items_iniciales ? i * 30 : 0}
                    onClick={() => setPopupItem(item)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-8 text-center text-text/60">
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
              className="mx-auto mt-6 block w-full rounded-lg bg-accent py-3 font-semibold uppercase text-bg transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
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
        onClose={handleClosePopup}
      />
    </div>
  );
}
