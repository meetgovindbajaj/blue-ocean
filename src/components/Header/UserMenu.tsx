"use client";

import { useState, useRef, useEffect } from "react";
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

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push("/");
  };

  const isAdmin = user?.role && ["admin", "super_admin", "moderator"].includes(user.role);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={20} className={styles.spinner} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.authButtons}>
        <Link href="/login" className={styles.loginButton}>
          <LogIn size={18} />
          <span>Login</span>
        </Link>
        <Link href="/register" className={styles.registerButton}>
          <UserPlus size={18} />
          <span>Sign Up</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={menuRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className={styles.avatar}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <User size={20} />
          )}
        </div>
        <span className={styles.userName}>{user.name.split(" ")[0]}</span>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <div className={styles.avatarLarge}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <User size={28} />
              )}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userNameFull}>{user.name}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          </div>

          <div className={styles.divider} />

          <nav className={styles.menu}>
            <Link href="/profile" className={styles.menuItem} onClick={() => setIsOpen(false)}>
              <User size={18} />
              <span>My Profile</span>
            </Link>
            <Link href="/settings" className={styles.menuItem} onClick={() => setIsOpen(false)}>
              <Settings size={18} />
              <span>Settings</span>
            </Link>
            <Link href="/inquiries" className={styles.menuItem} onClick={() => setIsOpen(false)}>
              <MessageSquare size={18} />
              <span>My Inquiries</span>
            </Link>

            {isAdmin && (
              <>
                <div className={styles.divider} />
                <Link href="/admin" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                  <Shield size={18} />
                  <span>Admin Panel</span>
                </Link>
              </>
            )}

            <div className={styles.divider} />

            <button className={styles.logoutButton} onClick={handleLogout}>
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
