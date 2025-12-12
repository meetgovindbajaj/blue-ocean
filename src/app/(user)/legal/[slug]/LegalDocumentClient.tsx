"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import parse from "html-react-parser";
import styles from "./page.module.css";
import {
  ArrowLeft,
  FileText,
  Shield,
  FileCheck,
  RefreshCcw,
  Scale,
  Award,
  ScrollText,
  Download,
  ZoomIn,
  ZoomOut,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface LegalDocument {
  type: string;
  title: string;
  slug: string;
  format: "rich-text" | "pdf" | "image";
  content?: string;
  file?: {
    url: string;
    name: string;
    size?: number;
    mimeType?: string;
  };
  images?: {
    url: string;
    name: string;
    order: number;
  }[];
  updatedAt: string;
}

interface Props {
  document: LegalDocument;
}

const getIconForType = (type: string) => {
  switch (type) {
    case "terms-and-conditions":
      return <FileText size={32} />;
    case "privacy-policy":
      return <Shield size={32} />;
    case "terms-of-service":
      return <ScrollText size={32} />;
    case "refund-policy":
      return <RefreshCcw size={32} />;
    case "warranty":
      return <FileCheck size={32} />;
    case "trade-contracts":
      return <Scale size={32} />;
    case "certificates":
      return <Award size={32} />;
    default:
      return <FileText size={32} />;
  }
};

const LegalDocumentClient = ({ document }: Props) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Parse rich text content safely
  const parsedContent = useMemo(() => {
    if (!document?.content || document.format !== "rich-text") return null;
    try {
      return parse(document.content);
    } catch (error) {
      console.error("Failed to parse content:", error);
      return null;
    }
  }, [document?.content, document?.format]);

  // Early return if no document
  if (!document) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p>Document not found.</p>
        </div>
      </div>
    );
  }

  const handleImageClick = useCallback((imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
    setZoomLevel(1);
  }, []);

  const closeImageModal = useCallback(() => {
    setSelectedImage(null);
    setZoomLevel(1);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  // Memoize sorted images to avoid re-sorting on every render
  const sortedImages = useMemo(() => {
    if (!document?.images || !Array.isArray(document.images) || document.images.length === 0) {
      return [];
    }
    return [...document.images]
      .filter((img) => img?.url)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [document?.images]);

  const handlePrevImage = useCallback(() => {
    if (sortedImages.length > 0) {
      const newIndex = currentImageIndex === 0 ? sortedImages.length - 1 : currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      setSelectedImage(sortedImages[newIndex]?.url || null);
      setZoomLevel(1);
    }
  }, [currentImageIndex, sortedImages]);

  const handleNextImage = useCallback(() => {
    if (sortedImages.length > 0) {
      const newIndex = currentImageIndex === sortedImages.length - 1 ? 0 : currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      setSelectedImage(sortedImages[newIndex]?.url || null);
      setZoomLevel(1);
    }
  }, [currentImageIndex, sortedImages]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Back Button */}
        <Link href="/legal" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Back to Legal Documents</span>
        </Link>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerIcon}>{getIconForType(document?.type || "")}</div>
          <h1 className={styles.title}>{document?.title || "Legal Document"}</h1>
          {document?.updatedAt && (
            <p className={styles.updatedAt}>
              Last updated:{" "}
              {new Date(document.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </header>

        {/* Content */}
        <div className={styles.content}>
          {/* Rich Text Content */}
          {document.format === "rich-text" && parsedContent && (
            <div className={styles.richTextContent}>
              {parsedContent}
            </div>
          )}

          {/* PDF Content */}
          {document.format === "pdf" && document.file?.url && (
            <div className={styles.pdfSection}>
              <div className={styles.pdfHeader}>
                <span className={styles.pdfFileName}>{document.file.name || "Document.pdf"}</span>
                <a
                  href={document.file.url}
                  className={styles.downloadButton}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={18} />
                  <span>Download PDF</span>
                </a>
              </div>
              <div className={styles.pdfViewer}>
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(document.file.url)}&embedded=true`}
                  title={document.title || "PDF Document"}
                  className={styles.pdfIframe}
                />
              </div>
              <p className={styles.pdfFallback}>
                If the PDF doesn&apos;t load,{" "}
                <a href={document.file.url} target="_blank" rel="noopener noreferrer">
                  click here to view it directly
                </a>
                .
              </p>
            </div>
          )}

          {/* Image Content */}
          {document.format === "image" && sortedImages.length > 0 && (
            <div className={styles.imageSection}>
              <div className={styles.imageGrid}>
                {sortedImages.map((image, index) => (
                  <div
                    key={index}
                    className={styles.imageItem}
                    onClick={() => handleImageClick(image.url, index)}
                  >
                    <Image
                      src={image.url}
                      alt={image.name || `Document image ${index + 1}`}
                      width={600}
                      height={800}
                      className={styles.documentImage}
                    />
                    <div className={styles.imageOverlay}>
                      <ZoomIn size={24} />
                      <span>Click to view</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image Modal for Zoom */}
        {selectedImage && (
          <div className={styles.imageModal} onClick={closeImageModal}>
            {/* Close Button - positioned separately */}
            <button
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                closeImageModal();
              }}
            >
              <X size={24} />
            </button>

            {/* Zoom Controls - centered at top */}
            <div className={styles.modalControls}>
              <div className={styles.zoomControls}>
                <button
                  className={styles.zoomButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut size={20} />
                </button>
                <span className={styles.zoomLevel}>{Math.round(zoomLevel * 100)}%</span>
                <button
                  className={styles.zoomButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn size={20} />
                </button>
              </div>
            </div>

            {sortedImages.length > 1 && (
              <>
                <button
                  className={`${styles.navButton} ${styles.prevButton}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  className={`${styles.navButton} ${styles.nextButton}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            <div
              className={styles.modalImageWrapper}
              onClick={(e) => e.stopPropagation()}
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <Image
                src={selectedImage}
                alt="Full size view"
                width={1200}
                height={1600}
                className={styles.modalImage}
              />
            </div>

            {sortedImages.length > 1 && (
              <div className={styles.imageCounter}>
                {currentImageIndex + 1} / {sortedImages.length}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalDocumentClient;
