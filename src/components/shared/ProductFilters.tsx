"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { SlidersHorizontal, X, Search } from "lucide-react";
import styles from "./ProductFilters.module.css";
import { Route } from "next";
import { useCurrency } from "@/context/CurrencyContext";

export type SortOption =
  | "newest"
  | "name"
  | "price-low"
  | "price-high"
  | "trending";

export interface FilterValues {
  category: string;
  search: string;
  sort: SortOption;
  minPrice: string;
  maxPrice: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
  totalResults?: number;
  onFiltersChange?: (filters: FilterValues) => void;
  hideSearch?: boolean;
  onClear?: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name", label: "Sort by Name" },
  { value: "newest", label: "Sort by Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "trending", label: "Sort by Trending" },
];

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function ProductFilters({
  categories,
  totalResults,
  onFiltersChange,
  hideSearch = false,
  onClear,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);
  const { currency, currencySymbol } = useCurrency();

  // Initialize state from URL params
  const [filters, setFilters] = useState<FilterValues>({
    category: searchParams.get("category") || "",
    search: searchParams.get("search") || "",
    sort: (searchParams.get("sort") as SortOption) || "newest",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
  });

  const [searchInput, setSearchInput] = useState(filters.search);
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Debounce inputs
  const debouncedSearch = useDebounce(searchInput, 400);
  const debouncedMinPrice = useDebounce(minPriceInput, 500);
  const debouncedMaxPrice = useDebounce(maxPriceInput, 500);

  // Update URL with filters
  const updateURL = useCallback(
    (newFilters: FilterValues) => {
      // Start with existing params to preserve slug and other params
      const params = new URLSearchParams(searchParams.toString());

      // Update filter params
      if (newFilters.search) {
        params.set("search", newFilters.search);
      } else {
        params.delete("search");
      }

      if (newFilters.category) {
        params.set("category", newFilters.category);
      } else {
        params.delete("category");
      }

      if (newFilters.sort && newFilters.sort !== "newest") {
        params.set("sort", newFilters.sort);
      } else {
        params.delete("sort");
      }

      if (newFilters.minPrice) {
        params.set("minPrice", newFilters.minPrice);
      } else {
        params.delete("minPrice");
      }

      if (newFilters.maxPrice) {
        params.set("maxPrice", newFilters.maxPrice);
      } else {
        params.delete("maxPrice");
      }

      // Add currency for price conversion in backend
      if (newFilters.minPrice || newFilters.maxPrice) {
        params.set("priceCurrency", currency);
      } else {
        params.delete("priceCurrency");
      }

      // Remove page when filters change
      params.delete("page");

      const queryString = params.toString();
      const url: Route = (
        queryString ? `${pathname}?${queryString}` : pathname
      ) as Route;
      router.push(url, {
        scroll: false,
      });
    },
    [router, pathname, searchParams, currency]
  );

  // Update filters when debounced values change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const hasSearchChanged = debouncedSearch !== filters.search;
    const hasMinPriceChanged = debouncedMinPrice !== filters.minPrice;
    const hasMaxPriceChanged = debouncedMaxPrice !== filters.maxPrice;

    if (hasSearchChanged || hasMinPriceChanged || hasMaxPriceChanged) {
      const newFilters = {
        ...filters,
        search: debouncedSearch,
        minPrice: debouncedMinPrice,
        maxPrice: debouncedMaxPrice,
      };
      setFilters(newFilters);
      updateURL(newFilters);
      onFiltersChange?.(newFilters);
    }
  }, [debouncedSearch, debouncedMinPrice, debouncedMaxPrice]);

  // Get active filters for chips
  const activeFilters: { key: keyof FilterValues; label: string }[] = [];
  if (filters.search) {
    activeFilters.push({ key: "search", label: `Search: ${filters.search}` });
  }
  if (filters.category) {
    const cat = categories.find((c) => c.slug === filters.category);
    activeFilters.push({
      key: "category",
      label: `Category: ${cat?.name || filters.category}`,
    });
  }
  // Show sort in pills except for "newest" (default)
  if (filters.sort && filters.sort !== "newest") {
    const sortOption = SORT_OPTIONS.find((opt) => opt.value === filters.sort);
    activeFilters.push({
      key: "sort",
      label: `${sortOption?.label || filters.sort}`,
    });
  }
  if (filters.minPrice || filters.maxPrice) {
    const priceLabel =
      filters.minPrice && filters.maxPrice
        ? `${currencySymbol}${filters.minPrice} - ${currencySymbol}${filters.maxPrice}`
        : filters.minPrice
        ? `Min: ${currencySymbol}${filters.minPrice}`
        : `Max: ${currencySymbol}${filters.maxPrice}`;
    activeFilters.push({ key: "minPrice", label: priceLabel });
  }

  // Handle filter change (immediate for selects)
  const handleFilterChange = useCallback(
    (key: keyof FilterValues, value: string) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      updateURL(newFilters);
      onFiltersChange?.(newFilters);
    },
    [filters, updateURL, onFiltersChange]
  );

  // Remove single filter
  const handleRemoveFilter = useCallback(
    (key: keyof FilterValues) => {
      const newFilters = { ...filters };
      if (key === "minPrice") {
        newFilters.minPrice = "";
        newFilters.maxPrice = "";
        setMinPriceInput("");
        setMaxPriceInput("");
      } else if (key === "search") {
        newFilters.search = "";
        setSearchInput("");
      } else if (key === "sort") {
        newFilters.sort = "newest";
      } else if (key === "category") {
        newFilters.category = "";
      } else {
        newFilters.maxPrice = "";
        setMaxPriceInput("");
      }
      setFilters(newFilters);
      updateURL(newFilters);
      onFiltersChange?.(newFilters);
    },
    [filters, updateURL, onFiltersChange]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const clearedFilters: FilterValues = {
      category: "",
      search: "",
      sort: "newest",
      minPrice: "",
      maxPrice: "",
    };
    setFilters(clearedFilters);
    setSearchInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    updateURL(clearedFilters);
    onFiltersChange?.(clearedFilters);
    onClear?.();
  }, [updateURL, onFiltersChange, onClear]);

  // Apply filters from sheet (mobile)
  const handleApplyFilters = useCallback(() => {
    const newFilters = {
      ...filters,
      search: searchInput,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
    };
    setFilters(newFilters);
    updateURL(newFilters);
    onFiltersChange?.(newFilters);
    setIsSheetOpen(false);
  }, [filters, searchInput, minPriceInput, maxPriceInput, updateURL, onFiltersChange]);

  // Sync state with URL params on mount and URL changes
  useEffect(() => {
    const newFilters: FilterValues = {
      category: searchParams.get("category") || "",
      search: searchParams.get("search") || "",
      sort: (searchParams.get("sort") as SortOption) || "newest",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
    };
    setFilters(newFilters);
    setSearchInput(newFilters.search);
    setMinPriceInput(newFilters.minPrice);
    setMaxPriceInput(newFilters.maxPrice);
  }, [searchParams]);

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters = {
      ...filters,
      search: searchInput,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
    };
    setFilters(newFilters);
    updateURL(newFilters);
    onFiltersChange?.(newFilters);
  };

  return (
    <div className={styles.container}>
      {/* Desktop/Tablet Filters */}
      <div className={styles.desktopWrapper}>
        {/* Top Row: Search, Category, Sort, Price Range */}
        <div className={styles.filtersRow}>
          {/* Search Input */}
          {!hideSearch && (
            <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
              <div className={styles.searchWrapper}>
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={styles.searchInput}
                />
                <button type="button" className={styles.searchClear}>
                  {searchInput && (
                    <X
                      className="h-4 w-4"
                      onClick={() => {
                        setSearchInput("");
                        handleRemoveFilter("search");
                      }}
                    />
                  )}
                </button>
                <button type="submit" className={styles.searchButton}>
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Category Select */}
          <Select
            value={filters.category || "all"}
            onValueChange={(value) =>
              handleFilterChange("category", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className={`${styles.selectTrigger} ${styles.categorySelect}`}>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Select */}
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              handleFilterChange("sort", value as SortOption)
            }
          >
            <SelectTrigger className={`${styles.selectTrigger} ${styles.sortSelect}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Price Range */}
          <div className={styles.priceRange}>
            <Input
              type="number"
              placeholder={`Min ${currencySymbol}`}
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className={styles.priceInput}
              min={0}
            />
            <span className={styles.priceSeparator}>-</span>
            <Input
              type="number"
              placeholder={`Max ${currencySymbol}`}
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className={styles.priceInput}
              min={0}
            />
          </div>
        </div>

        {/* Bottom Row: Results Count, Active Filters, Clear All */}
        <div className={styles.activeFiltersRow}>
          <div className={styles.leftSection}>
            {totalResults !== undefined && (
              <span className={styles.resultsCount}>
                {totalResults} {totalResults === 1 ? "product" : "products"}{" "}
                found
              </span>
            )}

            {/* Active Filter Chips */}
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                className={styles.filterChip}
                onClick={() => handleRemoveFilter(filter.key)}
              >
                {filter.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>

          {activeFilters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className={styles.clearAllButton}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Filter Button & Sheet */}
      <div className={styles.mobileWrapper}>
        <div className={styles.mobileHeader}>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className={styles.filterButton}>
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilters.length > 0 && (
                  <span className={styles.filterBadge}>
                    {activeFilters.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className={styles.sheetContent}>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className={styles.sheetBody}>
                {/* Search */}
                {!hideSearch && (
                  <div className={styles.mobileFilterGroup}>
                    <label className={styles.filterLabel}>Search</label>
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                )}

                {/* Category */}
                <div className={styles.mobileFilterGroup}>
                  <label className={styles.filterLabel}>Category</label>
                  <Select
                    value={filters.category || "all"}
                    onValueChange={(value) =>
                      setFilters((f) => ({
                        ...f,
                        category: value === "all" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className={styles.mobileSelectTrigger}>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className={styles.mobileFilterGroup}>
                  <label className={styles.filterLabel}>Price Range ({currencySymbol})</label>
                  <div className={styles.mobilePriceRange}>
                    <Input
                      type="number"
                      placeholder={`Min ${currencySymbol}`}
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      min={0}
                    />
                    <span className={styles.priceSeparator}>-</span>
                    <Input
                      type="number"
                      placeholder={`Max ${currencySymbol}`}
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      min={0}
                    />
                  </div>
                </div>

                {/* Sort */}
                <div className={styles.mobileFilterGroup}>
                  <label className={styles.filterLabel}>Sort By</label>
                  <Select
                    value={filters.sort}
                    onValueChange={(value) =>
                      setFilters((f) => ({ ...f, sort: value as SortOption }))
                    }
                  >
                    <SelectTrigger className={styles.mobileSelectTrigger}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter className={styles.sheetFooter}>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className={styles.sheetClearBtn}
                >
                  Clear All
                </Button>
                <SheetClose asChild>
                  <Button onClick={handleApplyFilters}>Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Mobile Sort Quick Access */}
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              handleFilterChange("sort", value as SortOption)
            }
          >
            <SelectTrigger className={styles.mobileSortTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Results & Active Filters */}
        <div className={styles.mobileActiveFilters}>
          {totalResults !== undefined && (
            <span className={styles.mobileResultsCount}>
              {totalResults} {totalResults === 1 ? "product" : "products"} found
            </span>
          )}
          {activeFilters.length > 0 && (
            <div className={styles.mobileChips}>
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  className={styles.filterChip}
                  onClick={() => handleRemoveFilter(filter.key)}
                >
                  {filter.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                className={styles.clearAllChip}
                onClick={handleClearFilters}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
