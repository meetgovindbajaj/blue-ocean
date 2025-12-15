"use client";

import { Suspense, useCallback, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ProductType } from "@/types/product";
import ProductCard from "./ProductCard";
import ProductFilters from "./ProductFilters";
import { CarouselWrapper, CarouselItem } from "@/components/ui/CarouselWrapper";
import styles from "./SearchResultPage.module.css";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface SearchResultPageProps {
  showFilters?: boolean;
  /** Initial products from server-side fetch for SEO */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialProducts?: any[];
  /** Initial categories from server-side fetch */
  initialCategories?: Category[];
  /** Initial pagination from server-side fetch */
  initialPagination?: PaginationInfo;
  /** Initial related products from server-side fetch */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialRelatedProducts?: any[];
  /** Initial recommended products from server-side fetch */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialRecommendedProducts?: any[];
}

// Inner component that uses useSearchParams
const SearchResultPageInner = ({
  showFilters = true,
  initialProducts = [],
  initialCategories = [],
  initialPagination,
  initialRelatedProducts = [],
  initialRecommendedProducts = [],
}: SearchResultPageProps) => {
  const searchParams = useSearchParams();

  // Use initial data from server if available
  const [products, setProducts] = useState<ProductType[]>(initialProducts);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>(initialRelatedProducts);
  const [lessRelevantProducts, setLessRelevantProducts] = useState<ProductType[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductType[]>(initialRecommendedProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  // Don't show loading if we have initial data
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>(
    initialPagination || {
      total: 0,
      page: 1,
      limit: 20,
      pages: 0,
    }
  );
  const [hasAnimated, setHasAnimated] = useState(initialProducts.length > 0);
  const gridRef = useRef<HTMLDivElement>(null);
  // Track if this is first render with URL params (to determine if we need to fetch)
  const isInitialRender = useRef(true);

  // Intersection Observer for products grid animation - triggers once
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || hasAnimated) return;

    // Small delay to ensure grid is rendered
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [products, hasAnimated]);


  // Fetch categories on mount (only if not provided from server)
  useEffect(() => {
    // Skip if we already have initial categories from server
    if (initialCategories.length > 0) return;

    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch {
        console.error("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, [initialCategories.length]);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      const search = searchParams.get("search");
      const categories = searchParams.get("categories");
      const category = searchParams.get("category"); // Legacy support
      const sort = searchParams.get("sort");
      const minPrice = searchParams.get("minPrice");
      const maxPrice = searchParams.get("maxPrice");
      const page = searchParams.get("page");
      const priceCurrency = searchParams.get("priceCurrency");

      if (search) params.set("search", search);
      if (categories) params.set("categories", categories);
      if (category && !categories) params.set("category", category);
      if (sort) params.set("sort", sort);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (page) params.set("page", page);
      if (priceCurrency) params.set("priceCurrency", priceCurrency);

      // Always request additional products for carousels
      params.set("includeRelated", "true");
      params.set("includeLessRelevant", "true");
      params.set("includeRecommended", "true");

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        setPagination(data.pagination);
        setRelatedProducts(data.relatedProducts || []);
        setLessRelevantProducts(data.lessRelevantProducts || []);
        setRecommendedProducts(data.recommendedProducts || []);
      } else {
        setError(data.error || "Failed to fetch products");
        setProducts([]);
        setRelatedProducts([]);
        setLessRelevantProducts([]);
        setRecommendedProducts([]);
      }
    } catch {
      setError("Failed to fetch products");
      setProducts([]);
      setRelatedProducts([]);
      setLessRelevantProducts([]);
      setRecommendedProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Fetch on mount and when search params change
  useEffect(() => {
    // On initial render with initial data and no URL filters, skip fetch
    if (isInitialRender.current && initialProducts.length > 0) {
      // Check if there are any filter params in URL
      const hasUrlFilters =
        searchParams.get("search") ||
        searchParams.get("categories") ||
        searchParams.get("category") ||
        searchParams.get("sort") ||
        searchParams.get("minPrice") ||
        searchParams.get("maxPrice") ||
        searchParams.get("page");

      isInitialRender.current = false;

      // If no URL filters, use initial data from server
      if (!hasUrlFilters) {
        return;
      }
    }

    fetchProducts();
  }, [fetchProducts, initialProducts.length, searchParams]);

  const query = searchParams.get("search") || "";

  // Convert products to carousel items
  const productToCarouselItem = (product: ProductType): CarouselItem => ({
    id: product.id || "",
    image: product.images?.[0]?.url || "/placeholder.jpg",
    url: `/products/${product.slug}`,
    alt: product.name,
    content: (
      <div className={styles.carouselProductCard}>
        <ProductCard product={product} />
      </div>
    ),
  });

  return (
    <div className={styles.navSearchResults}>
      {/* Filters */}
      {showFilters && (
        <ProductFilters
          categories={categories}
          totalResults={pagination.total}
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading products...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={fetchProducts} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className={styles.emptyState}>
          <p>No products found</p>
          {query && <span>Try adjusting your search or filters</span>}
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && products.length > 0 && (
        <>
          <div className={styles.productsGrid} ref={gridRef}>
            {products.map((product, index) => (
              <motion.div
                key={product.id + "_search-result"}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={
                  hasAnimated
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 30, scale: 0.95 }
                }
                transition={{
                  duration: 0.4,
                  delay: Math.min(index, 8) * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && <Pagination pagination={pagination} />}

          {/* Related Products Carousel */}
          {relatedProducts.length > 0 && (
            <div className={styles.carouselSection}>
              <h2 className={styles.carouselTitle}>Related Products</h2>
              <CarouselWrapper
                variant="default"
                data={relatedProducts.map(productToCarouselItem)}
                options={{
                  showControlBtns: true,
                  showControlDots: false,
                  loop: true,
                  autoPlay: true,
                  itemsPerView: {
                    mobile: 1,
                    tablet: 2,
                    desktop: 4,
                    xl: 4,
                  },
                }}
                renderItem={(item) => item.content}
              />
            </div>
          )}

          {/* You Might Also Like Carousel (Less Relevant) */}
          {lessRelevantProducts.length > 0 && (
            <div className={styles.carouselSection}>
              <h2 className={styles.carouselTitle}>You Might Also Like</h2>
              <CarouselWrapper
                variant="default"
                data={lessRelevantProducts.map(productToCarouselItem)}
                options={{
                  showControlBtns: true,
                  showControlDots: false,
                  loop: true,
                  autoPlay: true,
                  itemsPerView: {
                    mobile: 1,
                    tablet: 2,
                    desktop: 4,
                    xl: 4,
                  },
                }}
                renderItem={(item) => item.content}
              />
            </div>
          )}

          {/* Recommended Products Carousel */}
          {recommendedProducts.length > 0 && (
            <div className={styles.carouselSection}>
              <h2 className={styles.carouselTitle}>Recommended For You</h2>
              <CarouselWrapper
                variant="default"
                data={recommendedProducts.map(productToCarouselItem)}
                options={{
                  showControlBtns: true,
                  showControlDots: false,
                  loop: true,
                  autoPlay: true,
                  itemsPerView: {
                    mobile: 1,
                    tablet: 2,
                    desktop: 4,
                    xl: 4,
                  },
                }}
                renderItem={(item) => item.content}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Main component with Suspense wrapper
const SearchResultPage = (props: SearchResultPageProps) => {
  return (
    <Suspense fallback={<SearchResultsLoading />}>
      <SearchResultPageInner {...props} />
    </Suspense>
  );
};

// Loading skeleton - using better skeleton components
const SearchResultsLoading = () => (
  <div className={styles.navSearchResults}>
    <div className={styles.loadingState}>
      <div className={styles.spinner} />
      <span>Loading products...</span>
    </div>
  </div>
);

// Pagination Component
const Pagination = ({ pagination }: { pagination: PaginationInfo }) => {
  const searchParams = useSearchParams();

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `?${params.toString()}`;
  };

  const { page, pages } = pagination;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(pages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push("...", pages);
    } else if (pages > 1) {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
  };

  return (
    <div className={styles.pagination}>
      {page > 1 && (
        <a href={createPageUrl(page - 1)} className={styles.pageLink}>
          Previous
        </a>
      )}

      <div className={styles.pageNumbers}>
        {getPageNumbers().map((pageNum, idx) =>
          typeof pageNum === "string" ? (
            <span key={`dots-${idx}`} className={styles.pageDots}>
              {pageNum}
            </span>
          ) : (
            <a
              key={pageNum}
              href={createPageUrl(pageNum)}
              className={`${styles.pageLink} ${
                pageNum === page ? styles.pageActive : ""
              }`}
            >
              {pageNum}
            </a>
          )
        )}
      </div>

      {page < pages && (
        <a href={createPageUrl(page + 1)} className={styles.pageLink}>
          Next
        </a>
      )}
    </div>
  );
};

export default SearchResultPage;
