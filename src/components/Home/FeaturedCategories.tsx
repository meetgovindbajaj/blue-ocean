"use client";
import { AnimatePresence, motion } from "framer-motion";
import Anchor from "../shared/Anchor";
import styles from "./FeaturedCategories.module.css";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Category } from "@/context/LandingDataContext";

interface FeaturedCategoriesProps {
  categories: Category[];
}

const FeaturedCategories = ({ categories }: FeaturedCategoriesProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 600);
      setIsTablet(window.innerWidth > 600 && window.innerWidth <= 1000);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const getCardWidth = () => {
    if (isMobile) return 280;
    if (isTablet) return 480;
    return 800;
  };

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Calculate the scroll position based on card width + gap
      const cardWidth = getCardWidth();
      const gap = isMobile ? 16 : 24; // gap-4 on mobile, gap-6 otherwise
      const scrollPosition = index * (cardWidth + gap);
      container.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  };

  const resetTimer = () => {
    if (autoAdvanceTimerRef.current) {
      clearInterval(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(0);
  };

  const startTimer = () => {
    resetTimer();

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + 100 / 50; // 5 seconds = 5000ms / 100ms intervals = 50 steps
      });
    }, 100);
    progressTimerRef.current = progressInterval;

    // Auto advance every 5 seconds
    const autoAdvanceTimer = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const newIndex = prevIndex < categories.length - 1 ? prevIndex + 1 : 0;
        scrollToIndex(newIndex);
        return newIndex;
      });
      setProgress(0);
    }, 5000);
    autoAdvanceTimerRef.current = autoAdvanceTimer;
  };

  useEffect(() => {
    startTimer();
    return () => {
      resetTimer();
    };
  }, []);

  const handlePrevious = () => {
    const newIndex = activeIndex > 0 ? activeIndex - 1 : categories.length - 1;
    setActiveIndex(newIndex);
    scrollToIndex(newIndex);
    startTimer(); // Restart timer on manual navigation
  };

  const handleNext = () => {
    const newIndex = activeIndex < categories.length - 1 ? activeIndex + 1 : 0;
    setActiveIndex(newIndex);
    scrollToIndex(newIndex);
    startTimer(); // Restart timer on manual navigation
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = getCardWidth();
      const gap = isMobile ? 16 : 24;
      const newIndex = Math.round(scrollLeft / (cardWidth + gap));
      if (
        newIndex !== activeIndex &&
        newIndex >= 0 &&
        newIndex < categories.length
      ) {
        setActiveIndex(newIndex);
        startTimer(); // Restart timer on scroll
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex, isMobile, isTablet, categories.length]);

  // Don't render if no categories
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.customHeader + " header"}>
        <div className="titleWrapper">
          <div className="title">Shop by Categories</div>
          <p
            className="subtitle"
            style={{ color: "var(--background-secondary)" }}
          >
            Explore our top furniture categories
          </p>
        </div>
        {!!!isMobile && (
          <Anchor
            href="/categories"
            className="viewAllLink"
            content="View All"
            rootStyle={{ display: "flex", alignItems: "center", gap: "8px" }}
          />
        )}
      </div>
      {categories.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={categories[activeIndex]?.id || activeIndex}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.6 }}
            transition={{ duration: 0.3 }}
            style={{ position: "absolute", inset: 0, zIndex: 0 }}
          >
            <div
              style={{
                backgroundImage: categories[activeIndex]?.image?.url
                  ? `url(${categories[activeIndex].image.url})`
                  : "none",
                backgroundColor: categories[activeIndex]?.image?.url ? "transparent" : "#374151",
                filter: "blur(40px)",
                transform: "scale(1.1)",
                position: "absolute",
                inset: 0,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, .6)",
              }}
            />
          </motion.div>
        </AnimatePresence>
      )}
      <div className={styles.body}>
        {/* Carousel */}
        <div className={styles.carouselWrapper}>
          {/* Previous Button - Hidden on mobile */}
          {!isMobile && (
            <button
              onClick={handlePrevious}
              className={`${styles.navButton} ${styles.prevButton}`}
            >
              <ChevronLeft className={styles.iconSize} color="black" />
            </button>
          )}

          {/* Scroll Container */}
          <div ref={scrollContainerRef} className={styles.scrollContainer}>
            <div
              className={styles.cardsContainer}
              style={{
                gap: isMobile ? "16px" : "24px",
                paddingLeft: isMobile
                  ? `calc(50vw - 140px)`
                  : isTablet
                  ? `calc(50vw - 200px)`
                  : `calc(50vw - 320px)`,
                paddingRight: isMobile
                  ? `calc(50vw - 140px)`
                  : isTablet
                  ? `calc(50vw - 200px)`
                  : `calc(50vw - 320px)`,
              }}
            >
              {categories.map((category, index) => (
                <div key={category.id} className={styles.cardWrapper}>
                  <motion.div
                    initial={false}
                    animate={{
                      scale: index === activeIndex ? 1 : 0.85,
                      opacity: index === activeIndex ? 1 : 0.6,
                    }}
                    transition={{ duration: 0.3 }}
                    className={styles.card}
                    style={{
                      width: `${getCardWidth()}px`,
                      aspectRatio: isMobile ? "4/6" : isTablet ? "5/4" : "6/3",
                    }}
                  >
                    {category.image?.url ? (
                      <img
                        src={category.image.url}
                        alt={category.name}
                        className={styles.cardImage}
                      />
                    ) : (
                      <div className={styles.cardImage} style={{ backgroundColor: "#374151" }} />
                    )}
                    <div className={styles.cardGradient} />
                    <div
                      className={styles.cardContent}
                      style={{
                        padding: isMobile ? "0.75rem" : "1rem",
                      }}
                    >
                      <h3 className={styles.cardTitle}>{category.name}</h3>
                      <p className={styles.cardSubtitle}>{category.productCount || 0} products</p>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Button - Hidden on mobile */}
          {!isMobile && (
            <button
              onClick={handleNext}
              className={`${styles.navButton} ${styles.nextButton}`}
            >
              <ChevronRight className={styles.iconSize} color="black" />
            </button>
          )}
        </div>

        {/* Indicators */}
        <div className={styles.indicators}>
          {categories.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveIndex(index);
                scrollToIndex(index);
                startTimer(); // Restart timer on manual navigation
              }}
              className={`${styles.indicator} ${
                index === activeIndex
                  ? styles.indicatorActive
                  : styles.indicatorInactive
              }`}
            >
              {index === activeIndex && (
                <div
                  className={styles.indicatorProgress}
                  style={{
                    width: `${progress}%`,
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedCategories;
