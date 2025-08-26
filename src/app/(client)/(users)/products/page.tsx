"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Pagination,
  Spin,
  Empty,
  message,
  Space,
  Typography,
  Tag,
  Image,
  Segmented,
  Divider,
} from "antd";
import {
  AppstoreOutlined,
  BarsOutlined,
  HeartOutlined,
  HeartFilled,
  ShoppingCartOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { Meta } = Card;

interface ProductsPageState {
  products: IProduct[];
  categories: ICategory[];
  loading: boolean;
  searchTerm: string;
  selectedCategory: string;
  sortBy: string;
  viewMode: "grid" | "list";
  currentPage: number;
  pageSize: number;
}

export default function ProductsPage() {
  const [state, setState] = useState<ProductsPageState>({
    products: [],
    categories: [],
    loading: true,
    searchTerm: "",
    selectedCategory: "",
    sortBy: "name",
    viewMode: "grid",
    currentPage: 1,
    pageSize: 12,
  });

  const { addItem: addToCart } = useCart();
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      // Fetch products and categories
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/v1/products"),
        fetch("/api/v1/category"),
      ]);

      const productsData = productsRes.ok
        ? await productsRes.json()
        : { success: false };
      const categoriesData = categoriesRes.ok
        ? await categoriesRes.json()
        : { success: false };
      // console.log({ productsData, categoriesData });

      setState((prev) => ({
        ...prev,
        products: productsData.success ? productsData.products : [],
        categories: categoriesData.success ? categoriesData.categories : [],
        loading: false,
      }));
    } catch (error) {
      console.error("Error loading products:", error);
      message.error("Failed to load products");
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAndSortedProducts = useMemo(() => {
    // console.log({ state });

    if (!state.products || !Array.isArray(state.products)) {
      return [];
    }

    const filtered = state.products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        product.description
          ?.toLowerCase()
          .includes(state.searchTerm.toLowerCase());

      const matchesCategory =
        !state.selectedCategory ||
        (typeof product.category === "object" &&
          (product.category as ICategory).id === state.selectedCategory);

      return matchesSearch && matchesCategory && product.isActive;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          return (a.prices?.retail || 0) - (b.prices?.retail || 0);
        case "price-high":
          return (b.prices?.retail || 0) - (a.prices?.retail || 0);
        case "newest":
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [state.products, state.searchTerm, state.selectedCategory, state.sortBy]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, state.currentPage, state.pageSize]);

  const handleSearch = useCallback((value: string) => {
    setState((prev) => ({ ...prev, searchTerm: value, currentPage: 1 }));
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, selectedCategory: value, currentPage: 1 }));
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, sortBy: value, currentPage: 1 }));
  }, []);

  const handleViewModeChange = useCallback((mode: string) => {
    setState((prev) => ({ ...prev, viewMode: mode as "grid" | "list" }));
  }, []);

  const handlePageChange = useCallback((page: number, pageSize?: number) => {
    setState((prev) => ({
      ...prev,
      currentPage: page,
      pageSize: pageSize || prev.pageSize,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleAddToCart = useCallback(
    (product: IProduct) => {
      addToCart(product, 1);
    },
    [addToCart]
  );

  const handleToggleWishlist = useCallback(
    (product: IProduct) => {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product);
      }
    },
    [isInWishlist, removeFromWishlist, addToWishlist]
  );

  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      searchTerm: "",
      selectedCategory: "",
      currentPage: 1,
    }));
  }, []);

  const renderProductCard = useCallback(
    (product: IProduct) => {
      const productInWishlist = isInWishlist(product.id);
      const imageUrl = product.images?.[0]?.id
        ? `/api/v1/image/${product.images[0].id}?w=300&h=240&format=webp`
        : "/images/fallback.webp";

      return (
        <Card
          hoverable
          style={{ height: "100%" }}
          cover={
            <div
              style={{ position: "relative", height: 240, overflow: "hidden" }}
            >
              <Image
                src={imageUrl}
                alt={product.name}
                width="100%"
                height={240}
                style={{ objectFit: "cover" }}
                fallback="/images/fallback.webp"
                preview={false}
              />
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <Button
                  type="text"
                  shape="circle"
                  icon={
                    productInWishlist ? (
                      <HeartFilled style={{ color: "#ff4d4f" }} />
                    ) : (
                      <HeartOutlined />
                    )
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleWishlist(product);
                  }}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    border: "none",
                  }}
                />
              </div>
              {product.prices?.discount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    backgroundColor: "#ff4d4f",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  -{product.prices.discount}%
                </div>
              )}
            </div>
          }
          actions={[
            <Button
              key="cart"
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(product);
              }}
            >
              Add to Cart
            </Button>,
            <Link key="view" href={`/products/${product.slug}`}>
              <Button icon={<EyeOutlined />}>View Details</Button>
            </Link>,
          ]}
        >
          <Meta
            title={
              <Link href={`/products/${product.slug}`}>
                <Text strong style={{ color: "#1890ff" }}>
                  {product.name}
                </Text>
              </Link>
            }
            description={
              <div>
                <Text type="secondary">
                  {product.description && product.description.length > 100
                    ? `${product.description.substring(0, 100)}...`
                    : product.description}
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Space
                    direction="vertical"
                    size="small"
                    style={{ width: "100%" }}
                  >
                    <div>
                      <Text strong style={{ fontSize: 16, color: "#52c41a" }}>
                        ${product.prices?.retail || 0}
                      </Text>
                      {product.prices?.discount > 0 && (
                        <Text delete type="secondary" style={{ marginLeft: 8 }}>
                          $
                          {Math.round(
                            (product.prices.retail || 0) /
                              (1 - (product.prices.discount || 0) / 100)
                          )}
                        </Text>
                      )}
                    </div>
                    {product.category &&
                      typeof product.category === "object" && (
                        <Tag color="blue">
                          {(product.category as ICategory).name}
                        </Tag>
                      )}
                  </Space>
                </div>
              </div>
            }
          />
        </Card>
      );
    },
    [isInWishlist, handleAddToCart, handleToggleWishlist]
  );

  const renderProductList = useCallback(
    (product: IProduct) => {
      const productInWishlist = isInWishlist(product.id);
      const imageUrl = product.images?.[0]?.id
        ? `/api/v1/image/${product.images[0].id}?w=200&h=150&format=webp`
        : "/images/fallback.webp";

      return (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={6}>
              <div style={{ position: "relative" }}>
                <Image
                  src={imageUrl}
                  alt={product.name}
                  width="100%"
                  height={150}
                  style={{ objectFit: "cover", borderRadius: 8 }}
                  fallback="/images/fallback.webp"
                  preview={false}
                />
                {product.prices?.discount > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      backgroundColor: "#ff4d4f",
                      color: "white",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    -{product.prices.discount}%
                  </div>
                )}
              </div>
            </Col>
            <Col xs={24} sm={18}>
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="middle"
              >
                <div>
                  <Link href={`/products/${product.slug}`}>
                    <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
                      {product.name}
                    </Title>
                  </Link>
                  {product.category && typeof product.category === "object" && (
                    <Tag color="blue" style={{ marginTop: 4 }}>
                      {(product.category as ICategory).name}
                    </Tag>
                  )}
                </div>

                <Text type="secondary">
                  {product.description && product.description.length > 150
                    ? `${product.description.substring(0, 150)}...`
                    : product.description}
                </Text>

                <div>
                  <Text strong style={{ fontSize: 18, color: "#52c41a" }}>
                    ${product.prices?.retail || 0}
                  </Text>
                  {product.prices?.discount > 0 && (
                    <Text delete type="secondary" style={{ marginLeft: 8 }}>
                      $
                      {Math.round(
                        (product.prices.retail || 0) /
                          (1 - (product.prices.discount || 0) / 100)
                      )}
                    </Text>
                  )}
                </div>

                <Space>
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    icon={
                      productInWishlist ? (
                        <HeartFilled style={{ color: "#ff4d4f" }} />
                      ) : (
                        <HeartOutlined />
                      )
                    }
                    onClick={() => handleToggleWishlist(product)}
                  >
                    {productInWishlist
                      ? "Remove from Wishlist"
                      : "Add to Wishlist"}
                  </Button>
                  <Link href={`/products/${product.slug}`}>
                    <Button icon={<EyeOutlined />}>View Details</Button>
                  </Link>
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>
      );
    },
    [isInWishlist, handleAddToCart, handleToggleWishlist]
  );

  if (state.loading) {
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
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 32 }}
        >
          <Title level={1}>Premium Furniture Collection</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Discover our exquisite range of handcrafted solid wood furniture
          </Text>
        </motion.div>

        {/* Filters and Controls */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Search furniture..."
                allowClear
                size="large"
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="All Categories"
                size="large"
                allowClear
                onChange={handleCategoryChange}
                style={{ width: "100%" }}
                value={state.selectedCategory || undefined}
              >
                {state.categories.map((category) => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Select
                value={state.sortBy}
                size="large"
                onChange={handleSortChange}
                style={{ width: "100%" }}
              >
                <Option value="name">Sort by Name</Option>
                <Option value="price-low">Price: Low to High</Option>
                <Option value="price-high">Price: High to Low</Option>
                <Option value="newest">Newest First</Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Segmented
                value={state.viewMode}
                onChange={handleViewModeChange}
                options={[
                  {
                    label: "Grid",
                    value: "grid",
                    icon: <AppstoreOutlined />,
                  },
                  { label: "List", value: "list", icon: <BarsOutlined /> },
                ]}
              />
            </Col>
          </Row>

          <Divider style={{ margin: "16px 0" }} />

          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Text strong>
                  {filteredAndSortedProducts.length} products found
                </Text>
                {state.searchTerm && (
                  <Tag
                    closable
                    onClose={() =>
                      setState((prev) => ({
                        ...prev,
                        searchTerm: "",
                        currentPage: 1,
                      }))
                    }
                  >
                    Search: {state.searchTerm}
                  </Tag>
                )}
                {state.selectedCategory && (
                  <Tag
                    closable
                    onClose={() =>
                      setState((prev) => ({
                        ...prev,
                        selectedCategory: "",
                        currentPage: 1,
                      }))
                    }
                  >
                    Category:{" "}
                    {
                      state.categories.find(
                        (c) => c.id === state.selectedCategory
                      )?.name
                    }
                  </Tag>
                )}
              </Space>
            </Col>

            {(state.searchTerm || state.selectedCategory) && (
              <Col>
                <Button onClick={clearFilters}>Clear All Filters</Button>
              </Col>
            )}
          </Row>
        </Card>

        {/* Products */}
        {paginatedProducts.length === 0 ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={3}>No products found</Title>
                  <Text type="secondary">
                    Try adjusting your search criteria or browse all categories
                  </Text>
                </div>
              }
            >
              <Button type="primary" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Empty>
          </Card>
        ) : (
          <>
            <AnimatePresence mode="wait">
              {state.viewMode === "grid" ? (
                <Row gutter={[16, 16]}>
                  {paginatedProducts.map((product, index) => (
                    <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                        }}
                      >
                        {renderProductCard(product)}
                      </motion.div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div>
                  {paginatedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                      }}
                    >
                      {renderProductList(product)}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {filteredAndSortedProducts.length > state.pageSize && (
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <Pagination
                  current={state.currentPage}
                  total={filteredAndSortedProducts.length}
                  pageSize={state.pageSize}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} of ${total} products`
                  }
                  pageSizeOptions={["12", "24", "48", "96"]}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
