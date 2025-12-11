"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Route } from "next";
import styles from "./FeaturedTags.module.css";
import { Skeleton } from "@/components/ui/skeleton";
import { useLandingData } from "@/context/LandingDataContext";

// Limit description to 20 words
function truncateDescription(text: string | undefined, maxWords = 20): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

const FeaturedTags = () => {
  const { data, loading } = useLandingData();
  const tags = data?.tags || [];
  const trackingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Track tag click with debounce
  const trackTagClick = useCallback((tagId: string, tagSlug: string) => {
    // Clear existing timeout for this tag
    const existingTimeout = trackingTimeouts.current.get(tagId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Debounce tracking - wait 300ms before sending
    const timeout = setTimeout(() => {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "tag_click",
          entityType: "tag",
          entityId: tagId,
          entitySlug: tagSlug,
        }),
      }).catch(console.error);
      trackingTimeouts.current.delete(tagId);
    }, 300);

    trackingTimeouts.current.set(tagId, timeout);
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.skeletonItem}>
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Don't render if no tags
  if (tags.length === 0) {
    return null;
  }

  // Duplicate tags for seamless scrolling
  const displayTags = [...tags, ...tags];

  const renderTag = (tag: any, index: number, keyPrefix = "") => {
    const logoUrl = tag.logo?.url || tag.logo?.thumbnailUrl;
    const logoThumbnailUrl = tag.logo?.thumbnailUrl || tag.logo?.url;
    const href = tag.website || `/products?tag=${tag.slug}`;
    const isExternal = tag.website && tag.website.startsWith("http");
    const description = truncateDescription(tag.description);

    return (
      <Link
        key={`${keyPrefix}${tag.id}-${index}`}
        href={href as Route}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={styles.featureItem}
        onClick={() => trackTagClick(tag.id, tag.slug)}
      >
        {logoUrl && (
          <span className={styles.featureLogo}>
            <Image
              src={logoUrl}
              alt={tag.name}
              width={48}
              height={48}
              className={styles.tagImage}
              placeholder="blur"
              blurDataURL={logoThumbnailUrl}
            />
          </span>
        )}
        <span className={styles.featureContent}>
          <span className={styles.featureName}>{tag.name}</span>
          {description && (
            <span className={styles.featureDescription}>{description}</span>
          )}
        </span>
      </Link>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.featuresTrack}>
        <div className={styles.featuresContent}>
          {displayTags.map((tag, index) => renderTag(tag, index))}
        </div>
        <div className={styles.featuresContent} aria-hidden="true">
          {displayTags.map((tag, index) => renderTag(tag, index, "dup-"))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedTags;
