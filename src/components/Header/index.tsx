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
    <div className={styles.page}>
      <div className={styles.leftSection}>
        {/* <MobileSidebar /> */}
        <Anchor href="/" className={styles.brand} content={siteName} />
      </div>
      <div className={styles.links}>
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
      </div>
      <div className={styles.moreOptions}>
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
    </div>
  );
};

export default Header;
