"use client";

import Link from "next/link";
import styles from "./FeaturedServices.module.css";
import { PencilRuler, Globe2, Headset, ShieldCheck, ArrowRight } from "lucide-react";

const services = [
  {
    id: "custom-design",
    title: "Custom Design",
    description: "Tailored furniture built exactly to your vision with premium materials and professional AutoCAD support.",
    features: [
      "Choose from premium solid woods",
      "Wide leather palette options",
      "Full custom dimensions",
      "Professional AutoCAD designs",
    ],
    icon: <PencilRuler size={28} />,
    color: "#3b82f6",
  },
  {
    id: "global-shipping",
    title: "Global Shipping",
    description: "Reliable worldwide delivery with trusted logistics partners and seamless customs handling.",
    features: [
      "FCL and LCL shipments",
      "Seamless customs handling",
      "Real-time container tracking",
      "Trusted logistics partners",
    ],
    icon: <Globe2 size={28} />,
    color: "#10b981",
  },
  {
    id: "expert-support",
    title: "Expert Support",
    description: "End-to-end guidance with clear communication and order updates shared at every stage.",
    features: [
      "Timely communication",
      "Order updates at every stage",
      "Customer approval process",
      "Quick query assistance",
    ],
    icon: <Headset size={28} />,
    color: "#8b5cf6",
  },
  {
    id: "quality-control",
    title: "Quality Control",
    description: "Strict inspections ensure world-class craftsmanship with internationally aligned QC processes.",
    features: [
      "Strict inspections",
      "Build quality checks",
      "Color and finish verification",
      "Internationally aligned QC",
    ],
    icon: <ShieldCheck size={28} />,
    color: "#f59e0b",
  },
];

const FeaturedServices = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className="header" style={{ justifyContent: "center", textAlign: "center" }}>
          <div className="titleWrapper" style={{ alignItems: "center" }}>
            <span className={styles.badge}>What We Offer</span>
            <div className="title">Our Services</div>
            <p className="subtitle">
              Comprehensive solutions to bring your furniture dreams to life
            </p>
          </div>
        </div>

        <div className={styles.grid}>
          {services.map((service) => (
            <div key={service.id} className={styles.card}>
              <div
                className={styles.iconWrapper}
                style={{ backgroundColor: `${service.color}15`, color: service.color }}
              >
                {service.icon}
              </div>
              <h3 className={styles.cardTitle}>{service.title}</h3>
              <p className={styles.cardDescription}>{service.description}</p>
              <ul className={styles.featureList}>
                {service.features.map((feature, index) => (
                  <li key={index} className={styles.featureItem}>
                    <span className={styles.checkIcon} style={{ color: service.color }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/about" className={styles.learnMore}>
                Learn more <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedServices;
