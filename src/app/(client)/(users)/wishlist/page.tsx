"use client";

import React, { useCallback } from "react";
import "@/styles/wishlist.scss";
import {
  Typography,
  Row,
  Col,
  Button,
  Empty,
  Space,
  Card,
  Popconfirm,
} from "antd";
import {
  HeartFilled,
  ShoppingCartOutlined,
  DeleteOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import ProductCard from "@/components/products/ProductCard";

const { Title, Text } = Typography;

const WishlistPage: React.FC = () => {
  const router = useRouter();
  const { addItem } = useCart();
  const { items: wishlistItems, removeItem, clearWishlist } = useWishlist();

  const addToCart = useCallback(
    (product: IProduct) => {
      addItem(product, 1);
    },
    [addItem]
  );

  const addAllToCart = useCallback(() => {
    wishlistItems.forEach((product) => {
      addItem(product, 1);
    });
  }, [wishlistItems, addItem]);

  const removeFromWishlist = useCallback(
    (productId: string) => {
      removeItem(productId);
    },
    [removeItem]
  );

  if (wishlistItems.length === 0) {
    return (
      <div style={{ padding: "24px" }}>
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            textAlign: "center",
            paddingTop: 60,
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={3}>Your wishlist is empty</Title>
                <Text type="secondary">
                  Save items you love to your wishlist and shop them later.
                </Text>
              </div>
            }
          >
            <Button
              type="primary"
              size="large"
              icon={<ShoppingOutlined />}
              onClick={() => router.push("/products")}
            >
              Start Shopping
            </Button>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Space align="center" style={{ marginBottom: 16 }}>
            <HeartFilled style={{ fontSize: 24, color: "#ff4d4f" }} />
            <Title level={2} style={{ margin: 0 }}>
              My Wishlist
            </Title>
          </Space>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <Text type="secondary">
              {wishlistItems.length} item
              {wishlistItems.length !== 1 ? "s" : ""} in your wishlist
            </Text>

            <Space>
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={addAllToCart}
                disabled={wishlistItems.length === 0}
              >
                Add All to Cart
              </Button>

              <Popconfirm
                title="Clear all items from wishlist?"
                description="This action cannot be undone."
                onConfirm={clearWishlist}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={wishlistItems.length === 0}
                >
                  Clear Wishlist
                </Button>
              </Popconfirm>
            </Space>
          </div>
        </div>

        {/* Wishlist Items */}
        <Row gutter={[24, 24]}>
          {wishlistItems.map((product) => (
            <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
              <div style={{ position: "relative" }}>
                <ProductCard
                  product={product}
                  onAddToCart={addToCart}
                  isInWishlist={true}
                />

                {/* Quick Remove Button */}
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={() => removeFromWishlist(product.id)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                />
              </div>
            </Col>
          ))}
        </Row>

        {/* Recommendations */}
        <div style={{ marginTop: 64 }}>
          <Title level={3} style={{ textAlign: "center", marginBottom: 32 }}>
            You Might Also Like
          </Title>

          <Card style={{ textAlign: "center", padding: "40px 20px" }}>
            <ShoppingOutlined
              style={{ fontSize: 48, color: "#1890ff", marginBottom: 16 }}
            />
            <Title level={4}>Discover More Products</Title>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 24 }}
            >
              Browse our full collection to find more items you&apos;ll love
            </Text>
            <Space>
              <Button type="primary" onClick={() => router.push("/products")}>
                Browse All Products
              </Button>
              <Button onClick={() => router.push("/categories")}>
                Shop by Category
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
