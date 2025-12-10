"use client";
import Search from "@/assets/search.svg";
import Cross from "@/assets/cross.svg";
import Image from "next/image";
import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import styles from "./search.module.css";
import ProductFilters from "../shared/ProductFilters";
import ProductCard from "../shared/ProductCard";
import { ProductType } from "@/types/product";
import { Route } from "next";

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

  const [products, setProducts] = useState<ProductType[]>([]);
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

  const debouncedQuery = useDebounce(query, 300);

  // Get current filter values from URL
  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentPriceCurrency = searchParams.get("priceCurrency") || "";

  // Sync query to URL when debounced query changes
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    if (debouncedQuery !== currentSearch) {
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

  // Sync query state from URL when search param is cleared externally (e.g., from filter pills)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch !== query && urlSearch === "") {
      setQuery("");
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
      if (currentCategory) params.set("category", currentCategory);
      if (currentSort && currentSort !== "newest")
        params.set("sort", currentSort);
      if (currentMinPrice) params.set("minPrice", currentMinPrice);
      if (currentMaxPrice) params.set("maxPrice", currentMaxPrice);
      if (currentPriceCurrency)
        params.set("priceCurrency", currentPriceCurrency);
      params.set("limit", "12");

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        setPagination(data.pagination);

        // Generate suggestions from product names
        const productSuggestions = data.products
          .slice(0, 5)
          .map((p: ProductType) => p.name);

        // Add category suggestions
        const categorySuggestions = categories
          .filter((c) =>
            c.name.toLowerCase().includes(debouncedQuery.toLowerCase())
          )
          .map((c) => c.name);

        setSuggestions([
          ...new Set([...productSuggestions, ...categorySuggestions]),
        ]);
      }
    } catch {
      console.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedQuery,
    currentCategory,
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
    <>
      <div className={styles.navSearch}>
        <form onSubmit={handleSearchSubmit}>
          <div className={styles.searchBox}>
            <Image
              src={Search}
              alt=""
              style={{
                position: "absolute",
                left: "16px",
                translate: "0 50%",
                cursor: "pointer",
              }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Search products..."
              autoFocus
              style={{
                width: "100%",
                height: "48px",
                padding: "0 48px",
                color: "#2d3436",
                backgroundColor: "#f5f5f5",
                border: "none",
                borderRadius: "10px",
                outline: "none",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                if (query.length >= 2) setShowSuggestions(true);
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "32px",
                height: "32px",
                borderRadius: "100%",
                backgroundColor: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#636e72",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e8f4f8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Image src={Cross} alt="" />
            </button>
          </div>
        </form>
      </div>

      <div
        className={`${styles.navSearch} ${styles.navSearchResultsContainer}`}
      >
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && query.length >= 2 && (
          <div className={styles.suggestionsDropdown}>
            <div className={styles.suggestionsHeader}>
              <span>{suggestions.length} suggestions</span>
              <button onClick={() => setShowSuggestions(false)}>Close</button>
            </div>
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className={styles.suggestionItem}
              >
                <Image src={Search} alt="" width={14} height={14} />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <ProductFilters
          categories={categories}
          totalResults={pagination.total}
          hideSearch
          onClear={() => setQuery("")}
        />

        {/* Loading State */}
        {loading && (
          <div className={styles.searchHint}>
            <p>Searching...</p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && products.length > 0 && (
          <div className={styles.quickResults}>
            <div className={styles.quickResultsGrid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && query.length >= 2 && products.length === 0 && (
          <div className={styles.noResults}>
            <p>No products found for &quot;{query}&quot;</p>
            <span>Try a different search term</span>
          </div>
        )}

        {/* Empty State - No query */}
        {!loading && query.length < 2 && products.length === 0 && (
          <div className={styles.searchHint}>
            <p>Start typing to search products...</p>
          </div>
        )}
      </div>
    </>
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

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  // Close overlay when route changes
  useEffect(() => {
    if (prevPathname.current !== pathname && isOpen) {
      handleClose();
    }
    prevPathname.current = pathname;
  }, [pathname, isOpen]);

  return (
    <div style={{ display: "contents", position: "relative" }}>
      <Image
        style={{ cursor: "pointer" }}
        src={Search}
        alt="Search"
        onClick={() => setIsOpen((p) => !p)}
      />
      {isOpen && (
        <Suspense fallback={<SearchContentLoading />}>
          <SearchContent
            query={query}
            setQuery={setQuery}
            onClose={handleClose}
          />
        </Suspense>
      )}
    </div>
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
