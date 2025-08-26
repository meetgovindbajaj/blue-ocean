"use client";

import React, { useState, useCallback } from "react";
import {
  Typography,
  Card,
  Table,
  Tag,
  Button,
  Space,
  Empty,
  Descriptions,
  Modal,
  Timeline,
  Divider,
  Image,
} from "antd";
import {
  EyeOutlined,
  ShoppingOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { ColumnsType } from "antd/es/table";
const { Title, Text } = Typography;

interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
}

const OrdersPage: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Mock data - replace with actual API call
  const [orders] = useState<Order[]>([
    {
      id: "1",
      orderNumber: "BO-2024-001",
      date: "2024-01-15",
      status: "delivered",
      total: 89.97,
      trackingNumber: "TRK123456789",
      items: [
        {
          id: "1",
          productName: "Premium Cotton T-Shirt",
          productImage: "/images/fallback.webp",
          quantity: 2,
          price: 29.99,
          total: 59.98,
        },
        {
          id: "2",
          productName: "Classic Jeans",
          productImage: "/images/fallback.webp",
          quantity: 1,
          price: 29.99,
          total: 29.99,
        },
      ],
      shippingAddress: {
        name: "John Doe",
        address: "123 Main Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
      },
    },
    {
      id: "2",
      orderNumber: "BO-2024-002",
      date: "2024-01-20",
      status: "shipped",
      total: 149.99,
      trackingNumber: "TRK987654321",
      items: [
        {
          id: "3",
          productName: "Leather Jacket",
          productImage: "/images/fallback.webp",
          quantity: 1,
          price: 149.99,
          total: 149.99,
        },
      ],
      shippingAddress: {
        name: "John Doe",
        address: "123 Main Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
      },
    },
  ]);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "orange";
      case "processing":
        return "blue";
      case "shipped":
        return "purple";
      case "delivered":
        return "green";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <ClockCircleOutlined />;
      case "processing":
        return <InboxOutlined />;
      case "shipped":
        return <TruckOutlined />;
      case "delivered":
        return <CheckCircleOutlined />;
      case "cancelled":
        return <ClockCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const viewOrderDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  }, []);

  const columns: ColumnsType<Order> = [
    {
      title: "Order Number",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: Order["status"]) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      render: (items: OrderItem[]) =>
        `${items.length} item${items.length !== 1 ? "s" : ""}`,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total: number) => <Text strong>${total.toFixed(2)}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: Order) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewOrderDetails(record)}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  const renderOrderTimeline = (order: Order) => {
    const timelineItems = [
      {
        color: "green",
        dot: <CheckCircleOutlined />,
        children: (
          <div>
            <Text strong>Order Placed</Text>
            <br />
            <Text type="secondary">
              {new Date(order.date).toLocaleString()}
            </Text>
          </div>
        ),
      },
    ];

    if (order.status !== "cancelled") {
      timelineItems.push({
        color: order.status === "pending" ? "gray" : "green",
        dot:
          order.status === "pending" ? (
            <ClockCircleOutlined />
          ) : (
            <CheckCircleOutlined />
          ),
        children: (
          <div>
            <Text strong>Order Confirmed</Text>
            <br />
            <Text type="secondary">
              Your order has been confirmed and is being processed
            </Text>
          </div>
        ),
      });

      if (order.status === "shipped" || order.status === "delivered") {
        timelineItems.push({
          color: "green",
          dot: <TruckOutlined />,
          children: (
            <div>
              <Text strong>Order Shipped</Text>
              <br />
              <Text type="secondary">
                Tracking: {order.trackingNumber || "N/A"}
              </Text>
            </div>
          ),
        });
      }

      if (order.status === "delivered") {
        timelineItems.push({
          color: "green",
          dot: <CheckCircleOutlined />,
          children: (
            <div>
              <Text strong>Order Delivered</Text>
              <br />
              <Text type="secondary">
                Your order has been successfully delivered
              </Text>
            </div>
          ),
        });
      }
    } else {
      timelineItems.push({
        color: "red",
        dot: <ClockCircleOutlined />,
        children: (
          <div>
            <Text strong>Order Cancelled</Text>
            <br />
            <Text type="secondary">This order has been cancelled</Text>
          </div>
        ),
      });
    }

    return <Timeline items={timelineItems} />;
  };

  if (!isAuthenticated) {
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
            description={
              <div>
                <Title level={3}>Please log in to view your orders</Title>
                <Text type="secondary">
                  You need to be logged in to access your order history.
                </Text>
              </div>
            }
          >
            <Button
              type="primary"
              size="large"
              onClick={() => router.push("/auth/login")}
            >
              Log In
            </Button>
          </Empty>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
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
                <Title level={3}>No orders yet</Title>
                <Text type="secondary">
                  You haven&apos;t placed any orders yet. Start shopping to see
                  your orders here.
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
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>My Orders</Title>
          <Text type="secondary">Track and manage your orders</Text>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} orders`,
            }}
          />
        </Card>

        {/* Order Details Modal */}
        <Modal
          title={`Order Details - ${selectedOrder?.orderNumber}`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
        >
          {selectedOrder && (
            <div>
              {/* Order Status */}
              <div style={{ marginBottom: 24, textAlign: "center" }}>
                <Tag
                  color={getStatusColor(selectedOrder.status)}
                  icon={getStatusIcon(selectedOrder.status)}
                  style={{ fontSize: 16, padding: "8px 16px" }}
                >
                  {selectedOrder.status.charAt(0).toUpperCase() +
                    selectedOrder.status.slice(1)}
                </Tag>
              </div>

              {/* Order Timeline */}
              <Card title="Order Status" style={{ marginBottom: 24 }}>
                {renderOrderTimeline(selectedOrder)}
              </Card>

              {/* Order Items */}
              <Card title="Order Items" style={{ marginBottom: 24 }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                      }}
                    >
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={60}
                        height={60}
                        style={{ objectFit: "cover", borderRadius: 8 }}
                        fallback="/images/fallback.webp"
                      />
                      <div style={{ flex: 1 }}>
                        <Text strong>{item.productName}</Text>
                        <br />
                        <Text type="secondary">
                          Quantity: {item.quantity} × ${item.price.toFixed(2)}
                        </Text>
                      </div>
                      <Text strong>${item.total.toFixed(2)}</Text>
                    </div>
                  ))}
                </Space>

                <Divider />

                <div style={{ textAlign: "right" }}>
                  <Text strong style={{ fontSize: 16 }}>
                    Total: ${selectedOrder.total.toFixed(2)}
                  </Text>
                </div>
              </Card>

              {/* Shipping Information */}
              <Card title="Shipping Information">
                <Descriptions column={1}>
                  <Descriptions.Item label="Name">
                    {selectedOrder.shippingAddress.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Address">
                    {selectedOrder.shippingAddress.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="City">
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state}{" "}
                    {selectedOrder.shippingAddress.zipCode}
                  </Descriptions.Item>
                  <Descriptions.Item label="Country">
                    {selectedOrder.shippingAddress.country}
                  </Descriptions.Item>
                  {selectedOrder.trackingNumber && (
                    <Descriptions.Item label="Tracking Number">
                      <Text copyable>{selectedOrder.trackingNumber}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default OrdersPage;
