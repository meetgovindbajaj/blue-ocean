"use client";

import React, { useState, useCallback } from "react";
import "@/styles/cart.scss";
import {
  Card,
  Row,
  Col,
  Button,
  InputNumber,
  Typography,
  Space,
  Divider,
  Empty,
  Image,
  Tag,
  message,
  Popconfirm,
  Steps,
  Form,
  Input,
  Select,
} from "antd";
import {
  DeleteOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

const { Title, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;

interface _ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const CartPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shippingForm] = Form.useForm();

  const router = useRouter();
  const {
    items: cartItems,
    summary: cartSummary,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const handleCheckout = useCallback(async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }

    if (currentStep === 1) {
      try {
        await shippingForm.validateFields();
        setCurrentStep(2);
      } catch (_error) {
        message.error("Please fill in all required shipping information");
        return;
      }
    }

    if (currentStep === 2) {
      setLoading(true);
      try {
        // Simulate checkout process
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setCurrentStep(3);
        message.success("Order placed successfully!");
      } catch (_error) {
        message.error("Checkout failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  }, [currentStep, shippingForm]);

  const renderCartItems = () => (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      {cartItems.map((item) => (
        <Card key={item.id} style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={6}>
              <Image
                src={`/api/v1/image/${item.product.images?.[0]?.id}?w=250&h=180&format=webp`}
                alt={item.product.name}
                width="100%"
                height={120}
                style={{ objectFit: "cover", borderRadius: 8 }}
                fallback="/images/fallback.webp"
              />
            </Col>

            <Col xs={24} sm={10}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Link href={`/products/${item.product.slug}`}>
                  <Title level={4} style={{ margin: 0, cursor: "pointer" }}>
                    {item.product.name}
                  </Title>
                </Link>

                <Text type="secondary" ellipsis>
                  {item.product.description}
                </Text>

                <Space>
                  {item.selectedSize && (
                    <Tag color="blue">Size: {item.selectedSize}</Tag>
                  )}
                  {item.selectedColor && (
                    <Tag color="green">Color: {item.selectedColor}</Tag>
                  )}
                </Space>
              </Space>
            </Col>

            <Col xs={24} sm={4}>
              <Space
                direction="vertical"
                align="center"
                style={{ width: "100%" }}
              >
                <Text strong style={{ fontSize: 16 }}>
                  $
                  {(
                    (item.product.prices?.retail || 0) *
                    (1 - (item.product.prices?.discount || 0) / 100)
                  ).toFixed(2)}
                </Text>
                {item.product.prices?.discount > 0 && (
                  <Text delete type="secondary">
                    ${item.product.prices.retail.toFixed(2)}
                  </Text>
                )}
              </Space>
            </Col>

            <Col xs={24} sm={4}>
              <Space
                direction="vertical"
                align="center"
                style={{ width: "100%" }}
              >
                <Space>
                  <Button
                    size="small"
                    icon={<MinusOutlined />}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  />
                  <InputNumber
                    min={1}
                    max={99}
                    value={item.quantity}
                    onChange={(value) => updateQuantity(item.id, value || 1)}
                    style={{ width: 60 }}
                  />
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  />
                </Space>

                <Popconfirm
                  title="Remove item from cart?"
                  onConfirm={() => removeItem(item.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  >
                    Remove
                  </Button>
                </Popconfirm>
              </Space>
            </Col>
          </Row>
        </Card>
      ))}
    </Space>
  );

  const renderOrderSummary = () => (
    <Card title="Order Summary" style={{ position: "sticky", top: 24 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text>Subtotal ({cartSummary.itemCount} items)</Text>
          <Text>${cartSummary.subtotal.toFixed(2)}</Text>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text>Shipping</Text>
          <Text>
            {cartSummary.shipping === 0 ? (
              <Text type="success">FREE</Text>
            ) : (
              `$${cartSummary.shipping.toFixed(2)}`
            )}
          </Text>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text>Tax</Text>
          <Text>${cartSummary.tax.toFixed(2)}</Text>
        </div>

        <Divider style={{ margin: "12px 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text strong style={{ fontSize: 16 }}>
            Total
          </Text>
          <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
            ${cartSummary.total.toFixed(2)}
          </Text>
        </div>

        {cartSummary.subtotal < 100 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Add ${(100 - cartSummary.subtotal).toFixed(2)} more for free
            shipping
          </Text>
        )}

        <Button
          type="primary"
          size="large"
          block
          onClick={handleCheckout}
          loading={loading}
          disabled={cartItems.length === 0}
        >
          {currentStep === 0
            ? "Proceed to Checkout"
            : currentStep === 1
            ? "Continue to Payment"
            : currentStep === 2
            ? "Place Order"
            : "Order Placed"}
        </Button>

        {cartItems.length > 0 && (
          <Popconfirm
            title="Clear all items from cart?"
            onConfirm={clearCart}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger block>
              Clear Cart
            </Button>
          </Popconfirm>
        )}
      </Space>
    </Card>
  );

  const renderShippingForm = () => (
    <Card title="Shipping Information">
      <Form
        form={shippingForm}
        layout="vertical"
        initialValues={{
          country: "US",
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[
                { required: true, message: "Please enter your full name" },
              ]}
            >
              <Input placeholder="John Doe" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="john@example.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: "Please enter your phone number" },
              ]}
            >
              <Input placeholder="+1 (555) 123-4567" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="country"
              label="Country"
              rules={[
                { required: true, message: "Please select your country" },
              ]}
            >
              <Select>
                <Option value="US">United States</Option>
                <Option value="CA">Canada</Option>
                <Option value="UK">United Kingdom</Option>
                <Option value="AU">Australia</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: "Please enter your address" }]}
        >
          <Input placeholder="123 Main Street" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true, message: "Please enter your city" }]}
            >
              <Input placeholder="New York" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="state"
              label="State/Province"
              rules={[{ required: true, message: "Please enter your state" }]}
            >
              <Input placeholder="NY" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="zipCode"
              label="ZIP/Postal Code"
              rules={[
                { required: true, message: "Please enter your ZIP code" },
              ]}
            >
              <Input placeholder="10001" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );

  const renderPaymentForm = () => (
    <Card title="Payment Information">
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <CreditCardOutlined
          style={{ fontSize: 48, color: "#1890ff", marginBottom: 16 }}
        />
        <Title level={4}>Secure Payment</Title>
        <Text type="secondary">
          Payment processing would be integrated here with services like Stripe,
          PayPal, etc.
        </Text>
      </div>
    </Card>
  );

  const renderOrderComplete = () => (
    <Card>
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <CheckCircleOutlined
          style={{ fontSize: 64, color: "#52c41a", marginBottom: 24 }}
        />
        <Title level={2}>Order Placed Successfully!</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Thank you for your order. You will receive a confirmation email
          shortly.
        </Text>
        <div style={{ marginTop: 32 }}>
          <Space>
            <Button type="primary" onClick={() => router.push("/orders")}>
              View Orders
            </Button>
            <Button onClick={() => router.push("/products")}>
              Continue Shopping
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  );

  if (cartItems.length === 0 && currentStep === 0) {
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
                <Title level={3}>Your cart is empty</Title>
                <Text type="secondary">
                  Looks like you haven&apos;t added any items to your cart yet.
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
        <Title level={2}>Shopping Cart</Title>

        {/* Checkout Steps */}
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Step title="Cart" icon={<ShoppingOutlined />} />
          <Step title="Shipping" icon={<TruckOutlined />} />
          <Step title="Payment" icon={<CreditCardOutlined />} />
          <Step title="Complete" icon={<CheckCircleOutlined />} />
        </Steps>

        <Row gutter={24}>
          <Col xs={24} lg={16}>
            {currentStep === 0 && renderCartItems()}
            {currentStep === 1 && renderShippingForm()}
            {currentStep === 2 && renderPaymentForm()}
            {currentStep === 3 && renderOrderComplete()}
          </Col>

          {currentStep < 3 && (
            <Col xs={24} lg={8}>
              {renderOrderSummary()}
            </Col>
          )}
        </Row>
      </div>
    </div>
  );
};

export default CartPage;
