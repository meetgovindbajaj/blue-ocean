"use client";

import { useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import parse from "html-react-parser";
import { ProductType } from "@/types/product";
import ProductCard from "./ProductCard";
import styles from "./ProductDetailClient.module.css";
import { Route } from "next";
import { useCurrency } from "@/context/CurrencyContext";
import { useAuth } from "@/context/AuthContext";
import CarouselWrapper, { CarouselItem } from "@/components/ui/CarouselWrapper";

// Get or create a session ID for anonymous users
function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
}

interface Breadcrumb {
  id: string;
  name: string;
  slug: string;
  url: string;
}

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  prices: {
    retail: number;
    discount: number;
    wholesale: number;
  };
  size?: {
    length: number;
    width: number;
    height: number;
    unit: string;
    fixedSize: boolean;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  thumbnail?: {
    url: string;
    thumbnailUrl?: string;
  };
  images?: {
    id: string;
    name?: string;
    url: string;
    thumbnailUrl?: string;
    isThumbnail?: boolean;
    downloadUrl?: string;
    size?: number;
    width?: number;
    height?: number;
  }[];
}

interface ProductDetailClientProps {
  product: ProductType & {
    totalViews?: number;
    score?: number;
  };
  breadcrumbs: Breadcrumb[];
  relatedProducts: ProductType[];
  recommendedProducts?: RecommendedProduct[];
}

