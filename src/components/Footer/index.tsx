"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./index.module.css";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
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
  const copyright = settings?.footer?.copyright || `© ${currentYear} ${siteName}. All rights reserved.`;

  return (
    <footer className={styles.page}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand & Description */}
          <div className={styles.section}>
            <h3 className={styles.brand}>{siteName}</h3>
            {settings?.tagline && (
              <p className={styles.tagline}>{settings.tagline}</p>
            )}
            {settings?.footer?.description && (
              <p className={styles.description}>{settings.footer.description}</p>
            )}
          </div>

          {/* Quick Links */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Quick Links</h4>
            <nav className={styles.links}>
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
            <nav className={styles.links}>
              <Link href="/faq">FAQ</Link>
              <Link href="/contact">Help Center</Link>
              <Link href="/inquiries">My Inquiries</Link>
              <Link href="/sitemap">Sitemap</Link>
              {settings?.support?.whatsappNumber && (
                <a
                  href={`https://wa.me/${settings.support.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(settings.support.whatsappMessage || "Hello!")}`}
                  target="_blank"
                  rel="noopener noreferrer"
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
              <nav className={styles.links}>
                {legalDocs.map((doc, index) => (
                  <Link key={doc._id || `legal-${index}`} href={`/legal/${doc.slug}`}>
                    {doc.title}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* Contact Info */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Contact</h4>
            <div className={styles.contactInfo}>
              {settings?.contact?.email && (
                <a href={`mailto:${settings.contact.email}`} className={styles.contactItem}>
                  <Mail size={16} />
                  <span>{settings.contact.email}</span>
                </a>
              )}
              {settings?.contact?.phone && (
                <a href={`tel:${settings.contact.phone}`} className={styles.contactItem}>
                  <Phone size={16} />
                  <span>{settings.contact.phone}</span>
                </a>
              )}
              {settings?.contact?.address && (
                <div className={styles.contactItem}>
                  <MapPin size={16} />
                  <span>
                    {settings.contact.address}
                    {settings.contact.city && `, ${settings.contact.city}`}
                    {settings.contact.state && `, ${settings.contact.state}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Newsletter - Only show when user is logged in */}
        {user && (
          <div className={styles.newsletterSection}>
            <div className={styles.newsletterContent}>
              <div className={styles.newsletterInfo}>
                <h4 className={styles.newsletterTitle}>Subscribe to Our Newsletter</h4>
                <p className={styles.newsletterText}>
                  Get updates on new products, exclusive offers, and more.
                </p>
              </div>
              <form onSubmit={handleNewsletterSubmit} className={styles.newsletterForm}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.newsletterInput}
                  disabled={subscribing}
                />
                <button
                  type="submit"
                  className={styles.newsletterButton}
                  disabled={subscribing}
                  aria-label="Subscribe"
                >
                  {subscribing ? (
                    <Loader2 size={18} className={styles.spinner} />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Social Links */}
        {settings?.socialLinks && settings.socialLinks.length > 0 && (
          <div className={styles.socialSection}>
            <div className={styles.socialLinks}>
              {settings.socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={link.platform}
                >
                  {socialIcons[link.platform.toLowerCase()] || link.platform}
                </a>
              ))}
            </div>
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
