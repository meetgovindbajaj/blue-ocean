"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./index.module.css";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface LegalDocument {
  _id: string;
  title: string;
  slug: string;
  type: string;
}

const socialIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook size={20} />,
  instagram: <Instagram size={20} />,
  twitter: <Twitter size={20} />,
  linkedin: <Linkedin size={20} />,
  youtube: <Youtube size={20} />,
};

const Footer = () => {
  const { settings, loading } = useSiteSettings();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [legalDocs, setLegalDocs] = useState<LegalDocument[]>([]);

  // Auto-fill email when user is logged in
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    const fetchLegalDocs = async () => {
      try {
        const response = await fetch("/api/legal-documents");
        const data = await response.json();
        if (data.success) {
          setLegalDocs(data.documents);
        }
      } catch (error) {
        console.error("Failed to fetch legal documents:", error);
      }
    };

    fetchLegalDocs();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setSubscribing(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <footer className={styles.page}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <div className={styles.section}>
              <Skeleton className="h-6 w-32 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className={styles.section}>
              <Skeleton className="h-5 w-24 mb-3" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-20" />
                ))}
              </div>
            </div>
            <div className={styles.section}>
              <Skeleton className="h-5 w-24 mb-3" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
            <div className={styles.section}>
              <Skeleton className="h-5 w-24 mb-3" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </footer>
    );
  }

  const currentYear = new Date().getFullYear();
  const siteName = settings?.siteName || "Furniture Store";
  const copyright =
    settings?.footer?.copyright ||
    `© ${currentYear} ${siteName}. All rights reserved.`;

  return (
    <footer className={styles.page} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand & Description */}
          <div className={styles.section}>
            <h3 className={styles.brand}>{siteName}</h3>
            {settings?.tagline && (
              <p className={styles.tagline}>{settings.tagline}</p>
            )}
            {settings?.footer?.description && (
              <p className={styles.description}>
                {settings.footer.description}
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Quick Links</h4>
            <nav className={styles.links} aria-label="Quick links">
              <Link href="/">Home</Link>
              <Link href="/products">Products</Link>
              <Link href="/categories">Categories</Link>
              <Link href="/about">About Us</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </div>

          {/* Support Links */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Support</h4>
            <nav className={styles.links} aria-label="Support links">
              <Link href="/faq">FAQ</Link>
              <Link href="/contact">Help Center</Link>
              <Link href="/inquiries">My Inquiries</Link>
              <Link href="/sitemaps">Sitemap</Link>
              {settings?.support?.whatsappNumber && (
                <a
                  href={`https://wa.me/${settings.support.whatsappNumber.replace(
                    /[^0-9]/g,
                    ""
                  )}?text=${encodeURIComponent(
                    settings.support.whatsappMessage || "Hello!"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contact us on WhatsApp (opens in new tab)"
                >
                  WhatsApp Support
                </a>
              )}
            </nav>
          </div>

          {/* Legal Links */}
          {legalDocs.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Legal</h4>
              <nav className={styles.links} aria-label="Legal documents">
                {legalDocs.map((doc, index) => (
                  <Link
                    key={doc._id || `legal-${index}`}
                    href={`/legal/${doc.slug}`}
                  >
                    {doc.title}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* Contact Info */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Contact</h4>
            <address className={styles.contactInfo}>
              {settings?.contact?.email && (
                <a
                  href={`mailto:${settings.contact.email}`}
                  className={styles.contactItem}
                  aria-label={`Email us at ${settings.contact.email}`}
                >
                  <Mail size={16} aria-hidden="true" />
                  <span>{settings.contact.email}</span>
                </a>
              )}
              {settings?.contact?.phone && (
                <a
                  href={`tel:${settings.contact.phone}`}
                  className={styles.contactItem}
                  aria-label={`Call us at ${settings.contact.phone}`}
                >
                  <Phone size={16} aria-hidden="true" />
                  <span>{settings.contact.phone}</span>
                </a>
              )}
              {settings?.contact?.address && (
                <div className={styles.contactItem}>
                  <MapPin size={16} aria-hidden="true" />
                  <span>
                    {settings.contact.address}
                    {settings.contact.city && `, ${settings.contact.city}`}
                    {settings.contact.state && `, ${settings.contact.state}`}
                  </span>
                </div>
              )}
            </address>
          </div>
        </div>

        {/* Newsletter - Only show when user is logged in */}
        {user && (
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
        )}

        {/* Social Links */}
        {settings?.socialLinks && settings.socialLinks.length > 0 && (
          <div className={styles.socialSection}>
            <nav className={styles.socialLinks} aria-label="Social media links">
              {settings.socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={`Follow us on ${link.platform} (opens in new tab)`}
                >
                  <span aria-hidden="true">
                    {socialIcons[link.platform.toLowerCase()] || link.platform}
                  </span>
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Copyright */}
        <div className={styles.copyright}>
          <p>{copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
