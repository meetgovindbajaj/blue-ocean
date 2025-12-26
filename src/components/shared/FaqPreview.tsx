"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import styles from "./FaqPreview.module.css";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";

interface FAQItem {
  question: string;
  answer: string;
  order?: number;
  isActive?: boolean;
}

export default function FaqPreview({
  title,
  subtitle,
  limit = 5,
  variant = "section",
}: {
  title: string;
  subtitle?: string;
  limit?: number;
  variant?: "section" | "inline";
}) {
  const { settings, loading } = useSiteSettings();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const faqs = useMemo(() => {
    const all: FAQItem[] = (settings?.faq || []) as FAQItem[];
    return all
      .filter((faq) => faq.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .slice(0, limit);
  }, [settings?.faq, limit]);

  if (loading) return null;
  if (faqs.length === 0) return null;

  return (
    <section
      className={`${styles.section} ${
        variant === "inline" ? styles.inline : ""
      }`}
      aria-label={title}
    >
      <div
        className={`${styles.container} ${
          variant === "inline" ? styles.inlineContainer : ""
        }`}
      >
        <div className={styles.headerRow}>
          <div className="header" style={{ paddingBlock: 0 }}>
            <div className="titleWrapper">
              <div className={styles.titleRow}>
                <HelpCircle size={18} className={styles.titleIcon} />
                <div className="title">{title}</div>
              </div>
              {subtitle ? <p className="subtitle">{subtitle}</p> : null}
            </div>
            <Link href="/faq" className="viewAllLink desktopOnly">
              View All
            </Link>
          </div>
          {!!!isMobile && (
            <Link href="/faq" className={styles.mobileLink}>
              View All
            </Link>
          )}
        </div>

        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <div
              key={`${faq.question}-${index}`}
              className={`${styles.faqItem} ${
                openIndex === index ? styles.open : ""
              }`}
            >
              <button
                className={styles.faqQuestion}
                onClick={() =>
                  setOpenIndex((prev) => (prev === index ? null : index))
                }
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={18}
                  className={`${styles.chevron} ${
                    openIndex === index ? styles.rotated : ""
                  }`}
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
        {!!isMobile && (
          <div
            style={{
              textAlign: "center",
              marginBlock: "2rem",
            }}
          >
            <Button variant="secondary" asChild>
              <Link href="/faq" className={styles.mobileLink}>
                View All FAQs
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
