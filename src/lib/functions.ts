import { PopulateOptions } from "mongoose";

// Memoization cache for expensive operations
const memoCache = new Map<string, unknown>();

// Cache with TTL (Time To Live)
interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTL = 300000) {
    // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Create cache instances
const formatCache = new TTLCache<string>(600000); // 10 minutes for formatting
const slugCache = new TTLCache<string>(3600000); // 1 hour for slugs

// Enhanced date formatting with validation and caching
export const formatDate = (date: Date | string | number): string => {
  try {
    if (!date) return "";

    const cacheKey = `date_${date.toString()}`;
    const cached = formatCache.get(cacheKey);
    if (cached) return cached;

    const d = new Date(date);
    if (isNaN(d.getTime())) {
      console.warn("Invalid date provided to formatDate:", date);
      return "";
    }

    const result = d.toISOString().split("T")[0];
    formatCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

export const formatDateToWords = (date: Date | string | number): string => {
  try {
    if (!date) return "";

    const cacheKey = `dateWords_${date.toString()}`;
    const cached = formatCache.get(cacheKey);
    if (cached) return cached;

    const d = new Date(date);
    if (isNaN(d.getTime())) {
      console.warn("Invalid date provided to formatDateToWords:", date);
      return "";
    }

    const result = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    formatCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error formatting date to words:", error);
    return "";
  }
};

// Enhanced text truncation with better handling
export const truncateText = (
  text: string | null | undefined,
  maxLength: number = 100,
  suffix: string = "..."
): string => {
  try {
    if (!text || typeof text !== "string") return "";
    if (maxLength <= 0) return "";
    if (text.length <= maxLength) return text;

    // Ensure suffix doesn't exceed maxLength
    const safeSuffixLength = Math.min(suffix.length, maxLength);
    const truncateLength = maxLength - safeSuffixLength;

    if (truncateLength <= 0) return suffix.slice(0, maxLength);

    return text.slice(0, truncateLength) + suffix;
  } catch (error) {
    console.error("Error truncating text:", error);
    return "";
  }
};

// Enhanced price formatting with error handling and caching
export const formatPrice = (
  price: number | string | null | undefined
): string => {
  try {
    if (price === null || price === undefined) return "₹0.00";

    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) {
      console.warn("Invalid price provided to formatPrice:", price);
      return "₹0.00";
    }

    const cacheKey = `price_${numPrice}`;
    const cached = formatCache.get(cacheKey);
    if (cached) return cached;

    const result = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numPrice);

    formatCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error formatting price:", error);
    return "₹0.00";
  }
};

// Enhanced slug creation with caching and better sanitization
export function createSlug(text: string | undefined | null): string {
  try {
    if (!text || typeof text !== "string") return "";

    const cacheKey = `slug_${text}`;
    const cached = slugCache.get(cacheKey);
    if (cached) return cached;

    const result = text
      .toString()
      .toLowerCase()
      .trim()
      // Replace accented characters
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Remove unwanted characters (keep letters, numbers, spaces, hyphens)
      .replace(/[^a-z0-9\s-]/g, "")
      // Replace multiple spaces/hyphens with single hyphen
      .replace(/[\s-]+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "");

    slugCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error creating slug:", error);
    return "";
  }
}

// Enhanced URL extraction with better error handling
export function extractFolderIdFromUrl(url: string | null | undefined): string {
  try {
    if (!url || typeof url !== "string") return "";

    // For Google Drive folder links
    const folderRegex = /\/folders\/([a-zA-Z0-9_-]+)/;
    const match = url.match(folderRegex);

    if (match && match[1]) {
      return match[1];
    }

    // Fallback to file ID extraction
    return extractFileIdFromUrl(url);
  } catch (error) {
    console.error("Error extracting folder ID:", error);
    return "";
  }
}

export function extractFileIdFromUrl(url: string | null | undefined): string {
  try {
    if (!url || typeof url !== "string") return "";

    // For Google Drive file links
    const fileRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(fileRegex);

    return match && match[1] ? match[1] : "";
  } catch (error) {
    console.error("Error extracting file ID:", error);
    return "";
  }
}

// Enhanced populate builder with validation
export const buildPopulate = (depth: number = 10): PopulateOptions => {
  try {
    if (depth <= 0 || depth > 20) {
      console.warn("Invalid depth for buildPopulate, using default of 10");
      depth = 10;
    }

    const populate: PopulateOptions = {
      path: "parent",
      select: "id name slug parent",
    };

    let current: PopulateOptions = populate;
    for (let i = 1; i < depth; i++) {
      current.populate = {
        path: "parent",
        select: "id name slug parent",
      };
      current = current.populate as PopulateOptions;
    }

    return populate;
  } catch (error) {
    console.error("Error building populate options:", error);
    return {
      path: "parent",
      select: "id name slug parent",
    };
  }
};

// Enhanced date range functions with validation
export function getDateRangeOfWeek(
  week: number,
  year: number
): { start: Date; end: Date } {
  try {
    if (!Number.isInteger(week) || !Number.isInteger(year)) {
      throw new Error("Week and year must be integers");
    }

    if (week < 1 || week > 53) {
      throw new Error("Week must be between 1 and 53");
    }

    if (year < 1900 || year > 2100) {
      throw new Error("Year must be between 1900 and 2100");
    }

    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const ISOweekStart = new Date(simple);

    if (dayOfWeek <= 4) {
      ISOweekStart.setDate(simple.getDate() - dayOfWeek + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - dayOfWeek);
    }

    const ISOweekEnd = new Date(ISOweekStart);
    ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

    return {
      start: ISOweekStart,
      end: ISOweekEnd,
    };
  } catch (error) {
    console.error("Error getting date range of week:", error);
    const now = new Date();
    return { start: now, end: now };
  }
}

export function getDateRange(
  range: string,
  date: Date | string | number
): { start: Date; end: Date } {
  try {
    if (!range || typeof range !== "string") {
      throw new Error("Range must be a valid string");
    }

    const baseDate = new Date(date);
    if (isNaN(baseDate.getTime())) {
      throw new Error("Invalid date provided");
    }

    const start = new Date(baseDate);
    const end = new Date(baseDate);

    switch (range.toLowerCase()) {
      case "daily":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case "weekly": {
        const day = start.getDay(); // 0=Sun
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // ISO week starts on Mon
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }

      case "monthly":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case "yearly":
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;

      default:
        throw new Error(
          `Invalid range: ${range}. Valid ranges are: daily, weekly, monthly, yearly`
        );
    }

    return { start, end };
  } catch (error) {
    console.error("Error getting date range:", error);
    const now = new Date();
    return { start: now, end: now };
  }
}

// Utility function to clear all caches
export function clearAllCaches(): void {
  try {
    formatCache.clear();
    slugCache.clear();
    memoCache.clear();
    console.log("All caches cleared successfully");
  } catch (error) {
    console.error("Error clearing caches:", error);
  }
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Safe JSON parse with error handling
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return fallback;
  }
}

// Generate unique ID
export function generateId(prefix: string = ""): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${randomStr}`;
}
