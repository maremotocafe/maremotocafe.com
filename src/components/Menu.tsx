import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  lazy,
  Suspense,
} from "react";
import type {
  MenuItem,
  MenuCategory,
  MenuConfig,
  ResolvedImage,
} from "../data/types";
import MenuFilterBar from "./MenuFilterBar";
import MenuItemCard from "./MenuItemCard";
import MenuItemPopup from "./MenuItemPopup";

const AdminShell = import.meta.env.DEV
  ? lazy(() => import("../admin/components/AdminShell"))
  : null;
const AdminItemOverlay = import.meta.env.DEV
  ? lazy(() => import("../admin/components/AdminItemOverlay"))
  : null;
const AdminNewItemDialog = import.meta.env.DEV
  ? lazy(() => import("../admin/components/AdminNewItemDialog"))
  : null;

interface MenuProps {
  config: MenuConfig;
  categories: MenuCategory[];
  items: MenuItem[];
  /** Map of image filename → { thumbnail, full } URLs (pre-resolved by Astro). */
  images: Record<string, ResolvedImage>;
  /** Map of item nombre → JSON filename (for admin mode). */
  itemFilenames?: Record<string, string>;
}

/** Sort items: available first, unavailable last, then by orden, then alphabetical. */
function sortItems(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => {
    const bucketA = a.disponible === false ? 1 : 0;
    const bucketB = b.disponible === false ? 1 : 0;
    if (bucketA !== bucketB) return bucketA - bucketB;
    const ordenA = a.orden ?? Infinity;
    const ordenB = b.orden ?? Infinity;
    if (ordenA !== ordenB) return ordenA - ordenB;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

export default function Menu({
  config,
  categories,
  items,
  images,
  itemFilenames,
}: MenuProps) {
  const isDev = import.meta.env.DEV;
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(
    null,
  );
  const [visibleCount, setVisibleCount] = useState(config.items_iniciales);
  const [popupItem, setPopupItem] = useState<MenuItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sorted items (stable)
  const sortedItems = useMemo(() => sortItems(items), [items]);

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

  // Infinite scroll: load more when sentinel enters viewport
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => prev + config.items_incremento);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [config.items_incremento, activeCategory, activeSubcategory]);

  // Category selection handler
  const handleCategorySelect = useCallback(
    (value: string) => {
      setActiveCategory(value);
      setActiveSubcategory(null);
      setVisibleCount(config.items_iniciales);
      window.plausible?.("Category Selected", { props: { category: value } });
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
      window.plausible?.("Subcategory Selected", {
        props: { subcategory: value, category: activeCategory },
      });
    },
    [activeCategory, config.items_iniciales],
  );

  const handleClosePopup = useCallback(() => {
    setPopupItem(null);
  }, []);

  // Drag-and-drop swap: exchange orden values between two items (dev only)
  const handleSwap = useCallback(
    async (dragFilename: string, dropFilename: string) => {
      const dragItem = items.find(
        (i) => itemFilenames?.[i.nombre] === dragFilename,
      );
      const dropItem = items.find(
        (i) => itemFilenames?.[i.nombre] === dropFilename,
      );
      if (!dragItem || !dropItem) return;

      const dragOrden = dragItem.orden;
      const dropOrden = dropItem.orden;

      const { updateItem } = await import("../admin/api-client");
      await Promise.all([
        updateItem(dragFilename, { ...dragItem, orden: dropOrden }),
        updateItem(dropFilename, { ...dropItem, orden: dragOrden }),
      ]);
    },
    [items, itemFilenames],
  );

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

  const content = (
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
                const card = (
                  <MenuItemCard
                    key={`${item.nombre}-${item.categorias.join("-")}`}
                    nombre={item.nombre}
                    thumbnailSrc={img?.thumbnail}
                    thumbAspectRatio={img?.thumbAspectRatio}
                    disponible={item.disponible}
                    staggerDelay={i < config.items_iniciales ? i * 30 : 0}
                    onClick={() => {
                      setPopupItem(item);
                      window.plausible?.("Item Viewed", {
                        props: { item: item.nombre, category: activeCategory },
                      });
                    }}
                  />
                );
                if (isDev && AdminItemOverlay) {
                  const filename = itemFilenames?.[item.nombre] || "";
                  return (
                    <Suspense
                      key={`${item.nombre}-${item.categorias.join("-")}`}
                      fallback={card}
                    >
                      <AdminItemOverlay
                        item={item}
                        filename={filename}
                        categories={categories}
                        onSwap={handleSwap}
                      >
                        {card}
                      </AdminItemOverlay>
                    </Suspense>
                  );
                }
                return card;
              })}
            </div>
          ) : (
            <div className="mt-8 text-center text-text">
              <i className={`${config.no_items_icono} mr-2`} />
              <span>{config.no_items_mensaje}</span>
            </div>
          )}

          {/* Admin: New item button */}
          {isDev && AdminNewItemDialog && (
            <Suspense fallback={null}>
              <button
                type="button"
                onClick={() => setShowNewDialog(true)}
                className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-amber-400"
              >
                <i className="las la-plus" /> Nuevo Item
              </button>
              {showNewDialog && (
                <AdminNewItemDialog
                  categories={categories}
                  onClose={() => setShowNewDialog(false)}
                />
              )}
            </Suspense>
          )}

          {/* Infinite scroll sentinel */}
          {hasMore && <div ref={sentinelRef} className="h-1" />}
        </>
      )}

      {/* Popup */}
      <MenuItemPopup
        item={popupItem}
        config={config}
        imageSrc={popupItem ? images[popupItem.imagen]?.full : undefined}
        thumbnailSrc={
          popupItem ? images[popupItem.imagen]?.thumbnail : undefined
        }
        imageWidth={popupItem ? images[popupItem.imagen]?.width : undefined}
        imageHeight={popupItem ? images[popupItem.imagen]?.height : undefined}
        onClose={handleClosePopup}
      />
    </div>
  );

  if (isDev && AdminShell) {
    return (
      <Suspense fallback={content}>
        <AdminShell>{content}</AdminShell>
      </Suspense>
    );
  }

  return content;
}
