"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FAQItem {
  question: string;
  answer: string;
  order?: number;
  isActive?: boolean;
}

const FAQPage = () => {
  const { settings, loading } = useSiteSettings();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.hero}>
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className={styles.faqList}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const faqs: FAQItem[] = (settings?.faq || [])
    .filter((faq: FAQItem) => faq.isActive !== false)
    .sort((a: FAQItem, b: FAQItem) => (a.order || 0) - (b.order || 0));

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <HelpCircle size={48} className={styles.heroIcon} />
          <h1 className={styles.title}>Frequently Asked Questions</h1>
          <p className={styles.subtitle}>
            Find answers to common questions about our products and services
          </p>
        </section>

        {/* FAQ List */}
        {faqs.length > 0 ? (
          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`${styles.faqItem} ${openIndex === index ? styles.open : ""}`}
              >
                <button
                  className={styles.faqQuestion}
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={openIndex === index}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`${styles.chevron} ${openIndex === index ? styles.rotated : ""}`}
                  />
                </button>
                <div
                  className={styles.faqAnswer}
                  style={{ maxHeight: openIndex === index ? "500px" : "0" }}
                >
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <HelpCircle size={64} className={styles.emptyIcon} />
            <h2>No FAQs Available</h2>
            <p>We&apos;re working on adding frequently asked questions. Please check back later.</p>
          </div>
        )}

        {/* Contact CTA */}
        <section className={styles.ctaSection}>
          <MessageCircle size={40} className={styles.ctaIcon} />
          <h2 className={styles.ctaTitle}>Still have questions?</h2>
          <p className={styles.ctaText}>
            Can&apos;t find the answer you&apos;re looking for? Our team is here to help.
          </p>
          <a href="/contact" className={styles.ctaButton}>
            Contact Support
          </a>
        </section>
      </div>
    </div>
  );
};

export default FAQPage;
