"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Spin, Button } from "antd";
import { EyeOutlined, AppstoreOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import "@/styles/userPages.scss";

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  image?: {
    id: string;
    url: string;
    thumbnailUrl: string;
  };
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  children?: Category[];
  productCount?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/category");

      if (response.ok) {
        const data = await response.json();
        // Filter to show only parent categories (categories without parent)
        const parentCategories = data.filter(
          (category: Category) => !category.parent
        );
        setCategories(parentCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (loading) {
    return (
      <div className="categories-page">
        <div className="categories-page__loading">
          <Spin size="large" />
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="categories-page">
      <div className="categories-page__header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="categories-page__title">Product Categories</h1>
          <p className="categories-page__subtitle">
            Explore our furniture collections by category
          </p>
        </motion.div>
      </div>

      <motion.div
        className="categories-page__grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Row gutter={[24, 24]}>
          {categories.map((category) => (
            <Col key={category.id} xs={24} sm={12} md={8} lg={6}>
              <motion.div variants={itemVariants}>
                <Card
                  hoverable
                  className="category-card"
                  cover={
                    <div className="category-card__image-container">
                      {category.image ? (
                        <Image
                          src={`/api/v1/image/${category.image.id}?w=300&h=200&format=webp`}
                          alt={category.name}
                          width={300}
                          height={200}
                          className="category-card__image"
                          placeholder="blur"
                          blurDataURL={`/api/v1/image/${category.image.id}?w=20&h=20&format=webp&grayscale=1`}
                        />
                      ) : (
                        <div className="category-card__no-image">
                          <AppstoreOutlined
                            style={{ fontSize: "2rem", color: "#ccc" }}
                          />
                        </div>
                      )}
                    </div>
                  }
                  actions={[
                    <Link key="view" href={`/category/${category.slug}`}>
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        size="small"
                      >
                        View Products
                      </Button>
                    </Link>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <div className="category-card__title">
                        <h3>{category.name}</h3>
                      </div>
                    }
                    description={
                      <div className="category-card__description">
                        {category.description.length > 120
                          ? `${category.description.substring(0, 120)}...`
                          : category.description}
                      </div>
                    }
                  />
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      {categories.length === 0 && !loading && (
        <div className="categories-page__empty">
          <h3>No categories found</h3>
          <p>Categories will appear here once they are added</p>
        </div>
      )}
    </div>
  );
}
