"use client";

import React, { useState, useCallback } from "react";
import {
  Typography,
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Select,
  Space,
  message,
  Divider,
} from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SendOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  inquiryType: string;
}

const ContactPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (_values: ContactFormData) => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        message.success(
          "Thank you for your message! We will get back to you within 24 hours."
        );
        form.resetFields();
      } catch (_error) {
        message.error("Failed to send message. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  const contactInfo = [
    {
      icon: <PhoneOutlined style={{ fontSize: 24, color: "#1890ff" }} />,
      title: "Phone",
      content: ["+1 (555) 123-4567", "+1 (555) 987-6543"],
      description: "Mon-Fri 9AM-6PM EST",
    },
    {
      icon: <MailOutlined style={{ fontSize: 24, color: "#1890ff" }} />,
      title: "Email",
      content: ["info@blueoceanexport.com", "sales@blueoceanexport.com"],
      description: "We respond within 24 hours",
    },
    {
      icon: <EnvironmentOutlined style={{ fontSize: 24, color: "#1890ff" }} />,
      title: "Address",
      content: ["123 Export Boulevard", "New York, NY 10001, USA"],
      description: "Visit our headquarters",
    },
    {
      icon: <ClockCircleOutlined style={{ fontSize: 24, color: "#1890ff" }} />,
      title: "Business Hours",
      content: [
        "Monday - Friday: 9:00 AM - 6:00 PM",
        "Saturday: 10:00 AM - 4:00 PM",
      ],
      description: "Eastern Standard Time",
    },
  ];

  const offices = [
    {
      city: "New York",
      country: "USA",
      address: "123 Export Boulevard, NY 10001",
      phone: "+1 (555) 123-4567",
      email: "ny@blueoceanexport.com",
    },
    {
      city: "London",
      country: "UK",
      address: "456 Trade Street, London EC1A 1BB",
      phone: "+44 20 7123 4567",
      email: "london@blueoceanexport.com",
    },
    {
      city: "Singapore",
      country: "Singapore",
      address: "789 Commerce Ave, Singapore 018956",
      phone: "+65 6123 4567",
      email: "singapore@blueoceanexport.com",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
          color: "white",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Title level={1} style={{ color: "white", marginBottom: 24 }}>
            Contact Us
          </Title>
          <Paragraph style={{ fontSize: 18, color: "rgba(255,255,255,0.9)" }}>
            Get in touch with our team. We&apos;re here to help you with all
            your export needs and answer any questions you may have.
          </Paragraph>
        </div>
      </div>

      {/* Contact Information */}
      <div style={{ padding: "80px 24px", backgroundColor: "#f5f5f5" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: 48 }}>
            Get In Touch
          </Title>

          <Row gutter={[32, 32]}>
            {contactInfo.map((info, index) => (
              <Col key={index} xs={24} sm={12} lg={6}>
                <Card style={{ textAlign: "center", height: "100%" }}>
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: "100%" }}
                  >
                    {info.icon}
                    <Title level={4} style={{ margin: 0 }}>
                      {info.title}
                    </Title>
                    <div>
                      {info.content.map((line, i) => (
                        <div key={i}>
                          <Text strong>{line}</Text>
                        </div>
                      ))}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {info.description}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Contact Form & Map */}
      <div style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Row gutter={[48, 48]}>
            {/* Contact Form */}
            <Col xs={24} lg={12}>
              <Card title="Send us a Message" style={{ height: "100%" }}>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  size="large"
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[
                          {
                            required: true,
                            message: "Please enter your name",
                          },
                        ]}
                      >
                        <Input placeholder="John Doe" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                          {
                            required: true,
                            message: "Please enter your email",
                          },
                          {
                            type: "email",
                            message: "Please enter a valid email",
                          },
                        ]}
                      >
                        <Input placeholder="john@example.com" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item name="phone" label="Phone Number">
                        <Input placeholder="+1 (555) 123-4567" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="company" label="Company">
                        <Input placeholder="Your Company Name" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="inquiryType"
                        label="Inquiry Type"
                        rules={[
                          {
                            required: true,
                            message: "Please select inquiry type",
                          },
                        ]}
                      >
                        <Select placeholder="Select inquiry type">
                          <Option value="general">General Inquiry</Option>
                          <Option value="sales">Sales & Pricing</Option>
                          <Option value="support">Customer Support</Option>
                          <Option value="partnership">Partnership</Option>
                          <Option value="careers">Careers</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="subject"
                        label="Subject"
                        rules={[
                          { required: true, message: "Please enter subject" },
                        ]}
                      >
                        <Input placeholder="Brief subject line" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="message"
                    label="Message"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your message",
                      },
                    ]}
                  >
                    <TextArea
                      rows={6}
                      placeholder="Tell us more about your inquiry..."
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<SendOutlined />}
                      size="large"
                      block
                    >
                      Send Message
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            {/* Map Placeholder */}
            <Col xs={24} lg={12}>
              <Card title="Our Location" style={{ height: "100%" }}>
                <div
                  style={{
                    height: 400,
                    background: "linear-gradient(45deg, #f0f2f5, #d9d9d9)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <EnvironmentOutlined
                    style={{
                      fontSize: 64,
                      color: "#1890ff",
                      marginBottom: 16,
                    }}
                  />
                  <Title level={4} style={{ color: "#666" }}>
                    Interactive Map
                  </Title>
                  <Text type="secondary">
                    Map integration would be implemented here
                  </Text>
                </div>

                <Divider />

                <Space direction="vertical" style={{ width: "100%" }}>
                  <Title level={5}>Headquarters</Title>
                  <Text>
                    <EnvironmentOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    123 Export Boulevard, New York, NY 10001, USA
                  </Text>
                  <Text>
                    <PhoneOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    +1 (555) 123-4567
                  </Text>
                  <Text>
                    <MailOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    info@blueoceanexport.com
                  </Text>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Global Offices */}
      <div style={{ padding: "80px 24px", backgroundColor: "#f5f5f5" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: 48 }}>
            <GlobalOutlined style={{ marginRight: 16, color: "#1890ff" }} />
            Global Offices
          </Title>

          <Row gutter={[32, 32]}>
            {offices.map((office, index) => (
              <Col key={index} xs={24} md={8}>
                <Card hoverable style={{ height: "100%" }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
                      {office.city}, {office.country}
                    </Title>

                    <div>
                      <Text>
                        <EnvironmentOutlined style={{ marginRight: 8 }} />
                        {office.address}
                      </Text>
                    </div>

                    <div>
                      <Text>
                        <PhoneOutlined style={{ marginRight: 8 }} />
                        {office.phone}
                      </Text>
                    </div>

                    <div>
                      <Text>
                        <MailOutlined style={{ marginRight: 8 }} />
                        {office.email}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <Title level={2} style={{ marginBottom: 24 }}>
            Frequently Asked Questions
          </Title>

          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card>
              <Title level={4}>What are your shipping options?</Title>
              <Paragraph>
                We offer various shipping options including air freight, sea
                freight, and express delivery. Shipping times and costs vary
                depending on destination and product type.
              </Paragraph>
            </Card>

            <Card>
              <Title level={4}>Do you provide custom packaging?</Title>
              <Paragraph>
                Yes, we offer custom packaging solutions to meet your specific
                requirements. Our team can work with you to design packaging
                that protects your products during transit.
              </Paragraph>
            </Card>

            <Card>
              <Title level={4}>What payment methods do you accept?</Title>
              <Paragraph>
                We accept various payment methods including wire transfers,
                letters of credit, and major credit cards. Payment terms can be
                discussed based on order volume and relationship.
              </Paragraph>
            </Card>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
