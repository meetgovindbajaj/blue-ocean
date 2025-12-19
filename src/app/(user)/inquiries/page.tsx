"use client";

import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  Package,
  Send,
  User,
  X,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { InquiriesPageSkeleton } from "@/components/ui/skeletons";
import styles from "./page.module.css";

const ITEMS_PER_PAGE = 5;

interface Note {
  adminId: string;
  note: string;
  timestamp: string;
}

interface UserComment {
  comment: string;
  timestamp: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status:
    | "pending"
    | "in-progress"
    | "customer-feedback"
    | "resolved"
    | "closed";
  priority?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    image?: string;
  } | null;
  notes?: Note[];
  userComments?: UserComment[];
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  pending: { label: "Pending", icon: AlertCircle, color: "#f59e0b" },
  "in-progress": { label: "In Progress", icon: Clock, color: "#3b82f6" },
  "customer-feedback": {
    label: "Awaiting Your Feedback",
    icon: MessageCircle,
    color: "#a855f7",
  },
  resolved: { label: "Resolved", icon: CheckCircle, color: "#22c55e" },
  closed: { label: "Closed", icon: CheckCircle, color: "#6b7280" },
};

const InquiriesPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(
    null
  );
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  // Get page from URL or default to 1
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
  const currentPage =
    Number.isNaN(pageFromUrl) || pageFromUrl < 1 ? 1 : pageFromUrl;

  // Calculate pagination
  const totalPages = Math.ceil(inquiries.length / ITEMS_PER_PAGE);
  const validPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedInquiries = inquiries.slice(startIndex, endIndex);

  // Update URL when page changes
  const setCurrentPage = (page: number) => {
    const url = new URL(window.location.href);
    if (page === 1) {
      url.searchParams.delete("page");
    } else {
      url.searchParams.set("page", page.toString());
    }
    router.push(`${url.pathname}${url.search}` as Route, { scroll: false });
  };

  const fetchInquiries = useCallback(async () => {
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
    } catch (_error) {
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedInquiry(null);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmitComment = async (inquiryId: string) => {
    const comment = commentText[inquiryId]?.trim();
    if (!comment) {
      toast.error("Please enter a comment");
      return;
    }

    setSubmittingComment(inquiryId);
    try {
      const response = await fetch(`/api/user/inquiries/${inquiryId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit comment");
      }

      toast.success("Comment submitted successfully");
      setCommentText((prev) => ({ ...prev, [inquiryId]: "" }));
      // Refresh inquiries to get updated status
      fetchInquiries();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit comment");
    } finally {
      setSubmittingComment(null);
    }
  };

  if (loading) {
    return <InquiriesPageSkeleton />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <MessageSquare size={28} />
          <div>
            <h1 className={styles.title}>My Inquiries</h1>
            <p className={styles.subtitle}>
              Track the status of your inquiries
            </p>
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
          <>
            {/* Results summary */}
            <div className={styles.resultsSummary}>
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, inquiries.length)}{" "}
                of {inquiries.length}{" "}
                {inquiries.length === 1 ? "inquiry" : "inquiries"}
                {totalPages > 1 && ` (Page ${validPage} of ${totalPages})`}
              </span>
            </div>

            <div className={styles.inquiriesList}>
              {paginatedInquiries.map((inquiry) => {
                const status =
                  statusConfig[inquiry.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const conversationCount =
                  (inquiry.userComments?.length || 0) +
                  (inquiry.notes?.length || 0);

                return (
                  <div key={inquiry.id} className={styles.inquiryCard}>
                    <div className={styles.inquiryHeader}>
                      <div
                        className={styles.statusBadge}
                        style={{ backgroundColor: status.color }}
                      >
                        <StatusIcon size={14} />
                        {status.label}
                      </div>
                      <span className={styles.date}>
                        {formatDate(inquiry.createdAt)}
                      </span>
                    </div>

                    {inquiry.product && (
                      <div className={styles.productInfo}>
                        {inquiry.product.image && (
                          <div className={styles.productImageSmall}>
                            <Image
                              src={inquiry.product.image}
                              alt={inquiry.product.name}
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        )}
                        <span className={styles.productNameSmall}>
                          <Package size={12} />
                          {inquiry.product.name}
                        </span>
                      </div>
                    )}

                    {inquiry.subject && (
                      <h3 className={styles.inquirySubject}>
                        {inquiry.subject}
                      </h3>
                    )}

                    <p className={styles.inquiryMessagePreview}>
                      {inquiry.message.length > 120
                        ? `${inquiry.message.substring(0, 120)}...`
                        : inquiry.message}
                    </p>

                    <div className={styles.inquiryCardFooter}>
                      <div className={styles.inquiryStats}>
                        {conversationCount > 0 && (
                          <span className={styles.statBadge}>
                            <MessageCircle size={12} />
                            {conversationCount}{" "}
                            {conversationCount === 1 ? "message" : "messages"}
                          </span>
                        )}
                        {inquiry.status === "customer-feedback" && (
                          <span className={styles.feedbackBadge}>
                            <AlertCircle size={12} />
                            Needs Response
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.viewDetailsButton}
                        onClick={() => setSelectedInquiry(inquiry)}
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage(Math.max(1, validPage - 1))}
                  disabled={validPage === 1}
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>
                <div className={styles.paginationPages}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        className={`${styles.paginationPage} ${
                          validPage === page ? styles.paginationPageActive : ""
                        }`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
                <button
                  type="button"
                  className={styles.paginationButton}
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, validPage + 1))
                  }
                  disabled={validPage === totalPages}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}

        <div className={styles.helpSection}>
          <p>
            Need help?{" "}
            <Link href="/contact" className={styles.link}>
              Submit a new inquiry
            </Link>
          </p>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInquiry && (
        <div className={styles.modalOverlay}>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => setSelectedInquiry(null)}
            style={{
              position: "absolute",
              inset: 0,
              background: "transparent",
              border: "none",
              padding: 0,
            }}
          />
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            style={{ position: "relative", zIndex: 1 }}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Inquiry Details</h2>
                <p className={styles.modalSubtitle}>
                  Submitted on {formatDate(selectedInquiry.createdAt)}
                </p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setSelectedInquiry(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalContent}>
              {/* Status Badge */}
              <div className={styles.modalStatusRow}>
                {(() => {
                  const status =
                    statusConfig[selectedInquiry.status] ||
                    statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <div
                      className={styles.statusBadge}
                      style={{ backgroundColor: status.color }}
                    >
                      <StatusIcon size={14} />
                      {status.label}
                    </div>
                  );
                })()}
              </div>

              {/* Product Link */}
              {selectedInquiry.product && (
                <Link
                  href={`/products/${selectedInquiry.product.slug}`}
                  className={styles.productLink}
                  onClick={() => setSelectedInquiry(null)}
                >
                  {selectedInquiry.product.image && (
                    <div className={styles.productImage}>
                      <Image
                        src={selectedInquiry.product.image}
                        alt={selectedInquiry.product.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <span className={styles.productName}>
                    <Package size={14} />
                    {selectedInquiry.product.name}
                  </span>
                  <ExternalLink size={14} className={styles.externalIcon} />
                </Link>
              )}

              {/* Subject */}
              {selectedInquiry.subject && (
                <h3 className={styles.modalSubject}>
                  {selectedInquiry.subject}
                </h3>
              )}

              {/* Original Message */}
              <div className={styles.originalMessage}>
                <p className={styles.sectionLabel}>Your Message</p>
                <p className={styles.messageText}>{selectedInquiry.message}</p>
              </div>

              {/* Feedback Form for customer-feedback status */}
              {selectedInquiry.status === "customer-feedback" && (
                <div className={styles.feedbackSection}>
                  <h4 className={styles.feedbackTitle}>
                    <MessageCircle size={16} />
                    Your Feedback is Needed
                  </h4>
                  <p className={styles.feedbackDescription}>
                    Please provide additional information to help us resolve
                    your inquiry.
                  </p>
                  <div className={styles.commentForm}>
                    <textarea
                      className={styles.commentTextarea}
                      placeholder="Type your response here..."
                      value={commentText[selectedInquiry.id] || ""}
                      onChange={(e) =>
                        setCommentText((prev) => ({
                          ...prev,
                          [selectedInquiry.id]: e.target.value,
                        }))
                      }
                      rows={4}
                      maxLength={1000}
                    />
                    <div className={styles.commentFormFooter}>
                      <span className={styles.charCount}>
                        {(commentText[selectedInquiry.id] || "").length}/1000
                      </span>
                      <button
                        type="button"
                        className={styles.submitButton}
                        onClick={() => {
                          handleSubmitComment(selectedInquiry.id);
                        }}
                        disabled={
                          submittingComment === selectedInquiry.id ||
                          !commentText[selectedInquiry.id]?.trim()
                        }
                      >
                        {submittingComment === selectedInquiry.id ? (
                          <>
                            <Loader2 size={14} className={styles.spinner} />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Submit Feedback
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Conversation Timeline */}
              {(() => {
                type TimelineItem = {
                  type: "user" | "admin" | "email";
                  content: string;
                  timestamp: string;
                };
                const timelineItems: TimelineItem[] = [];

                selectedInquiry.userComments?.forEach((comment) => {
                  timelineItems.push({
                    type: "user",
                    content: comment.comment,
                    timestamp: comment.timestamp,
                  });
                });

                selectedInquiry.notes?.forEach((note) => {
                  const isEmailResponse = note.note.startsWith(
                    "[Email Response Sent]"
                  );
                  timelineItems.push({
                    type: isEmailResponse ? "email" : "admin",
                    content: isEmailResponse
                      ? note.note.replace("[Email Response Sent]\n", "")
                      : note.note,
                    timestamp: note.timestamp,
                  });
                });

                timelineItems.sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
                );

                if (timelineItems.length === 0) return null;

                return (
                  <div className={styles.timelineSection}>
                    <h4 className={styles.timelineTitle}>
                      <MessageCircle size={16} />
                      Conversation ({timelineItems.length})
                    </h4>
                    <div className={styles.timeline}>
                      {timelineItems.map((item) => {
                        const isUser = item.type === "user";
                        const isEmail = item.type === "email";

                        return (
                          <div
                            key={`${item.type}:${item.timestamp}:${item.content}`}
                            className={`${styles.timelineItem} ${
                              isUser
                                ? styles.timelineItemUser
                                : isEmail
                                ? styles.timelineItemEmail
                                : styles.timelineItemAdmin
                            }`}
                          >
                            <div className={styles.timelineItemHeader}>
                              {isUser ? (
                                <>
                                  <User size={12} />
                                  <span>You</span>
                                </>
                              ) : isEmail ? (
                                <>
                                  <Mail size={12} />
                                  <span>Support Team</span>
                                </>
                              ) : (
                                <>
                                  <MessageCircle size={12} />
                                  <span>Support</span>
                                </>
                              )}
                              <span className={styles.timelineItemDate}>
                                {formatDate(item.timestamp)}
                              </span>
                            </div>
                            <p className={styles.timelineItemContent}>
                              {item.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Footer Info */}
              <div className={styles.modalFooterInfo}>
                <span>
                  Submitted as: {selectedInquiry.name} ({selectedInquiry.email})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InquiriesPage = () => {
  return (
    <Suspense fallback={<InquiriesPageSkeleton />}>
      <InquiriesPageContent />
    </Suspense>
  );
};

export default InquiriesPage;
