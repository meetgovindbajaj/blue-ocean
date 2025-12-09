"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import Anchor from "../shared/Anchor";
import type { HeroBanner } from "@/types/heroBanner";
import styles from "./categoryDropdown.module.css";
import CarouselWrapper, { CarouselItem } from "@/components/ui/CarouselWrapper";

// Local interfaces since we fetch data directly
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    thumbnailUrl?: string;
  };
  productCount: number;
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  prices: {
    wholesale: number;
    retail: number;
    discount: number;
  };
  images: {
    id: string;
    url: string;
    thumbnailUrl: string;
  }[];
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  size?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
}

type PreviewState =
  | { type: "default" }
  | { type: "category"; category: Category }
  | { type: "product"; product: Product };

const getImageUrl = (image: any): string => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.thumbnailUrl || image.url || "";
};

const CategoryDropdown = ({ id }: { id: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredParentCategory, setHoveredParentCategory] =
    useState<Category | null>(null);
  const [hoveredSubCategory, setHoveredSubCategory] =
    useState<Category | null>(null);
  const [previewState, setPreviewState] = useState<PreviewState>({
    type: "default",
  });

  // Local data state - fetch directly
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);

  // Fetch data when dropdown opens (lazy loading)
  useEffect(() => {
    if (isOpen && !dataFetched) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [categoriesRes, productsRes, bannersRes] = await Promise.all([
            fetch("/api/categories?parentOnly=true"),
            fetch("/api/products?limit=100"),
            fetch("/api/hero-banners"),
          ]);

          const [categoriesData, productsData, bannersData] = await Promise.all(
            [categoriesRes.json(), productsRes.json(), bannersRes.json()]
          );

          if (categoriesData.success) {
            setCategories(categoriesData.categories || []);
          }
          if (productsData.success) {
            setProducts(productsData.products || []);
          }
          if (bannersData.success) {
            setHeroBanners(bannersData.banners || []);
          }
          setDataFetched(true);
        } catch (error) {
          console.error("Failed to fetch dropdown data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, dataFetched]);

  // Get products for a category (including its subcategories)
  const getProductsForCategory = useCallback(
    (category: Category | null): Product[] => {
      if (!category) return [];

      // Get products directly in this category
      const directProducts = products.filter(
        (p) => p.category?.slug === category.slug
      );

      // Get products in subcategories
      const subCategoryProducts: Product[] = [];
      if (category.children && category.children.length > 0) {
        category.children.forEach((child) => {
          const childProducts = products.filter(
            (p) => p.category?.slug === child.slug
          );
          subCategoryProducts.push(...childProducts);
        });
      }

      return [...directProducts, ...subCategoryProducts];
    },
    [products]
  );

  // Get products to show in col 3
  const productsToShow = useMemo(() => {
    if (hoveredSubCategory) {
      // Show products only from the hovered subcategory
      return products.filter(
        (p) => p.category?.slug === hoveredSubCategory.slug
      );
    } else if (hoveredParentCategory) {
      // Show all products from parent + subcategories
      return getProductsForCategory(hoveredParentCategory);
    }
    return [];
  }, [hoveredParentCategory, hoveredSubCategory, products, getProductsForCategory]);

  // Handle mouse events for dropdown
  useEffect(() => {
    const element = document.getElementById(id);
    const handleMouseLeave = () => {
      setIsOpen(false);
      setHoveredParentCategory(null);
      setHoveredSubCategory(null);
      setPreviewState({ type: "default" });
    };
    const handleMouseEnter = () => setIsOpen(true);
    element?.addEventListener("mouseleave", handleMouseLeave);
    element?.addEventListener("mouseenter", handleMouseEnter);
    return () => {
      element?.removeEventListener("mouseleave", handleMouseLeave);
      element?.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [id]);

  const handleParentCategoryHover = useCallback((category: Category) => {
    setHoveredParentCategory(category);
    setHoveredSubCategory(null);
    setPreviewState({ type: "category", category });
  }, []);

  const handleSubCategoryHover = useCallback((category: Category) => {
    setHoveredSubCategory(category);
    setPreviewState({ type: "category", category });
  }, []);

  const handleProductHover = useCallback((product: Product) => {
    setPreviewState({ type: "product", product });
  }, []);

  const handleClearSelection = useCallback(() => {
    setHoveredParentCategory(null);
    setHoveredSubCategory(null);
    setPreviewState({ type: "default" });
  }, []);

  // Convert hero banners to carousel format
  const offersCarouselData: CarouselItem[] = useMemo(() => {
    return heroBanners.map((banner) => ({
      id: banner.id,
      image: banner.image?.url || "",
      alt: banner.title || banner.name,
      content: (
        <div className={styles.offerContent}>
          {banner.discountPercent && (
            <span className={styles.offerBadge}>LIMITED OFFER</span>
          )}
          <h4 className={styles.offerTitle}>
            {banner.title || banner.name}
          </h4>
          {banner.subtitle && (
            <p className={styles.offerSubtitle}>{banner.subtitle}</p>
          )}
          {banner.ctaText && banner.ctaLink && (
            <Link href={banner.ctaLink as any} className={styles.offerButton}>
              {banner.ctaText}
            </Link>
          )}
        </div>
      ),
    }));
  }, [heroBanners]);

  // Column 1: Parent Categories List
  const renderParentCategoriesColumn = () => (
    <div className={styles.column}>
      <h3 className={styles.columnTitle}>COLLECTIONS</h3>
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>Loading...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className={styles.emptyList}>No categories available</div>
      ) : (
        <ul className={styles.categoryList}>
          {categories.map((category) => (
            <li
              key={category.id}
              className={`${styles.categoryItem} ${
                hoveredParentCategory?.id === category.id
                  ? styles.categoryItemActive
                  : ""
              }`}
              onMouseEnter={() => handleParentCategoryHover(category)}
            >
              <Link
                href={`/categories?slug=${category.slug}` as any}
                className={styles.categoryLink}
              >
                <span className={styles.categoryName}>{category.name}</span>
                <span className={styles.categoryCount}>
                  {category.productCount || 0}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // Column 2: Subcategories List
  const renderSubCategoriesColumn = () => (
    <div className={styles.column}>
      {hoveredParentCategory ? (
        <>
          <h3 className={styles.columnTitle}>{hoveredParentCategory.name}</h3>
          {hoveredParentCategory.children &&
          hoveredParentCategory.children.length > 0 ? (
            <ul className={styles.subCategoryList}>
              {hoveredParentCategory.children.map((subCategory) => (
                <li
                  key={subCategory.id}
                  className={`${styles.subCategoryItem} ${
                    hoveredSubCategory?.id === subCategory.id
                      ? styles.subCategoryItemActive
                      : ""
                  }`}
                  onMouseEnter={() => handleSubCategoryHover(subCategory)}
                >
                  <Link
                    href={`/categories?slug=${subCategory.slug}` as any}
                    className={styles.subCategoryLink}
                  >
                    <span className={styles.subCategoryName}>
                      {subCategory.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.noSubCategories}>
              No subcategories
            </div>
          )}
        </>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>
          </div>
          <p className={styles.emptyText}>
            Hover over a collection to see subcategories
          </p>
        </div>
      )}
    </div>
  );

  // Column 3: Featured List (default) or Products Grid (on hover)
  const renderThirdColumn = () => {
    // Show products when hovering on categories
    if (hoveredParentCategory || hoveredSubCategory) {
      return (
        <div className={styles.column}>
          <div className={styles.productHeader}>
            <h3 className={styles.columnTitle}>
              {hoveredSubCategory
                ? hoveredSubCategory.name
                : `All in ${hoveredParentCategory?.name}`}
            </h3>
            <button
              className={styles.clearButton}
              onClick={handleClearSelection}
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
          {productsToShow.length > 0 ? (
            <div className={styles.productGrid}>
              {productsToShow.slice(0, 6).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}` as any}
                  className={styles.productCard}
                  onMouseEnter={() => handleProductHover(product)}
                >
                  <div
                    className={styles.productCardBg}
                    style={{
                      backgroundImage: product.images?.[0]
                        ? `url(${getImageUrl(product.images[0])})`
                        : undefined,
                    }}
                  />
                  <div className={styles.productCardOverlay} />
                  <div className={styles.productCardInfo}>
                    <span className={styles.productCardName}>{product.name}</span>
                    {product.size && (
                      <span className={styles.productCardDimensions}>
                        {product.size.length} × {product.size.width} ×{" "}
                        {product.size.height} {product.size.unit}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.noProducts}>No products found</div>
          )}
          {productsToShow.length > 6 && (
            <div className={styles.viewAllProducts}>
              <Link
                href={
                  hoveredSubCategory
                    ? (`/products?category=${hoveredSubCategory.slug}` as any)
                    : hoveredParentCategory
                    ? (`/products?category=${hoveredParentCategory.slug}` as any)
                    : "/products"
                }
              >
                View all {productsToShow.length} products →
              </Link>
            </div>
          )}
        </div>
      );
    }

    // Default: Show Featured list
    return (
      <div className={styles.column}>
        <h3 className={styles.columnTitle}>FEATURED</h3>
        <ul className={styles.featuredList}>
          <li className={styles.featuredItem}>
            <Link href={"/products?sort=trending" as any}>Best Sellers</Link>
          </li>
          <li className={styles.featuredItem}>
            <Link href={"/products?sort=newest" as any}>New Arrivals</Link>
          </li>
          <li className={styles.featuredItem}>
            <Link href={"/products?sort=price-low" as any}>
              Price: Low to High
            </Link>
          </li>
          <li className={styles.featuredItem}>
            <Link href={"/products?sort=price-high" as any}>
              Price: High to Low
            </Link>
          </li>
        </ul>

        {categories.length > 0 && (
          <>
            <h3 className={`${styles.columnTitle} ${styles.columnTitleSpaced}`}>
              SHOP BY CATEGORY
            </h3>
            <ul className={styles.featuredList}>
              {categories.slice(0, 6).map((category) => (
                <li key={category.id} className={styles.featuredItem}>
                  <Link href={`/categories?slug=${category.slug}` as any}>
                    {category.name}
                  </Link>
                </li>
              ))}
              {categories.length > 6 && (
                <li className={styles.featuredItem}>
                  <Link href="/categories" className={styles.viewAllLink}>
                    View All Categories →
                  </Link>
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    );
  };

  // Column 4: Preview Panel (Offers Carousel or Preview)
  const renderPreviewColumn = () => {
    if (previewState.type === "category") {
      const { category } = previewState;
      return (
        <div className={styles.previewColumn}>
          <div className={styles.previewCard}>
            <div
              className={styles.previewImageWrapper}
              style={{
                backgroundImage: category.image
                  ? `url(${getImageUrl(category.image)})`
                  : undefined,
              }}
            >
              {!category.image && (
                <div className={styles.previewImagePlaceholder}>
                  <span>{category.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className={styles.previewOverlay} />
            <div className={styles.previewInfo}>
              <h4 className={styles.previewTitle}>{category.name}</h4>
              <p className={styles.previewMeta}>
                {category.productCount || 0} products
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (previewState.type === "product") {
      const { product } = previewState;
      return (
        <div className={styles.previewColumn}>
          <div className={styles.previewCard}>
            <div
              className={styles.previewImageWrapper}
              style={{
                backgroundImage: product.images?.[0]
                  ? `url(${getImageUrl(product.images[0])})`
                  : undefined,
              }}
            >
              {!product.images?.[0] && (
                <div className={styles.previewImagePlaceholder}>
                  <span>{product.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className={styles.previewOverlay} />
            <div className={styles.previewInfo}>
              <h4 className={styles.previewTitle}>{product.name}</h4>
              {product.size && (
                <p className={styles.previewDimensions}>
                  {product.size.length} × {product.size.width} ×{" "}
                  {product.size.height} {product.size.unit}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Default: Offers Carousel using CarouselWrapper
    if (loading) {
      return (
        <div className={styles.previewColumn}>
          <div className={styles.emptyPreview}>
            <div className={styles.loadingSpinner} />
            <p>Loading offers...</p>
          </div>
        </div>
      );
    }

    if (heroBanners.length === 0) {
      return (
        <div className={styles.previewColumn}>
          <div className={styles.emptyPreview}>
            <p>Explore our collections</p>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.previewColumn}>
        <CarouselWrapper
          variant="fullWidth"
          data={offersCarouselData}
          options={{
            showControlBtns: false,
            showControlDots: heroBanners.length > 1,
            autoPlay: true,
            autoPlayInterval: 3000,
            loop: true,
            showOverlay: true,
          }}
          className={styles.offersCarousel}
        />
      </div>
    );
  };

  return (
    <>
      <Anchor
        href="/categories"
        content="Category"
        tracking={{ enabled: true, grouped: true, id: "categories" }}
        onClick={() => setIsOpen(true)}
      />

      <div
        className={styles.dropdown}
        style={{
          maxHeight: isOpen ? "400px" : "0px",
        }}
      >
        <div className={styles.grid}>
          {renderParentCategoriesColumn()}
          {renderSubCategoriesColumn()}
          {renderThirdColumn()}
          {renderPreviewColumn()}
        </div>
      </div>
    </>
  );
};

export default CategoryDropdown;
