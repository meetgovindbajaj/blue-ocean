import { PopulateOptions } from "mongoose";

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().split("T")[0]; // Returns date in YYYY-MM-DD format
};

export const formatDateToWords = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const truncateText = (
  text: string,
  maxLength: number = 100,
  suffix: string = "..."
): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);
};

export function createSlug(text: string | undefined): string {
  if (!text) return "";

  return text
    .toString() // Ensure input is a string
    .toLowerCase() // 1. Convert to lowercase
    .replace(/[^a-z0-9\s-]/g, "") // 2. Remove unwanted characters (anything not letter, number, space, hyphen)
    .trim() // Remove leading/trailing whitespace (before replacing spaces)
    .replace(/\s+/g, "-") // 3. Replace spaces with hyphens
    .replace(/-+/g, "-") // 4. Replace multiple hyphens with single hyphens
    .replace(/^-+/, "") // 5. Remove leading hyphens (optional if trim() and replacements handle it)
    .replace(/-+$/, ""); // 6. Remove trailing hyphens (optional if trim() and replacements handle it)
}

export function extractFolderIdFromUrl(url: string) {
  try {
    // For links like "https://drive.google.com/drive/folders/1qJ7Mb1tAtAeCGHf0xAMg3u7jrA7RIRvO?usp=drive_link"
    const regex = /\/folders\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : extractFileIdFromUrl(url); // Return the folder ID or the original URL if no match
  } catch (error) {
    console.error("Error extracting folder ID:", error);
    return "";
  }
}

export function extractFileIdFromUrl(url: string) {
  try {
    const regex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : url;
  } catch (error) {
    console.error("Error extracting file ID:", error);
    return ""; // Return the original URL in case of error
  }
}

export const buildPopulate = (depth = 10): PopulateOptions => {
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
};
