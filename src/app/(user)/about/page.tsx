"use client";

import styles from "./page.module.css";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Target, Eye, Building2, PencilRuler, Globe2, Headset, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const services = [
  {
    id: "custom-design",
    title: "Custom Design",
    description: "Tailored furniture built exactly to your vision with premium materials and professional AutoCAD support.",
    icon: PencilRuler,
    color: "#3b82f6",
  },
  {
    id: "global-shipping",
    title: "Global Shipping",
    description: "Reliable worldwide delivery with trusted logistics partners and seamless customs handling.",
    icon: Globe2,
    color: "#10b981",
  },
  {
    id: "expert-support",
    title: "Expert Support",
    description: "End-to-end guidance with clear communication and order updates shared at every stage.",
    icon: Headset,
    color: "#8b5cf6",
  },
  {
    id: "quality-control",
    title: "Quality Control",
    description: "Strict inspections ensure world-class craftsmanship with internationally aligned QC processes.",
    icon: ShieldCheck,
    color: "#f59e0b",
  },
];

const AboutPage = () => {
  const { settings, loading } = useSiteSettings();

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-80 mx-auto" />
          </section>
          <section className={styles.section}>
            <Skeleton className="h-24 w-full rounded-lg" />
          </section>
          <section className={styles.missionVision}>
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </section>
        </div>
      </div>
    );
  }

  const about = settings?.about || {};
  const siteName = settings?.siteName || "Our Company";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.title}>{about.title || `About ${siteName}`}</h1>
          {settings?.tagline && (
            <p className={styles.tagline}>{settings.tagline}</p>
          )}
        </section>

        {/* Description */}
        {about.description && (
          <section className={styles.section}>
            <p className={styles.description}>{about.description}</p>
          </section>
        )}

        {/* Mission & Vision */}
        {(about.mission || about.vision) && (
          <section className={styles.missionVision}>
            {about.mission && (
              <div className={styles.card}>
                <div className={styles.cardIcon}>
                  <Target size={32} />
                </div>
                <h2 className={styles.cardTitle}>Our Mission</h2>
                <p className={styles.cardText}>{about.mission}</p>
              </div>
            )}
            {about.vision && (
              <div className={styles.card}>
                <div className={styles.cardIcon}>
                  <Eye size={32} />
                </div>
                <h2 className={styles.cardTitle}>Our Vision</h2>
                <p className={styles.cardText}>{about.vision}</p>
              </div>
            )}
          </section>
        )}

        {/* Services Section */}
        <section className={styles.servicesSection}>
          <h2 className={styles.sectionTitle}>What We Offer</h2>
          <p className={styles.sectionSubtitle}>
            Comprehensive solutions to bring your furniture dreams to life
          </p>
          <div className={styles.servicesGrid}>
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.id} className={styles.serviceCard}>
                  <div
                    className={styles.serviceIcon}
                    style={{ backgroundColor: `${service.color}15`, color: service.color }}
                  >
                    <Icon size={28} />
                  </div>
                  <h3 className={styles.serviceTitle}>{service.title}</h3>
                  <p className={styles.serviceDescription}>{service.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact CTA */}
        <section className={styles.ctaSection}>
          <Building2 size={48} className={styles.ctaIcon} />
          <h2 className={styles.ctaTitle}>Get in Touch</h2>
          <p className={styles.ctaText}>
            Have questions? We&apos;d love to hear from you.
          </p>
          <a href="/contact" className={styles.ctaButton}>
            Contact Us
          </a>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
