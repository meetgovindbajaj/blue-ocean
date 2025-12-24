"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import styles from "./index.module.css";

export default function FooterNewsletterClient() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  if (!user) return null;

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setSubscribing(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.alreadySubscribed) {
          toast.info(data.message);
        } else {
          toast.success(data.message);
          setEmail("");
        }
      } else {
        toast.error(data.error || "Failed to subscribe");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div
      className={styles.newsletterSection}
      role="region"
      aria-labelledby="newsletter-title"
    >
      <div className={styles.newsletterContent}>
        <div className={styles.newsletterInfo}>
          <h4 id="newsletter-title" className={styles.newsletterTitle}>
            Subscribe to Our Newsletter
          </h4>
          <p className={styles.newsletterText}>
            Get updates on new products, exclusive offers, and more.
          </p>
        </div>

        <form
          onSubmit={handleNewsletterSubmit}
          className={styles.newsletterForm}
          aria-label="Newsletter subscription"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address for newsletter
          </label>
          <input
            id="newsletter-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.newsletterInput}
            disabled={subscribing}
            aria-describedby="newsletter-description"
            required
          />
          <span id="newsletter-description" className="sr-only">
            Enter your email to receive our newsletter with updates on new
            products and exclusive offers
          </span>
          <button
            type="submit"
            className={styles.newsletterButton}
            disabled={subscribing}
            aria-label={
              subscribing ? "Subscribing..." : "Subscribe to newsletter"
            }
          >
            {subscribing ? (
              <Loader2
                size={18}
                className={styles.spinner}
                aria-hidden="true"
              />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
