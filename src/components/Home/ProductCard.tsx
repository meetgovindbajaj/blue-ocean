"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/context/LandingDataContext";
import styles from "./ProductCard.module.css";
import { useRef, useEffect, useState } from "react";
import { Route } from "next";
import { useCurrency } from "@/context/CurrencyContext";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { formatPrice } = useCurrency();
  const visibleContentRef = useRef<HTMLDivElement>(null);
  const [collapsedHeight, setCollapsedHeight] = useState(75); // fallback

  const thumbnail =
    product.images?.find((img) => img.isThumbnail) || product.images?.[0];
  const categoryName = product.category?.name || "";
  const hasDiscount = product.prices?.discount > 0;

  // ResizeObserver for dynamic height calculation
  useEffect(() => {
    const visibleContent = visibleContentRef.current;
    if (!visibleContent) return;

    const calculateHeight = () => {
      const sizeInfoEl = visibleContent.querySelector(
        `.${styles.sizeInfo}`
      ) as HTMLElement;
      const titleEl = visibleContent.querySelector(
        `.${styles.title}`
      ) as HTMLElement;

      if (sizeInfoEl && titleEl) {
        // Get actual rendered heights
        const sizeInfoHeight = sizeInfoEl.offsetHeight;
        const titleHeight = titleEl.offsetHeight;

        // Get padding from the container
        const computedStyle = window.getComputedStyle(visibleContent);
        const paddingTop = parseInt(computedStyle.paddingTop) || 0;

        // margin-bottom (20px from CSS)
        const margin = 20;

        // Calculate total visible height
        const totalHeight = paddingTop + sizeInfoHeight + margin + titleHeight;
        console.log(totalHeight);

        setCollapsedHeight(totalHeight);
      }
    };

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to avoid layout thrashing
      window.requestAnimationFrame(() => {
        calculateHeight();
      });
    });

    // Observe the visible content container
    resizeObserver.observe(visibleContent);

    // Also observe individual elements for more granular updates
    const sizeInfoEl = visibleContent.querySelector(`.${styles.sizeInfo}`);
    const titleEl = visibleContent.querySelector(`.${styles.title}`);

    if (sizeInfoEl) resizeObserver.observe(sizeInfoEl);
    if (titleEl) resizeObserver.observe(titleEl);

    // Initial calculation
    calculateHeight();

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, []); // Empty deps - observer handles all updates

  return (
    <Link
      href={`/products/${product.slug}` as Route}
      className={styles.card}
      style={
        { "--collapsed-height": `${collapsedHeight}px` } as React.CSSProperties
      }
    >
      <div className={styles.imageContainer}>
        <Image
          src={thumbnail.url}
          alt={product.name}
          fill
          className={styles.image}
          // sizes="(max-width: 480px) 100vw, (max-width: 768px) 320px, (max-width: 1200px) 340px, 380px"
          quality={85}
        />

        {/* Glassmorphism info section that slides up on hover */}
        <div className={styles.infoSection} ref={visibleContentRef}>
          <h3 className={styles.title}>{product.name}</h3>
          {/* Size Info */}
          {product.size && (
            <div className={styles.sizeInfo}>
              <span>
                {product.size.length} × {product.size.width} ×{" "}
                {product.size.height} {product.size.unit}
              </span>
              {!product.size.fixedSize && (
                <span className={styles.customBadge}>Custom</span>
              )}
            </div>
          )}
          {/* Hidden content wrapper */}
          <div className={styles.hiddenContent}>
            {/* <div className={styles.category}>{categoryName}</div> */}

            <div className={styles.priceContainer}>
              {hasDiscount ? (
                <>
                  <span className={styles.price}>
                    {formatPrice(product.prices.retail * (1 - product.prices.discount / 100))}
                  </span>
                  <span className={styles.originalPrice}>
                    {formatPrice(product.prices.retail)}
                  </span>
                  <span className={styles.discount}>
                    -{product.prices.discount}%
                  </span>
                </>
              ) : (
                <span className={styles.price}>{formatPrice(product.prices.retail)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
