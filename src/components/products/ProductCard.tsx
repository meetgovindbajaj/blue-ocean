"use client";

import { useState, useCallback, memo } from "react";
import { Card, Button, Tag, Rate } from "antd";
import {
  HeartOutlined,
  HeartFilled,
  ShoppingCartOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/functions";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

interface ProductCardProps {
  product: IProduct;
  onAddToCart?: (product: IProduct) => void;
  onToggleWishlist?: (product: IProduct) => void;
  isInWishlist?: boolean;
  className?: string;
}

const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isInWishlist: propIsInWishlist,
  className = "",
}: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Use context wishlist state if no prop is provided
  const isProductInWishlist =
    propIsInWishlist !== undefined
      ? propIsInWishlist
      : isInWishlist(product.id);

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onAddToCart) {
        onAddToCart(product);
      } else {
        addItem(product, 1);
      }
    },
    [onAddToCart, product, addItem]
  );

  const handleToggleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onToggleWishlist) {
        onToggleWishlist(product);
      } else {
        toggleWishlist(product);
      }
    },
    [onToggleWishlist, product, toggleWishlist]
  );

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  // Memoize computed values
  const discountPercentage = product.prices?.discount || 0;
  const currentPrice = product.prices?.retail || 0;
  const originalPrice =
    discountPercentage > 0
      ? Math.round(currentPrice / (1 - discountPercentage / 100))
      : 0;

  const imageUrl = product.images?.[0]?.url || "/images/fallback.webp";
  const categoryData = product.category as ICategory;

  return (
    <motion.div
      className={`product-card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Card
        hoverable
        className="product-card__container"
        cover={
          <div className="product-card__image-container">
            <Link href={`/products/${product.slug}`}>
              <div className="product-card__image-wrapper">
                {!imageError ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={`product-card__image ${
                      imageLoading ? "loading" : ""
                    }`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    priority={false}
                    loading="lazy"
                  />
                ) : (
                  <div className="product-card__image-fallback">
                    <EyeOutlined />
                    <span>No Image</span>
                  </div>
                )}

                {imageLoading && (
                  <div className="product-card__image-skeleton">
                    <div className="skeleton-shimmer"></div>
                  </div>
                )}
              </div>
            </Link>

            {/* Discount Badge */}
            {discountPercentage > 0 && (
              <div className="product-card__discount-badge">
                -{discountPercentage}%
              </div>
            )}

            {/* Wishlist Button */}
            <button
              className="product-card__wishlist-btn"
              onClick={handleToggleWishlist}
              aria-label={
                isProductInWishlist ? "Remove from wishlist" : "Add to wishlist"
              }
            >
              {isProductInWishlist ? (
                <HeartFilled className="wishlist-icon filled" />
              ) : (
                <HeartOutlined className="wishlist-icon" />
              )}
            </button>

            {/* Quick Actions Overlay */}
            <div className="product-card__overlay">
              <div className="product-card__actions">
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleAddToCart}
                  className="add-to-cart-btn"
                >
                  Add to Cart
                </Button>
                <Link href={`/products/${product.slug}`} prefetch={false}>
                  <Button
                    type="default"
                    icon={<EyeOutlined />}
                    className="quick-view-btn"
                  >
                    Quick View
                  </Button>
                </Link>
              </div>
            </div>

            {/* Active Status */}
            {!product.isActive && (
              <div className="product-card__out-of-stock">Unavailable</div>
            )}
          </div>
        }
      >
        <div className="product-card__content">
          {/* Category */}
          {categoryData && (
            <Link href={`/category/${categoryData.slug}`} prefetch={false}>
              <Tag className="product-card__category" color="blue">
                {categoryData.name}
              </Tag>
            </Link>
          )}

          {/* Product Name */}
          <Link href={`/products/${product.slug}`} prefetch={false}>
            <h3 className="product-card__title">{product.name}</h3>
          </Link>

          {/* Description */}
          {product.description && (
            <p className="product-card__description">
              {product.description.length > 100
                ? `${product.description.substring(0, 100)}...`
                : product.description}
            </p>
          )}

          {/* Rating - Placeholder for future implementation */}
          <div className="product-card__rating">
            <Rate disabled defaultValue={4.5} allowHalf />
            <span className="rating-count">(0 reviews)</span>
          </div>

          {/* Price */}
          <div className="product-card__price">
            <span className="current-price">{formatPrice(currentPrice)}</span>
            {discountPercentage > 0 && (
              <span className="original-price">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Size Information */}
          {product.size && (
            <div className="product-card__features">
              <Tag className="feature-tag">
                {product.size.length}×{product.size.width}×{product.size.height}{" "}
                {product.size.unit}
              </Tag>
              {product.size.fixedSize && (
                <Tag className="feature-tag">Fixed Size</Tag>
              )}
            </div>
          )}

          {/* Availability Indicator */}
          {product.isActive && (
            <div className="product-card__availability">✓ Available</div>
          )}
        </div>
      </Card>
    </motion.div>
  );
});

export default ProductCard;
