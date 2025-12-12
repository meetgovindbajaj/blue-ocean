"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home,
  Info,
  Mail,
  HelpCircle,
  ShoppingBag,
  FolderTree,
  Package,
  ChevronRight,
  Search,
  MapPin,
  FileText,
  Users,
  ExternalLink,
  Scale,
  Shield,
  ScrollText,
  RefreshCcw,
  FileCheck,
  Award,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import styles from "./page.module.css";
import { Route } from "next";

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  category?: {
    name: string;
    slug: string;
  };
}

interface LegalDocument {
  id: string;
  title: string;
  slug: string;
  type: string;
}

interface SitemapPageClientProps {
  categories: Category[];
  products: Product[];
  settings: any;
  legalDocuments: LegalDocument[];
}

// Static pages configuration
const staticPages = [
  { name: "Home", href: "/", icon: Home, description: "Welcome to our store" },
  {
    name: "Products",
    href: "/products",
    icon: ShoppingBag,
    description: "Browse all products",
  },
  {
    name: "Categories",
    href: "/categories",
    icon: FolderTree,
    description: "Shop by category",
  },
  {
    name: "About Us",
    href: "/about",
    icon: Info,
    description: "Learn about our company",
  },
  {
    name: "Contact",
    href: "/contact",
    icon: Mail,
    description: "Get in touch with us",
  },
  {
    name: "FAQ",
    href: "/faq",
    icon: HelpCircle,
    description: "Frequently asked questions",
  },
];

// Helper function to get icon for legal document type
const getLegalIcon = (type: string) => {
  switch (type) {
    case "terms-and-conditions":
      return FileText;
    case "privacy-policy":
      return Shield;
    case "terms-of-service":
      return ScrollText;
    case "refund-policy":
      return RefreshCcw;
    case "warranty":
      return FileCheck;
    case "trade-contracts":
      return Scale;
    case "certificates":
      return Award;
    default:
      return FileText;
  }
};

