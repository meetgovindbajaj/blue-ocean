"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./UserMenu.module.css";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  ChevronDown,
  Loader2,
  MessageSquare,
} from "lucide-react";

const UserMenu = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuItemsRef = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [router]);

  // Focus management and keyboard navigation
  useEffect(() => {
    if (isOpen && menuItemsRef.current[0]) {
      menuItemsRef.current[0]?.focus();
      setFocusedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen) return;

    const items = menuItemsRef.current.filter(Boolean);
    const itemCount = items.length;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < itemCount - 1 ? prev + 1 : 0;
          items[next]?.focus();
          return next;
        });
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : itemCount - 1;
          items[next]?.focus();
          return next;
        });
        break;
      case "Home":
        event.preventDefault();
        items[0]?.focus();
        setFocusedIndex(0);
        break;
      case "End":
        event.preventDefault();
        items[itemCount - 1]?.focus();
        setFocusedIndex(itemCount - 1);
        break;
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        // Allow tab to close menu naturally
        setIsOpen(false);
        break;
    }
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push("/");
  };

  const isAdmin = user?.role && ["admin", "super_admin", "moderator"].includes(user.role);

  if (loading) {
    return (
      <div className={styles.loading} role="status" aria-label="Loading user menu">
        <Loader2 size={20} className={styles.spinner} aria-hidden="true" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.authButtons} role="group" aria-label="Authentication options">
        <Link href="/login" className={styles.loginButton}>
          <LogIn size={18} aria-hidden="true" />
          <span>Login</span>
        </Link>
        <Link href="/register" className={styles.registerButton}>
          <UserPlus size={18} aria-hidden="true" />
          <span>Sign Up</span>
        </Link>
      </div>
    );
  }

  // Build menu items array for keyboard navigation
  let menuItemIndex = 0;

  return (
    <div className={styles.container} ref={menuRef}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`User menu for ${user.name}`}
        id="user-menu-button"
      >
        <div className={styles.avatar}>
          {user.avatar ? (
            <img src={user.avatar} alt="" aria-hidden="true" />
          ) : (
            <User size={20} aria-hidden="true" />
          )}
        </div>
        <span className={styles.userName}>{user.name.split(" ")[0]}</span>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className={styles.dropdown}
          role="menu"
          aria-labelledby="user-menu-button"
          onKeyDown={handleKeyDown}
        >
          <div className={styles.userInfo} aria-label="User information">
            <div className={styles.avatarLarge}>
              {user.avatar ? (
                <img src={user.avatar} alt={`${user.name}'s profile picture`} />
              ) : (
                <User size={28} aria-hidden="true" />
              )}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userNameFull}>{user.name}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          </div>

          <div className={styles.divider} role="separator" />

          <nav className={styles.menu} aria-label="User menu options">
            <Link
              href="/profile"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
              role="menuitem"
              ref={(el) => { menuItemsRef.current[menuItemIndex++] = el; }}
            >
              <User size={18} aria-hidden="true" />
              <span>My Profile</span>
            </Link>
            <Link
              href="/settings"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
              role="menuitem"
              ref={(el) => { menuItemsRef.current[menuItemIndex++] = el; }}
            >
              <Settings size={18} aria-hidden="true" />
              <span>Settings</span>
            </Link>
            <Link
              href="/inquiries"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
              role="menuitem"
              ref={(el) => { menuItemsRef.current[menuItemIndex++] = el; }}
            >
              <MessageSquare size={18} aria-hidden="true" />
              <span>My Inquiries</span>
            </Link>

            {isAdmin && (
              <>
                <div className={styles.divider} role="separator" />
                <Link
                  href="/admin"
                  className={styles.menuItem}
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  ref={(el) => { menuItemsRef.current[menuItemIndex++] = el; }}
                >
                  <Shield size={18} aria-hidden="true" />
                  <span>Admin Panel</span>
                </Link>
              </>
            )}

            <div className={styles.divider} role="separator" />

            <button
              className={styles.logoutButton}
              onClick={handleLogout}
              role="menuitem"
              ref={(el) => { menuItemsRef.current[menuItemIndex++] = el; }}
              aria-label="Log out of your account"
            >
              <LogOut size={18} aria-hidden="true" />
              <span>Log Out</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
