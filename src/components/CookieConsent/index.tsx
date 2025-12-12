"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Cookie, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./index.module.css";

const COOKIE_CONSENT_KEY = "cookie_consent_accepted";
const CONSENT_EXPIRY_DAYS = 365;

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if consent was already given
    const consentData = localStorage.getItem(COOKIE_CONSENT_KEY);

    if (consentData) {
      try {
        const { accepted, expiry } = JSON.parse(consentData);
        const now = new Date().getTime();

        // If consent exists and hasn't expired, don't show banner
        if (accepted && expiry > now) {
          setShowBanner(false);
          return;
        }
      } catch {
        // Invalid data, show banner
      }
    }

    // Small delay to prevent flash on page load
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    const expiry = new Date().getTime() + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ accepted: true, expiry })
    );
    setShowBanner(false);
  };

  const handleDismiss = () => {
    // Just dismiss without storing - will show again on next visit
    setShowBanner(false);
  };

  // Don't render anything on server or if banner shouldn't show
  if (!mounted || !showBanner) {
    return null;
  }

  return (
    <div className={styles.banner}>
      <div className={styles.container}>
        <div className={styles.iconWrapper}>
          <Cookie className={styles.icon} />
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <Shield size={18} />
            <h3 className={styles.title}>Cookie Notice</h3>
          </div>
          <p className={styles.description}>
            We use cookies and similar technologies to enhance your browsing experience,
            analyze site traffic, and personalize content. By continuing to use our website,
            you consent to our use of cookies.
          </p>
          <p className={styles.learnMore}>
            Learn more about how we use cookies in our{" "}
            <Link href="/legal/terms-and-conditions" className={styles.link}>
              Terms & Conditions
            </Link>
            {" "}and{" "}
            <Link href="/legal/privacy-policy" className={styles.link}>
              Privacy Policy
            </Link>.
          </p>
        </div>

        <div className={styles.actions}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className={styles.dismissBtn}
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className={styles.acceptBtn}
          >
            Accept Cookies
          </Button>
        </div>

        <button
          onClick={handleDismiss}
          className={styles.closeBtn}
          aria-label="Close cookie notice"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