export default function SitemapPageClient({
  categories,
  products,
  settings,
  legalDocuments,
}: SitemapPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const siteName = settings?.siteName || "Blue Ocean";

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const categoryName = product.category?.name || "Uncategorized";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Filter categories based on search
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.children?.some((child) =>
        child.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const totalLinks =
    staticPages.length +
    categories.length +
    categories.reduce((acc, cat) => acc + (cat.children?.length || 0), 0) +
    products.length +
    legalDocuments.length;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroIcon}>
            <MapPin size={48} />
          </div>
          <h1 className={styles.title}>Sitemap</h1>
          <p className={styles.subtitle}>
            Explore all pages on {siteName}. Find products, categories, and
            information quickly.
          </p>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <FileText size={20} />
              <span>{staticPages.length} Pages</span>
            </div>
            <div className={styles.statItem}>
              <FolderTree size={20} />
              <span>{categories.length} Categories</span>
            </div>
            <div className={styles.statItem}>
              <Package size={20} />
              <span>{products.length} Products</span>
            </div>
            {legalDocuments.length > 0 && (
              <div className={styles.statItem}>
                <Scale size={20} />
                <span>{legalDocuments.length} Legal</span>
              </div>
            )}
          </div>
        </section>

        {/* Search */}
        <section className={styles.searchSection}>
          <div className={styles.searchWrapper}>
            <Search size={20} className={styles.searchIcon} />
            <Input
              type="text"
              placeholder="Search pages, categories, or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </section>

        {/* Main Pages */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FileText size={24} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Main Pages</h2>
              <p className={styles.sectionDescription}>
                Core pages of our website
              </p>
            </div>
          </div>
          <div className={styles.pagesGrid}>
            {staticPages.map((page) => {
              const Icon = page.icon;
              return (
                <Link
                  key={page.href}
                  href={page.href as Route}
                  className={styles.pageCard}
                >
                  <div className={styles.pageCardIcon}>
                    <Icon size={24} />
                  </div>
                  <div className={styles.pageCardContent}>
                    <h3 className={styles.pageCardTitle}>{page.name}</h3>
                    <p className={styles.pageCardDescription}>
                      {page.description}
                    </p>
                  </div>
                  <ChevronRight size={20} className={styles.pageCardArrow} />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Categories */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FolderTree size={24} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Categories</h2>
              <p className={styles.sectionDescription}>
                Browse products by category ({filteredCategories.length}{" "}
                categories)
              </p>
            </div>
          </div>
          <div className={styles.categoriesGrid}>
            {filteredCategories.map((category) => (
              <div key={category.id} className={styles.categoryCard}>
                <Link
                  href={`/categories?slug=${category.slug}`}
                  className={styles.categoryHeader}
                >
                  <FolderTree size={20} />
                  <span className={styles.categoryName}>{category.name}</span>
                  {category.productCount !== undefined && (
                    <span className={styles.categoryCount}>
                      {category.productCount} products
                    </span>
                  )}
                  <ExternalLink size={16} className={styles.categoryLink} />
                </Link>
                {category.children && category.children.length > 0 && (
                  <div className={styles.subcategories}>
                    {category.children
                      .filter(
                        (child) =>
                          !searchQuery ||
                          child.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                      )
                      .map((child) => (
                        <Link
                          key={child.id}
                          href={`/categories?slug=${child.slug}`}
                          className={styles.subcategoryLink}
                        >
                          <ChevronRight size={14} />
                          <span>{child.name}</span>
                          {child.productCount !== undefined && (
                            <span className={styles.subcategoryCount}>
                              ({child.productCount})
                            </span>
                          )}
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <Package size={24} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>All Products</h2>
              <p className={styles.sectionDescription}>
                {searchQuery
                  ? `Found ${filteredProducts.length} products matching "${searchQuery}"`
                  : `Complete list of ${products.length} products`}
              </p>
            </div>
          </div>

          {Object.keys(productsByCategory).length > 0 ? (
            <div className={styles.productsContainer}>
              {Object.entries(productsByCategory).map(
                ([categoryName, categoryProducts]) => (
                  <div key={categoryName} className={styles.productCategory}>
                    <button
                      className={styles.productCategoryHeader}
                      onClick={() =>
                        setActiveSection(
                          activeSection === categoryName ? null : categoryName
                        )
                      }
                    >
                      <FolderTree size={18} />
                      <span className={styles.productCategoryName}>
                        {categoryName}
                      </span>
                      <span className={styles.productCategoryCount}>
                        {categoryProducts.length} products
                      </span>
                      <ChevronRight
                        size={18}
                        className={`${styles.productCategoryChevron} ${
                          activeSection === categoryName ? styles.rotated : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`${styles.productsList} ${
                        activeSection === categoryName || searchQuery
                          ? styles.expanded
                          : ""
                      }`}
                    >
                      {categoryProducts.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          className={styles.productLink}
                        >
                          <Package size={14} />
                          <span>{product.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Package size={48} />
              <p>No products found matching your search.</p>
            </div>
          )}
        </section>

        {/* Legal Documents */}
        {legalDocuments.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <Scale size={24} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>Legal Documents</h2>
                <p className={styles.sectionDescription}>
                  Policies, terms, and legal information
                </p>
              </div>
            </div>
            <div className={styles.pagesGrid}>
              <Link
                href={"/legal" as Route}
                className={styles.pageCard}
              >
                <div className={styles.pageCardIcon}>
                  <Scale size={24} />
                </div>
                <div className={styles.pageCardContent}>
                  <h3 className={styles.pageCardTitle}>All Legal Documents</h3>
                  <p className={styles.pageCardDescription}>
                    View all policies and legal information
                  </p>
                </div>
                <ChevronRight size={20} className={styles.pageCardArrow} />
              </Link>
              {legalDocuments.map((doc) => {
                const Icon = getLegalIcon(doc.type);
                return (
                  <Link
                    key={doc.id}
                    href={`/legal/${doc.slug}` as Route}
                    className={styles.pageCard}
                  >
                    <div className={styles.pageCardIcon}>
                      <Icon size={24} />
                    </div>
                    <div className={styles.pageCardContent}>
                      <h3 className={styles.pageCardTitle}>{doc.title}</h3>
                      <p className={styles.pageCardDescription}>
                        {doc.type.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                    </div>
                    <ChevronRight size={20} className={styles.pageCardArrow} />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer Info */}
        <section className={styles.footerInfo}>
          <div className={styles.footerCard}>
            <Users size={24} />
            <h3>Need Help?</h3>
            <p>
              Can&apos;t find what you&apos;re looking for? Our team is here to
              help.
            </p>
            <Link href="/contact" className={styles.footerLink}>
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
