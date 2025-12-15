"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const startProgress = useCallback(() => {
    setIsVisible(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        // Slow down as it progresses
        const increment = Math.max(1, (90 - prev) * 0.1);
        return Math.min(90, prev + increment);
      });
    }, 100);

    return interval;
  }, []);

  const completeProgress = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 200);
  }, []);

  useEffect(() => {
    // Complete progress when route changes
    completeProgress();
  }, [pathname, searchParams, completeProgress]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const handleStart = () => {
      interval = startProgress();
    };

    // Listen for link clicks to start the progress bar
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        const isExternal =
          anchor.target === "_blank" || anchor.rel?.includes("external");
        const isHashLink = href?.startsWith("#");
        const isSamePageLink = href === pathname;
        const isDownload = anchor.hasAttribute("download");

        // Only trigger for internal navigation links
        if (href && !isExternal && !isHashLink && !isSamePageLink && !isDownload) {
          handleStart();
        }
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      if (interval) clearInterval(interval);
    };
  }, [pathname, startProgress]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] bg-transparent"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading"
    >
      <div
        className="h-full bg-blue-600 transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: "0 0 10px rgba(37, 99, 235, 0.7), 0 0 5px rgba(37, 99, 235, 0.5)",
        }}
      />
    </div>
  );
}
