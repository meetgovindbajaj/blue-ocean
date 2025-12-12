"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  FileText,
  Shield,
  FileCheck,
  RefreshCcw,
  Scale,
  Award,
  ScrollText,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LegalDocument {
  _id: string;
  type: string;
  title: string;
  slug: string;
  format: string;
  updatedAt: string;
}

const getIconForType = (type: string) => {
  switch (type) {
    case "terms-and-conditions":
      return <FileText size={24} />;
    case "privacy-policy":
      return <Shield size={24} />;
    case "terms-of-service":
      return <ScrollText size={24} />;
    case "refund-policy":
      return <RefreshCcw size={24} />;
    case "warranty":
      return <FileCheck size={24} />;
    case "trade-contracts":
      return <Scale size={24} />;
    case "certificates":
      return <Award size={24} />;
    default:
      return <FileText size={24} />;
  }
};

const LegalPageClient = () => {
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("/api/legal-documents");
        const data = await response.json();
        if (data.success) {
          setDocuments(data.documents);
        }
      } catch (error) {
        console.error("Failed to fetch legal documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (loading || settingsLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.hero}>
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className={styles.documentsList}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const siteName = settings?.siteName || "Our Company";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <Scale size={48} className={styles.heroIcon} />
          <h1 className={styles.title}>Legal Documents</h1>
          <p className={styles.subtitle}>
            Review our policies and legal documentation
          </p>
        </section>

        {/* Documents List */}
        {documents.length > 0 ? (
          <div className={styles.documentsList}>
            {documents.map((doc) => (
              <Link
                key={doc._id}
                href={`/legal/${doc.slug}`}
                className={styles.documentCard}
              >
                <div className={styles.documentIcon}>
                  {getIconForType(doc.type)}
                </div>
                <div className={styles.documentInfo}>
                  <h2 className={styles.documentTitle}>{doc.title}</h2>
                  <p className={styles.documentMeta}>
                    Last updated:{" "}
                    {new Date(doc.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <ChevronRight size={20} className={styles.documentArrow} />
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FileText size={64} className={styles.emptyIcon} />
            <h2>No Documents Available</h2>
            <p>Legal documents will be available soon.</p>
          </div>
        )}

        {/* Contact Info */}
        <section className={styles.infoSection}>
          <p className={styles.infoText}>
            If you have any questions about our policies, please{" "}
            <Link href="/contact" className={styles.infoLink}>
              contact us
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
};

export default LegalPageClient;
