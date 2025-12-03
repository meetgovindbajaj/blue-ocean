"use client";
import Anchor from "../shared/Anchor";
import ProductCard from "./ProductCard";
import styles from "./FeaturedProducts.module.css";
import { useEffect, useId, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { CardContent } from "../ui/card";
import Autoplay from "embla-carousel-autoplay";
import type { Product } from "@/context/LandingDataContext";

interface FeaturedProductsProps {
  products: Product[];
}

const FeaturedProducts = ({ products }: FeaturedProductsProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const headerId = "featured_products_header_" + useId();
  // Show only active products, limit to 8 for featured section
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 600);
      setIsTablet(window.innerWidth > 600 && window.innerWidth <= 1000);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <div className={styles.page}>
      <div className="header" id={headerId}>
        <div className="titleWrapper">
          <div className="title">Trending Products</div>
          <p className="subtitle">Popular picks loved by our customers</p>
        </div>
        {!!!isMobile && (
          <Anchor
            href="/products?sort=trending"
            className="viewAllLink"
            content="View All"
            rootStyle={{ display: "flex", alignItems: "center", gap: "8px" }}
          />
        )}
      </div>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 2000,
          }),
        ]}
        className="w-full relative"
      >
        <CarouselContent className="">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="xs:basis-1/1 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              style={{ paddingInline: "8px" }}
            >
              {/* <div> */}
              <CardContent className="flex flex-1 items-center justify-center">
                <ProductCard product={product} />
              </CardContent>
              {/* </div> */}
            </CarouselItem>
          ))}
        </CarouselContent>
        {!!!(isTablet || isMobile) && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>
      {/* <div className={styles.body}>
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div> */}
      {!!isMobile && (
        <div style={{ padding: "1rem" }}>
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
