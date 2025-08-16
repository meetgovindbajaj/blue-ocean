"use client";

import { motion } from "framer-motion";
import { Card, Button, Tag } from "antd";
import {
  EyeOutlined,
  HeartOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";

const { Meta } = Card;

interface ApiProduct {
  id: string;
  name: string;
  description: string;
  slug: string;
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    isThumbnail: boolean;
  }>;
  prices: {
    retail: number;
    wholesale: number;
    discount: number;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  isActive: boolean;
  [key: string]: unknown;
}

interface FeaturedProductsProps {
  products?: ApiProduct[];
}

// Fallback products for when API data is not available
const fallbackProducts = [
  {
    id: "1",
    name: "Classic Oak Dining Table",
    category: { name: "Dining Room", slug: "dining-room" },
    prices: { retail: 1299, discount: 20 },
    images: [{ id: "1", url: "/images/fallback.webp", isThumbnail: true }],
    slug: "classic-oak-dining-table",
    description: "Beautiful handcrafted oak dining table",
    isActive: true,
  },
  {
    id: "2",
    name: "Handcrafted Teak Bookshelf",
    category: { name: "Living Room", slug: "living-room" },
    prices: { retail: 899, discount: 0 },
    images: [{ id: "2", url: "/images/fallback.webp", isThumbnail: true }],
    slug: "handcrafted-teak-bookshelf",
    description: "Elegant teak bookshelf for your home",
    isActive: true,
  },
  {
    id: "3",
    name: "Mahogany Executive Desk",
    category: { name: "Office", slug: "office" },
    prices: { retail: 1899, discount: 0 },
    images: [{ id: "3", url: "/images/fallback.webp", isThumbnail: true }],
    slug: "mahogany-executive-desk",
    description: "Professional mahogany desk for your office",
    isActive: true,
  },
  {
    id: "4",
    name: "Rustic Pine Bed Frame",
    category: { name: "Bedroom", slug: "bedroom" },
    prices: { retail: 1199, discount: 15 },
    images: [{ id: "4", url: "/images/fallback.webp", isThumbnail: true }],
    slug: "rustic-pine-bed-frame",
    description: "Comfortable and stylish pine bed frame",
    isActive: true,
  },
];

export default function FeaturedProducts({
  products = [],
}: FeaturedProductsProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section className="featured-products">
      <div className="container">
        <motion.div
          className="featured-products__header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="featured-products__title">Featured Products</h2>
          <p className="featured-products__subtitle">
            Discover our handpicked selection of premium solid wood furniture
          </p>
        </motion.div>

        <motion.div
          className="featured-products__grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {(products.length > 0 ? products : fallbackProducts).map(
            (product) => {
              const thumbnailImage =
                product.images?.find((img) => img.isThumbnail) ||
                product.images?.[0];
              const imageUrl = thumbnailImage
                ? `/api/v1/image/${thumbnailImage.id}?w=300&h=250&format=webp`
                : "/images/fallback.webp";

              const discountedPrice =
                product.prices.discount > 0
                  ? product.prices.retail * (1 - product.prices.discount / 100)
                  : product.prices.retail;

              return (
                <motion.div key={product.id} variants={cardVariants}>
                  <Card
                    className="product-card"
                    cover={
                      <div className="product-card__image-container">
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          width={300}
                          height={250}
                          className="product-card__image"
                          placeholder="blur"
                          blurDataURL="/images/fallback.webp"
                        />
                        <div className="product-card__overlay">
                          <Link href={`/products/${product.slug}`}>
                            <Button
                              type="primary"
                              icon={<EyeOutlined />}
                              className="product-card__action"
                            >
                              Quick View
                            </Button>
                          </Link>
                        </div>
                        <div className="product-card__badges">
                          {product.prices.discount > 0 && (
                            <Tag color="red" className="product-card__badge">
                              {product.prices.discount}% OFF
                            </Tag>
                          )}
                        </div>
                        <div className="product-card__wishlist">
                          <Button
                            type="text"
                            icon={<HeartOutlined />}
                            className="product-card__wishlist-btn"
                          />
                        </div>
                      </div>
                    }
                    actions={[
                      <Button
                        key="cart"
                        type="primary"
                        icon={<ShoppingCartOutlined />}
                        className="product-card__cart-btn"
                        block
                      >
                        Add to Cart
                      </Button>,
                    ]}
                  >
                    <Meta
                      title={
                        <div className="product-card__info">
                          <h3 className="product-card__name">{product.name}</h3>
                          <p className="product-card__category">
                            {product.category?.name || "Furniture"}
                          </p>
                        </div>
                      }
                      description={
                        <div className="product-card__pricing">
                          <span className="product-card__price">
                            ${discountedPrice.toFixed(2)}
                          </span>
                          {product.prices.discount > 0 && (
                            <span className="product-card__original-price">
                              ${product.prices.retail.toFixed(2)}
                            </span>
                          )}
                        </div>
                      }
                    />
                  </Card>
                </motion.div>
              );
            }
          )}
        </motion.div>

        <motion.div
          className="featured-products__footer"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <Link href="/products">
            <Button
              type="default"
              size="large"
              className="featured-products__view-all"
            >
              View All Products
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
