"use server";
import { cache } from "react";
import Link from "next/link";
import styles from "./index.module.css";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import connectDB from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import LegalDocument from "@/models/LegalDocument";
import FooterNewsletterClient from "./FooterNewsletterClient";

interface PublicLegalDocument {
  title: string;
  slug: string;
  type: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

const socialIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook size={20} />,
  instagram: <Instagram size={20} />,
  twitter: <Twitter size={20} />,
  linkedin: <Linkedin size={20} />,
  youtube: <Youtube size={20} />,
};

const getFooterData = cache(async () => {
  try {
    await connectDB();

    let settings = await SiteSettings.findOne().lean();

    if (!settings) {
      const created = await SiteSettings.create({
        siteName: "Furniture Store",
        contact: { email: "contact@example.com" },
      });
      settings = created.toObject();
    }

    const legalDocs = await LegalDocument.find({ isVisible: true })
      .select("type title slug order")
      .sort({ order: 1 })
      .lean();

    return {
      settings: settings as any,
      legalDocs: (legalDocs as any[]).map((doc) => ({
        type: doc.type,
        title: doc.title,
        slug: doc.slug,
      })) as PublicLegalDocument[],
    };
  } catch (error) {
    console.error("Failed to fetch footer data:", error);
    return {
      settings: null as any,
      legalDocs: [] as PublicLegalDocument[],
    };
  }
});

const Footer = async () => {
  const { settings, legalDocs } = await getFooterData();

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
                    key={doc.slug || `legal-${index}`}
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

        {/* Newsletter (client-only interaction, server-rendered markup) */}
        <FooterNewsletterClient />

        {/* Social Links */}
        {settings?.socialLinks && settings.socialLinks.length > 0 && (
          <div className={styles.socialSection}>
            <nav className={styles.socialLinks} aria-label="Social media links">
              {(settings.socialLinks as SocialLink[]).map(
                (link, index: number) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label={`Follow us on ${link.platform} (opens in new tab)`}
                  >
                    <span aria-hidden="true">
                      {socialIcons[link.platform.toLowerCase()] ||
                        link.platform}
                    </span>
                    <span className="sr-only">
                      Follow us on {link.platform}
                    </span>
                  </a>
                )
              )}
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
