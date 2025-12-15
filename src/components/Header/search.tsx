"use client";
import { Search as SearchIcon, X } from "lucide-react";
import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import styles from "./search.module.css";
import ProductFilters from "../shared/ProductFilters";
import ProductCard from "../shared/ProductCard";
import { CarouselWrapper, CarouselItem } from "@/components/ui/CarouselWrapper";
import { ProductType } from "@/types/product";
import { Route } from "next";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Inner search content component that uses search params
const SearchContent = ({
  query,
  setQuery,
  onClose,
}: {
  query: string;
  setQuery: (value: string) => void;
  onClose: () => void;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<ProductType[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [lessRelevantProducts, setLessRelevantProducts] = useState<
    ProductType[]
  >([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductType[]>(
    []
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    pages: 0,
  });

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

  const debouncedQuery = useDebounce(query, 300);

  // Track if URL update was triggered internally to prevent loops
  const isInternalUpdate = useRef(false);

  // Get current filter values from URL
  const currentCategories = searchParams.get("categories") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentPriceCurrency = searchParams.get("priceCurrency") || "";

  // Sync query to URL when debounced query changes
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    if (debouncedQuery !== currentSearch) {
      isInternalUpdate.current = true;
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedQuery) {
        params.set("search", debouncedQuery);
      } else {
        params.delete("search");
      }
      const queryString = params.toString();
      router.push(
        (queryString ? `${pathname}?${queryString}` : pathname) as Route,
        { scroll: false }
      );
    }
  }, [debouncedQuery, searchParams, router, pathname]);

  // Sync query state from URL when search param changes externally (e.g., from filter pills)
  useEffect(() => {
    // Skip if this URL change was triggered by us
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const urlSearch = searchParams.get("search") || "";
    // Only sync if the URL search differs from current query
    if (urlSearch !== query) {
      setQuery(urlSearch);
    }
  }, [searchParams]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories?limit=20");
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

  // Fetch products when query or filters change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (debouncedQuery) params.set("search", debouncedQuery);
      if (currentCategories) params.set("categories", currentCategories);
      if (currentSort && currentSort !== "newest")
        params.set("sort", currentSort);
      if (currentMinPrice) params.set("minPrice", currentMinPrice);
      if (currentMaxPrice) params.set("maxPrice", currentMaxPrice);
      if (currentPriceCurrency)
        params.set("priceCurrency", currentPriceCurrency);
      params.set("limit", "12");

      // Always request carousels (same as products page)
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

        // Generate suggestions from product names
        const productSuggestions = data.products
          .slice(0, 5)
          .map((p: ProductType) => p.name);

        // // Add category suggestions
        // const categorySuggestions = categories
        //   .filter((c) =>
        //     c.name.toLowerCase().includes(debouncedQuery.toLowerCase())
        //   )
        //   .map((c) => c.name);

        setSuggestions([...new Set([...productSuggestions])]);
      }
    } catch {
      console.error("Failed to fetch products");
      setProducts([]);
      setRelatedProducts([]);
      setLessRelevantProducts([]);
      setRecommendedProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedQuery,
    currentCategories,
    currentSort,
    currentMinPrice,
    currentMaxPrice,
    currentPriceCurrency,
    categories,
  ]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleClearSearch = () => {
    if (showSuggestions || query.length > 0) {
      setShowSuggestions(false);
      setQuery("");
      setProducts([]);
      setSuggestions([]);
      // Clear URL params
      router.push(pathname as Route);
    } else {
      onClose();
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      // Update URL with search query
      const params = new URLSearchParams(searchParams.toString());
      params.set("search", query.trim());
      router.push(`${pathname}?${params.toString()}` as Route, {
        scroll: false,
      });
      setShowSuggestions(false);
    }
  };

  // Suggestion click updates search query (doesn't navigate away)
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    // Update URL with the suggestion as search
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", suggestion);
    router.push(`${pathname}?${params.toString()}` as Route, { scroll: false });
  };

  return (
    <div className={styles.searchDrawerContent}>
      {/* Search Input Header */}
      <div className={styles.searchHeader}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <SearchIcon className={styles.searchInputIcon} />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                console.log(e.target.value);
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Search products..."
              className={styles.searchInput}
              onFocus={() => {
                if (query.length >= 2) setShowSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
            {query.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClearSearch}
                className={styles.clearButton}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
        <DrawerClose asChild>
          <Button variant="ghost" size="sm" className={styles.cancelButton}>
            Cancel
          </Button>
        </DrawerClose>
      </div>

      {/* Scrollable Results Area */}
      <ScrollArea className={styles.searchResults}>
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && query.length >= 2 && (
          <div className={styles.suggestionsDropdown}>
            <div className={styles.suggestionsHeader}>
              <span>{suggestions.length} suggestions</span>
              <button type="button" onClick={() => setShowSuggestions(false)}>
                Close
              </button>
            </div>
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className={styles.suggestionItem}
              >
                <SearchIcon className="h-4 w-4" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        )}
        {/* Filters */}
        <div className="p-4">
          <ProductFilters
            categories={categories}
            totalResults={pagination.total}
            hideSearch
            onClear={() => setQuery("")}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className={styles.searchHint}>
            <p>Searching...</p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && products.length > 0 && (
          <>
            <div className={styles.quickResults}>
              <div className={styles.quickResultsGrid}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>

            {/* Related Products Carousel */}
            {relatedProducts.length > 0 && (
              <div className={styles.carouselSection}>
                <h3 className={styles.carouselTitle}>Related Products</h3>
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

            {/* You Might Also Like Carousel */}
            {lessRelevantProducts.length > 0 && (
              <div className={styles.carouselSection}>
                <h3 className={styles.carouselTitle}>You Might Also Like</h3>
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
                <h3 className={styles.carouselTitle}>Recommended For You</h3>
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

        {/* No Results */}
        {!loading &&
          (query.length >= 2 ||
            currentCategories ||
            currentMinPrice ||
            currentMaxPrice) &&
          products.length === 0 && (
            <div className={styles.noResults}>
              <p>No products found{query ? ` for "${query}"` : ""}</p>
              <span>Try adjusting your search or filters</span>
            </div>
          )}

        {/* Empty State - No query and no filters */}
        {!loading &&
          query.length < 2 &&
          !currentCategories &&
          !currentMinPrice &&
          !currentMaxPrice &&
          products.length === 0 && (
            <div className={styles.searchHint}>
              <p>Start typing to search products...</p>
            </div>
          )}
      </ScrollArea>
    </div>
  );
};

// Loading fallback
const SearchContentLoading = () => (
  <div className={styles.searchHint}>
    <p>Loading...</p>
  </div>
);

const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  // Close overlay when route changes (e.g., when clicking a product)
  useEffect(() => {
    if (prevPathname.current !== pathname && isOpen) {
      handleClose();
    }
    prevPathname.current = pathname;
  }, [pathname, isOpen, handleClose]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-8 w-8 align-center justify-center"
        aria-label="Search"
      >
        <SearchIcon className="h-5 w-5" />
      </Button>

      <Drawer open={isOpen} onOpenChange={setIsOpen} direction="top">
        <DrawerContent className={styles.searchDrawer}>
          <VisuallyHidden>
            <DrawerTitle>Search Products</DrawerTitle>
          </VisuallyHidden>
          <Suspense fallback={<SearchContentLoading />}>
            <SearchContent
              query={query}
              setQuery={setQuery}
              onClose={handleClose}
            />
          </Suspense>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SearchBar;

// Export CategoryType for other components that might need it
export interface CategoryType {
  id: string;
  name: string;
  slug: string;
  parent?: string;
  description?: string;
  image?: {
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    isThumbnail: boolean;
    downloadUrl: string;
    size: number;
    width: number;
    height: number;
  };
  isActive: boolean;
  children?: string[];
}
