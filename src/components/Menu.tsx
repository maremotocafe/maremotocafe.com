import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  createContext,
  useContext,
  lazy,
  Suspense,
} from "react";
import { Masonry, useInfiniteLoader } from "masonic";
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
const AdminNewItemDialog = import.meta.env.DEV
  ? lazy(() => import("../admin/components/AdminNewItemDialog"))
  : null;

// WARNING: Do NOT use lazy()/Suspense for AdminItemOverlay. When Suspense resolves
// a lazy component, it unmounts the fallback and mounts the real tree — causing every
// menu item card to visibly flash (appear → disappear → reappear). Instead, we eagerly
// import the module and store it in component state so cards are never unmounted.
const adminItemOverlayPromise = import.meta.env.DEV
  ? import("../admin/components/AdminItemOverlay")
  : null;

/** Extended item with pre-resolved data for masonry cards. */
interface MasonryItem extends MenuItem {
  id: string;
  _img?: ResolvedImage;
  _filename: string;
}

/** Context providing menu-level state to masonry card components. */
const CardContext = createContext<{
  onItemClick: (item: MasonryItem) => void;
  AdminItemOverlay: React.ComponentType<any> | null;
  categories: MenuCategory[];
  onSwap: (a: string, b: string) => Promise<void>;
}>(null!);

/** Masonry card renderer — defined at module level for a stable reference. */
const MasonryCard = ({ data }: { data: MasonryItem; index: number; width: number }) => {
  const { onItemClick, AdminItemOverlay, categories, onSwap } =
    useContext(CardContext);
  const card = (
    <MenuItemCard
      nombre={data.nombre}
      thumbnailSrc={data._img?.thumbnail}
      thumbAspectRatio={data._img?.thumbAspectRatio}
      disponible={data.disponible}
      onClick={() => onItemClick(data)}
    />
  );
  if (AdminItemOverlay) {
    return (
      <AdminItemOverlay
        item={data}
        filename={data._filename}
        categories={categories}
        onSwap={onSwap}
      >
        {card}
      </AdminItemOverlay>
    );
  }
  return card;
};

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
  const [AdminItemOverlay, setAdminItemOverlay] =
    useState<React.ComponentType<any> | null>(null);
  useEffect(() => {
    adminItemOverlayPromise?.then((mod) =>
      setAdminItemOverlay(() => mod.default),
    );
  }, []);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(
    null,
  );
  const [visibleCount, setVisibleCount] = useState(config.items_iniciales);
  const [popupItem, setPopupItem] = useState<MenuItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeCategoryRef = useRef(activeCategory);
  activeCategoryRef.current = activeCategory;

  // Sorted items (stable)
  const sortedItems = useMemo(() => sortItems(items), [items]);

  // Filter items based on active filters
  const filteredItems = useMemo(() => {
    return sortedItems.filter((item) => {
      if (!activeCategory) return false;
      if (!item.categorias.includes(activeCategory)) return false;
      if (activeSubcategory && !item.categorias.includes(activeSubcategory))
        return false;
      return true;
    });
  }, [sortedItems, activeCategory, activeSubcategory]);

  // Masonry items with pre-resolved data
  const allMasonryItems = useMemo(
    () =>
      filteredItems.map((item) => ({
        ...item,
        id: `${item.nombre}-${item.categorias.join("-")}`,
        _img: images[item.imagen],
        _filename: itemFilenames?.[item.nombre] || "",
      })),
    [filteredItems, images, itemFilenames],
  );

  // Items to display (paginated via infinite loader)
  const displayedItems = useMemo(
    () => allMasonryItems.slice(0, visibleCount),
    [allMasonryItems, visibleCount],
  );

  // Ref for total count (used in async loader to avoid stale closure)
  const totalRef = useRef(allMasonryItems.length);
  totalRef.current = allMasonryItems.length;

  // Infinite loader: reveal more pre-loaded items as user scrolls
  const maybeLoadMore = useInfiniteLoader(
    async (_startIndex, stopIndex) => {
      setVisibleCount((prev) =>
        Math.min(totalRef.current, Math.max(prev, stopIndex + 1)),
      );
    },
    {
      isItemLoaded: (index, items) => !!items[index],
      minimumBatchSize: config.items_incremento,
      threshold: 3,
    },
  );

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

  // Item click handler (stable via ref for activeCategory)
  const onItemClick = useCallback((item: MasonryItem) => {
    setPopupItem(item);
    window.plausible?.("Item Viewed", {
      props: { item: item.nombre, category: activeCategoryRef.current },
    });
  }, []);

  // Card context (for stable masonry render component)
  const cardCtx = useMemo(
    () => ({
      onItemClick,
      AdminItemOverlay,
      categories,
      onSwap: handleSwap,
    }),
    [onItemClick, AdminItemOverlay, categories, handleSwap],
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
          `Mostrando ${displayedItems.length} de ${allMasonryItems.length} items`}
      </div>

      {/* Item Grid */}
      {activeCategory && (
        <>
          {displayedItems.length > 0 ? (
            <CardContext.Provider value={cardCtx}>
              <div className="mt-6">
                <Masonry
                  key={`${activeCategory}-${activeSubcategory}`}
                  items={displayedItems}
                  onRender={maybeLoadMore}
                  render={MasonryCard}
                  columnGutter={16}
                  columnWidth={280}
                  overscanBy={5}
                />
              </div>
            </CardContext.Provider>
          ) : (
            <div className="mt-8 text-center text-text">
              <i className={`${config.no_items_icono} mr-2`} />
              <span>{config.no_items_mensaje}</span>
            </div>
          )}

          {/* Admin: New item button */}
          {isDev && AdminNewItemDialog && (
            <>
              <button
                type="button"
                onClick={() => setShowNewDialog(true)}
                className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-amber-400"
              >
                <i className="las la-plus" /> Nuevo Item
              </button>
              {showNewDialog && (
                <Suspense fallback={null}>
                  <AdminNewItemDialog
                    categories={categories}
                    onClose={() => setShowNewDialog(false)}
                  />
                </Suspense>
              )}
            </>
          )}
        </>
      )}

      {/* Popup */}
      <MenuItemPopup
        item={popupItem}
        config={config}
        imageSrc={popupItem ? images[popupItem.imagen]?.full : undefined}
        thumbnailSrc={
          popupItem ? images[popupItem.imagen]?.popupThumbnail : undefined
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
