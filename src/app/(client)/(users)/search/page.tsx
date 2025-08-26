"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import {
  Input,
  Card,
  Row,
  Col,
  Pagination,
  Select,
  Space,
  Typography,
  Empty,
  Spin,
  Tag,
  Button,
  Divider,
  Slider,
  Checkbox,
  message,
  Image,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ClearOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
const { Search } = Input;
const { Title, Text } = Typography;
const { Option } = Select;
const { Meta } = Card;

interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface SearchResult {
  products: IProduct[];
  total: number;
  categories: ICategory[];
  priceRange: { min: number; max: number };
}

const SearchContent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult>({
    products: [],
    total: 0,
    categories: [],
    priceRange: { min: 0, max: 1000 },
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const performSearch = useCallback(
    async (
      searchQuery: string,
      page: number = 1,
      searchFilters: SearchFilters = {}
    ) => {
      if (!searchQuery.trim()) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          page: page.toString(),
          limit: pageSize.toString(),
          ...Object.fromEntries(
            Object.entries(searchFilters).filter(
              ([_, value]) => value !== undefined && value !== ""
            )
          ),
        });

        const response = await fetch(`/api/v1/search?${params}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setSearchResults(data.data);
          setPriceRange([
            data.data.priceRange.min,
            data.data.priceRange.max,
          ] as [number, number]);
        } else {
          message.error(data.error || "Search failed");
          setSearchResults({
            products: [],
            total: 0,
            categories: [],
            priceRange: { min: 0, max: 1000 },
          });
        }
      } catch (error) {
        console.error("Search error:", error);
        message.error("Network error during search");
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    if (query) {
      performSearch(query, currentPage, filters);
    }
  }, [query, currentPage, filters, performSearch]);

  const handleSearch = useCallback(
    (value: string) => {
      if (value.trim()) {
        router.push(`/search?q=${encodeURIComponent(value.trim())}`);
        setCurrentPage(1);
      }
    },
    [router]
  );

  const handleFilterChange = useCallback(
    (
      key: keyof SearchFilters,
      value: string | number | boolean | undefined
    ) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      setCurrentPage(1);
    },
    [filters]
  );

  const handlePriceRangeChange = useCallback(
    (value: number | number[]) => {
      const rangeValue: [number, number] = Array.isArray(value)
        ? (value as [number, number])
        : [0, value];
      setPriceRange(rangeValue);
      handleFilterChange("minPrice", rangeValue[0]);
      handleFilterChange("maxPrice", rangeValue[1]);
    },
    [handleFilterChange]
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    setPriceRange([
      searchResults.priceRange.min,
      searchResults.priceRange.max,
    ] as [number, number]);
    setCurrentPage(1);
  }, [searchResults.priceRange]);

  const sortOptions = useMemo(
    () => [
      { label: "Relevance", value: "relevance" },
      { label: "Price: Low to High", value: "price_asc" },
      { label: "Price: High to Low", value: "price_desc" },
      { label: "Name: A to Z", value: "name_asc" },
      { label: "Name: Z to A", value: "name_desc" },
      { label: "Newest First", value: "created_desc" },
    ],
    []
  );

  const handleSortChange = useCallback(
    (value: string) => {
      const [sortBy, sortOrder] = value.split("_");
      handleFilterChange("sortBy", sortBy);
      handleFilterChange("sortOrder", sortOrder || "asc");
    },
    [handleFilterChange]
  );

  const handleAddToCart = useCallback((product: IProduct) => {
    message.success(`${product.name} added to cart!`);
  }, []);

  const renderFilters = () => (
    <Card title="Filters" size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Category Filter */}
        <div>
          <Text strong>Category</Text>
          <Select
            placeholder="Select category"
            style={{ width: "100%", marginTop: 8 }}
            allowClear
            value={filters.category}
            onChange={(value) => handleFilterChange("category", value)}
          >
            {searchResults.categories.map((category) => (
              <Option key={category.id} value={category.slug}>
                {category.name}
              </Option>
            ))}
          </Select>
        </div>

        {/* Price Range Filter */}
        <div>
          <Text strong>Price Range</Text>
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <Slider
              range
              min={searchResults.priceRange.min}
              max={searchResults.priceRange.max}
              value={priceRange}
              onChange={handlePriceRangeChange}
              tooltip={{
                formatter: (value) => `$${value}`,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <Text type="secondary">${priceRange[0]}</Text>
              <Text type="secondary">${priceRange[1]}</Text>
            </div>
          </div>
        </div>

        {/* Availability Filter */}
        <div>
          <Checkbox
            checked={filters.inStock}
            onChange={(e) => handleFilterChange("inStock", e.target.checked)}
          >
            In Stock Only
          </Checkbox>
        </div>

        {/* Clear Filters */}
        <Button
          type="default"
          icon={<ClearOutlined />}
          onClick={clearFilters}
          block
        >
          Clear Filters
        </Button>
      </Space>
    </Card>
  );

  const renderProductCard = useCallback(
    (product: IProduct) => {
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
                  icon={<HeartOutlined />}
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
              onClick={() => handleAddToCart(product)}
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
    [handleAddToCart]
  );

  const renderProductGrid = () => (
    <Row gutter={[16, 16]}>
      {searchResults.products.map((product) => (
        <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
          {renderProductCard(product)}
        </Col>
      ))}
    </Row>
  );

  const renderProductList = () => (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      {searchResults.products.map((product) => {
        const imageUrl = product.images?.[0]?.id
          ? `/api/v1/image/${product.images[0].id}?w=200&h=150&format=webp`
          : "/images/fallback.webp";

        return (
          <Card key={product.id} hoverable>
            <Row gutter={16} align="middle">
              <Col xs={24} sm={6}>
                <div
                  style={{
                    width: "100%",
                    height: 120,
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 8,
                  }}
                >
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    width="100%"
                    height={120}
                    style={{ objectFit: "cover" }}
                    fallback="/images/fallback.webp"
                    preview={false}
                  />
                </div>
              </Col>
              <Col xs={24} sm={18}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Link href={`/products/${product.slug}`}>
                    <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
                      {product.name}
                    </Title>
                  </Link>
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
                      <Text delete style={{ marginLeft: 8, color: "#999" }}>
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
                    <Link href={`/products/${product.slug}`}>
                      <Button icon={<EyeOutlined />}>View Details</Button>
                    </Link>
                  </Space>
                </Space>
              </Col>
            </Row>
          </Card>
        );
      })}
    </Space>
  );

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Search Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>Search Results</Title>
          <Search
            placeholder="Search products..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            defaultValue={query}
            onSearch={handleSearch}
            style={{ marginBottom: 16 }}
          />

          {query && (
            <div>
              <Text>
                Showing results for: <Tag color="blue">{query}</Tag>
              </Text>
              <Text type="secondary" style={{ marginLeft: 16 }}>
                {searchResults.total} products found
              </Text>
            </div>
          )}
        </div>

        {/* Controls */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
              style={{ marginRight: 8 }}
            >
              Filters
            </Button>
            <Button.Group>
              <Button
                icon={<AppstoreOutlined />}
                type={viewMode === "grid" ? "primary" : "default"}
                onClick={() => setViewMode("grid")}
              />
              <Button
                icon={<BarsOutlined />}
                type={viewMode === "list" ? "primary" : "default"}
                onClick={() => setViewMode("list")}
              />
            </Button.Group>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Sort by"
              style={{ width: "100%" }}
              value={
                filters.sortBy
                  ? `${filters.sortBy}_${filters.sortOrder}`
                  : "relevance"
              }
              onChange={handleSortChange}
              suffixIcon={<SortAscendingOutlined />}
            >
              {sortOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Row gutter={24}>
          {/* Filters Sidebar */}
          {showFilters && (
            <Col xs={24} md={6}>
              {renderFilters()}
            </Col>
          )}

          {/* Results */}
          <Col xs={24} md={showFilters ? 18 : 24}>
            <Spin spinning={loading}>
              {searchResults.products.length > 0 ? (
                <>
                  {viewMode === "grid"
                    ? renderProductGrid()
                    : renderProductList()}

                  <Divider />

                  {/* Pagination */}
                  <div style={{ textAlign: "center" }}>
                    <Pagination
                      current={currentPage}
                      total={searchResults.total}
                      pageSize={pageSize}
                      onChange={setCurrentPage}
                      showSizeChanger={false}
                      showQuickJumper
                      showTotal={(total, range) =>
                        `${range[0]}-${range[1]} of ${total} products`
                      }
                    />
                  </div>
                </>
              ) : (
                !loading && (
                  <Empty
                    description={
                      query
                        ? `No products found for "${query}"`
                        : "Enter a search term to find products"
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    {query && (
                      <Button
                        type="primary"
                        onClick={() => router.push("/products")}
                      >
                        Browse All Products
                      </Button>
                    )}
                  </Empty>
                )
              )}
            </Spin>
          </Col>
        </Row>
      </div>
    </div>
  );
};

const SearchPage = () => {
  return (
    <Suspense
      fallback={
        <div className="search-container">
          <Spin size="large" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
};

export default SearchPage;
