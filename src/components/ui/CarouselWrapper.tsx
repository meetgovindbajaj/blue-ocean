"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Share2,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./CarouselWrapper.module.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Types
export type CarouselVariant = "fullWidth" | "inset" | "default";

export interface CarouselItem {
  id: string;
  image: string;
  thumbnailImage?: string;
  alt?: string;
  content?: ReactNode;
}

export interface CarouselOptions {
  showControlBtns?: boolean;
  showControlDots?: boolean;
  showDotsProgress?: boolean;
  showPreviewCards?: boolean;
  showPreviewBtn?: boolean;
  showShareBtn?: boolean;
  showOverlay?: boolean;
  headerContent?: ReactNode;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  pauseOnInteraction?: boolean;
  loop?: boolean;
  itemsPerView?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    xl?: number;
  };
}

export interface CarouselWrapperProps {
  variant?: CarouselVariant;
  options?: CarouselOptions;
  data: CarouselItem[];
  className?: string;
  onSlideChange?: (index: number) => void;
  renderItem?: (item: CarouselItem, index: number, isActive: boolean) => ReactNode;
}

// Default options per variant
const getDefaultOptions = (variant: CarouselVariant): CarouselOptions => {
  switch (variant) {
    case "fullWidth":
      return {
        showControlBtns: true,
        showControlDots: true,
        showDotsProgress: true,
        showPreviewCards: false,
        showPreviewBtn: false,
        showShareBtn: false,
        showOverlay: true,
        autoPlay: true,
        autoPlayInterval: 5000,
        loop: true,
      };
    case "inset":
      return {
        showControlBtns: true,
        showControlDots: true,
        showDotsProgress: true,
        showPreviewCards: false,
        showPreviewBtn: false,
        showShareBtn: false,
        autoPlay: true,
        autoPlayInterval: 5000,
        loop: true,
      };
    case "default":
      return {
        showControlBtns: true,
        showControlDots: false,
        showDotsProgress: true,
        showPreviewCards: false,
        showPreviewBtn: false,
        showShareBtn: false,
        autoPlay: true,
        autoPlayInterval: 3000,
        loop: true,
        itemsPerView: {
          mobile: 1,
          tablet: 2,
          desktop: 3,
          xl: 4,
        },
      };
    default:
      return {
        showControlBtns: true,
        showControlDots: false,
      };
  }
};

// Utility hooks
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop" | "xl">("desktop");

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      if (width <= 600) setScreenSize("mobile");
      else if (width <= 1000) setScreenSize("tablet");
      else if (width <= 1200) setScreenSize("desktop");
      else setScreenSize("xl");
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return screenSize;
};

// Share Dialog Component
const ShareDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  // Update URL when dialog opens to get the current page URL
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const encodedUrl = encodeURIComponent(currentUrl);

  const shareLinks = [
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "#1877F2",
    },
    {
      name: "Twitter",
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}`,
      color: "#1DA1F2",
    },
    {
      name: "WhatsApp",
      url: `https://wa.me/?text=${encodedUrl}`,
      color: "#25D366",
    },
    {
      name: "LinkedIn",
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}`,
      color: "#0A66C2",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={styles.shareDialog}>
        <DialogHeader>
          <DialogTitle className={styles.shareTitle}>
            <Share2 className="w-5 h-5" />
            Share this page
          </DialogTitle>
        </DialogHeader>
        <div className={styles.shareContent}>
          <div className={styles.shareLinks}>
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shareLink}
                style={{ backgroundColor: link.color }}
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className={styles.copyLinkSection}>
            <div className={styles.copyLinkInput}>
              <Link2 className="w-4 h-4" />
              <span className={styles.linkText}>{currentUrl}</span>
            </div>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className={styles.copyBtn}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Fullscreen Preview Component
const FullscreenPreview = ({
  isOpen,
  onClose,
  data,
  currentIndex,
  onIndexChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: CarouselItem[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}) => {
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onIndexChange(currentIndex > 0 ? currentIndex - 1 : data.length - 1);
          break;
        case "ArrowRight":
          onIndexChange(currentIndex < data.length - 1 ? currentIndex + 1 : 0);
          break;
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex, data.length, onClose, onIndexChange]);

  // Scroll thumbnail into view
  useEffect(() => {
    if (thumbnailsRef.current) {
      const container = thumbnailsRef.current;
      const selectedThumb = container.children[currentIndex] as HTMLElement;
      if (selectedThumb) {
        selectedThumb.scrollIntoView({ behavior: "smooth", inline: "center" });
      }
    }
  }, [currentIndex]);

  if (!isOpen) return null;

  const currentItem = data[currentIndex];

  return (
    <div className={styles.fullscreenOverlay} onClick={onClose}>
      <button
        className={styles.fullscreenClose}
        onClick={onClose}
        aria-label="Close fullscreen"
      >
        <X className="w-6 h-6" />
      </button>

      <div
        className={styles.fullscreenContent}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentItem?.image}
          alt={currentItem?.alt || `Image ${currentIndex + 1}`}
          className={styles.fullscreenImage}
        />
      </div>

      {data.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange(currentIndex > 0 ? currentIndex - 1 : data.length - 1);
            }}
            className={`${styles.fullscreenNav} ${styles.fullscreenNavLeft}`}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange(currentIndex < data.length - 1 ? currentIndex + 1 : 0);
            }}
            className={`${styles.fullscreenNav} ${styles.fullscreenNavRight}`}
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <div className={styles.fullscreenCounter}>
            {currentIndex + 1} / {data.length}
          </div>
        </>
      )}

      {data.length > 1 && (
        <div className={styles.fullscreenThumbnails} ref={thumbnailsRef}>
          {data.map((item, idx) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(idx);
              }}
              className={cn(
                styles.fullscreenThumb,
                currentIndex === idx && styles.fullscreenThumbActive
              )}
            >
              <img
                src={item.thumbnailImage || item.image}
                alt={item.alt || `Thumbnail ${idx + 1}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Main CarouselWrapper Component