export default function ProductDetailClient({
  product,
  breadcrumbs,
  relatedProducts,
  recommendedProducts = [],
}: ProductDetailClientProps) {
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const viewTrackingTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasTrackedView = useRef(false);

  // Track product view with debounce (500ms delay to ensure user actually views the product)
  const trackProductView = useCallback(() => {
    // Prevent duplicate tracking for same product
    if (hasTrackedView.current) return;

    // Clear existing timeout
    if (viewTrackingTimeout.current) {
      clearTimeout(viewTrackingTimeout.current);
    }

    // Debounce - wait 500ms before tracking to ensure user is actually viewing
    viewTrackingTimeout.current = setTimeout(() => {
      const sessionId = getSessionId();

      // Track analytics event (for all users)
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "product_view",
          entityType: "product",
          entityId: product.id,
          entitySlug: product.slug,
          entityName: product.name,
          sessionId,
          userId: user?.userId,
        }),
      })
        .then(() => {
          hasTrackedView.current = true;
        })
        .catch(console.error);

      // Update recently viewed list (for logged-in users only)
      if (user?.userId) {
        fetch(`/api/products/${product.slug}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.userId }),
        }).catch(console.error);
      }

      viewTrackingTimeout.current = null;
    }, 500);
  }, [product.id, product.slug, product.name, user?.userId]);

  // Track view on mount
  useEffect(() => {
    trackProductView();

    // Cleanup timeout on unmount
    return () => {
      if (viewTrackingTimeout.current) {
        clearTimeout(viewTrackingTimeout.current);
      }
    };
  }, [trackProductView]);

  // Reset tracking flag when product changes
  useEffect(() => {
    hasTrackedView.current = false;
  }, [product.id]);

  const hasDiscount = product.prices.discount > 0;
  const discountedPrice = hasDiscount
    ? product.prices.retail * (1 - product.prices.discount / 100)
    : product.prices.retail;

  const images = product.images || [];

  // Check if all dimensions are 0
  const allDimensionsZero =
    product.size.length === 0 &&
    product.size.width === 0 &&
    product.size.height === 0;

  // Convert product images to CarouselItem format for main gallery
  const galleryCarouselData: CarouselItem[] = useMemo(() => {
    return images.map((img, idx) => ({
      id: img.id || `img-${idx}`,
      image: img.url,
      thumbnailImage: img.thumbnailUrl || img.url,
      alt: `${product.name} ${idx + 1}`,
    }));
  }, [images, product.name]);

  // Convert related products to CarouselItem format
  const relatedCarouselData: CarouselItem[] = useMemo(() => {
    return relatedProducts.map((p) => ({
      id: p.id,
      image: p.images?.[0]?.url || p.images?.[0]?.thumbnailUrl || "",
      thumbnailImage: p.images?.[0]?.thumbnailUrl || p.images?.[0]?.url || "",
      alt: p.name,
      content: <ProductCard product={p} />,
    }));
  }, [relatedProducts]);

  // Convert recommended products to CarouselItem format
  const recommendedCarouselData: CarouselItem[] = useMemo(() => {
    return recommendedProducts.map((rec) => ({
      id: rec.id,
      image: rec.images?.[0]?.url || rec.thumbnail?.url || "",
      thumbnailImage:
        rec.images?.[0]?.thumbnailUrl ||
        rec.thumbnail?.thumbnailUrl ||
        rec.thumbnail?.url ||
        "",
      alt: rec.name,

      content: (
        <ProductCard
          product={{
            id: rec.id,
            name: rec.name,
            slug: rec.slug,
            description: rec.description || "",
            prices: rec.prices,
            size: {
              length: rec.size?.length || 0,
              width: rec.size?.width || 0,
              height: rec.size?.height || 0,
              fixedSize: rec.size?.fixedSize || false,
              unit: (rec.size?.unit as "in" | "cm" | "mm" | "ft") || "in",
            },
            images: rec.images?.length
              ? rec.images.map((img) => ({
                  id: img.id,
                  name: img.name || rec.name,
                  url: img.url,
                  thumbnailUrl: img.thumbnailUrl || img.url,
                  isThumbnail: img.isThumbnail || false,
                  downloadUrl: img.downloadUrl || img.url,
                  size: img.size || 0,
                  width: img.width || 0,
                  height: img.height || 0,
                }))
              : rec.thumbnail
              ? [
                  {
                    id: "1",
                    name: rec.name,
                    url: rec.thumbnail.url,
                    thumbnailUrl:
                      rec.thumbnail.thumbnailUrl || rec.thumbnail.url,
                    isThumbnail: true,
                    downloadUrl: rec.thumbnail.url,
                    size: 0,
                    width: 0,
                    height: 0,
                  },
                ]
              : [],
            category: rec.category?.name || "",
            breadcrumbs: [],
            isActive: true,
          }}
        />
      ),
    }));
  }, [recommendedProducts]);

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        {breadcrumbs.map((crumb, idx) => (
          <span key={crumb.id}>
            {idx > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
            <Link href={crumb.url as Route} className={styles.breadcrumbLink}>
              {crumb.name}
            </Link>
          </span>
        ))}
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Image Gallery */}
        <div className={styles.gallery}>
          {images.length > 0 ? (
            <CarouselWrapper
              variant="fullWidth"
              data={galleryCarouselData}
              options={{
                showControlBtns: images.length > 1,
                showControlDots: false,
                showPreviewCards: images.length > 1,
                showPreviewBtn: true,
                showOverlay: false,
                autoPlay: true,
                autoPlayInterval: 5000,
                loop: true,
              }}
              className={styles.galleryCarousel}
            />
          ) : (
            <div className={styles.noImage}>No Image Available</div>
          )}
          {hasDiscount && (
            <div className={styles.discountBadge}>
              -{product.prices.discount}%
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={styles.info}>
          {/* Category Tag */}
          {product.breadcrumbs?.length > 0 && (
            <div className={styles.categoryTag}>
              {product.breadcrumbs[product.breadcrumbs.length - 1]?.name}
            </div>
          )}

          {/* Title */}
          <h1 className={styles.title}>{product.name}</h1>

          {/* Price */}
          <div className={styles.priceSection}>
            <span className={styles.currentPrice}>
              {formatPrice(discountedPrice)}
            </span>
            {hasDiscount && (
              <span className={styles.originalPrice}>
                {formatPrice(product.prices.retail)}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className={styles.description}>
              {parse(product.description)}
            </div>
          )}

          {/* Specifications */}
          <div className={styles.specifications}>
            <h3 className={styles.specsTitle}>Specifications</h3>
            <div className={styles.specsList}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Size</span>
                <span className={styles.specValue}>
                  {allDimensionsZero ? (
                    <span className={styles.customTag}>Custom Size</span>
                  ) : (
                    `${product.size.length} × ${product.size.width} × ${product.size.height} ${product.size.unit}`
                  )}
                </span>
              </div>
              {!allDimensionsZero && !product.size.fixedSize && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Customizable</span>
                  <span className={styles.specValue}>Yes</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact CTA */}
          <div className={styles.ctaSection}>
            <Link
              href={`/contact?product=${encodeURIComponent(
                product.name
              )}&productId=${product.id}&subject=Product Question`}
              className={styles.contactButton}
            >
              Contact for Inquiry
            </Link>
            <p className={styles.ctaNote}>
              Interested in this product? Get in touch with us for pricing and
              availability.
            </p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <CarouselWrapper
            variant="default"
            data={relatedCarouselData}
            options={{
              showControlBtns: true,
              showControlDots: false,
              autoPlay: true,
              autoPlayInterval: 4000,
              loop: true,
              itemsPerView: {
                mobile: 1,
                tablet: 2,
                desktop: 4,
                xl: 4,
              },
              headerContent: (
                <h2 className={styles.relatedTitle}>Related Products</h2>
              ),
            }}
            renderItem={(item) => (
              <div className={styles.productCardWrapper}>{item.content}</div>
            )}
            className={styles.relatedCarousel}
          />
        </section>
      )}

      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <section className={styles.recommendedSection}>
          <CarouselWrapper
            variant="default"
            data={recommendedCarouselData}
            options={{
              showControlBtns: true,
              showControlDots: false,
              autoPlay: true,
              autoPlayInterval: 4000,
              loop: true,
              itemsPerView: {
                mobile: 1,
                tablet: 2,
                desktop: 4,
                xl: 4,
              },
              headerContent: (
                <div>
                  <h2 className={styles.sectionTitle}>Recommended For You</h2>
                  <p className={styles.sectionSubtitle}>
                    Based on popular products and your browsing history
                  </p>
                </div>
              ),
            }}
            renderItem={(item) => (
              <div className={styles.productCardWrapper}>{item.content}</div>
            )}
            className={styles.recommendedCarousel}
          />
        </section>
      )}
    </div>
  );
}
