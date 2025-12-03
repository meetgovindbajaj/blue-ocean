"use client";

import Image from "next/image";
import Link from "next/link";
import { Route } from "next";
import styles from "./FeaturedTags.module.css";
import { Skeleton } from "@/components/ui/skeleton";
import { useLandingData } from "@/context/LandingDataContext";

const FeaturedTags = () => {
  const { data, loading } = useLandingData();
  const tags = data?.tags || [];

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-full" />
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

  return (
    <div className={styles.page}>
      <div className={styles.featuresTrack}>
        <div className={styles.featuresContent}>
          {displayTags.map((tag, index) => {
            const imageUrl = tag.logo?.url || tag.image?.thumbnailUrl || tag.image?.url;
            const href = tag.website || `/products?tag=${tag.slug}`;
            const isExternal = tag.website && tag.website.startsWith("http");

            return (
              <Link
                key={`${tag.id}-${index}`}
                href={href as Route}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className={styles.featureItem}
              >
                {imageUrl && (
                  <span className={styles.featureIcon}>
                    <Image
                      src={imageUrl}
                      alt={tag.name}
                      width={24}
                      height={24}
                      className={styles.tagImage}
                    />
                  </span>
                )}
                <span className={styles.featureText}>{tag.name}</span>
              </Link>
            );
          })}
        </div>
        <div className={styles.featuresContent} aria-hidden="true">
          {displayTags.map((tag, index) => {
            const imageUrl = tag.logo?.url || tag.image?.thumbnailUrl || tag.image?.url;
            const href = tag.website || `/products?tag=${tag.slug}`;
            const isExternal = tag.website && tag.website.startsWith("http");

            return (
              <Link
                key={`duplicate-${tag.id}-${index}`}
                href={href as Route}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className={styles.featureItem}
              >
                {imageUrl && (
                  <span className={styles.featureIcon}>
                    <Image
                      src={imageUrl}
                      alt={tag.name}
                      width={24}
                      height={24}
                      className={styles.tagImage}
                    />
                  </span>
                )}
                <span className={styles.featureText}>{tag.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeaturedTags;