export const CarouselWrapper = ({
  variant = "default",
  options: userOptions,
  data,
  className,
  onSlideChange,
  renderItem,
}: CarouselWrapperProps) => {
  const defaultOptions = useMemo(() => getDefaultOptions(variant), [variant]);
  const options = useMemo(
    () => ({ ...defaultOptions, ...userOptions }),
    [defaultOptions, userOptions]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previewCardsRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const screenSize = useScreenSize();
  const total = data.length;

  // Touch/Swipe state
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const minSwipeDistance = 50;

  // Get items per view based on variant and screen size
  const getItemsPerView = useCallback(() => {
    if (variant === "fullWidth") return 1;
    if (variant === "inset") return 1;

    const itemsConfig = options.itemsPerView || {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      xl: 4,
    };

    return itemsConfig[screenSize] || 1;
  }, [variant, options.itemsPerView, screenSize]);

  // Calculate max index based on variant
  const itemsPerView = getItemsPerView();
  const maxIndex = variant === "default" ? Math.max(0, total - itemsPerView) : total - 1;

  // Navigation functions
  const goTo = useCallback(
    (index: number) => {
      if (!total) return;
      let newIndex: number;
      if (options.loop) {
        // For loop, wrap around based on maxIndex
        if (index > maxIndex) {
          newIndex = 0;
        } else if (index < 0) {
          newIndex = maxIndex;
        } else {
          newIndex = index;
        }
      } else {
        newIndex = Math.max(0, Math.min(index, maxIndex));
      }
      setActiveIndex(newIndex);
      setProgress(0);
      onSlideChange?.(newIndex);
    },
    [total, maxIndex, options.loop, onSlideChange]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Auto-play logic
  useEffect(() => {
    if (!options.autoPlay || total <= 1 || isFullscreen || (options.pauseOnInteraction && isPaused)) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }

    const interval = options.autoPlayInterval || 5000;

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 100 / (interval / 100);
      });
    }, 100);
    progressRef.current = progressInterval;

    // Auto advance
    autoPlayRef.current = setInterval(() => {
      goNext();
    }, interval);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [activeIndex, total, options.autoPlay, options.autoPlayInterval, options.pauseOnInteraction, isFullscreen, isPaused, goNext]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) goNext();
    else if (isRightSwipe) goPrev();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) return;
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown as any);
      return () => container.removeEventListener("keydown", handleKeyDown as any);
    }
  }, [goPrev, goNext, isFullscreen]);

  // Scroll to index for inset variant
  const scrollToIndex = useCallback(
    (index: number) => {
      if (scrollContainerRef.current && variant === "inset") {
        const container = scrollContainerRef.current;
        const cardWidth = screenSize === "mobile" ? 280 : screenSize === "tablet" ? 480 : 800;
        const gap = screenSize === "mobile" ? 16 : 24;
        const scrollPosition = index * (cardWidth + gap);
        container.scrollTo({ left: scrollPosition, behavior: "smooth" });
      }
    },
    [variant, screenSize]
  );

  useEffect(() => {
    if (variant === "inset") {
      scrollToIndex(activeIndex);
    }
  }, [activeIndex, variant, scrollToIndex]);

  // Handle scroll for inset variant
  useEffect(() => {
    if (variant !== "inset" || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const handleScroll = () => {
      const cardWidth = screenSize === "mobile" ? 280 : screenSize === "tablet" ? 480 : 800;
      const gap = screenSize === "mobile" ? 16 : 24;
      const newIndex = Math.round(container.scrollLeft / (cardWidth + gap));
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < total) {
        setActiveIndex(newIndex);
        setProgress(0);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [variant, screenSize, activeIndex, total]);

  // Scroll active preview card into view (horizontally only)
  useEffect(() => {
    if (previewCardsRef.current && options.showPreviewCards) {
      const container = previewCardsRef.current;
      const activeCard = container.children[activeIndex] as HTMLElement;
      if (activeCard) {
        // Calculate the scroll position to center the active card horizontally
        const containerWidth = container.offsetWidth;
        const cardLeft = activeCard.offsetLeft;
        const cardWidth = activeCard.offsetWidth;
        const scrollLeft = cardLeft - (containerWidth / 2) + (cardWidth / 2);

        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [activeIndex, options.showPreviewCards]);

  if (!data || data.length === 0) return null;

  // Render based on variant
  const renderFullWidthVariant = () => {
    const currentItem = data[activeIndex];

    return (
      <div
        className={styles.fullWidthWrapper}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => options.pauseOnInteraction && setIsPaused(true)}
        onMouseLeave={() => options.pauseOnInteraction && setIsPaused(false)}
      >
        {/* Background Image */}
        <motion.div
          key={activeIndex}
          className={styles.fullWidthImage}
          style={{ backgroundImage: `url(${currentItem?.image})` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
        {options.showOverlay && <div className={styles.fullWidthOverlay} />}

        {/* Header Content */}
        {options.headerContent && (
          <div className={styles.fullWidthHeader}>{options.headerContent}</div>
        )}

        {/* Custom Content */}
        {currentItem?.content && (
          <div className={styles.fullWidthContent}>{currentItem.content}</div>
        )}

        {/* Render Item (custom renderer) */}
        {renderItem && (
          <div className={styles.fullWidthContent}>
            {renderItem(currentItem, activeIndex, true)}
          </div>
        )}

        {/* Navigation Arrows */}
        {options.showControlBtns && total > 1 && (
          <>
            <button
              className={cn(styles.navArrow, styles.navArrowLeft)}
              onClick={goPrev}
              aria-label="Previous slide"
            >
              <ChevronLeft className={styles.navArrowIcon} />
            </button>
            <button
              className={cn(styles.navArrow, styles.navArrowRight)}
              onClick={goNext}
              aria-label="Next slide"
            >
              <ChevronRight className={styles.navArrowIcon} />
            </button>
          </>
        )}

        {/* Control Dots */}
        {options.showControlDots && total > 1 && (
          <div className={styles.controlDots}>
            {data.map((_, index) => (
              <button
                key={index}
                className={cn(
                  styles.dot,
                  activeIndex === index && styles.dotActive,
                  activeIndex === index && !options.showDotsProgress && styles.dotActiveNoProgress
                )}
                onClick={() => goTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              >
                {activeIndex === index && options.showDotsProgress && (
                  <span
                    className={styles.dotProgress}
                    style={{ transform: `scaleX(${progress / 100})` }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Preview Cards - Positioned AFTER the carousel for fullWidth */}
        {options.showPreviewCards && total > 1 && (
          <div className={styles.fullWidthPreviewCards}>
            <div className={styles.previewCards} ref={previewCardsRef}>
              {data.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => goTo(index)}
                  className={cn(
                    styles.previewCard,
                    activeIndex === index && styles.previewCardActive
                  )}
                >
                  <img
                    src={item.thumbnailImage || item.image}
                    alt={item.alt || `Preview ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons Container */}
        <div className={styles.actionButtons}>
          {options.showShareBtn && (
            <button
              className={styles.actionBtn}
              onClick={() => setIsShareOpen(true)}
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
          {options.showPreviewBtn && (
            <button
              className={styles.actionBtn}
              onClick={() => setIsFullscreen(true)}
              aria-label="Preview"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderInsetVariant = () => {
    const cardWidth = screenSize === "mobile" ? 280 : screenSize === "tablet" ? 480 : 800;
    const gap = screenSize === "mobile" ? 16 : 24;
    const aspectRatio = screenSize === "mobile" ? "4/6" : screenSize === "tablet" ? "5/4" : "6/3";

    // Handler for inset navigation - state based
    const handleInsetPrev = () => {
      const newIndex = activeIndex > 0 ? activeIndex - 1 : (options.loop ? total - 1 : 0);
      setActiveIndex(newIndex);
      setProgress(0);
      onSlideChange?.(newIndex);
    };

    const handleInsetNext = () => {
      const newIndex = activeIndex < total - 1 ? activeIndex + 1 : (options.loop ? 0 : total - 1);
      setActiveIndex(newIndex);
      setProgress(0);
      onSlideChange?.(newIndex);
    };

    const handleInsetGoTo = (index: number) => {
      if (index === activeIndex) return;
      setActiveIndex(index);
      setProgress(0);
      onSlideChange?.(index);
    };

    // Calculate translateX for the track
    const translateX = -activeIndex * (cardWidth + gap);

    return (
      <div
        className={styles.insetWrapper}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => {
          if (!touchStart || !touchEnd) return;
          const distance = touchStart - touchEnd;
          if (distance > minSwipeDistance) handleInsetNext();
          else if (distance < -minSwipeDistance) handleInsetPrev();
        }}
        onMouseEnter={() => options.pauseOnInteraction && setIsPaused(true)}
        onMouseLeave={() => options.pauseOnInteraction && setIsPaused(false)}
      >
        {/* Blurred Background */}
        <div className={styles.insetBackground}>
          <AnimatePresence mode="wait">
            <motion.div
              key={data[activeIndex]?.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={styles.insetBackgroundImage}
              style={{
                backgroundImage: data[activeIndex]?.image
                  ? `url(${data[activeIndex].image})`
                  : "none",
              }}
            />
          </AnimatePresence>
          <div className={styles.insetBackgroundOverlay} />
        </div>

        {/* Header Content */}
        {options.headerContent && (
          <div className={styles.insetHeader}>{options.headerContent}</div>
        )}

        {/* Carousel Body */}
        <div className={styles.insetBody}>
          <div className={styles.insetCarouselWrapper}>
            {/* Nav Buttons */}
            {options.showControlBtns && screenSize !== "mobile" && (
              <button
                onClick={handleInsetPrev}
                className={cn(styles.insetNavBtn, styles.insetNavBtnPrev)}
              >
                <ChevronLeft className={styles.insetNavIcon} />
              </button>
            )}

            {/* Cards Track - State based animation */}
            <div className={styles.insetTrackContainer}>
              <motion.div
                className={styles.insetTrack}
                animate={{ x: translateX }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  gap: `${gap}px`,
                  paddingLeft: `calc(50% - ${cardWidth / 2}px)`,
                  paddingRight: `calc(50% - ${cardWidth / 2}px)`,
                }}
              >
                {data.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className={styles.insetCard}
                    initial={false}
                    animate={{
                      scale: index === activeIndex ? 1 : 0.85,
                      opacity: index === activeIndex ? 1 : 0.6,
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: `${cardWidth}px`,
                      aspectRatio,
                      cursor: index === activeIndex && options.showPreviewBtn ? "zoom-in" : "pointer",
                    }}
                    onClick={() => {
                      if (index === activeIndex && options.showPreviewBtn) {
                        setIsFullscreen(true);
                      } else {
                        handleInsetGoTo(index);
                      }
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.alt || `Slide ${index + 1}`}
                      className={styles.insetCardImage}
                      draggable={false}
                    />
                    <div className={styles.insetCardGradient} />
                    {item.content && (
                      <div className={styles.insetCardContent}>{item.content}</div>
                    )}
                    {renderItem && (
                      <div className={styles.insetCardContent}>
                        {renderItem(item, index, index === activeIndex)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Next Button */}
            {options.showControlBtns && screenSize !== "mobile" && (
              <button
                onClick={handleInsetNext}
                className={cn(styles.insetNavBtn, styles.insetNavBtnNext)}
              >
                <ChevronRight className={styles.insetNavIcon} />
              </button>
            )}
          </div>

          {/* Indicators */}
          {options.showControlDots && total > 1 && (
            <div className={styles.insetIndicators}>
              {data.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleInsetGoTo(index)}
                  className={cn(
                    styles.insetIndicator,
                    activeIndex === index
                      ? styles.insetIndicatorActive
                      : styles.insetIndicatorInactive
                  )}
                >
                  {activeIndex === index && (
                    <div
                      className={styles.insetIndicatorProgress}
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Preview Cards - Positioned AFTER the carousel */}
          {options.showPreviewCards && total > 1 && (
            <div className={styles.previewCardsWrapper}>
              <div className={styles.previewCards} ref={previewCardsRef}>
                {data.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleInsetGoTo(index)}
                    className={cn(
                      styles.previewCard,
                      activeIndex === index && styles.previewCardActive
                    )}
                  >
                    <img
                      src={item.thumbnailImage || item.image}
                      alt={item.alt || `Preview ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {options.showShareBtn && (
            <button
              className={styles.actionBtn}
              onClick={() => setIsShareOpen(true)}
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
          {options.showPreviewBtn && (
            <button
              className={styles.actionBtn}
              onClick={() => setIsFullscreen(true)}
              aria-label="Preview"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderDefaultVariant = () => {
    const totalSlides = maxIndex + 1;
    const currentSlideStart = activeIndex;

    // Each item should take up (100 / itemsPerView)% of the container
    const itemWidthPercent = 100 / itemsPerView;
    // Translate by activeIndex * itemWidth
    const translatePercent = activeIndex * itemWidthPercent;

    return (
      <div
        className={styles.defaultWrapper}
        onMouseEnter={() => options.pauseOnInteraction && setIsPaused(true)}
        onMouseLeave={() => options.pauseOnInteraction && setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header Content */}
        {options.headerContent && (
          <div className={styles.defaultHeader}>{options.headerContent}</div>
        )}

        {/* Carousel Container */}
        <div className={styles.defaultCarouselContainer}>
          <motion.div
            className={styles.defaultTrack}
            animate={{
              x: `-${translatePercent}%`,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {data.map((item, index) => {
              const isActive =
                index >= currentSlideStart && index < currentSlideStart + itemsPerView;
              return (
                <div
                  key={item.id}
                  className={styles.defaultItem}
                  style={{
                    flex: `0 0 ${itemWidthPercent}%`,
                    maxWidth: `${itemWidthPercent}%`,
                  }}
                >
                  <div
                    className={styles.defaultItemInner}
                    style={{
                      cursor: options.showPreviewBtn ? "zoom-in" : "default",
                    }}
                    onClick={() => {
                      if (options.showPreviewBtn) {
                        setActiveIndex(index);
                        setIsFullscreen(true);
                      }
                    }}
                  >
                    {renderItem ? (
                      renderItem(item, index, isActive)
                    ) : (
                      <>
                        <img
                          src={item.image}
                          alt={item.alt || `Item ${index + 1}`}
                          className={styles.defaultItemImage}
                        />
                        {item.content && (
                          <div className={styles.defaultItemContent}>
                            {item.content}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Nav Arrows */}
          {options.showControlBtns && totalSlides > 1 && (
            <>
              <button
                className={cn(styles.defaultNavBtn, styles.defaultNavBtnPrev)}
                onClick={goPrev}
                disabled={!options.loop && activeIndex === 0}
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className={cn(styles.defaultNavBtn, styles.defaultNavBtnNext)}
                onClick={goNext}
                disabled={!options.loop && activeIndex >= maxIndex}
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Preview Cards */}
        {options.showPreviewCards && total > 1 && (
          <div className={styles.previewCardsWrapper}>
            <div className={styles.previewCards} ref={previewCardsRef}>
              {data.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => goTo(index)}
                  className={cn(
                    styles.previewCard,
                    activeIndex === index && styles.previewCardActive
                  )}
                >
                  <img
                    src={item.thumbnailImage || item.image}
                    alt={item.alt || `Preview ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Control Dots */}
        {options.showControlDots && totalSlides > 1 && (
          <div className={styles.defaultDots}>
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                className={cn(
                  styles.defaultDot,
                  activeIndex === index && styles.defaultDotActive
                )}
                onClick={() => goTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actionButtonsDefault}>
          {options.showShareBtn && (
            <button
              className={styles.actionBtn}
              onClick={() => setIsShareOpen(true)}
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
          {options.showPreviewBtn && (
            <button
              className={styles.actionBtn}
              onClick={() => setIsFullscreen(true)}
              aria-label="Preview"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        styles.carouselWrapper,
        styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
        className
      )}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
    >
      {variant === "fullWidth" && renderFullWidthVariant()}
      {variant === "inset" && renderInsetVariant()}
      {variant === "default" && renderDefaultVariant()}

      {/* Fullscreen Preview */}
      <FullscreenPreview
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        data={data}
        currentIndex={activeIndex}
        onIndexChange={setActiveIndex}
      />

      {/* Share Dialog */}
      <ShareDialog isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
    </div>
  );
};

export default CarouselWrapper;
