"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronDown, Search, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./CategoryMultiSelect.module.css";

export interface CategoryWithProductCount {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

// Alias for backward compatibility
type Category = CategoryWithProductCount;

interface CategoryMultiSelectProps {
  selectedCategories: string[];
  onSelectionChange: (categories: string[]) => void;
  placeholder?: string;
  className?: string;
  /** If provided, only these categories will be shown (by slug). When empty array, no categories shown. */
  allowedCategories?: Category[];
}

const CategoryMultiSelect = ({
  selectedCategories,
  onSelectionChange,
  placeholder = "Select categories...",
  className,
  allowedCategories,
}: CategoryMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if we should use allowed categories or fetch all
  const useAllowedCategories = allowedCategories !== undefined;

  // Fetch categories with product counts (only if not using allowedCategories)
  const fetchCategories = useCallback(async () => {
    if (useAllowedCategories) {
      setCategories(allowedCategories);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/categories?withCounts=true&onlyWithProducts=true&limit=100"
      );
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      } else {
        setError("Failed to load categories");
      }
    } catch (err) {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [useAllowedCategories, allowedCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected category objects
  const selectedCategoryObjects = categories.filter((cat) =>
    selectedCategories.includes(cat.slug)
  );

  const toggleCategory = (slug: string) => {
    if (selectedCategories.includes(slug)) {
      onSelectionChange(selectedCategories.filter((s) => s !== slug));
    } else {
      onSelectionChange([...selectedCategories, slug]);
    }
  };

  const removeCategory = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedCategories.filter((s) => s !== slug));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange([]);
  };

  return (
    <div ref={containerRef} className={cn(styles.container, className)}>
      {/* Trigger */}
      <div
        className={cn(styles.trigger, isOpen && styles.triggerOpen)}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
      >
        <div className={styles.triggerContent}>
          {selectedCategoryObjects.length > 0 ? (
            <div className={styles.tags}>
              {selectedCategoryObjects.slice(0, 3).map((cat) => (
                <span key={cat.slug} className={styles.tag}>
                  {cat.name}
                  <button
                    type="button"
                    className={styles.tagRemove}
                    onClick={(e) => removeCategory(cat.slug, e)}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {selectedCategoryObjects.length > 3 && (
                <span className={styles.tagMore}>
                  +{selectedCategoryObjects.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </div>
        <div className={styles.triggerActions}>
          {selectedCategories.length > 0 && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearAll}
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={cn(styles.chevron, isOpen && styles.chevronOpen)}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Search Input */}
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className={styles.optionsList}>
            {loading ? (
              <div className={styles.loadingState}>
                <Loader2 size={16} className={styles.spinner} />
                Loading categories...
              </div>
            ) : error ? (
              <div className={styles.errorState}>{error}</div>
            ) : filteredCategories.length === 0 ? (
              <div className={styles.emptyState}>
                {searchQuery ? "No categories found" : "No categories available"}
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isSelected = selectedCategories.includes(category.slug);
                return (
                  <div
                    key={category.id}
                    className={cn(
                      styles.option,
                      isSelected && styles.optionSelected
                    )}
                    onClick={() => toggleCategory(category.slug)}
                  >
                    <div className={styles.optionContent}>
                      <span className={styles.optionName}>{category.name}</span>
                      {category.productCount !== undefined && (
                        <span className={styles.optionCount}>
                          ({category.productCount})
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={14} className={styles.checkIcon} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Count Footer */}
          {selectedCategories.length > 0 && (
            <div className={styles.footer}>
              {selectedCategories.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryMultiSelect;
