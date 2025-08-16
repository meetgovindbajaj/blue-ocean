"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "@/styles/footer.scss";

const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubscribing(true);
    try {
      // Handle newsletter subscription
      console.log("Subscribing email:", email);
      // You would typically make an API call here
      setEmail("");
      // Show success message
    } catch (error) {
      console.error("Newsletter subscription failed:", error);
      // Show error message
    } finally {
      setIsSubscribing(false);
    }
  };

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: "Categories", href: "/categories" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Blog", href: "/blog" },
  ];

  const supportLinks = [
    { name: "Help Center", href: "/help" },
    { name: "Shipping Info", href: "/shipping" },
    { name: "Returns", href: "/returns" },
    { name: "Size Guide", href: "/size-guide" },
    { name: "Care Instructions", href: "/care" },
    { name: "FAQ", href: "/faq" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Refund Policy", href: "/refund" },
  ];

  const socialLinks = [
    {
      name: "Facebook",
      href: "https://facebook.com/blueoceanexport",
      icon: (
        <svg
          className="footer__social-link-icon"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "https://instagram.com/blueoceanexport",
      icon: (
        <svg
          className="footer__social-link-icon"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297L3.182 17.635l1.944-1.944c-.807-.875-1.297-2.026-1.297-3.323 0-2.734 2.215-4.949 4.949-4.949s4.949 2.215 4.949 4.949c0 2.734-2.215 4.949-4.949 4.949z" />
        </svg>
      ),
    },
    {
      name: "Twitter",
      href: "https://twitter.com/blueoceanexport",
      icon: (
        <svg
          className="footer__social-link-icon"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/blueoceanexport",
      icon: (
        <svg
          className="footer__social-link-icon"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__content">
          {/* Company Information */}
          <div className="footer__section footer__section--company">
            <Link href="/" className="footer__brand">
              <Image
                src="/images/logo-cropped.png"
                alt="Blue Ocean Export"
                width={40}
                height={40}
                className="footer__brand-logo"
              />
              <span className="footer__brand-text">Blue Ocean Export</span>
            </Link>
            <p className="footer__section-description">
              Premium quality solid wood furniture crafted with precision and
              care. We specialize in exporting high-quality wooden furniture
              that combines traditional craftsmanship with modern design.
            </p>
            <div className="footer__social">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="footer__social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer__section">
            <h3 className="footer__section-title">Quick Links</h3>
            <ul className="footer__links">
              {quickLinks.map((link) => (
                <li key={link.name} className="footer__links-item">
                  <Link href={link.href} className="footer__links-item-link">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer__section">
            <h3 className="footer__section-title">Support</h3>
            <ul className="footer__links">
              {supportLinks.map((link) => (
                <li key={link.name} className="footer__links-item">
                  <Link href={link.href} className="footer__links-item-link">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="footer__section">
            <h3 className="footer__section-title">Contact Us</h3>
            <div className="footer__contact">
              <div className="footer__contact-item">
                <svg
                  className="footer__contact-item-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <div className="footer__contact-item-text">
                  123 Export Street
                  <br />
                  Furniture District
                  <br />
                  Mumbai, India 400001
                </div>
              </div>
              <div className="footer__contact-item">
                <svg
                  className="footer__contact-item-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
                <div className="footer__contact-item-text">
                  +91 98765 43210
                  <br />
                  +91 98765 43211
                </div>
              </div>
              <div className="footer__contact-item">
                <svg
                  className="footer__contact-item-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <div className="footer__contact-item-text">
                  info@blueoceanexport.com
                  <br />
                  sales@blueoceanexport.com
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <h4
              className="footer__section-title"
              style={{ marginTop: "2rem", fontSize: "1.1rem" }}
            >
              Newsletter
            </h4>
            <p className="footer__section-description">
              Subscribe to get updates on new products and exclusive offers.
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="footer__newsletter-form"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="footer__newsletter-input"
                required
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="footer__newsletter-button"
              >
                {isSubscribing ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer__bottom">
          <div className="footer__bottom-copyright">
            © {new Date().getFullYear()} Blue Ocean Export. All rights reserved.
          </div>
          <ul className="footer__bottom-links">
            {legalLinks.map((link) => (
              <li key={link.name} className="footer__bottom-links-item">
                <Link
                  href={link.href}
                  className="footer__bottom-links-item-link"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
