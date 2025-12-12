"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ProductType } from "@/types/product";
import ProductCard from "@/components/shared/ProductCard";
import ProductFilters from "@/components/shared/ProductFilters";
import { CarouselWrapper, CarouselItem } from "@/components/ui/CarouselWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, FolderTree } from "lucide-react";
import styles from "./page.module.css";
import { Route } from "next";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    thumbnailUrl?: string;
  };
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  children?: Category[];
}

interface Breadcrumb {
  id: string;
  name: string;
  slug: string;
  url: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Breadcrumbs Component
const Breadcrumbs = ({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) => {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <nav className={styles.breadcrumb}>
      {breadcrumbs.map((crumb, idx) => (
        <span key={crumb.id}>
          {idx > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
          {idx === breadcrumbs.length - 1 ? (
            <span className={styles.breadcrumbCurrent}>{crumb.name}</span>
          ) : (
            <Link href={crumb.url as Route} className={styles.breadcrumbLink}>
              {crumb.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

// Category Header Component with gradient overlay
const CategoryHeader = ({ category }: { category: Category }) => {
  const imageUrl = category.image?.url || category.image?.thumbnailUrl;
  const thumbnailUrl = category.image?.thumbnailUrl || category.image?.url;
  return (
    <div className={styles.categoryHeader}>
      {/* Desktop: Full background image with overlay */}
      <div className={styles.categoryHeaderDesktop}>
        <div className={styles.categoryHeaderBackground}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={category.name}
              fill
              style={{ objectFit: "cover" }}
              priority
              placeholder="blur"
              blurDataURL={thumbnailUrl}
            />
          ) : (
            <div className={styles.categoryHeaderPlaceholder}>
              <FolderTree className="w-20 h-20 text-white/30" />
            </div>
          )}
          <div className={styles.categoryHeaderOverlay} />
        </div>
        <div className={styles.categoryHeaderContent}>
          <h1 className={styles.categoryTitle}>{category.name}</h1>
          {category.description && (
            <p className={styles.categoryDescription}>{category.description}</p>
          )}
        </div>
      </div>
      {/* Mobile: Full width image with text below */}
      <div className={styles.categoryHeaderMobile}>
        <div className={styles.categoryHeaderMobileImage}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={category.name}
              fill
              style={{ objectFit: "cover" }}
              priority
              placeholder="blur"
              blurDataURL={thumbnailUrl}
            />
          ) : (
            <div className={styles.categoryHeaderMobilePlaceholder}>
              <FolderTree className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className={styles.categoryHeaderMobileContent}>
          <h1 className={styles.categoryTitleMobile}>{category.name}</h1>
          {category.description && (
            <p className={styles.categoryDescriptionMobile}>
              {category.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Subcategories Pills Component
const SubcategoriesPills = ({
  subcategories,
  activeSlug,
  onSelect,
}: {
  subcategories: Category[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}) => {
  if (!subcategories || subcategories.length === 0) return null;

  return (
    <div className={styles.subcategoriesSection}>
      <h3 className={styles.subcategoriesTitle}>Subcategories</h3>
      <div className={styles.subcategoriesPills}>
        {subcategories.map((sub) => (
          <button
            key={sub.id}
            className={`${styles.subcategoryPill} ${
              activeSlug === sub.slug ? styles.subcategoryPillActive : ""
            }`}
            onClick={() => onSelect(sub.slug)}
          >
            {sub.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// Category Tree Component for when no category is selected
const CategoryTree = ({ categories }: { categories: Category[] }) => {
  return (
    <div className={styles.categoryTreeContainer}>
      <h1 className={styles.allCategoriesTitle}>All Categories</h1>
      <p className={styles.allCategoriesSubtitle}>
        Browse our product categories
      </p>
      <div className={styles.categoryTree}>
        {categories.map((category) => (
          <div key={category.id} className={styles.categoryTreeItem}>
            <Link
              href={`/categories?slug=${category.slug}`}
              className={styles.categoryTreeParent}
            >
              <div className={styles.categoryTreeImage}>
                {category.image?.url ? (
                  <Image
                    src={
                      category.image.url || category.image.thumbnailUrl || ""
                    }
                    alt={category.name}
                    fill
                    style={{ objectFit: "cover" }}
                    placeholder="blur"
                    blurDataURL={
                      category.image.thumbnailUrl || category.image.url || ""
                    }
                  />
                ) : (
                  <FolderTree className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className={styles.categoryTreeInfo}>
                <span className={styles.categoryTreeName}>{category.name}</span>
                {category.description && (
                  <span className={styles.categoryTreeDescription}>
                    {category.description}
                  </span>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
            {category.children && category.children.length > 0 && (
              <div className={styles.categoryTreeChildren}>
                {category.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/categories?slug=${child.slug}`}
                    className={styles.categoryTreeChild}
                  >
                    <span>{child.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Extended Category interface with product count
interface CategoryWithCount extends Category {
  productCount?: number;
}

// Main Category List Page Inner Component
const CategoryListPageInner = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug");

  const [category, setCategory] = useState<Category | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [lessRelevantProducts, setLessRelevantProducts] = useState<ProductType[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductType[]>([]);
  const [subcategoriesWithProducts, setSubcategoriesWithProducts] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });

  // Check if current category is a subcategory (has a parent)
  const isSubcategory = Boolean(category?.parent);

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

  // Fetch all categories for tree view
  const fetchAllCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories?parentOnly=true&limit=100");
      const data = await response.json();
      if (data.success) {
        setAllCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  // Fetch specific category
  const fetchCategory = useCallback(
    async (categorySlug: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/categories/${categorySlug}`);
        const data = await response.json();

        if (data.success) {
          setCategory(data.category);
          setBreadcrumbs(data.breadcrumbs || []);

          // If category has children (is a parent category), fetch subcategories with product counts
          if (data.category.children && data.category.children.length > 0) {
            try {
              const subcatResponse = await fetch(
                `/api/categories?withCounts=true&onlyWithProducts=true&limit=100`
              );
              const subcatData = await subcatResponse.json();
              if (subcatData.success) {
                // Filter to only show children of this category that have products
                const childSlugs = data.category.children.map((c: Category) => c.slug);
                const filteredSubcats = subcatData.categories.filter(
                  (cat: CategoryWithCount) => childSlugs.includes(cat.slug) && (cat.productCount || 0) > 0
                );
                setSubcategoriesWithProducts(filteredSubcats);
              }
            } catch {
              // If fails, use the children from category response
              setSubcategoriesWithProducts(data.category.children);
            }
          } else {
            setSubcategoriesWithProducts([]);
          }

          setLoading(false);
          return data.category;
        } else {
          setError(data.error || "Category not found");
          setCategory(null);
          setBreadcrumbs([]);
          setSubcategoriesWithProducts([]);
          await fetchAllCategories();
          setLoading(false);
          return null;
        }
      } catch (err) {
        console.error("Failed to fetch category:", err);
        setError("Failed to load category");
        setCategory(null);
        setBreadcrumbs([]);
        setSubcategoriesWithProducts([]);
        await fetchAllCategories();
        setLoading(false);
        return null;
      }
    },
    [fetchAllCategories]
  );

  // Fetch products for category
  const fetchProducts = useCallback(
    async (categorySlug: string) => {
      setProductsLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("category", categorySlug);

        // Get other filter params
        const search = searchParams.get("search");
        const sort = searchParams.get("sort");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const page = searchParams.get("page");
        const priceCurrency = searchParams.get("priceCurrency");

        if (priceCurrency) params.set("priceCurrency", priceCurrency);
        if (search) params.set("search", search);
        if (sort) params.set("sort", sort);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        if (page) params.set("page", page);

        // Always request carousels (related, less relevant, recommended)
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
          setProducts([]);
          setRelatedProducts([]);
          setLessRelevantProducts([]);
          setRecommendedProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProducts([]);
        setRelatedProducts([]);
        setLessRelevantProducts([]);
        setRecommendedProducts([]);
      } finally {
        setProductsLoading(false);
      }
    },
    [searchParams]
  );

  // Load data when slug changes
  useEffect(() => {
    const loadData = async () => {
      if (slug) {
        const cat = await fetchCategory(slug);
        if (cat) {
          fetchProducts(slug);
        }
      } else {
        setLoading(true);
        setCategory(null);
        setProducts([]);
        await fetchAllCategories();
        setLoading(false);
      }
    };

    loadData();
  }, [slug, fetchCategory, fetchProducts, fetchAllCategories]);

  // Refetch products when filter params change (but not slug)
  useEffect(() => {
    if (slug && category) {
      fetchProducts(slug);
    }
    // Only depend on searchParams string to detect filter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Handle subcategory selection
  const handleSubcategorySelect = (subSlug: string) => {
    router.push(`/categories?slug=${subSlug}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <Skeleton className="w-full h-[300px] rounded-2xl" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-10 w-full max-w-md" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No slug provided or category not found - show all categories
  if (!slug || error || !category) {
    return (
      <div className={styles.page}>
        <CategoryTree categories={allCategories} />
      </div>
    );
  }

  // Category found - show category page with products
  return (
    <div className={styles.page}>
      {/* Breadcrumbs */}
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      {/* Category Header with gradient */}
      <CategoryHeader category={category} />

      {/* Subcategories Pills - Only show for parent categories with subcategories that have products */}
      {!isSubcategory && subcategoriesWithProducts.length > 0 && (
        <SubcategoriesPills
          subcategories={subcategoriesWithProducts}
          activeSlug=""
          onSelect={handleSubcategorySelect}
        />
      )}

      {/* Filters - show only subcategories with products, or hide if none */}
      <div className={styles.filtersSection}>
        <ProductFilters
          categories={subcategoriesWithProducts}
          totalResults={pagination.total}
          hideSearch={false}
          hideCategoryFilter={isSubcategory || subcategoriesWithProducts.length === 0}
          allowedCategories={subcategoriesWithProducts}
        />
      </div>

      {/* Products Grid */}
      {productsLoading ? (
        <div className={styles.productsLoading}>
          <div className={styles.spinner} />
          <span>Loading products...</span>
        </div>
      ) : products.length === 0 ? (
        <div className={styles.emptyProducts}>
          <FolderTree className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-muted-foreground">
            Try adjusting your filters or browse subcategories
          </p>
        </div>
      ) : (
        <>
          <div className={styles.productsGrid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
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

// Pagination Component
const Pagination = ({ pagination }: { pagination: PaginationInfo }) => {
  const searchParams = useSearchParams();

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `/categories?${params.toString()}`;
  };

  const { page, pages } = pagination;

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
        <Link
          href={createPageUrl(page - 1) as Route}
          className={styles.pageLink}
        >
          Previous
        </Link>
      )}

      <div className={styles.pageNumbers}>
        {getPageNumbers().map((pageNum, idx) =>
          typeof pageNum === "string" ? (
            <span key={`dots-${idx}`} className={styles.pageDots}>
              {pageNum}
            </span>
          ) : (
            <Link
              key={pageNum}
              href={createPageUrl(pageNum) as Route}
              className={`${styles.pageLink} ${
                pageNum === page ? styles.pageActive : ""
              }`}
            >
              {pageNum}
            </Link>
          )
        )}
      </div>

      {page < pages && (
        <Link
          href={createPageUrl(page + 1) as Route}
          className={styles.pageLink}
        >
          Next
        </Link>
      )}
    </div>
  );
};

// Main Component with Suspense
const CategoriesPageClient = () => {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.loadingContainer}>
            <Skeleton className="w-full h-[300px] rounded-2xl" />
          </div>
        </div>
      }
    >
      <CategoryListPageInner />
    </Suspense>
  );
};

export default CategoriesPageClient;
