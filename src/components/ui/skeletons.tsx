import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
import { Card, CardContent } from "./card";

/**
 * Skeleton for ProductCard component
 */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "overflow-hidden p-0 gap-0 h-full flex flex-col",
        className
      )}
    >
      {/* Image skeleton */}
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      {/* Content skeleton */}
      <CardContent className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-3/4 mb-2" />

        {/* Size info */}
        <Skeleton className="h-4 w-1/2 mb-2" />

        {/* Price */}
        <div className="flex items-center gap-2 pt-1 mt-auto">
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Grid of ProductCard skeletons
 */
export function ProductGridSkeleton({
  count = 12,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for CategoryCard component
 */
export function CategoryCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <Skeleton className="aspect-square w-full rounded-none" />
      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

/**
 * Grid of CategoryCard skeletons
 */
export function CategoryGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for product detail page
 */
export function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image gallery skeleton */}
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-md" />
            ))}
          </div>
        </div>

        {/* Product info skeleton */}
        <div className="space-y-6">
          {/* Breadcrumbs */}
          <div className="flex gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Title */}
          <Skeleton className="h-8 w-3/4" />

          {/* Price */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Size */}
          <Skeleton className="h-10 w-48" />

          {/* Actions */}
          <div className="flex gap-4">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-12" />
          </div>
        </div>
      </div>

      {/* Related products */}
      <div className="mt-16">
        <Skeleton className="h-8 w-48 mb-6" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}

/**
 * Skeleton for filter bar
 */
export function FilterBarSkeleton() {
  return (
    <div className="flex flex-wrap gap-4 items-center py-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-48" />
    </div>
  );
}

/**
 * Skeleton for products page (filters + grid)
 */
export function ProductsPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-48 mb-6" />
      <FilterBarSkeleton />
      <div className="mt-6">
        <ProductGridSkeleton count={12} />
      </div>
      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-10 rounded-md" />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for categories page
 */
export function CategoriesPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-48 mb-2" />
      <Skeleton className="h-5 w-96 mb-8" />
      <CategoryGridSkeleton count={8} />
    </div>
  );
}

/**
 * Skeleton for about page
 */
export function AboutPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="text-center mb-12">
        <Skeleton className="h-12 w-64 mx-auto mb-4" />
        <Skeleton className="h-5 w-full max-w-2xl mx-auto mb-2" />
        <Skeleton className="h-5 w-3/4 max-w-2xl mx-auto" />
      </div>

      {/* Content sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Values/features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for contact page
 */
export function ContactPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-48 mx-auto mb-4" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        {/* Contact form */}
        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-32 w-full rounded-md" />
          <Skeleton className="h-12 w-40 rounded-md" />
        </div>

        {/* Contact info */}
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for FAQ page
 */
export function FAQPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for profile page
 */
export function ProfilePageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Skeleton className="h-10 w-48 mb-8" />

      {/* Avatar */}
      <div className="flex items-center gap-6 mb-8">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <Skeleton className="h-12 w-32 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Skeleton for settings page
 */
export function SettingsPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Skeleton className="h-10 w-48 mb-8" />

      <div className="space-y-8">
        {/* Setting sections */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b pb-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for inquiries page
 */
export function InquiriesPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-48 mb-8" />

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for legal pages list
 */
export function LegalListSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Skeleton className="h-10 w-48 mb-8" />

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <Skeleton className="h-6 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for legal detail page
 */
export function LegalDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-4 w-48 mb-8" />

      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Generic page skeleton with title and content
 */
export function PageSkeleton({
  showTitle = true,
  contentLines = 5,
}: {
  showTitle?: boolean;
  contentLines?: number;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      {showTitle && <Skeleton className="h-10 w-64 mb-8" />}
      <div className="space-y-4">
        {Array.from({ length: contentLines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Carousel section skeleton
 */
export function CarouselSkeleton({
  title,
  count = 4,
}: {
  title?: string;
  count?: number;
}) {
  return (
    <div className="py-8">
      {title && <Skeleton className="h-8 w-48 mb-6" />}
      <div className="flex gap-6 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-64">
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Hidden SEO container - renders server data for crawlers but hidden visually
 * Uses inline styles to prevent FOUC (Flash of Unstyled Content)
 */
export function SEOContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("sr-only", className)}
      aria-hidden="true"
      data-seo-content="true"
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        borderWidth: 0,
      }}
    >
      {children}
    </div>
  );
}

/**
 * SEO Product data for search engines
 */
export function SEOProductData({
  product,
}: {
  product: {
    name: string;
    description?: string;
    slug: string;
    prices?: { retail: number; discount?: number };
    category?: { name: string; slug: string };
    images?: { url: string }[];
  };
}) {
  return (
    <article data-product-slug={product.slug}>
      <h3>{product.name}</h3>
      {product.description && <p>{product.description}</p>}
      {product.prices && (
        <p>
          Price: ${product.prices.retail}
          {product.prices.discount && ` (${product.prices.discount}% off)`}
        </p>
      )}
      {product.category && <p>Category: {product.category.name}</p>}
    </article>
  );
}

/**
 * SEO Category data for search engines
 */
export function SEOCategoryData({
  category,
}: {
  category: {
    name: string;
    description?: string;
    slug: string;
    productCount?: number;
  };
}) {
  return (
    <article data-category-slug={category.slug}>
      <h3>{category.name}</h3>
      {category.description && <p>{category.description}</p>}
      {category.productCount !== undefined && (
        <p>{category.productCount} products</p>
      )}
    </article>
  );
}
