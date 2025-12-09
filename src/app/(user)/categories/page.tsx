import { Metadata } from "next";
import CategoriesPageClient from "./CategoriesPageClient";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse our furniture categories. Find tables, chairs, beds, sofas, storage and more premium quality solid wood furniture collections.",
  openGraph: {
    title: "Categories | Blue Ocean",
    description: "Browse our furniture categories. Find tables, chairs, beds, sofas, storage and more premium quality solid wood furniture collections.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Categories | Blue Ocean",
    description: "Browse our furniture categories and collections.",
  },
};

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}
