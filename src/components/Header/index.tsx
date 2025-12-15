"use client";

import styles from "./index.module.css";
import SearchBar from "./search";
import Anchor from "../shared/Anchor";
import CategoryDropdown from "./categoryDropdown";
import UserMenu from "./UserMenu";
import MobileNavSidebar from "./MobileNavSidebar";
import { useId } from "react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const Header = () => {
  const id = useId();
  const { settings } = useSiteSettings();
  const tracking = { enabled: true, grouped: true };
  const siteName = settings?.siteName || "Blue Ocean";

  return (
    <header className={styles.page} role="banner">
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        Skip to main content
      </a>

      <div className={styles.leftSection}>
        <Anchor
          href="/"
          className={styles.brand}
          content={siteName}
          aria-label={`${siteName} - Go to homepage`}
        />
      </div>

      <nav className={styles.links} aria-label="Main navigation">
        <Anchor
          href="/"
          content="Home"
          tracking={{ ...tracking, id: "home" }}
        />
        <Anchor
          href="/products"
          content="Products"
          tracking={{ ...tracking, id: "products" }}
        />
        <div style={{ display: "contents" }} id={id}>
          <CategoryDropdown id={id} />
        </div>
        <Anchor
          href="/about"
          content="About Us"
          tracking={{ ...tracking, id: "about" }}
        />
        <Anchor
          href="/contact"
          content="Contact"
          tracking={{ ...tracking, id: "contact" }}
        />
      </nav>

      <div className={styles.moreOptions} role="group" aria-label="User actions">
        <SearchBar />
        {/* Desktop only - shows dropdown */}
        <div className={styles.desktopOnly}>
          <UserMenu />
        </div>
        {/* Mobile/Tablet - hamburger menu opens mobile sidebar */}
        <div className={styles.mobileOnly}>
          <MobileNavSidebar />
        </div>
      </div>
    </header>
  );
};

export default Header;
