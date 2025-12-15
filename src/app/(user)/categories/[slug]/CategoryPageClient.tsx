"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ProductType } from "@/types/product";
import ProductCard from "@/components/shared/ProductCard";
import ProductFilters from "@/components/shared/ProductFilters";
import {
  CarouselWrapper,
  CarouselItem,
} from "@/components/ui/CarouselWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderTree } from "lucide-react";
import styles from "../page.module.css";
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

interface CategoryWithCount extends Category {
  productCount?: number;
}

// Breadcrumbs Component
const Breadcrumbs = ({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) => {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {breadcrumbs.map((crumb, idx) => (
        <span key={crumb.id}>
          {idx > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
          {idx === breadcrumbs.length - 1 ? (
            <span className={styles.breadcrumbCurrent} aria-current="page">
              {crumb.name}
            </span>
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
  onSelect,
}: {
  subcategories: Category[];
  onSelect: (slug: string) => void;
}) => {
  if (!subcategories || subcategories.length === 0) return null;

  return (
    <div className={styles.subcategoriesSection}>
      <h3 className={styles.subcategoriesTitle}>Subcategories</h3>
      <div className={styles.subcategoriesPills} role="list">
        {subcategories.map((sub) => (
          <button
            key={sub.id}
            className={styles.subcategoryPill}
            onClick={() => onSelect(sub.slug)}
            role="listitem"
          >
            {sub.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({
  pagination,
  slug,
}: {
  pagination: PaginationInfo;
  slug: string;
}) => {
  const searchParams = useSearchParams();

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `/categories/${slug}?${params.toString()}`;
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
    <nav className={styles.pagination} aria-label="Pagination">
      {page > 1 && (
        <Link
          href={createPageUrl(page - 1) as Route}
          className={styles.pageLink}
          aria-label="Previous page"
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
              aria-label={`Page ${pageNum}`}
              aria-current={pageNum === page ? "page" : undefined}
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
          aria-label="Next page"
        >
          Next
        </Link>
      )}
    </nav>
  );
};

interface CategoryPageClientProps {
  slug: string;
  initialCategory: Category;
  initialBreadcrumbs: Breadcrumb[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialProducts: any[];
}

export default function CategoryPageClient({
  slug,
  initialCategory,
  initialBreadcrumbs,
  initialProducts,
}: CategoryPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [category] = useState<Category>(initialCategory);
  const [breadcrumbs] = useState<Breadcrumb[]>(initialBreadcrumbs);
  const [products, setProducts] = useState<ProductType[]>(initialProducts);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [lessRelevantProducts, setLessRelevantProducts] = useState<
    ProductType[]
  >([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductType[]>(
    []
  );
  const [subcategoriesWithProducts, setSubcategoriesWithProducts] = useState<
    CategoryWithCount[]
  >([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: initialProducts.length,
    page: 1,
    limit: 20,
    pages: 1,
  });
  const [hasAnimated, setHasAnimated] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const initialFetchDone = useRef(false);

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

  // Animation trigger
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || hasAnimated) return;

    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [products, hasAnimated]);

  // Fetch subcategories with product counts
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!category.children || category.children.length === 0) return;

      try {
        const response = await fetch(
          `/api/categories?withCounts=true&onlyWithProducts=true&limit=100`
        );
        const data = await response.json();
        if (data.success) {
          const childSlugs = category.children!.map((c) => c.slug);
          const filteredSubcats = data.categories.filter(
            (cat: CategoryWithCount) =>
              childSlugs.includes(cat.slug) && (cat.productCount || 0) > 0
          );
          setSubcategoriesWithProducts(filteredSubcats);
        }
      } catch {
        setSubcategoriesWithProducts(category.children || []);
      }
    };

    fetchSubcategories();
  }, [category.children]);

  // Fetch products when filters change
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("category", slug);

      // Get filter params from URL
      const search = searchParams.get("search");
      const sort = searchParams.get("sort");
      const minPrice = searchParams.get("minPrice");
      const maxPrice = searchParams.get("maxPrice");
      const page = searchParams.get("page");
      const priceCurrency = searchParams.get("priceCurrency");
      const categories = searchParams.get("categories");

      if (priceCurrency) params.set("priceCurrency", priceCurrency);
      if (search) params.set("search", search);
      if (sort) params.set("sort", sort);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (page) params.set("page", page);
      if (categories) params.set("categories", categories);

      // Request carousels
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
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setProductsLoading(false);
    }
  }, [slug, searchParams]);

  // Refetch products when filter params change
  useEffect(() => {
    // Skip the initial fetch since we have server-rendered data
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      // Only fetch if there are filter params
      if (searchParams.toString()) {
        fetchProducts();
      }
      return;
    }
    fetchProducts();
  }, [searchParams, fetchProducts]);

  // Handle subcategory selection
  const handleSubcategorySelect = (subSlug: string) => {
    router.push(`/categories/${subSlug}`);
  };

  return (
    <div className={styles.page}>
      {/* Breadcrumbs */}
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      {/* Category Header with gradient */}
      <CategoryHeader category={category} />

      {/* Subcategories Pills */}
      {!isSubcategory && subcategoriesWithProducts.length > 0 && (
        <SubcategoriesPills
          subcategories={subcategoriesWithProducts}
          onSelect={handleSubcategorySelect}
        />
      )}

      {/* Filters */}
      <div className={styles.filtersSection}>
        <ProductFilters
          categories={subcategoriesWithProducts}
          totalResults={pagination.total}
          hideSearch={false}
          hideCategoryFilter={
            isSubcategory || subcategoriesWithProducts.length === 0
          }
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
          <div className={styles.productsGrid} ref={gridRef}>
            {products.map((product, index) => (
              <motion.div
                key={product.id}
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
          {pagination.pages > 1 && (
            <Pagination pagination={pagination} slug={slug} />
          )}

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

          {/* You Might Also Like Carousel */}
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
}
