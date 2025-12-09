"use client";

import { useMemo } from "react";
import Anchor from "../shared/Anchor";
import styles from "./FeaturedCategories.module.css";
import type { Category } from "@/context/LandingDataContext";
import Link from "next/link";
import CarouselWrapper, { CarouselItem } from "@/components/ui/CarouselWrapper";

interface FeaturedCategoriesProps {
  categories: Category[];
}

const FeaturedCategories = ({ categories }: FeaturedCategoriesProps) => {
  // Convert categories to CarouselItem format
  const carouselData: CarouselItem[] = useMemo(() => {
    return categories.map((category) => ({
      id: category.id,
      image: category.image?.url || "",
      alt: category.name,
      content: (
        <Link
          href={`/categories?slug=${category.slug}`}
          className={styles.cardLink}
        >
          <h3 className={styles.cardTitle}>{category.name}</h3>
          <p className={styles.cardSubtitle}>
            {category.productCount || 0} products
          </p>
        </Link>
      ),
    }));
  }, [categories]);

  // Don't render if no categories
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={styles.page}>
      <CarouselWrapper
        variant="inset"
        data={carouselData}
        options={{
          showControlBtns: true,
          showControlDots: true,
          autoPlay: true,
          autoPlayInterval: 5000,
          loop: true,
          headerContent: (
            <div
              className={styles.customHeader + " header"}
              style={{ paddingTop: "24px" }}
            >
              <div className="titleWrapper">
                <div className="title">Shop by Categories</div>
                <p
                  className="subtitle"
                  style={{ color: "var(--background-secondary)" }}
                >
                  Explore our top furniture categories
                </p>
              </div>
              <Anchor
                href="/categories"
                className="viewAllLink"
                content="View All"
                rootStyle={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              />
            </div>
          ),
        }}
        className={styles.categoryCarousel}
      />
    </div>
  );
};

export default FeaturedCategories;
