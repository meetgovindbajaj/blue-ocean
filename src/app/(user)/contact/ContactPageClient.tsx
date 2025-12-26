"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Loader2,
  Search,
  X,
  ChevronDown,
  Package,
  Share2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Globe,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import FaqPreview from "@/components/shared/FaqPreview";

interface ProductOption {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

// Helper function to get the appropriate icon for each social platform
const getSocialIcon = (platform: string) => {
  const platformLower = platform.toLowerCase();
  if (platformLower.includes("facebook")) return Facebook;
  if (platformLower.includes("twitter") || platformLower.includes("x"))
    return Twitter;
  if (platformLower.includes("instagram")) return Instagram;
  if (platformLower.includes("linkedin")) return Linkedin;
  if (platformLower.includes("youtube")) return Youtube;
  return Globe;
};

// Helper function to format platform name for display
const formatPlatformName = (platform: string) => {
  return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
};

const ContactPageInner = () => {
  const { settings, loading } = useSiteSettings();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    productId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [paramsInitialized, setParamsInitialized] = useState(false);
  const [userInitialized, setUserInitialized] = useState(false);

  // Product select state
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(
    null
  );
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const formSectionRef = useRef<HTMLElement>(null);

  // Fetch products for the dropdown
  const fetchProducts = useCallback(async () => {
    if (products.length > 0) return; // Already fetched

    setProductsLoading(true);
    try {
      const response = await fetch("/api/products?limit=500&isActive=true");
      const data = await response.json();
      if (data.success) {
        setProducts(
          data.products.map((p: any) => ({
            id: p.id || p._id,
            name: p.name,
            slug: p.slug,
            image: p.images?.[0]?.thumbnailUrl || p.images?.[0]?.url,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setProductsLoading(false);
    }
  }, [products.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prefill form with URL params (from product page) - run once
  useEffect(() => {
    if (paramsInitialized) return;

    const productName = searchParams.get("product");
    const productId = searchParams.get("productId");
    const urlSubject = searchParams.get("subject");
    const urlMessage = searchParams.get("message");

    if (productName || productId || urlSubject || urlMessage) {
      setFormData((prev) => ({
        ...prev,
        subject:
          urlSubject ||
          (productName || productId ? "Product Question" : prev.subject),
        message:
          urlMessage ||
          (productName
            ? `Hi, I'm interested in "${productName}". `
            : prev.message),
        productId: productId || prev.productId,
      }));

      // If we have a productId from URL, we need to fetch products and select it
      if (productId) {
        fetchProducts();
      }
    }

    setParamsInitialized(true);
  }, [searchParams, paramsInitialized, fetchProducts]);

  // Auto-scroll to form section when there are search params
  useEffect(() => {
    const hasScrollParams =
      searchParams.has("product") ||
      searchParams.has("productId") ||
      searchParams.has("subject") ||
      searchParams.has("message") ||
      searchParams.has("scroll");

    if (hasScrollParams && !loading && formSectionRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        formSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [searchParams, loading]);

  // Auto-select product from URL after products are loaded
  useEffect(() => {
    if (formData.productId && products.length > 0 && !selectedProduct) {
      const product = products.find((p) => p.id === formData.productId);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [formData.productId, products, selectedProduct]);

  // Fetch products when subject changes to "Product Question"
  useEffect(() => {
    if (formData.subject === "Product Question") {
      fetchProducts();
    }
  }, [formData.subject, fetchProducts]);

  // Prefill form with user info - run when user loads
  useEffect(() => {
    if (userInitialized || authLoading) return;

    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }

    setUserInitialized(true);
  }, [user, authLoading, userInitialized]);

  // Filter products based on search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Handle product selection
  const handleProductSelect = (product: ProductOption) => {
    setSelectedProduct(product);
    setFormData((prev) => ({ ...prev, productId: product.id }));
    setProductSearch("");
    setShowProductDropdown(false);

    // Update message if it's empty or is the default template
    if (
      !formData.message ||
      formData.message.startsWith("Hi, I'm interested in")
    ) {
      setFormData((prev) => ({
        ...prev,
        message: `Hi, I'm interested in "${product.name}". `,
      }));
    }
  };

  // Clear product selection
  const handleClearProduct = () => {
    setSelectedProduct(null);
    setFormData((prev) => ({ ...prev, productId: "" }));
    setProductSearch("");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to send a message");
      return;
    }

    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.message.length < 10) {
      toast.error("Message must be at least 10 characters");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setFormData({
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",
          subject: "",
          message: "",
          productId: "",
        });
        setSelectedProduct(null);
        setProductSearch("");
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingSkeleton}>
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
              <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contact = settings?.contact || {};
  const support = settings?.support || {};
  const siteName = settings?.siteName || "Our Company";

  const getWhatsAppLink = () => {
    if (!support.whatsappNumber) return null;
    const phone = support.whatsappNumber.replace(/\D/g, "");
    const message = encodeURIComponent(
      support.whatsappMessage || "Hello! I have a question."
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  const fullAddress = [
    contact.address,
    contact.city,
    contact.state,
    contact.postalCode,
    contact.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.title}>Contact Us</h1>
          <p className={styles.subtitle}>
            We&apos;d love to hear from you. Get in touch with us.
          </p>
        </section>

        <div className={styles.content}>
          {/* Contact Information */}
          <section className={styles.infoSection}>
            <h2 className={styles.sectionTitle}>Get in Touch</h2>

            <div className={styles.contactCards}>
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className={styles.contactCard}
                >
                  <div className={styles.cardIcon}>
                    <Mail size={24} />
                  </div>
                  <div className={styles.cardContent}>
                    <h3>Email</h3>
                    <p>{contact.email}</p>
                  </div>
                </a>
              )}

              {contact.phone && (
                <a href={`tel:${contact.phone}`} className={styles.contactCard}>
                  <div className={styles.cardIcon}>
                    <Phone size={24} />
                  </div>
                  <div className={styles.cardContent}>
                    <h3>Phone</h3>
                    <p>{contact.phone}</p>
                    {contact.alternatePhone && (
                      <p className={styles.secondary}>
                        {contact.alternatePhone}
                      </p>
                    )}
                  </div>
                </a>
              )}

              {fullAddress && (
                <div className={styles.contactCard}>
                  <div className={styles.cardIcon}>
                    <MapPin size={24} />
                  </div>
                  <div className={styles.cardContent}>
                    <h3>Address</h3>
                    <p>{fullAddress}</p>
                  </div>
                </div>
              )}

              {support.whatsappNumber && (
                <a
                  href={getWhatsAppLink() || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.contactCard} ${styles.whatsapp}`}
                >
                  <div className={styles.cardIcon}>
                    <MessageCircle size={24} />
                  </div>
                  <div className={styles.cardContent}>
                    <h3>WhatsApp</h3>
                    <p>{support.whatsappNumber}</p>
                  </div>
                </a>
              )}
            </div>

            {/* Business Hours */}
            {settings?.businessHours && settings.businessHours.length > 0 && (
              <div className={styles.businessHours}>
                <h3 className={styles.hoursTitle}>
                  <Clock size={20} />
                  Business Hours
                </h3>
                <div className={styles.hoursList}>
                  {settings.businessHours.map((hours: any, index: number) => (
                    <div key={index} className={styles.hoursItem}>
                      <span className={styles.day}>{hours.day}</span>
                      <span className={styles.time}>
                        {hours.isClosed
                          ? "Closed"
                          : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {settings?.socialLinks && settings.socialLinks.length > 0 && (
              <div className={styles.socialSection}>
                <h3 className={styles.socialTitle}>
                  <Share2 size={20} />
                  Connect With Us
                </h3>
                <div className={styles.socialLinks}>
                  {settings.socialLinks.map((link: any, index: number) => {
                    const IconComponent = getSocialIcon(link.platform);
                    return (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                      >
                        <IconComponent size={20} />
                        <span>{formatPlatformName(link.platform)}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Contact Form */}
          <section ref={formSectionRef} className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Send Us a Message</h2>

            {/* Login Required Notice */}
            {!authLoading && !user && (
              <div className={styles.loginRequired}>
                <div className={styles.loginRequiredContent}>
                  <LogIn size={24} />
                  <div>
                    <h3>Login Required</h3>
                    <p>
                      Please login to send us a message. This helps us serve you
                      better and track your inquiries.
                    </p>
                  </div>
                </div>
                <Link
                  href="/login?redirect=/contact"
                  className={styles.loginButton}
                >
                  Login to Continue
                </Link>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className={`${styles.form} ${
                !user && !authLoading ? styles.formDisabled : ""
              }`}
            >
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>
                    Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className={styles.input}
                    disabled={submitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your email"
                    className={styles.input}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.label}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                    className={styles.input}
                    disabled={submitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="subject" className={styles.label}>
                    Subject <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={styles.select}
                    disabled={submitting}
                  >
                    <option value="">Select a subject</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Product Question">Product Question</option>
                    <option value="Order Support">Order Support</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Product Select - shown when subject is "Product Question" */}
              {formData.subject === "Product Question" && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Select Product</label>
                  <div
                    className={styles.productSelectContainer}
                    ref={productDropdownRef}
                  >
                    {selectedProduct ? (
                      <div className={styles.selectedProduct}>
                        <div className={styles.selectedProductInfo}>
                          {selectedProduct.image ? (
                            <Image
                              src={selectedProduct.image}
                              alt={selectedProduct.name}
                              width={40}
                              height={40}
                              className={styles.selectedProductImage}
                            />
                          ) : (
                            <div className={styles.selectedProductPlaceholder}>
                              <Package size={20} />
                            </div>
                          )}
                          <span className={styles.selectedProductName}>
                            {selectedProduct.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearProduct}
                          className={styles.clearProductButton}
                          disabled={submitting}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={styles.productSearchWrapper}
                        onClick={() => {
                          setShowProductDropdown(true);
                          productInputRef.current?.focus();
                        }}
                      >
                        <Search
                          size={18}
                          className={styles.productSearchIcon}
                        />
                        <input
                          ref={productInputRef}
                          type="text"
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          placeholder="Search for a product..."
                          className={styles.productSearchInput}
                          disabled={submitting}
                        />
                        <ChevronDown
                          size={18}
                          className={styles.productSearchChevron}
                        />
                      </div>
                    )}

                    {showProductDropdown && !selectedProduct && (
                      <div className={styles.productDropdown}>
                        {productsLoading ? (
                          <div className={styles.productDropdownLoading}>
                            <Loader2 size={20} className={styles.spinner} />
                            <span>Loading products...</span>
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className={styles.productDropdownEmpty}>
                            {productSearch
                              ? "No products found"
                              : "No products available"}
                          </div>
                        ) : (
                          <div className={styles.productDropdownList}>
                            {filteredProducts.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                className={styles.productDropdownItem}
                                onClick={() => handleProductSelect(product)}
                              >
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    width={36}
                                    height={36}
                                    className={styles.productDropdownItemImage}
                                  />
                                ) : (
                                  <div
                                    className={
                                      styles.productDropdownItemPlaceholder
                                    }
                                  >
                                    <Package size={18} />
                                  </div>
                                )}
                                <span
                                  className={styles.productDropdownItemName}
                                >
                                  {product.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.label}>
                  Message <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  className={styles.textarea}
                  rows={5}
                  disabled={submitting}
                />
                <p className={styles.hint}>
                  {formData.message.length}/1000 characters (minimum 10)
                </p>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={submitting || !user}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    Sending...
                  </>
                ) : !user ? (
                  <>
                    <LogIn size={18} />
                    Login to Send
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Map Section */}
          {contact.mapUrl && (
            <section className={styles.mapSection}>
              <h2 className={styles.sectionTitle}>Find Us</h2>
              <div className={styles.mapContainer}>
                <iframe
                  src={contact.mapUrl}
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${siteName} Location`}
                />
              </div>
            </section>
          )}

          <section className={styles.faqSection}>
            <FaqPreview
              variant="inline"
              title="Frequently Asked Questions"
              subtitle="Quick answers before you message us"
            />
          </section>
        </div>
      </div>
    </div>
  );
};

// Wrap in Suspense for useSearchParams
const ContactPageClient = () => {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.loadingSkeleton}>
              <Skeleton className="h-10 w-64 mx-auto mb-4" />
              <Skeleton className="h-5 w-96 mx-auto mb-8" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ContactPageInner />
    </Suspense>
  );
};

export default ContactPageClient;
