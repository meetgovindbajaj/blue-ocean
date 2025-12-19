"use client";

import { useMemo } from "react";
import styles from "./Hero.module.css";
import type { HeroBanner } from "@/types/heroBanner";
import CarouselWrapper, { CarouselItem } from "@/components/ui/CarouselWrapper";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  // Convert banners to CarouselItem format
  const carouselData: CarouselItem[] = useMemo(() => {
    return slides.map((banner) => ({
      id: banner.id,
      image: isMobile
        ? banner.image.mobileUrl || banner.image.url || ""
        : banner.image.url || banner.image.mobileUrl || "",
      alt: banner.title || "Hero banner",
      content: <BannerContent banner={banner} />,
    }));
  }, [slides, isMobile]);

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
