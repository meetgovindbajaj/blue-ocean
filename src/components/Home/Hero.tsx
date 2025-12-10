"use client";

import { useMemo } from "react";
import styles from "./Hero.module.css";
import type { HeroBanner } from "@/types/heroBanner";
import CarouselWrapper, { CarouselItem } from "@/components/ui/CarouselWrapper";

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
  return image.url || image.thumbnailUrl || "";
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

const HeroSection = ({ banners }: HeroSectionProps) => {
  const slides = useMemo(() => banners?.filter(Boolean) || [], [banners]);

  // Convert banners to CarouselItem format
  const carouselData: CarouselItem[] = useMemo(() => {
    return slides.map((banner) => ({
      id: banner.id,
      image: banner.image.mobileUrl || banner.image.url,
      alt: banner.title || "Hero banner",
      content: <BannerContent banner={banner} />,
    }));
  }, [slides]);

  if (!slides.length) return null;

  return (
    <section className={styles.page}>
      <CarouselWrapper
        variant="fullWidth"
        data={carouselData}
        options={{
          showControlBtns: true,
          showControlDots: true,
          autoPlay: true,
          autoPlayInterval: SLIDE_DURATION,
          loop: true,
        }}
        className={styles.heroCarousel}
      />
    </section>
  );
};

// Separate component for banner content
const BannerContent = ({ banner }: { banner: HeroBanner }) => {
  // Render discount badge for offer content type
  const renderDiscountBadge = () => {
    if (!banner.discountPercent && !banner.offerCode) return null;

    return (
      <div className={styles.discountBadge}>
        {banner.discountPercent && <span>{banner.discountPercent}% OFF</span>}
        {banner.offerCode && (
          <span className={styles.offerCode}>{banner.offerCode}</span>
        )}
      </div>
    );
  };

  // Render linked product preview
  const renderProductPreview = () => {
    if (!banner.product) return null;

    const { product } = banner;
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
    if (!banner.category || banner.product) return null;

    const { category } = banner;

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
    if (!banner.autoProducts || banner.autoProducts.length === 0) return null;

    return (
      <div className={styles.autoProducts}>
        {banner.autoProducts.slice(0, 5).map((product) => {
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
    if (!banner.offerValidUntil) return null;

    return (
      <p className={styles.offerExpiry}>
        Valid until {formatExpiry(banner.offerValidUntil)}
      </p>
    );
  };

  return (
    <div className={styles.content}>
      {renderDiscountBadge()}
      {banner.title && <h1 className={styles.title}>{banner.title}</h1>}
      {banner.subtitle && <p className={styles.subtitle}>{banner.subtitle}</p>}
      {banner.description && (
        <p className={styles.description}>{banner.description}</p>
      )}
      {renderOfferExpiry()}
      {/* {renderProductPreview()}
      {renderCategoryPreview()}
      {renderAutoProducts()} */}
      {banner.ctaText && (
        <a
          href={banner.ctaLink || "#"}
          className={styles.button}
          onClick={() => trackBannerClick(banner.id)}
        >
          {banner.ctaText}
        </a>
      )}
    </div>
  );
};

export default HeroSection;
