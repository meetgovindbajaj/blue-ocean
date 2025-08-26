"use client";

import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "@/styles/navbar.scss";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  categories: ICategory[];
}

const Navbar: React.FC<NavbarProps> = memo(({ categories }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItemCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
    setIsSearchOpen(false);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
    setIsMobileMenuOpen(false);
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchQuery("");
        setIsSearchOpen(false);
        closeMobileMenu();
      }
    },
    [searchQuery, router, closeMobileMenu]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setShowUserDropdown(false);
      closeMobileMenu();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout, closeMobileMenu]);

  // Close dropdowns when clicking outside - Optimized with useCallback
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(target)
      ) {
        setShowUserDropdown(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(target) &&
        !(event.target as HTMLElement).closest(".navbar__search-toggle")
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu on window resize - Optimized with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (window.innerWidth > 768) {
          setIsMobileMenuOpen(false);
        }
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = React.useMemo(
    () => [
      { name: "Home", href: "/" },
      { name: "Products", href: "/products" },
      { name: "About", href: "/about" },
      { name: "Contact", href: "/contact" },
    ],
    []
  );

  // Memoize limited categories to prevent unnecessary re-renders
  const limitedCategories = React.useMemo(
    () => categories?.slice(0, 8) || [],
    [categories]
  );

  return (
    <nav className="navbar__container">
      {/* Brand Name */}
      <Link href="/" className="navbar__brand">
        <span className="navbar__brand-text">Blue Ocean Export</span>
      </Link>

      {/* Desktop Navigation */}
      <ul className="navbar__nav">
        {navigationItems.map((item) => (
          <li key={item.name} className="navbar__nav-item">
            <Link href={item.href} className="navbar__nav-item-link">
              {item.name}
            </Link>
          </li>
        ))}

        {/* Categories Dropdown */}
        {limitedCategories.length > 0 && (
          <li className="navbar__nav-item">
            <span className="navbar__nav-item-link">Categories</span>
            <div className="navbar__dropdown" ref={dropdownRef}>
              {limitedCategories.map((category) => (
                <div key={category.id} className="navbar__dropdown-item">
                  <Link
                    href={`/category/${category.slug}`}
                    className="navbar__dropdown-item-link"
                    prefetch={false}
                  >
                    {category.name}
                  </Link>
                </div>
              ))}
              {categories && categories.length > 8 && (
                <div className="navbar__dropdown-item">
                  <Link
                    href="/categories"
                    className="navbar__dropdown-item-link"
                    prefetch={false}
                  >
                    View All Categories
                  </Link>
                </div>
              )}
            </div>
          </li>
        )}
      </ul>

      {/* Actions */}
      <div className="navbar__actions">
        {/* Search Toggle */}
        <button
          className="navbar__search-toggle"
          onClick={toggleSearch}
          aria-label="Toggle search"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>

        {/* Authentication Buttons */}
        {!isLoading && (
          <div className="navbar__actions-auth">
            {isAuthenticated && user ? (
              <div className="navbar__user" ref={userDropdownRef}>
                <button
                  className="navbar__user-button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  aria-label="User menu"
                >
                  <span className="navbar__user-name">
                    {user.name || user.email}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {showUserDropdown && (
                  <div className="navbar__dropdown navbar__dropdown--user">
                    <div className="navbar__dropdown-item">
                      <Link
                        href="/profile"
                        className="navbar__dropdown-item-link"
                        onClick={() => setShowUserDropdown(false)}
                        prefetch={false}
                      >
                        My Profile
                      </Link>
                    </div>
                    <div className="navbar__dropdown-item">
                      <Link
                        href="/orders"
                        className="navbar__dropdown-item-link"
                        onClick={() => setShowUserDropdown(false)}
                        prefetch={false}
                      >
                        My Orders
                      </Link>
                    </div>
                    {(user.role === "admin" || user.role === "super_admin") && (
                      <div className="navbar__dropdown-item">
                        <Link
                          href="/admin/dashboard"
                          className="navbar__dropdown-item-link"
                          onClick={() => setShowUserDropdown(false)}
                          prefetch={false}
                        >
                          Admin Dashboard
                        </Link>
                      </div>
                    )}
                    <div className="navbar__dropdown-item">
                      <button
                        onClick={handleLogout}
                        className="navbar__dropdown-item-link"
                        style={{
                          width: "100%",
                          textAlign: "left",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="navbar__actions-button navbar__actions-button--secondary"
                  prefetch={false}
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="navbar__actions-button navbar__actions-button--primary"
                  prefetch={false}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}

        {/* Shopping Cart */}
        <button className="navbar__actions-cart" aria-label="Shopping Cart">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          {cartItemCount > 0 && (
            <span className="navbar__actions-cart-badge">{cartItemCount}</span>
          )}
        </button>

        {/* Mobile Menu Toggle */}
        <button
          className="navbar__mobile-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isMobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="navbar__search-overlay" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="navbar__search-form">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="navbar__search-input"
              autoFocus
            />
            <button type="submit" className="navbar__search-submit">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="navbar__search-close"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      <div className={`navbar__mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="navbar__mobile-menu-content">
          {/* Mobile Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="navbar__mobile-menu-search"
          >
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="navbar__mobile-menu-search-input"
            />
          </form>

          {/* Mobile Navigation */}
          <ul className="navbar__mobile-menu-nav">
            {navigationItems.map((item) => (
              <li key={item.name} className="navbar__mobile-menu-nav-item">
                <Link
                  href={item.href}
                  className="navbar__mobile-menu-nav-item-link"
                  onClick={closeMobileMenu}
                >
                  {item.name}
                </Link>
              </li>
            ))}

            {/* Mobile Categories */}
            {categories && categories.length > 0 && (
              <>
                <li className="navbar__mobile-menu-nav-item">
                  <span className="navbar__mobile-menu-nav-item-link">
                    Categories:
                  </span>
                </li>
                {categories.slice(0, 6).map((category) => (
                  <li
                    key={category.id}
                    className="navbar__mobile-menu-nav-item"
                  >
                    <Link
                      href={`/category/${category.slug}`}
                      className="navbar__mobile-menu-nav-item-link"
                      onClick={closeMobileMenu}
                      style={{ paddingLeft: "1rem" }}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
                {categories.length > 6 && (
                  <li className="navbar__mobile-menu-nav-item">
                    <Link
                      href="/categories"
                      className="navbar__mobile-menu-nav-item-link"
                      onClick={closeMobileMenu}
                      style={{ paddingLeft: "1rem" }}
                    >
                      View All Categories
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>

          {/* Mobile Authentication */}
          <div className="navbar__mobile-menu-auth">
            {isAuthenticated && user ? (
              <>
                <div className="navbar__mobile-menu-user">
                  <span className="navbar__mobile-menu-user-name">
                    {user.name || user.email}
                  </span>
                </div>
                <Link
                  href="/profile"
                  className="navbar__actions-button navbar__actions-button--secondary"
                  onClick={closeMobileMenu}
                >
                  My Profile
                </Link>
                <Link
                  href="/orders"
                  className="navbar__actions-button navbar__actions-button--secondary"
                  onClick={closeMobileMenu}
                >
                  My Orders
                </Link>
                {(user.role === "admin" || user.role === "super_admin") && (
                  <Link
                    href="/admin/dashboard"
                    className="navbar__actions-button navbar__actions-button--secondary"
                    onClick={closeMobileMenu}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="navbar__actions-button navbar__actions-button--primary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="navbar__actions-button navbar__actions-button--secondary"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="navbar__actions-button navbar__actions-button--primary"
                  onClick={closeMobileMenu}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
