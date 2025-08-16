"use client";

import { motion } from "framer-motion";
import { Card, Row, Col, Button } from "antd";
import {
  ToolOutlined,
  TruckOutlined,
  CustomerServiceOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

const services = [
  {
    icon: <ToolOutlined />,
    title: "Custom Design",
    description:
      "Bespoke furniture designed to your exact specifications and space requirements.",
    features: [
      "3D Design Consultation",
      "Material Selection",
      "Size Customization",
      "Style Matching",
    ],
  },
  {
    icon: <TruckOutlined />,
    title: "Global Shipping",
    description:
      "Secure worldwide delivery with professional packaging and tracking.",
    features: [
      "Insured Shipping",
      "White Glove Delivery",
      "Assembly Service",
      "Damage Protection",
    ],
  },
  {
    icon: <CustomerServiceOutlined />,
    title: "Expert Support",
    description:
      "Dedicated customer service team to assist you throughout your journey.",
    features: [
      "24/7 Support",
      "Product Guidance",
      "Care Instructions",
      "Warranty Service",
    ],
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: "Quality Guarantee",
    description:
      "Comprehensive warranty and quality assurance on all our products.",
    features: [
      "5-Year Warranty",
      "Quality Inspection",
      "Return Policy",
      "Satisfaction Guarantee",
    ],
  },
];

export default function Services() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
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
    <section className="services">
      <div className="container">
        <motion.div
          className="services__header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="services__title">Our Services</h2>
          <p className="services__subtitle">
            Comprehensive solutions for all your furniture needs
          </p>
        </motion.div>

        <motion.div
          className="services__grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Row gutter={[24, 24]}>
            {services.map((service, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <motion.div variants={cardVariants}>
                  <Card className="service-card" hoverable bordered={false}>
                    <div className="service-card__icon">{service.icon}</div>
                    <h3 className="service-card__title">{service.title}</h3>
                    <p className="service-card__description">
                      {service.description}
                    </p>
                    <ul className="service-card__features">
                      {service.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="service-card__feature"
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="link"
                      className="service-card__link"
                      icon={<ArrowRightOutlined />}
                      iconPosition="end"
                    >
                      Learn More
                    </Button>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>

        <motion.div
          className="services__cta"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="services__cta-content">
            <h3 className="services__cta-title">
              Ready to Start Your Project?
            </h3>
            <p className="services__cta-description">
              Get in touch with our experts to discuss your furniture needs
            </p>
            <div className="services__cta-actions">
              <Button
                type="primary"
                size="large"
                icon={<CustomerServiceOutlined />}
              >
                Contact Us
              </Button>
              <Button type="default" size="large">
                Request Quote
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
