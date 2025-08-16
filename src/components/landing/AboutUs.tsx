"use client";

import { motion } from "framer-motion";
import { Card, Row, Col } from "antd";
import {
  CrownOutlined,
  SafetyOutlined,
  GlobalOutlined,
  HeartOutlined,
} from "@ant-design/icons";

const features = [
  {
    icon: <CrownOutlined />,
    title: "Premium Quality",
    description:
      "Only the finest solid wood materials, carefully selected for durability and beauty.",
  },
  {
    icon: <SafetyOutlined />,
    title: "Expert Craftsmanship",
    description:
      "25+ years of traditional woodworking expertise combined with modern techniques.",
  },
  {
    icon: <GlobalOutlined />,
    title: "Global Reach",
    description:
      "Serving customers worldwide with reliable shipping and exceptional service.",
  },
  {
    icon: <HeartOutlined />,
    title: "Made with Love",
    description:
      "Every piece is crafted with passion and attention to detail that lasts generations.",
  },
];

export default function AboutUs() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section className="about-us">
      <div className="container">
        <motion.div
          className="about-us__content"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="about-us__header" variants={itemVariants}>
            <h2 className="about-us__title">About Blue Ocean Export</h2>
            <p className="about-us__subtitle">Crafting Excellence Since 1998</p>
          </motion.div>

          <Row gutter={[32, 32]} className="about-us__grid">
            <Col xs={24} lg={12}>
              <motion.div className="about-us__story" variants={itemVariants}>
                <h3 className="about-us__story-title">Our Story</h3>
                <p className="about-us__story-text">
                  Blue Ocean Export was founded with a simple vision: to create
                  furniture that combines traditional craftsmanship with modern
                  design sensibilities. For over two decades, we have been
                  dedicated to sourcing the finest solid wood materials and
                  transforming them into pieces that tell a story.
                </p>
                <p className="about-us__story-text">
                  Our skilled artisans bring generations of woodworking
                  expertise to every piece, ensuring that each item not only
                  meets our high standards but exceeds your expectations. We
                  believe that furniture should be more than functional – it
                  should be a reflection of your style and a testament to
                  quality that lasts.
                </p>
              </motion.div>
            </Col>

            <Col xs={24} lg={12}>
              <motion.div
                className="about-us__features"
                variants={itemVariants}
              >
                <Row gutter={[16, 24]}>
                  {features.map((feature, index) => (
                    <Col xs={24} sm={12} key={index}>
                      <Card className="feature-card" bordered={false}>
                        <div className="feature-card__icon">{feature.icon}</div>
                        <h4 className="feature-card__title">{feature.title}</h4>
                        <p className="feature-card__description">
                          {feature.description}
                        </p>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </motion.div>
            </Col>
          </Row>

          <motion.div className="about-us__stats" variants={itemVariants}>
            <Row gutter={[32, 16]} justify="center">
              <Col xs={12} sm={6}>
                <div className="stat-item">
                  <span className="stat-item__number">25+</span>
                  <span className="stat-item__label">Years Experience</span>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="stat-item">
                  <span className="stat-item__number">1000+</span>
                  <span className="stat-item__label">Happy Customers</span>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="stat-item">
                  <span className="stat-item__number">50+</span>
                  <span className="stat-item__label">Countries Served</span>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="stat-item">
                  <span className="stat-item__number">100%</span>
                  <span className="stat-item__label">Solid Wood</span>
                </div>
              </Col>
            </Row>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
