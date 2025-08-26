"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Rate, Tag, Breadcrumb, Spin, message, Carousel } from "antd";
import {
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  HomeOutlined,
  RightOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/functions";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import ProductCard from "@/components/products/ProductCard";

interface ProductDetailState {
  product: IProduct | null;
  relatedProducts: IProduct[];
  loading: boolean;
  selectedImageIndex: number;
  quantity: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [state, setState] = useState<ProductDetailState>({
    product: null,
    relatedProducts: [],
    loading: true,
    selectedImageIndex: 0,
    quantity: 1,
  });

  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const loadProduct = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      // Fetch product by slug
      const response = await fetch(`/api/v1/products/${slug}`);
      if (!response.ok) {
        throw new Error("Product not found");
      }

      const product = await response.json();

      // Fetch related products
      const relatedResponse = await fetch(
        `/api/v1/products?category=${product.category.id}&limit=4`
      );
      const relatedData = await relatedResponse.json();
      const relatedProducts =
        relatedData.products?.filter((p: IProduct) => p.id !== product.id) ||
        [];

      setState((prev) => ({
        ...prev,
        product,
        relatedProducts,
        loading: false,
      }));
    } catch (error) {
      console.error("Error loading product:", error);
      message.error("Product not found");
      router.push("/products");
    }
  }, [slug, router]);

  useEffect(() => {
    if (slug) {
      loadProduct();
    }
  }, [slug, loadProduct]);

  const handleAddToCart = () => {
    if (!state.product) return;
    addItem(state.product, state.quantity);
  };

  const handleToggleWishlist = () => {
    if (!state.product) return;
    toggleWishlist(state.product);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: state.product?.name,
          text: state.product?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      message.success("Link copied to clipboard!");
    }
  };

  const handleQuantityChange = (change: number) => {
    setState((prev) => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + change),
    }));
  };

  if (state.loading) {
    return (
      <div className="product-detail">
        <div className="product-detail__loading">
          <Spin size="large" />
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!state.product) {
    return (
      <div className="product-detail">
        <div className="product-detail__not-found">
          <h2>Product Not Found</h2>
          <p>The product you&apos;re looking for doesn&apos;t exist.</p>
          <Button type="primary" onClick={() => router.push("/products")}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  const { product } = state;
  console.log({ state });

  const discountPercentage = product.prices?.discount || 0;
  const originalPrice =
    discountPercentage > 0
      ? Math.round(product.prices.retail / (1 - discountPercentage / 100))
      : null;

  return (
    <div className="product-detail">
      {/* Breadcrumb */}
      <motion.div
        className="product-detail__breadcrumb"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Breadcrumb separator={<RightOutlined />}>
          <Breadcrumb.Item>
            <Link href="/">
              <HomeOutlined /> Home
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link href="/products">Products</Link>
          </Breadcrumb.Item>
          {typeof product.category === "object" && (
            <Breadcrumb.Item>
              <Link href={`/category/${(product.category as ICategory).slug}`}>
                {(product.category as ICategory).name}
              </Link>
            </Breadcrumb.Item>
          )}
          <Breadcrumb.Item>{product.name}</Breadcrumb.Item>
        </Breadcrumb>
      </motion.div>

      {/* Product Details */}
      <motion.div
        className="product-detail__main"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="product-detail__container">
          {/* Product Images */}
          <div className="product-detail__images">
            <div className="main-image">
              {product.images && product.images.length > 0 ? (
                <Carousel
                  dots={false}
                  arrows
                  beforeChange={(_current, next) =>
                    setState((prev) => ({ ...prev, selectedImageIndex: next }))
                  }
                >
                  {product.images.map((image, index) => (
                    <div key={"image_" + image.id} className="image-slide">
                      <Image
                        src={`/api/v1/image/${image.id}?w=500&h=300&format=webp`}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="product-image"
                        priority={index === 0}
                      />
                    </div>
                  ))}
                </Carousel>
              ) : (
                <div className="no-image">
                  <Image
                    src="/images/fallback.webp"
                    alt={product.name}
                    fill
                    className="product-image"
                  />
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="thumbnail-images">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${
                      index === state.selectedImageIndex ? "active" : ""
                    }`}
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        selectedImageIndex: index,
                      }))
                    }
                  >
                    <Image
                      src={`/api/v1/image/${image.id}?h=300&format=webp`}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      fill
                      className="thumbnail-image"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-detail__info">
            {/* Category Tag */}
            {typeof product.category === "object" && (
              <Link href={`/category/${(product.category as ICategory).slug}`}>
                <Tag className="category-tag" color="blue">
                  {(product.category as ICategory).name}
                </Tag>
              </Link>
            )}

            {/* Product Name */}
            <h1 className="product-title">{product.name}</h1>

            {/* Rating */}
            <div className="product-rating">
              <Rate disabled defaultValue={4.5} allowHalf />
              <span className="rating-text">(0 reviews)</span>
            </div>

            {/* Price */}
            <div className="product-price">
              <span className="current-price">
                {formatPrice(product.prices?.retail || 0)}
              </span>
              {originalPrice && (
                <>
                  <span className="original-price">
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="discount-badge">
                    -{discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            {/* Specifications */}
            {product.size && (
              <div className="product-specifications">
                <h3>Specifications</h3>
                <div className="spec-grid">
                  <div className="spec-item">
                    <span className="spec-label">Dimensions:</span>
                    <span className="spec-value">
                      {product.size.length} × {product.size.width} ×{" "}
                      {product.size.height} {product.size.unit}
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Size Type:</span>
                    <span className="spec-value">
                      {product.size.fixedSize ? "Fixed Size" : "Customizable"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="product-actions">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <div className="quantity-controls">
                  <Button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={state.quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="quantity-value">{state.quantity}</span>
                  <Button onClick={() => handleQuantityChange(1)}>+</Button>
                </div>
              </div>

              <div className="action-buttons">
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleAddToCart}
                  className="add-to-cart-btn"
                  disabled={!product.isActive}
                >
                  Add to Cart
                </Button>

                <Button
                  size="large"
                  icon={
                    isInWishlist(state.product.id) ? (
                      <HeartFilled />
                    ) : (
                      <HeartOutlined />
                    )
                  }
                  onClick={handleToggleWishlist}
                  className={`wishlist-btn ${
                    isInWishlist(state.product.id) ? "active" : ""
                  }`}
                >
                  {isInWishlist(state.product.id)
                    ? "In Wishlist"
                    : "Add to Wishlist"}
                </Button>

                <Button
                  size="large"
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                  className="share-btn"
                >
                  Share
                </Button>
              </div>
            </div>

            {/* Availability */}
            <div className="product-availability">
              {product.isActive ? (
                <span className="in-stock">✓ In Stock</span>
              ) : (
                <span className="out-of-stock">⚠ Currently Unavailable</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Related Products */}
      {state.relatedProducts.length > 0 && (
        <motion.div
          className="product-detail__related"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2>Related Products</h2>
          <div className="related-products-grid">
            {state.relatedProducts.map((relatedProduct: IProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
