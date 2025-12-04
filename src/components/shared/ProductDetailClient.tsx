"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductType } from "@/types/product";
import ProductCard from "./ProductCard";
import styles from "./ProductDetailClient.module.css";
import { Route } from "next";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useCurrency } from "@/context/CurrencyContext";

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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { formatPrice } = useCurrency();

  const hasDiscount = product.prices.discount > 0;
  const discountedPrice = hasDiscount
    ? product.prices.retail * (1 - product.prices.discount / 100)
    : product.prices.retail;

  const images = product.images || [];
  const currentImage = images[selectedImageIndex];

  // Check if all dimensions are 0
  const allDimensionsZero =
    product.size.length === 0 &&
    product.size.width === 0 &&
    product.size.height === 0;

  // Check scroll state for thumbnails
  const checkScrollState = () => {
    if (thumbnailsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = thumbnailsRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollState();
    const container = thumbnailsRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollState);
      window.addEventListener("resize", checkScrollState);
      return () => {
        container.removeEventListener("scroll", checkScrollState);
        window.removeEventListener("resize", checkScrollState);
      };
    }
  }, [images]);

  // Scroll to selected thumbnail
  useEffect(() => {
    if (thumbnailsRef.current) {
      const container = thumbnailsRef.current;
      const selectedThumb = container.children[
        selectedImageIndex
      ] as HTMLElement;
      if (selectedThumb) {
        const containerRect = container.getBoundingClientRect();
        const thumbRect = selectedThumb.getBoundingClientRect();

        if (thumbRect.left < containerRect.left) {
          container.scrollBy({
            left: thumbRect.left - containerRect.left - 10,
            behavior: "smooth",
          });
        } else if (thumbRect.right > containerRect.right) {
          container.scrollBy({
            left: thumbRect.right - containerRect.right + 10,
            behavior: "smooth",
          });
        }
      }
    }
  }, [selectedImageIndex]);

  const scrollThumbnails = (direction: "left" | "right") => {
    if (thumbnailsRef.current) {
      const scrollAmount = 200;
      thumbnailsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Navigate main image with arrows
  const goToPrevImage = useCallback(() => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNextImage = useCallback(() => {
    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    if (images.length <= 1 || isPaused || isFullscreen) {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    autoScrollIntervalRef.current = setInterval(() => {
      goToNextImage();
    }, 5000);

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [images.length, isPaused, isFullscreen, goToNextImage]);

  // Fullscreen handlers
  const openFullscreen = () => {
    setIsFullscreen(true);
    document.body.style.overflow = "hidden";
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = "";
  };

  // Handle keyboard navigation in fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;

      switch (e.key) {
        case "Escape":
          closeFullscreen();
          break;
        case "ArrowLeft":
          goToPrevImage();
          break;
        case "ArrowRight":
          goToNextImage();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, goToPrevImage, goToNextImage]);

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
          {/* Main Image with Navigation */}
          <div
            className={styles.mainImageContainer}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {currentImage?.url ? (
              <Image
                src={currentImage.url}
                alt={product.name}
                fill
                style={{ objectFit: "cover", cursor: "zoom-in" }}
                priority
                onClick={openFullscreen}
              />
            ) : (
              <div className={styles.noImage}>No Image Available</div>
            )}
            {hasDiscount && (
              <div className={styles.discountBadge}>
                -{product.prices.discount}%
              </div>
            )}
            {/* Fullscreen button */}
            {currentImage?.url && (
              <button
                onClick={openFullscreen}
                className={styles.fullscreenBtn}
                aria-label="View fullscreen"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            )}
            {/* Main Image Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevImage}
                  className={`${styles.mainImageNav} ${styles.mainImageNavLeft}`}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={goToNextImage}
                  className={`${styles.mainImageNav} ${styles.mainImageNavRight}`}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                {/* Image Counter */}
                <div className={styles.imageCounter}>
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Horizontal Scrollable Thumbnails */}
          {images.length > 1 && (
            <div className={styles.thumbnailsWrapper}>
              {canScrollLeft && (
                <button
                  onClick={() => scrollThumbnails("left")}
                  className={`${styles.thumbnailNav} ${styles.thumbnailNavLeft}`}
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className={styles.thumbnails} ref={thumbnailsRef}>
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`${styles.thumbnail} ${
                      selectedImageIndex === idx ? styles.thumbnailActive : ""
                    }`}
                  >
                    <Image
                      src={img.thumbnailUrl || img.url}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </button>
                ))}
              </div>
              {canScrollRight && (
                <button
                  onClick={() => scrollThumbnails("right")}
                  className={`${styles.thumbnailNav} ${styles.thumbnailNavRight}`}
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
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
            <p className={styles.description}>{product.description}</p>
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
              href={`/contact?product=${encodeURIComponent(product.name)}&productId=${product.id}&subject=Product Question`}
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
          <h2 className={styles.relatedTitle}>Related Products</h2>
          <Carousel
            opts={{
              align: "start",
              loop: relatedProducts.length > 4,
            }}
            className={styles.carouselContainer}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {relatedProducts.map((p) => (
                <CarouselItem key={p.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <ProductCard product={p} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className={styles.carouselNav} />
            <CarouselNext className={styles.carouselNav} />
          </Carousel>
        </section>
      )}

      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <section className={styles.recommendedSection}>
          <h2 className={styles.sectionTitle}>Recommended For You</h2>
          <p className={styles.sectionSubtitle}>
            Based on popular products and your browsing history
          </p>
          <Carousel
            opts={{
              align: "start",
              loop: recommendedProducts.length > 4,
            }}
            className={styles.carouselContainer}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {recommendedProducts.map((rec: RecommendedProduct) => (
                <CarouselItem key={rec.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
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
                      images: rec.thumbnail
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
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className={styles.carouselNav} />
            <CarouselNext className={styles.carouselNav} />
          </Carousel>
        </section>
      )}

      {/* Fullscreen Image Modal */}
      {isFullscreen && currentImage?.url && (
        <div className={styles.fullscreenOverlay} onClick={closeFullscreen}>
          <button
            className={styles.fullscreenClose}
            onClick={closeFullscreen}
            aria-label="Close fullscreen"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className={styles.fullscreenContent}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage.url}
              alt={product.name}
              fill
              style={{ objectFit: "contain" }}
              quality={100}
            />
          </div>

          {/* Navigation in fullscreen */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevImage();
                }}
                className={`${styles.fullscreenNav} ${styles.fullscreenNavLeft}`}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextImage();
                }}
                className={`${styles.fullscreenNav} ${styles.fullscreenNavRight}`}
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
              <div className={styles.fullscreenCounter}>
                {selectedImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Thumbnail strip in fullscreen */}
          {images.length > 1 && (
            <div className={styles.fullscreenThumbnails}>
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(idx);
                  }}
                  className={`${styles.fullscreenThumb} ${
                    selectedImageIndex === idx
                      ? styles.fullscreenThumbActive
                      : ""
                  }`}
                >
                  <Image
                    src={img.thumbnailUrl || img.url}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
