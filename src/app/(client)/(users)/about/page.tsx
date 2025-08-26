"use client";

import React from "react";
import {
  Typography,
  Row,
  Col,
  Card,
  Space,
  Timeline,
  Statistic,
  Avatar,
  Button,
} from "antd";
import {
  GlobalOutlined,
  TeamOutlined,
  TrophyOutlined,
  HeartOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
const { Title, Paragraph, Text } = Typography;

const AboutPage: React.FC = () => {
  const router = useRouter();

  const stats = [
    {
      title: "Years of Experience",
      value: 15,
      suffix: "+",
      icon: <TrophyOutlined />,
    },
    {
      title: "Countries Served",
      value: 50,
      suffix: "+",
      icon: <GlobalOutlined />,
    },
    {
      title: "Happy Customers",
      value: 10000,
      suffix: "+",
      icon: <HeartOutlined />,
    },
    { title: "Team Members", value: 100, suffix: "+", icon: <TeamOutlined /> },
  ];

  const timeline = [
    {
      year: "2008",
      title: "Company Founded",
      description:
        "Blue Ocean Export was established with a vision to connect global markets through quality products and exceptional service.",
    },
    {
      year: "2012",
      title: "International Expansion",
      description:
        "Expanded operations to serve customers across 20+ countries, establishing key partnerships worldwide.",
    },
    {
      year: "2016",
      title: "Digital Transformation",
      description:
        "Launched our e-commerce platform, making it easier for customers to access our products globally.",
    },
    {
      year: "2020",
      title: "Sustainability Initiative",
      description:
        "Implemented eco-friendly practices and sustainable sourcing to reduce environmental impact.",
    },
    {
      year: "2024",
      title: "Innovation Hub",
      description:
        "Opened our innovation center focused on developing next-generation export solutions.",
    },
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      avatar: "/images/fallback.webp",
      description: "Visionary leader with 20+ years in international trade.",
    },
    {
      name: "Michael Chen",
      role: "Head of Operations",
      avatar: "/images/fallback.webp",
      description:
        "Expert in supply chain management and logistics optimization.",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Sales",
      avatar: "/images/fallback.webp",
      description: "Passionate about building lasting customer relationships.",
    },
    {
      name: "David Kim",
      role: "Head of Technology",
      avatar: "/images/fallback.webp",
      description: "Leading digital innovation and platform development.",
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
            About Blue Ocean Export
          </Title>
          <Paragraph style={{ fontSize: 18, color: "rgba(255,255,255,0.9)" }}>
            Connecting global markets through quality products, exceptional
            service, and innovative solutions. We are your trusted partner in
            international trade.
          </Paragraph>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ padding: "60px 24px", backgroundColor: "#f5f5f5" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Row gutter={[32, 32]}>
            {stats.map((stat, index) => (
              <Col key={index} xs={24} sm={12} lg={6}>
                <Card style={{ textAlign: "center", height: "100%" }}>
                  <Space direction="vertical" size="middle">
                    <div style={{ fontSize: 32, color: "#1890ff" }}>
                      {stat.icon}
                    </div>
                    <Statistic
                      title={stat.title}
                      value={stat.value}
                      suffix={stat.suffix}
                      valueStyle={{ color: "#1890ff", fontSize: 28 }}
                    />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Mission & Vision */}
      <div style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <Space direction="vertical" size="large">
                <div>
                  <Title level={2}>Our Mission</Title>
                  <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
                    To bridge global markets by providing high-quality products
                    and exceptional export services that exceed customer
                    expectations. We strive to build lasting partnerships based
                    on trust, reliability, and mutual success.
                  </Paragraph>
                </div>

                <div>
                  <Title level={2}>Our Vision</Title>
                  <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
                    To be the world&apos;s most trusted export partner, known
                    for innovation, sustainability, and excellence in connecting
                    businesses across continents. We envision a future where
                    global trade is seamless, sustainable, and beneficial for
                    all.
                  </Paragraph>
                </div>
              </Space>
            </Col>

            <Col xs={24} lg={12}>
              <div
                style={{
                  height: 400,
                  background: "linear-gradient(45deg, #f0f2f5, #d9d9d9)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <GlobalOutlined style={{ fontSize: 120, color: "#1890ff" }} />
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Company Timeline */}
      <div style={{ padding: "80px 24px", backgroundColor: "#f5f5f5" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: 48 }}>
            Our Journey
          </Title>

          <Timeline mode="alternate">
            {timeline.map((item, index) => (
              <Timeline.Item
                key={index}
                dot={
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "#1890ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {item.year.slice(-2)}
                  </div>
                }
              >
                <Card style={{ maxWidth: 400 }}>
                  <Space direction="vertical">
                    <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
                      {item.year}
                    </Text>
                    <Title level={4} style={{ margin: 0 }}>
                      {item.title}
                    </Title>
                    <Paragraph style={{ margin: 0 }}>
                      {item.description}
                    </Paragraph>
                  </Space>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
      </div>

      {/* Team Section */}
      <div style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: 48 }}>
            Meet Our Team
          </Title>

          <Row gutter={[32, 32]}>
            {team.map((member, index) => (
              <Col key={index} xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  style={{ textAlign: "center", height: "100%" }}
                  cover={
                    <div style={{ padding: 24 }}>
                      <Avatar
                        size={120}
                        src={member.avatar}
                        style={{ backgroundColor: "#1890ff" }}
                      >
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </Avatar>
                    </div>
                  }
                >
                  <Card.Meta
                    title={member.name}
                    description={
                      <Space direction="vertical" size="small">
                        <Text strong style={{ color: "#1890ff" }}>
                          {member.role}
                        </Text>
                        <Text type="secondary">{member.description}</Text>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Values Section */}
      <div style={{ padding: "80px 24px", backgroundColor: "#f5f5f5" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: 48 }}>
            Our Values
          </Title>

          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <Card style={{ textAlign: "center", height: "100%" }}>
                <Space direction="vertical" size="large">
                  <TrophyOutlined style={{ fontSize: 48, color: "#1890ff" }} />
                  <Title level={3}>Excellence</Title>
                  <Paragraph>
                    We strive for excellence in everything we do, from product
                    quality to customer service, ensuring the highest standards
                    at every step.
                  </Paragraph>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card style={{ textAlign: "center", height: "100%" }}>
                <Space direction="vertical" size="large">
                  <HeartOutlined style={{ fontSize: 48, color: "#1890ff" }} />
                  <Title level={3}>Integrity</Title>
                  <Paragraph>
                    Honesty and transparency guide our business practices,
                    building trust with customers, partners, and stakeholders
                    worldwide.
                  </Paragraph>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card style={{ textAlign: "center", height: "100%" }}>
                <Space direction="vertical" size="large">
                  <EnvironmentOutlined
                    style={{ fontSize: 48, color: "#1890ff" }}
                  />
                  <Title level={3}>Sustainability</Title>
                  <Paragraph>
                    We are committed to sustainable practices that protect our
                    planet while supporting economic growth and social
                    responsibility.
                  </Paragraph>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
          color: "white",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Title level={2} style={{ color: "white", marginBottom: 24 }}>
            Ready to Work With Us?
          </Title>
          <Paragraph
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.9)",
              marginBottom: 32,
            }}
          >
            Join thousands of satisfied customers who trust Blue Ocean Export
            for their international trade needs.
          </Paragraph>

          <Space size="large">
            <Button
              type="primary"
              size="large"
              ghost
              icon={<PhoneOutlined />}
              onClick={() => router.push("/contact")}
            >
              Contact Us
            </Button>
            <Button
              size="large"
              style={{ backgroundColor: "white", color: "#1890ff" }}
              onClick={() => router.push("/products")}
            >
              View Products
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
