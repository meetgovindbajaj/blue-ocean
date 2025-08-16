"use client";

import { motion } from "framer-motion";
import { Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import "@/styles/landing.scss";

export default function Hero() {
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
    <section className="hero">
      <div className="hero__background">
        <div className="hero__gradient"></div>
      </div>

      <motion.div
        className="hero__content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 className="hero__title" variants={itemVariants}>
          Premium Solid Wood
          <span className="hero__title-accent"> Furniture</span>
        </motion.h1>

        <motion.p className="hero__subtitle" variants={itemVariants}>
          Crafted with precision, designed for generations. Experience the
          perfect blend of traditional craftsmanship and modern elegance.
        </motion.p>

        <motion.div className="hero__actions" variants={itemVariants}>
          <Button
            type="primary"
            size="large"
            className="hero__cta"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
          >
            Explore Collection
          </Button>
          <Button type="default" size="large" className="hero__secondary">
            Learn More
          </Button>
        </motion.div>

        <motion.div className="hero__stats" variants={itemVariants}>
          <div className="hero__stat">
            <span className="hero__stat-number">25+</span>
            <span className="hero__stat-label">Years Experience</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-number">1000+</span>
            <span className="hero__stat-label">Happy Customers</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-number">100%</span>
            <span className="hero__stat-label">Solid Wood</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
