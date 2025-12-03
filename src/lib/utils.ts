import { CategoryType } from "@/components/Header/search";
import { ProductType } from "@/types/product";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateRelevanceScore = (
  product: ProductType,
  searchQuery: string,
  categories: CategoryType[]
): number => {
  if (!searchQuery) return 0;

  const query = searchQuery.toLowerCase();
  const name = product.name.toLowerCase();
  const description = product.description.toLowerCase();
  const categoryName =
    categories.find((c) => c.id === product.category)?.name.toLowerCase() || "";

  let score = 0;

  // Exact name match (highest priority)
  if (name === query) score += 100;
  // Name starts with query
  else if (name.startsWith(query)) score += 75;
  // Name contains query
  else if (name.includes(query)) score += 50;

  // Description contains query
  if (description.includes(query)) score += 25;

  // Category match
  if (categoryName.includes(query)) score += 30;

  // Word-level matching
  const queryWords = query.split(" ").filter((w) => w.length > 2);
  const nameWords = name.split(" ");

  queryWords.forEach((queryWord) => {
    nameWords.forEach((nameWord) => {
      if (nameWord.startsWith(queryWord)) score += 20;
      else if (nameWord.includes(queryWord)) score += 10;
    });
  });

  // Boost for discount
  if (product.prices.discount > 0) score += 5;

  return score;
};
