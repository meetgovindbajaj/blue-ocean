"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Package,
  Mail,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Note {
  adminId: string;
  note: string;
  timestamp: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: "pending" | "in-progress" | "resolved" | "closed";
  priority?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    image?: string;
  } | null;
  notes?: Note[];
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Pending", icon: AlertCircle, color: "#f59e0b" },
  "in-progress": { label: "In Progress", icon: Clock, color: "#3b82f6" },
  resolved: { label: "Resolved", icon: CheckCircle, color: "#22c55e" },
  closed: { label: "Closed", icon: CheckCircle, color: "#6b7280" },
};

const InquiriesPage = () => {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const response = await fetch("/api/user/inquiries");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login?redirect=/inquiries");
          return;
        }
        throw new Error(data.error || "Failed to load inquiries");
      }

      setInquiries(data.inquiries || []);
    } catch (error) {
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Loader2 className={styles.spinner} size={32} />
          <span>Loading inquiries...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <MessageSquare size={28} />
          <div>
            <h1 className={styles.title}>My Inquiries</h1>
            <p className={styles.subtitle}>Track the status of your inquiries</p>
          </div>
        </div>

        {inquiries.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageSquare size={64} className={styles.emptyIcon} />
            <h2>No Inquiries Yet</h2>
            <p>You haven&apos;t submitted any inquiries.</p>
            <Link href="/contact" className={styles.ctaButton}>
              Contact Us
            </Link>
          </div>
        ) : (
          <div className={styles.inquiriesList}>
            {inquiries.map((inquiry) => {
              const status = statusConfig[inquiry.status] || statusConfig.new;
              const StatusIcon = status.icon;

              return (
                <div key={inquiry.id} className={styles.inquiryCard}>
                  <div className={styles.inquiryHeader}>
                    <div className={styles.statusBadge} style={{ backgroundColor: status.color }}>
                      <StatusIcon size={14} />
                      {status.label}
                    </div>
                    <span className={styles.date}>{formatDate(inquiry.createdAt)}</span>
                  </div>

                  {inquiry.product && (
                    <Link
                      href={`/products/${inquiry.product.slug}`}
                      className={styles.productLink}
                    >
                      {inquiry.product.image && (
                        <div className={styles.productImage}>
                          <Image
                            src={inquiry.product.image}
                            alt={inquiry.product.name}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      )}
                      <span className={styles.productName}>
                        <Package size={14} />
                        {inquiry.product.name}
                      </span>
                      <ExternalLink size={14} className={styles.externalIcon} />
                    </Link>
                  )}

                  {inquiry.subject && (
                    <h3 className={styles.inquirySubject}>{inquiry.subject}</h3>
                  )}

                  <p className={styles.inquiryMessage}>{inquiry.message}</p>

                  {/* Admin Responses/Notes */}
                  {inquiry.notes && inquiry.notes.length > 0 && (
                    <div className={styles.responsesSection}>
                      <h4 className={styles.responsesTitle}>
                        <MessageCircle size={16} />
                        Responses ({inquiry.notes.length})
                      </h4>
                      <div className={styles.responsesList}>
                        {inquiry.notes.map((note, index) => {
                          const isEmailResponse = note.note.startsWith("[Email Response Sent]");
                          const displayContent = isEmailResponse
                            ? note.note.replace("[Email Response Sent]\n", "")
                            : note.note;

                          return (
                            <div key={index} className={`${styles.responseItem} ${isEmailResponse ? styles.emailResponse : styles.noteResponse}`}>
                              <div className={styles.responseHeader}>
                                {isEmailResponse ? <Mail size={14} /> : <MessageCircle size={14} />}
                                <span>{isEmailResponse ? "Email Response" : "Admin Note"}</span>
                                <span className={styles.responseDate}>
                                  {formatDate(note.timestamp)}
                                </span>
                              </div>
                              <p className={styles.responseContent}>
                                {displayContent}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className={styles.inquiryFooter}>
                    <span className={styles.inquiryMeta}>
                      Submitted as: {inquiry.name} ({inquiry.email})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.helpSection}>
          <p>Need help? <Link href="/contact" className={styles.link}>Submit a new inquiry</Link></p>
        </div>
      </div>
    </div>
  );
};

export default InquiriesPage;
