"use client";

import Anchor from "../shared/Anchor";
import { Button } from "../ui/button";
import styles from "./AboutSection.module.css";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const DEFAULT_DESCRIPTION =
  "Discover premium solid wood furniture crafted with exceptional quality, thoughtful design, and reliable worldwide delivery.";

export default function AboutSection() {
  const { settings, loading } = useSiteSettings();

  if (loading) return null;

  const siteName = settings?.siteName || "Blue Ocean";
  const title = settings?.about?.title || `About ${siteName}`;
  const description = settings?.about?.description || DEFAULT_DESCRIPTION;

  return (
    <section className={styles.section} aria-label="About">
      <div className={styles.container}>
        <div
          className="header"
          style={{
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div className="titleWrapper" style={{ alignItems: "center" }}>
            <div className="title">{title}</div>
            <p
              className="subtitle py-4"
              style={{
                textAlign: "justify",
                textAlignLast: "center",
                fontSize: "1.05rem",
                lineHeight: "1.8",
                color: "var(--text-secondary)",
              }}
            >
              {description}
            </p>
          </div>
        </div>
        <div
          style={{
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <Anchor
            tracking={{ enabled: true }}
            href="/about"
            content={<Button variant="outline">Learn more about us</Button>}
          />
        </div>
      </div>
    </section>
  );
}
