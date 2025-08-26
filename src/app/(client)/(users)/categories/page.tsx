"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Spin,
  Button,
  Typography,
  Empty,
  message,
  Image,
  Space,
  Tag,
} from "antd";
import {
  EyeOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const { Title, Text } = Typography;
const { Meta } = Card;

interface Category extends ICategory {
  productCount?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/category");
      const productsResponse = await fetch("/api/v1/products");
      const productsData = (await productsResponse.json()) as {
        success: boolean;
        products: IProduct[];
        pagination: object;
        filters: object;
      };
      // console.log({ productsData });

      if (response.ok) {
        const categoriesRes = await response.json();
        const data = categoriesRes as {
          success: boolean;
          categories: Category[];
          pagination: object;
          filters: object;
        };
        // Filter to show only active parent categories (categories without parent)
        const parentCategories = data.success
          ? data.categories.filter(
              (category: Category) =>
                !category.parent && category.isActive !== false
            )
          : [];
        // product count for each category
        parentCategories.forEach((category) => {
          category.productCount = productsData.products.filter(
            (product: IProduct) =>
              product.category.id === category.id && product.isActive !== false
          ).length;
        });
        setCategories(parentCategories);
      } else {
        message.error("Failed to load categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      message.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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

  const renderCategoryCard = useCallback((category: Category) => {
    const imageUrl = category.image?.id
      ? `/api/v1/image/${category.image.id}?w=300&h=200&format=webp`
      : null;

    return (
      <Card
        hoverable
        style={{ height: "100%", overflow: "hidden" }}
        cover={
          <div
            style={{ position: "relative", height: 200, overflow: "hidden" }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={category.name}
                width="100%"
                height={200}
                style={{ objectFit: "cover" }}
                fallback="/images/fallback.webp"
                preview={false}
              />
            ) : (
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f5f5f5",
                  color: "#ccc",
                }}
              >
                <AppstoreOutlined style={{ fontSize: "3rem" }} />
              </div>
            )}
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: "white",
                padding: "4px 8px",
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              <ShoppingOutlined style={{ marginRight: 4 }} />
              {category.productCount || 0} items
            </div>
          </div>
        }
        actions={[
          <Link key="view" href={`/category/${category.slug}`}>
            <Button type="primary" icon={<EyeOutlined />} block>
              View Products
            </Button>
          </Link>,
        ]}
      >
        <Meta
          title={
            <Link href={`/category/${category.slug}`}>
              <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
                {category.name}
              </Text>
            </Link>
          }
          description={
            <div>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {category.description && category.description.length > 100
                  ? `${category.description.substring(0, 100)}...`
                  : category.description || "Explore our collection"}
              </Text>
              <div style={{ marginTop: 8 }}>
                <Space>
                  <Tag color="blue">{category.productCount || 0} Products</Tag>
                  {category.children && category.children.length > 0 && (
                    <Tag color="green">
                      {category.children.length} Subcategories
                    </Tag>
                  )}
                </Space>
              </div>
            </div>
          }
        />
      </Card>
    );
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text>Loading categories...</Text>
        </Space>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <Title level={1}>Product Categories</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Explore our furniture collections organized by category
          </Text>
        </motion.div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={3}>No categories available</Title>
                  <Text type="secondary">
                    Categories will appear here once they are added
                  </Text>
                </div>
              }
            >
              <Link href="/products">
                <Button type="primary" icon={<ShoppingOutlined />}>
                  Browse All Products
                </Button>
              </Link>
            </Empty>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              <Row gutter={[24, 24]}>
                {categories.map((category, index) => (
                  <Col key={category.id} xs={24} sm={12} md={8} lg={6}>
                    <motion.div
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{
                        duration: 0.5,
                        delay: index * 0.1,
                      }}
                    >
                      {renderCategoryCard(category)}
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Additional Info Section */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ marginTop: 48 }}
          >
            <Card style={{ textAlign: "center", backgroundColor: "#fafafa" }}>
              <Space direction="vertical" size="middle">
                <Title level={3}>
                  Can&apos;t find what you&apos;re looking for?
                </Title>
                <Text type="secondary">
                  Browse all our products or use our search feature to find
                  specific items
                </Text>
                <Space>
                  <Link href="/products">
                    <Button
                      type="primary"
                      size="large"
                      icon={<ShoppingOutlined />}
                    >
                      View All Products
                    </Button>
                  </Link>
                  <Link href="/search">
                    <Button size="large">Advanced Search</Button>
                  </Link>
                </Space>
              </Space>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
