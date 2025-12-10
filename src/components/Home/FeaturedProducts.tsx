"use client";

import { useMemo } from "react";
import Anchor from "../shared/Anchor";
import ProductCard from "./ProductCard";
import styles from "./FeaturedProducts.module.css";
import type { Product } from "@/context/LandingDataContext";
import CarouselWrapper, { CarouselItem } from "@/components/ui/CarouselWrapper";

interface FeaturedProductsProps {
  products: Product[];
}

const FeaturedProducts = ({ products }: FeaturedProductsProps) => {
  // Convert products to CarouselItem format
  const carouselData: CarouselItem[] = useMemo(() => {
    return products.map((product) => ({
      id: product.id,
      image:
        product.images?.[0]?.url || product.images?.[0]?.thumbnailUrl || "",
      alt: product.name,
      content: <ProductCard product={product} />,
    }));
  }, [products]);

  return (
    <div className={styles.page}>
      <CarouselWrapper
        variant="default"
        data={carouselData}
        options={{
          showControlBtns: true,
          showControlDots: false,
          autoPlay: true,
          autoPlayInterval: 3000,
          loop: true,
          itemsPerView: {
            mobile: 1,
            tablet: 2,
            desktop: 3,
            xl: 4,
          },
          headerContent: (
            <div className="header">
              <div className="titleWrapper">
                <div className="title">Trending Products</div>
                <p className="subtitle">Popular picks loved by our customers</p>
              </div>
              <Anchor
                href="/products?sort=trending"
                className="viewAllLink desktopOnly"
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
        renderItem={(item) => (
          <div className={styles.productCardWrapper}>{item.content}</div>
        )}
        className={styles.productsCarousel}
      />
      {carouselData.length !== 0 && (
        <div className={styles.mobileViewAll}>
          <Anchor
            href="/products?sort=trending"
            className="viewAllLink"
            content="View All"
            rootStyle={{ display: "flex", alignItems: "center", gap: "8px" }}
          />
        </div>
      )}
    </div>
  );
};

export default FeaturedProducts;
