"use client";

import { useState, useCallback, useRef } from "react";
import { CldImage } from "next-cloudinary";
import styles from "./page.module.css";

interface UploadedImage {
  id: string;
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
}

export default function UploadPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      uploadFiles(imageFiles);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      uploadFiles(files);
    }
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"
        );
        formData.append("folder", "furniture");

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();

        // Update progress
        setUploadProgress(((index + 1) / files.length) * 100);

        return {
          id: data.asset_id,
          url: data.secure_url,
          publicId: data.public_id,
          format: data.format,
          width: data.width,
          height: data.height,
          bytes: data.bytes,
          createdAt: data.created_at,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages((prev) => [...uploadedImages, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const deleteImage = async (publicId: string, imageId: string) => {
    try {
      const response = await fetch("/api/upload/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete image");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className={styles.uploadContainer}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Image Upload</h1>
          <p className={styles.subtitle}>
            Upload furniture images to Cloudinary
          </p>
        </div>

        <div className={styles.uploadArea}>
          {!uploading ? (
            <>
              <div
                className={`${styles.dropzone} ${
                  dragActive ? styles.dragActive : ""
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.uploadIcon}>
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className={styles.dropzoneText}>Drag and drop images here</p>
                <p className={styles.dropzoneSubtext}>
                  or click to browse from your computer
                </p>
                <button className={styles.browseButton} type="button">
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  className={styles.fileInput}
                />
              </div>
              {error && <div className={styles.errorMessage}>{error}</div>}
            </>
          ) : (
            <div className={styles.uploadingState}>
              <div className={styles.spinner} />
              <p className={styles.uploadingText}>Uploading images...</p>
              <p className={styles.uploadingSubtext}>
                Please wait while we upload your files
              </p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {images.length > 0 ? (
          <div className={styles.gallery}>
            {images.map((image) => (
              <div key={image.id} className={styles.imageCard}>
                <div className={styles.imageWrapper}>
                  <CldImage
                    src={image.publicId}
                    alt="Uploaded image"
                    fill
                    className={styles.image}
                    sizes="250px"
                    crop="fill"
                  />
                </div>
                <button
                  className={styles.deleteButton}
                  onClick={() => deleteImage(image.publicId, image.id)}
                  aria-label="Delete image"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className={styles.imageInfo}>
                  <p className={styles.imageName}>
                    {image.publicId.split("/").pop()}.{image.format}
                  </p>
                  <p className={styles.imageSize}>
                    {image.width} × {image.height} • {formatBytes(image.bytes)}
                  </p>
                  <button
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(image.url)}
                  >
                    Copy URL
                  </button>
                  <button
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(image.publicId)}
                  >
                    Copy Public ID
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !uploading && (
            <div className={styles.emptyState}>
              <p>
                No images uploaded yet. Start by uploading your first image!
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
