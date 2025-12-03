"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import Anchor from "../shared/Anchor";
import type { HeroBanner } from "@/types/heroBanner";
import styles from "./categoryDropdown.module.css";

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

const CAROUSEL_INTERVAL = 3000;

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

const getImageUrl = (image: any): string => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.thumbnailUrl || image.url || "";
};

const CategoryDropdown = ({ id }: { id: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [previewState, setPreviewState] = useState<PreviewState>({
    type: "default",
  });
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<NodeJS.Timeout | null>(null);

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
            fetch("/api/categories"),
            fetch("/api/products?limit=50"),
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

  // Get products for selected category
  const categoryProducts = selectedCategory
    ? products.filter((p) => p.category?.slug === selectedCategory.slug)
    : [];

  // Start carousel
  const startCarousel = useCallback(() => {
    if (carouselRef.current) {
      clearInterval(carouselRef.current);
    }
    if (heroBanners.length > 1) {
      carouselRef.current = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % heroBanners.length);
      }, CAROUSEL_INTERVAL);
    }
  }, [heroBanners.length]);

  // Auto-scroll carousel when in default state
  useEffect(() => {
    if (previewState.type === "default" && isOpen && heroBanners.length > 0) {
      startCarousel();
    }
    return () => {
      if (carouselRef.current) {
        clearInterval(carouselRef.current);
      }
    };
  }, [previewState.type, isOpen, startCarousel, heroBanners.length]);

  // Handle mouse events for dropdown
  useEffect(() => {
    const element = document.getElementById(id);
    const handleMouseLeave = () => {
      setIsOpen(false);
      setSelectedCategory(null);
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

  const handleCategoryHover = useCallback((category: Category) => {
    setSelectedCategory(category);
    setPreviewState({ type: "category", category });
  }, []);

  const handleProductHover = useCallback((product: Product) => {
    setPreviewState({ type: "product", product });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedCategory(null);
    setPreviewState({ type: "default" });
  }, []);

  const goToSlide = (index: number) => {
    setCarouselIndex(index);
    startCarousel();
  };

  // Column 1: Categories List
  const renderCategoriesColumn = () => (
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
                selectedCategory?.id === category.id
                  ? styles.categoryItemActive
                  : ""
              }`}
              onMouseEnter={() => handleCategoryHover(category)}
            >
              <div className={styles.categoryIcon}>
                {category.image ? (
                  <img
                    src={getImageUrl(category.image)}
                    alt={category.name}
                    className={styles.categoryIconImage}
                  />
                ) : (
                  <div className={styles.categoryIconPlaceholder}>
                    {category.name.charAt(0)}
                  </div>
                )}
              </div>
              <Link
                href={`/categories?slug=${category.slug}` as any}
                className={styles.categoryLink}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // Column 2: Products List
  const renderProductsColumn = () => (
    <div className={styles.column}>
      {selectedCategory ? (
        <>
          <div className={styles.productHeader}>
            <h3 className={styles.columnTitle}>{selectedCategory.name}</h3>
            <button
              className={styles.clearButton}
              onClick={handleClearSelection}
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
          <ul className={styles.productList}>
            {categoryProducts.length > 0 ? (
              categoryProducts.slice(0, 6).map((product) => (
                <li
                  key={product.id}
                  className={styles.productItem}
                  onMouseEnter={() => handleProductHover(product)}
                >
                  <Link
                    href={`/products/${product.slug}` as any}
                    className={styles.productLink}
                  >
                    <div className={styles.productThumbWrapper}>
                      {product.images?.[0] ? (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className={styles.productThumb}
                        />
                      ) : (
                        <div className={styles.productThumbPlaceholder}>
                          {product.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className={styles.productName}>{product.name}</span>
                  </Link>
                </li>
              ))
            ) : (
              <li className={styles.noProducts}>
                No products in this category
              </li>
            )}
            {categoryProducts.length > 6 && (
              <li className={styles.viewAll}>
                <Link
                  href={`/products?category=${selectedCategory.slug}` as any}
                >
                  View all {categoryProducts.length} products →
                </Link>
              </li>
            )}
          </ul>
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
            Hover over a collection to see products
          </p>
        </div>
      )}
    </div>
  );

  // Column 3: Featured Options (with real filters + categories)
  const renderFeaturedColumn = () => (
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

  // Column 4: Preview Panel
  const renderPreviewColumn = () => {
    if (previewState.type === "category") {
      const { category } = previewState;
      return (
        <div className={styles.previewColumn}>
          <div className={styles.previewCard}>
            <div className={styles.previewImageWrapper}>
              {category.image ? (
                <img
                  src={getImageUrl(category.image)}
                  alt={category.name}
                  className={styles.previewImage}
                />
              ) : (
                <div className={styles.previewImagePlaceholder}>
                  <span>{category.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className={styles.previewInfo}>
              <h4 className={styles.previewTitle}>{category.name}</h4>
              {category.description && (
                <p className={styles.previewDescription}>
                  {category.description}
                </p>
              )}
              <p className={styles.previewMeta}>
                {category.productCount} products
              </p>
              <Link
                href={`/categories/${category.slug}` as any}
                className={styles.previewButton}
              >
                Shop {category.name}
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (previewState.type === "product") {
      const { product } = previewState;
      const hasDiscount = product.prices.discount > 0;
      const finalPrice = hasDiscount
        ? product.prices.retail * (1 - product.prices.discount / 100)
        : product.prices.retail;

      return (
        <div className={styles.previewColumn}>
          <div className={styles.previewCard}>
            <div className={styles.previewImageWrapper}>
              {product.images?.[0] ? (
                <img
                  src={getImageUrl(product.images[0])}
                  alt={product.name}
                  className={styles.previewImage}
                />
              ) : (
                <div className={styles.previewImagePlaceholder}>
                  <span>{product.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className={styles.previewInfo}>
              <h4 className={styles.previewTitle}>{product.name}</h4>
              <div className={styles.previewPrice}>
                {hasDiscount && (
                  <span className={styles.originalPrice}>
                    {formatPrice(product.prices.retail)}
                  </span>
                )}
                <span className={styles.finalPrice}>
                  {formatPrice(finalPrice)}
                </span>
              </div>
              {product.size && (
                <p className={styles.previewDimensions}>
                  {product.size.length} × {product.size.width} ×{" "}
                  {product.size.height} {product.size.unit}
                </p>
              )}
              <Link
                href={`/products/${product.slug}` as any}
                className={styles.previewButton}
              >
                View Product
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Default: Offers Carousel
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

    const currentBanner = heroBanners[carouselIndex % heroBanners.length];

    return (
      <div className={styles.previewColumn}>
        <div className={styles.offerCard}>
          <div className={styles.offerImageWrapper}>
            <img
              src={currentBanner.image?.url || ""}
              alt={currentBanner.title || currentBanner.name}
              className={styles.offerImage}
            />
            <div className={styles.offerOverlay}>
              {currentBanner.discountPercent && (
                <span className={styles.offerBadge}>LIMITED OFFER</span>
              )}
              <h4 className={styles.offerTitle}>
                {currentBanner.title || currentBanner.name}
              </h4>
              {currentBanner.subtitle && (
                <p className={styles.offerSubtitle}>{currentBanner.subtitle}</p>
              )}
              {currentBanner.ctaText && currentBanner.ctaLink && (
                <Link
                  href={currentBanner.ctaLink as any}
                  className={styles.offerButton}
                >
                  {currentBanner.ctaText}
                </Link>
              )}
            </div>
          </div>
          {heroBanners.length > 1 && (
            <div className={styles.carouselDots}>
              {heroBanners.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.dot} ${
                    index === carouselIndex % heroBanners.length
                      ? styles.dotActive
                      : ""
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
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
          {renderCategoriesColumn()}
          {renderProductsColumn()}
          {renderFeaturedColumn()}
          {renderPreviewColumn()}
        </div>
      </div>
    </>
  );
};

export default CategoryDropdown;
