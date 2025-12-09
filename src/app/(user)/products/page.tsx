import { Metadata } from "next";
import SearchResultPage from "@/components/shared/SearchResultPage";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our collection of premium quality solid wood furniture. Find tables, chairs, beds, sofas and more crafted with precision and care.",
  openGraph: {
    title: "Products | Blue Ocean",
    description: "Browse our collection of premium quality solid wood furniture. Find tables, chairs, beds, sofas and more crafted with precision and care.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Products | Blue Ocean",
    description: "Browse our collection of premium quality solid wood furniture.",
  },
};

const ProductListPage = () => {
  return (
    <div className={styles.page}>
      <SearchResultPage />
    </div>
  );
};

export default ProductListPage;
