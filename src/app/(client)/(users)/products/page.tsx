"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Spin,
  Input,
  Select,
  Pagination,
  Badge,
  Button,
} from "antd";
import { SearchOutlined, FilterOutlined, EyeOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import "@/styles/userPages.scss";

const { Search } = Input;
const { Option } = Select;

interface Product {
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
  size: {
    length: number;
    width: number;
    height: number;
    unit: string;
    fixedSize: boolean;
  };
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch products and categories
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/v1/product"),
        fetch("/api/v1/category"),
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(
          productsData.filter((product: Product) => product.isActive)
        );
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.filter((category: Category) => category));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "price-low":
        return a.prices.retail - b.prices.retail;
      case "price-high":
        return b.prices.retail - a.prices.retail;
      default:
        return 0;
    }
  });

  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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

  const getDiscountedPrice = (product: Product) => {
    if (product.prices.discount > 0) {
      return product.prices.retail * (1 - product.prices.discount / 100);
    }
    return product.prices.retail;
  };

  if (loading) {
    return (
      <div className="products-page">
        <div className="products-page__loading">
          <Spin size="large" />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="products-page__header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="products-page__title">Our Products</h1>
          <p className="products-page__subtitle">
            Discover our collection of premium solid wood furniture
          </p>
        </motion.div>
      </div>

      <div className="products-page__filters">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search products..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Category"
              allowClear
              size="large"
              style={{ width: "100%" }}
              value={selectedCategory || undefined}
              onChange={setSelectedCategory}
              suffixIcon={<FilterOutlined />}
            >
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Sort by"
              size="large"
              style={{ width: "100%" }}
              value={sortBy}
              onChange={setSortBy}
            >
              <Option value="name">Name A-Z</Option>
              <Option value="price-low">Price: Low to High</Option>
              <Option value="price-high">Price: High to Low</Option>
            </Select>
          </Col>
        </Row>
      </div>

      <motion.div
        className="products-page__grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Row gutter={[24, 24]}>
          {paginatedProducts.map((product) => (
            <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
              <motion.div variants={itemVariants}>
                <Card
                  hoverable
                  className="product-card"
                  cover={
                    <div className="product-card__image-container">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={`/api/v1/image/${
                            product.images.find((img) => img.isThumbnail)?.id ||
                            product.images[0].id
                          }?w=300&h=300&format=webp`}
                          alt={product.name}
                          width={300}
                          height={300}
                          className="product-card__image"
                          placeholder="blur"
                          blurDataURL={`/api/v1/image/${
                            product.images.find((img) => img.isThumbnail)?.id ||
                            product.images[0].id
                          }?w=20&h=20&format=webp&grayscale=1`}
                        />
                      ) : (
                        <div className="product-card__no-image">
                          <span>No Image</span>
                        </div>
                      )}
                      {product.prices.discount > 0 && (
                        <Badge.Ribbon
                          text={`${product.prices.discount}% OFF`}
                          color="red"
                        >
                          <div />
                        </Badge.Ribbon>
                      )}
                    </div>
                  }
                  actions={[
                    <Link key="view" href={`/products/${product.slug}`}>
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        size="small"
                      >
                        View Details
                      </Button>
                    </Link>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <div className="product-card__title">
                        <h3>{product.name}</h3>
                        {product.category && (
                          <Badge
                            count={product.category.name}
                            style={{ backgroundColor: "#1e9df1" }}
                          />
                        )}
                      </div>
                    }
                    description={
                      <div className="product-card__details">
                        <p className="product-card__description">
                          {product.description.length > 100
                            ? `${product.description.substring(0, 100)}...`
                            : product.description}
                        </p>
                        <div className="product-card__price">
                          {product.prices.discount > 0 ? (
                            <>
                              <span className="product-card__price--discounted">
                                ${getDiscountedPrice(product).toFixed(2)}
                              </span>
                              <span className="product-card__price--original">
                                ${product.prices.retail.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="product-card__price--current">
                              ${product.prices.retail.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {product.size && product.size.fixedSize && (
                          <div className="product-card__dimensions">
                            {product.size.length} × {product.size.width} ×{" "}
                            {product.size.height} {product.size.unit}
                          </div>
                        )}
                      </div>
                    }
                  />
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      {sortedProducts.length === 0 && !loading && (
        <div className="products-page__empty">
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {sortedProducts.length > pageSize && (
        <div className="products-page__pagination">
          <Pagination
            current={currentPage}
            total={sortedProducts.length}
            pageSize={pageSize}
            onChange={setCurrentPage}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} products`
            }
          />
        </div>
      )}
    </div>
  );
}
