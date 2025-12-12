"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
}

// Inner component that uses useSearchParams
const SearchResultPageInner = ({
  showFilters = true,
}: SearchResultPageProps) => {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductType[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [lessRelevantProducts, setLessRelevantProducts] = useState<ProductType[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });

  // Fetch categories on mount
  useEffect(() => {
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
  }, []);

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
    fetchProducts();
  }, [fetchProducts]);

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
          <div className={styles.productsGrid}>
            {products.map((product) => (
              <ProductCard
                key={product.id + "_search-result"}
                product={product}
              />
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
                  autoPlay: false,
                  itemsPerView: {
                    mobile: 1,
                    tablet: 2,
                    desktop: 4,
                    xl: 5,
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
                  autoPlay: false,
                  itemsPerView: {
                    mobile: 1,
                    tablet: 2,
                    desktop: 4,
                    xl: 5,
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
                  autoPlay: false,
                  itemsPerView: {
                    mobile: 1,
                    tablet: 2,
                    desktop: 4,
                    xl: 5,
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

// Loading skeleton
const SearchResultsLoading = () => (
  <div className={styles.loadingState}>
    <div className={styles.spinner} />
    <span>Loading products...</span>
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
