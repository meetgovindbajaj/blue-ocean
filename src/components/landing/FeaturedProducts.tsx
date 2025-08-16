"use client";

import { motion } from "framer-motion";
import { Card, Button, Tag } from "antd";
import {
  EyeOutlined,
  HeartOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import Image from "next/image";

const { Meta } = Card;

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  isNew?: boolean;
  isSale?: boolean;
}

const featuredProducts: Product[] = [
  {
    id: "1",
    name: "Classic Oak Dining Table",
    category: "Dining Room",
    price: 1299,
    originalPrice: 1599,
    image: "/images/fallback.webp",
    isSale: true,
  },
  {
    id: "2",
    name: "Handcrafted Teak Bookshelf",
    category: "Living Room",
    price: 899,
    image: "/images/fallback.webp",
    isNew: true,
  },
  {
    id: "3",
    name: "Mahogany Executive Desk",
    category: "Office",
    price: 1899,
    image: "/images/fallback.webp",
  },
  {
    id: "4",
    name: "Rustic Pine Bed Frame",
    category: "Bedroom",
    price: 1199,
    image: "/images/fallback.webp",
    isNew: true,
  },
];

export default function FeaturedProducts() {
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
          {featuredProducts.map((product) => (
            <motion.div key={product.id} variants={cardVariants}>
              <Card
                className="product-card"
                cover={
                  <div className="product-card__image-container">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={300}
                      height={250}
                      className="product-card__image"
                    />
                    <div className="product-card__overlay">
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        className="product-card__action"
                      >
                        Quick View
                      </Button>
                    </div>
                    <div className="product-card__badges">
                      {product.isNew && (
                        <Tag color="green" className="product-card__badge">
                          New
                        </Tag>
                      )}
                      {product.isSale && (
                        <Tag color="red" className="product-card__badge">
                          Sale
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
                        {product.category}
                      </p>
                    </div>
                  }
                  description={
                    <div className="product-card__pricing">
                      <span className="product-card__price">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="product-card__original-price">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                  }
                />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="featured-products__footer"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <Button
            type="default"
            size="large"
            className="featured-products__view-all"
          >
            View All Products
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
