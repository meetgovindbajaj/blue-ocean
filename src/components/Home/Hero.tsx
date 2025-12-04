"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Hero.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroBanner } from "@/types/heroBanner";

export type { HeroBanner };

const SLIDE_DURATION = 5000;

interface HeroSectionProps {
  banners: HeroBanner[];
}

// Format price with currency
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

// Format date for offer expiry
const formatExpiry = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Get image URL (handle thumbnail object or direct url)
const getImageUrl = (image: any): string => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.thumbnailUrl || image.url || "";
};

const HeroSection = ({ banners }: HeroSectionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const slides = useMemo(() => banners?.filter(Boolean) || [], [banners]);
  const total = slides.length;

  const heroRef = useRef<HTMLDivElement | null>(null);

  const minSwipeDistance = 50;

  // Autoplay
  useEffect(() => {
    if (total <= 1) return;

    setProgress(0);
    const start = Date.now();

    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const next = Math.min(1, elapsed / SLIDE_DURATION);
      setProgress(next);

      if (elapsed >= SLIDE_DURATION) {
        setActiveIndex((prev) => (prev + 1) % total);
      }
    }, 80);

    return () => window.clearInterval(id);
  }, [activeIndex, total]);

  // Touch handlers for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goNext();
    } else if (isRightSwipe) {
      goPrev();
    }
  };

  // Track banner CTA click
  const trackBannerClick = async (bannerId: string) => {
    try {
      await fetch(`/api/hero-banners/${bannerId}/click`, {
        method: "POST",
      });
    } catch (error) {
      // Silently fail - don't block navigation
      console.error("Failed to track banner click:", error);
    }
  };

  if (!total) return null;

  const goTo = (index: number) => {
    if (!total) return;
    setActiveIndex((index + total) % total);
    setProgress(0);
  };
  const goNext = () => goTo(activeIndex + 1);
  const goPrev = () => goTo(activeIndex - 1);

  const current = slides[activeIndex];
  const imageUrl = current.image.mobileUrl || current.image.url;

  // Render discount badge for offer content type
  const renderDiscountBadge = () => {
    if (!current.discountPercent && !current.offerCode) return null;

    return (
      <div className={styles.discountBadge}>
        {current.discountPercent && <span>{current.discountPercent}% OFF</span>}
        {current.offerCode && (
          <span className={styles.offerCode}>{current.offerCode}</span>
        )}
      </div>
    );
  };

  // Render linked product preview
  const renderProductPreview = () => {
    if (!current.product) return null;

    const { product } = current;
    const hasDiscount = product.prices.discount > 0;
    const finalPrice = hasDiscount
      ? product.prices.retail * (1 - product.prices.discount / 100)
      : product.prices.retail;

    return (
      <a href={`/products/${product.slug}`} className={styles.linkedItem}>
        {product.thumbnail && (
          <img
            src={getImageUrl(product.thumbnail)}
            alt={product.name}
            className={styles.linkedItemImage}
          />
        )}
        <div className={styles.linkedItemInfo}>
          <span className={styles.linkedItemName}>{product.name}</span>
          <span className={styles.linkedItemPrice}>
            {hasDiscount && (
              <span className={styles.linkedItemOriginal}>
                {formatPrice(product.prices.retail)}
              </span>
            )}
            {formatPrice(finalPrice)}
          </span>
        </div>
      </a>
    );
  };

  // Render linked category preview
  const renderCategoryPreview = () => {
    if (!current.category || current.product) return null;

    const { category } = current;

    return (
      <a href={`/category/${category.slug}`} className={styles.linkedItem}>
        {category.image && (
          <img
            src={getImageUrl(category.image)}
            alt={category.name}
            className={styles.linkedItemImage}
          />
        )}
        <div className={styles.linkedItemInfo}>
          <span className={styles.linkedItemName}>{category.name}</span>
        </div>
      </a>
    );
  };

  // Render auto products carousel (for trending/new_arrivals/offer auto types)
  const renderAutoProducts = () => {
    if (!current.autoProducts || current.autoProducts.length === 0) return null;

    return (
      <div className={styles.autoProducts}>
        {current.autoProducts.slice(0, 5).map((product) => {
          const hasDiscount = product.prices.discount > 0;
          const finalPrice = hasDiscount
            ? product.prices.retail * (1 - product.prices.discount / 100)
            : product.prices.retail;

          return (
            <a
              key={product.id}
              href={`/products/${product.slug}`}
              className={styles.autoProductCard}
            >
              {product.thumbnail && (
                <img
                  src={getImageUrl(product.thumbnail)}
                  alt={product.name}
                  className={styles.autoProductImage}
                />
              )}
              <div className={styles.autoProductName}>{product.name}</div>
              <div className={styles.autoProductPrice}>
                {formatPrice(finalPrice)}
              </div>
            </a>
          );
        })}
      </div>
    );
  };

  // Render offer expiry date
  const renderOfferExpiry = () => {
    if (!current.offerValidUntil) return null;

    return (
      <p className={styles.offerExpiry}>
        Valid until {formatExpiry(current.offerValidUntil)}
      </p>
    );
  };

  return (
    <section className={styles.page}>
      <div
        ref={heroRef}
        className={styles.hero}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={styles.image}
          style={{
            backgroundImage: `url(${imageUrl})`,
          }}
        />
        <div className={styles.innerShadow} />

        {/* Content */}
        <div className={styles.content}>
          {renderDiscountBadge()}
          {current.title && <h1 className={styles.title}>{current.title}</h1>}
          {current.subtitle && (
            <p className={styles.subtitle}>{current.subtitle}</p>
          )}
          {current.description && (
            <p className={styles.description}>{current.description}</p>
          )}
          {renderOfferExpiry()}
          {/* {renderProductPreview()}
          {renderCategoryPreview()}
          {renderAutoProducts()} */}
          {current.ctaText && (
            <a
              href={current.ctaLink || "#"}
              className={styles.button}
              onClick={() => trackBannerClick(current.id)}
            >
              {current.ctaText}
            </a>
          )}
        </div>

        {/* Arrows (hidden on tablet/mobile via CSS) */}
        {total > 1 && (
          <>
            <button
              className={`${styles.arrow} ${styles.arrowLeft}`}
              onClick={goPrev}
              aria-label="Previous slide"
            >
              <ChevronLeft className={styles.iconSize} />
            </button>
            <button
              className={`${styles.arrow} ${styles.arrowRight}`}
              onClick={goNext}
              aria-label="Next slide"
            >
              <ChevronRight className={styles.iconSize} />
            </button>
          </>
        )}

        {/* Pills */}
        {total > 1 && (
          <div className={styles.pills}>
            {slides.map((banner, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={banner.id}
                  className={`${styles.pill} ${
                    isActive ? styles.pillActive : ""
                  }`}
                  onClick={() => goTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  {isActive && (
                    <span
                      className={styles.pillFill}
                      style={{ transform: `scaleX(${progress || 0.02})` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
