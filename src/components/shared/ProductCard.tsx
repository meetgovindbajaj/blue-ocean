"use client";

import { useMemo } from "react";
import { ProductType } from "@/types/product";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";
import {
  CarouselWrapper,
  type CarouselItem,
} from "@/components/ui/CarouselWrapper";
import styles from "./ProductCard.module.css";

const ProductCard = ({ product }: { product: ProductType }) => {
  const { formatPrice } = useCurrency();

  const getPriceDisplay = (product: ProductType) => {
    if (product.prices.discount > 0) {
      const discountedPrice =
        product.prices.retail * (1 - product.prices.discount / 100);
      return {
        current: formatPrice(discountedPrice),
        original: formatPrice(product.prices.retail),
        discount: product.prices.discount,
      };
    }
    return {
      current: formatPrice(product.prices.retail),
      original: null,
      discount: 0,
    };
  };

  const priceInfo = getPriceDisplay(product);
  const thumbnailImage =
    product.images?.find((img) => img.isThumbnail) || product.images?.[0];

  // Convert product images to CarouselItem format
  const carouselImages: CarouselItem[] = useMemo(() => {
    if (!product.images || product.images.length === 0) return [];
    return product.images.map((img, index) => ({
      id: img.id,
      image: img.url,
      thumbnailImage: img.thumbnailUrl,
      alt: `${product.name} - Image ${index + 1} of ${product.images.length}`,
    }));
  }, [product.images, product.name]);

  const hasMultipleImages = carouselImages.length > 1;

  // Check if all dimensions are 0 or size is not defined
  const allDimensionsZero =
    !product.size ||
    (product.size.length === 0 &&
      product.size.width === 0 &&
      product.size.height === 0);

  // Get category name from breadcrumbs (last item is the category)
  const categoryName =
    product.breadcrumbs?.length > 0
      ? product.breadcrumbs[product.breadcrumbs.length - 1]?.name
      : null;

  // Build size description for screen readers
  const sizeDescription = allDimensionsZero
    ? "Custom size available"
    : `${product.size.length} × ${product.size.width} × ${product.size.height} ${product.size.unit}${!product.size.fixedSize ? ", customizable" : ""}`;

  // Build full product description for screen readers
  const screenReaderDescription = `${product.name}. Price: ${priceInfo.current}${priceInfo.original ? `, was ${priceInfo.original}, ${priceInfo.discount}% off` : ""}. Size: ${sizeDescription}${categoryName ? `. Category: ${categoryName}` : ""}`;

  return (
    <article aria-label={product.name}>
      <Link
        href={`/products/${product.slug}`}
        className="block no-underline h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
        aria-label={screenReaderDescription}
      >
        <Card
          className={cn(
            "group overflow-hidden p-0 gap-0 transition-all duration-200 h-full flex flex-col",
            "hover:-translate-y-1 hover:shadow-lg cursor-pointer"
          )}
        >
          {/* Product Image */}
          <div
            className="relative aspect-[4/3] overflow-hidden bg-muted flex-shrink-0"
            aria-label={`Product images for ${product.name}`}
          >
            {hasMultipleImages ? (
              <CarouselWrapper
                variant="fullWidth"
                data={carouselImages}
                className={styles.productCarousel}
                options={{
                  showControlBtns: false,
                  showControlDots: true,
                  showDotsProgress: false,
                  autoPlay: true,
                  autoPlayInterval: 3000,
                  loop: true,
                }}
                aria-label={`${product.name} image gallery with ${carouselImages.length} images`}
              />
            ) : thumbnailImage?.url ? (
              <Image
                src={thumbnailImage.url}
                alt={`${product.name} product image`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                quality={85}
                placeholder="blur"
                blurDataURL={thumbnailImage.thumbnailUrl || thumbnailImage.url}
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm"
                role="img"
                aria-label="No product image available"
              >
                No Image
              </div>
            )}
            {product.prices.discount > 0 && (
              <Badge
                variant="destructive"
                className="absolute top-3 right-3 rounded-full px-2.5 py-1 z-10"
                aria-label={`${product.prices.discount}% discount`}
              >
                <span aria-hidden="true">-{product.prices.discount}%</span>
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <CardContent className="p-4 flex flex-col flex-grow">
            <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-2">
              {product.name}
            </h3>

            {/* Size Info */}
            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2"
              aria-label={`Size: ${sizeDescription}`}
            >
              {allDimensionsZero ? (
                <Badge variant="secondary" className="text-[11px] font-medium">
                  <span aria-hidden="true">Custom</span>
                </Badge>
              ) : (
                <>
                  <span aria-hidden="true">
                    {product.size.length} × {product.size.width} ×{" "}
                    {product.size.height} {product.size.unit}
                  </span>
                  {!product.size.fixedSize && (
                    <Badge
                      variant="secondary"
                      className="text-[11px] font-medium"
                    >
                      <span aria-hidden="true">Custom</span>
                    </Badge>
                  )}
                </>
              )}
            </div>

            {/* Price - pushed to bottom */}
            <div
              className="flex items-center gap-2 pt-1 mt-auto"
              aria-label={`Price: ${priceInfo.current}${priceInfo.original ? `, was ${priceInfo.original}` : ""}`}
            >
              <span className="text-lg font-bold" aria-hidden="true">
                {priceInfo.current}
              </span>
              {priceInfo.original && (
                <span
                  className="text-sm text-muted-foreground line-through"
                  aria-hidden="true"
                >
                  {priceInfo.original}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </article>
  );
};

export default ProductCard;
