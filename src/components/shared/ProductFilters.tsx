"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
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
import CategoryMultiSelect, {
  CategoryWithProductCount,
} from "./CategoryMultiSelect";

export type SortOption =
  | "newest"
  | "name"
  | "price-low"
  | "price-high"
  | "trending";

export interface FilterValues {
  categories: string[];
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
  categories?: Category[]; // Optional - used for displaying filter chips with names
  totalResults?: number;
  onFiltersChange?: (filters: FilterValues) => void;
  hideSearch?: boolean;
  onClear?: () => void;
  /** If true, completely hide the category filter dropdown */
  hideCategoryFilter?: boolean;
  /** If provided, only these categories will be available in the category multiselect */
  allowedCategories?: CategoryWithProductCount[];
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
  categories = [],
  totalResults,
  onFiltersChange,
  hideSearch = false,
  onClear,
  hideCategoryFilter = false,
  allowedCategories,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);
  const { currency, currencySymbol } = useCurrency();

  // Initialize state from URL params
  const categoriesParam = searchParams.get("categories");
  const [filters, setFilters] = useState<FilterValues>({
    categories: categoriesParam
      ? categoriesParam.split(",").filter(Boolean)
      : [],
    search: searchParams.get("search") || "",
    sort: (searchParams.get("sort") as SortOption) || "newest",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
  });

  const [searchInput, setSearchInput] = useState(filters.search);
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<
    CategoryWithProductCount[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Debounce inputs
  const debouncedSearch = useDebounce(searchInput, 400);
  const debouncedMinPrice = useDebounce(minPriceInput, 500);
  const debouncedMaxPrice = useDebounce(maxPriceInput, 500);

  // Fetch categories with filtered product counts when filters change
  const fetchFilteredCategories = useCallback(async () => {
    // Skip if using allowedCategories prop
    if (allowedCategories !== undefined) {
      setFilteredCategories(allowedCategories);
      return;
    }

    setLoadingCategories(true);
    try {
      const params = new URLSearchParams();
      params.set("withCounts", "true");
      params.set("onlyWithProducts", "true");
      params.set("limit", "100");

      // Add product filters to get accurate counts
      if (debouncedSearch) {
        params.set("productSearch", debouncedSearch);
      }
      if (debouncedMinPrice) {
        params.set("minPrice", debouncedMinPrice);
      }
      if (debouncedMaxPrice) {
        params.set("maxPrice", debouncedMaxPrice);
      }
      if (debouncedMinPrice || debouncedMaxPrice) {
        params.set("priceCurrency", currency);
      }

      const response = await fetch(`/api/categories?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setFilteredCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch filtered categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  }, [
    debouncedSearch,
    debouncedMinPrice,
    debouncedMaxPrice,
    currency,
    allowedCategories,
  ]);

  // Fetch filtered categories when filters change
  useEffect(() => {
    fetchFilteredCategories();
  }, [fetchFilteredCategories]);

  // Memoize the categories to pass to CategoryMultiSelect
  const categoriesToShow = useMemo(() => {
    if (allowedCategories !== undefined) {
      return allowedCategories;
    }
    return filteredCategories;
  }, [allowedCategories, filteredCategories]);

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

      if (newFilters.categories.length > 0) {
        params.set("categories", newFilters.categories.join(","));
      } else {
        params.delete("categories");
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
    // Note: Only debounced values should trigger this effect, not filters/updateURL/onFiltersChange
    // to avoid infinite loops. Those are used inside but shouldn't re-trigger the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, debouncedMinPrice, debouncedMaxPrice]);

  // Get active filters for chips
  const activeFilters: {
    key: keyof FilterValues;
    label: string;
    value?: string;
  }[] = [];
  if (filters.search) {
    activeFilters.push({ key: "search", label: `Search: ${filters.search}` });
  }
  if (filters.categories.length > 0) {
    // Use filteredCategories first, then fall back to categories prop for name lookup
    const allCategories = [...filteredCategories, ...categories];
    filters.categories.forEach((catSlug) => {
      const cat = allCategories.find((c) => c.slug === catSlug);
      activeFilters.push({
        key: "categories",
        label: cat?.name || catSlug,
        value: catSlug,
      });
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
    (key: keyof FilterValues, value: string | string[]) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      updateURL(newFilters);
      onFiltersChange?.(newFilters);
    },
    [filters, updateURL, onFiltersChange]
  );

  // Handle categories change from multiselect
  const handleCategoriesChange = useCallback(
    (selectedCategories: string[]) => {
      const newFilters = { ...filters, categories: selectedCategories };
      setFilters(newFilters);
      updateURL(newFilters);
      onFiltersChange?.(newFilters);
    },
    [filters, updateURL, onFiltersChange]
  );

  // Remove single filter
  const handleRemoveFilter = useCallback(
    (key: keyof FilterValues, value?: string) => {
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
      } else if (key === "categories") {
        if (value) {
          // Remove specific category
          newFilters.categories = newFilters.categories.filter(
            (c) => c !== value
          );
        } else {
          // Clear all categories
          newFilters.categories = [];
        }
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
      categories: [],
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
  }, [
    filters,
    searchInput,
    minPriceInput,
    maxPriceInput,
    updateURL,
    onFiltersChange,
  ]);

  // Sync state with URL params on mount and URL changes
  useEffect(() => {
    const urlCategories = searchParams.get("categories");
    const newFilters: FilterValues = {
      categories: urlCategories ? urlCategories.split(",").filter(Boolean) : [],
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
    <div
      className={styles.container}
      role="search"
      aria-label="Product filters"
    >
      {/* Desktop/Tablet Filters */}
      <div className={styles.desktopWrapper}>
        {/* Top Row: Search, Category, Sort, Price Range */}
        <fieldset className={styles.filtersRow}>
          <legend className="sr-only">Filter products</legend>

          {/* Search Input */}
          {!hideSearch && (
            <form
              onSubmit={handleSearchSubmit}
              className={styles.searchForm}
              role="search"
            >
              <div className={styles.searchWrapper}>
                <label htmlFor="product-search" className="sr-only">
                  Search products
                </label>
                <Input
                  id="product-search"
                  type="search"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={styles.searchInput}
                  aria-label="Search products"
                />
                {searchInput && (
                  <button
                    type="button"
                    className={styles.searchClear}
                    onClick={() => {
                      setSearchInput("");
                      handleRemoveFilter("search");
                    }}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.searchButton}
                  aria-label="Submit search"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {/* Category MultiSelect */}
          {!hideCategoryFilter && (
            <div role="group" aria-label="Category filter" className="flex-3">
              <CategoryMultiSelect
                selectedCategories={filters.categories}
                onSelectionChange={handleCategoriesChange}
                placeholder={
                  loadingCategories ? "Loading..." : "Select categories..."
                }
                className={styles.categorySelect}
                allowedCategories={categoriesToShow}
              />
            </div>
          )}

          {/* Sort Select */}
          <div role="group" aria-label="Sort options" className="flex-3">
            <label htmlFor="sort-select" className="sr-only">
              Sort products by
            </label>
            <Select
              value={filters.sort}
              onValueChange={(value) =>
                handleFilterChange("sort", value as SortOption)
              }
            >
              <SelectTrigger
                className={`${styles.selectTrigger} ${styles.sortSelect}`}
                id="sort-select"
                aria-label="Sort products by"
              >
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

          {/* Price Range */}
          <fieldset className={styles.priceRange}>
            <legend className="sr-only">Price range filter</legend>
            <label htmlFor="min-price" className="sr-only">
              Minimum price in {currencySymbol}
            </label>
            <Input
              id="min-price"
              type="number"
              placeholder={`Min ${currencySymbol}`}
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className={styles.priceInput}
              min={0}
              aria-label={`Minimum price in ${currencySymbol}`}
            />
            <span className={styles.priceSeparator} aria-hidden="true">
              -
            </span>
            <label htmlFor="max-price" className="sr-only">
              Maximum price in {currencySymbol}
            </label>
            <Input
              id="max-price"
              type="number"
              placeholder={`Max ${currencySymbol}`}
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className={styles.priceInput}
              min={0}
              aria-label={`Maximum price in ${currencySymbol}`}
            />
          </fieldset>
        </fieldset>

        {/* Bottom Row: Results Count, Active Filters, Clear All */}
        <div
          className={styles.activeFiltersRow}
          role="status"
          aria-live="polite"
        >
          <div className={styles.leftSection}>
            {totalResults !== undefined && (
              <span
                className={styles.resultsCount}
                aria-label={`${totalResults} ${
                  totalResults === 1 ? "product" : "products"
                } found`}
              >
                {totalResults} {totalResults === 1 ? "product" : "products"}{" "}
                found
              </span>
            )}

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
              <div role="group" aria-label="Active filters">
                {activeFilters.map((filter, index) => (
                  <button
                    key={`${filter.key}-${filter.value || index}`}
                    className={styles.filterChip}
                    onClick={() => handleRemoveFilter(filter.key, filter.value)}
                    aria-label={`Remove filter: ${filter.label}`}
                  >
                    <span aria-hidden="true">{filter.label}</span>
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeFilters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className={styles.clearAllButton}
              aria-label="Clear all active filters"
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
              <Button
                variant="outline"
                className={styles.filterButton}
                aria-label={`Open filters${
                  activeFilters.length > 0
                    ? `, ${activeFilters.length} active`
                    : ""
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                <span>Filters</span>
                {activeFilters.length > 0 && (
                  <span className={styles.filterBadge} aria-hidden="true">
                    {activeFilters.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className={styles.sheetContent}
              aria-label="Filter products"
            >
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className={styles.sheetBody}>
                {/* Search */}
                {!hideSearch && (
                  <div className={styles.mobileFilterGroup}>
                    <label
                      htmlFor="mobile-search"
                      className={styles.filterLabel}
                    >
                      Search
                    </label>
                    <Input
                      id="mobile-search"
                      type="search"
                      placeholder="Search products..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      aria-label="Search products"
                    />
                  </div>
                )}

                {/* Categories */}
                {!hideCategoryFilter && (
                  <div className={styles.mobileFilterGroup}>
                    <label
                      id="mobile-categories-label"
                      className={styles.filterLabel}
                    >
                      Categories
                    </label>
                    <div aria-labelledby="mobile-categories-label">
                      <CategoryMultiSelect
                        selectedCategories={filters.categories}
                        onSelectionChange={(categories) =>
                          setFilters((f) => ({
                            ...f,
                            categories,
                          }))
                        }
                        placeholder={
                          loadingCategories
                            ? "Loading..."
                            : "Select categories..."
                        }
                        allowedCategories={categoriesToShow}
                      />
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <fieldset className={styles.mobileFilterGroup}>
                  <legend className={styles.filterLabel}>
                    Price Range ({currencySymbol})
                  </legend>
                  <div className={styles.mobilePriceRange}>
                    <label htmlFor="mobile-min-price" className="sr-only">
                      Minimum price
                    </label>
                    <Input
                      id="mobile-min-price"
                      type="number"
                      placeholder={`Min ${currencySymbol}`}
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      min={0}
                      aria-label={`Minimum price in ${currencySymbol}`}
                    />
                    <span className={styles.priceSeparator} aria-hidden="true">
                      -
                    </span>
                    <label htmlFor="mobile-max-price" className="sr-only">
                      Maximum price
                    </label>
                    <Input
                      id="mobile-max-price"
                      type="number"
                      placeholder={`Max ${currencySymbol}`}
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      min={0}
                      aria-label={`Maximum price in ${currencySymbol}`}
                    />
                  </div>
                </fieldset>

                {/* Sort */}
                <div className={styles.mobileFilterGroup}>
                  <label htmlFor="mobile-sort" className={styles.filterLabel}>
                    Sort By
                  </label>
                  <Select
                    value={filters.sort}
                    onValueChange={(value) =>
                      setFilters((f) => ({ ...f, sort: value as SortOption }))
                    }
                  >
                    <SelectTrigger
                      className={styles.mobileSelectTrigger}
                      id="mobile-sort"
                      aria-label="Sort products by"
                    >
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
                  aria-label="Clear all filters"
                >
                  Clear All
                </Button>
                <SheetClose asChild>
                  <Button
                    onClick={handleApplyFilters}
                    aria-label="Apply selected filters"
                  >
                    Apply Filters
                  </Button>
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
            <SelectTrigger
              className={styles.mobileSortTrigger}
              aria-label="Sort products"
            >
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
        <div
          className={styles.mobileActiveFilters}
          role="status"
          aria-live="polite"
        >
          {activeFilters.length > 0 && (
            <div
              className={styles.mobileChips}
              role="group"
              aria-label="Active filters"
            >
              {activeFilters.map((filter, index) => (
                <button
                  key={`${filter.key}-${filter.value || index}`}
                  className={styles.filterChip}
                  onClick={() => handleRemoveFilter(filter.key, filter.value)}
                  aria-label={`Remove filter: ${filter.label}`}
                >
                  <span aria-hidden="true">{filter.label}</span>
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              ))}
              <button
                className={styles.clearAllChip}
                onClick={handleClearFilters}
                aria-label="Clear all filters"
              >
                Clear All
              </button>
            </div>
          )}
          {totalResults !== undefined && (
            <span
              className={styles.mobileResultsCount}
              aria-label={`${totalResults} ${
                totalResults === 1 ? "product" : "products"
              } found`}
            >
              {totalResults} {totalResults === 1 ? "product" : "products"} found
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
