"use client";

import { useState, useEffect, useMemo } from "react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useCurrency, CURRENCIES } from "@/context/CurrencyContext";
import {
  Share2,
  DollarSign,
  MessageCircle,
  Mail,
  X,
  Check,
  ChevronUp,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Menu,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import styles from "./FloatingActions.module.css";

export default function FloatingActions() {
  const { settings } = useSiteSettings();
  const { currency, setUserCurrency, loading: currencyLoading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Filter currencies based on exchange rates configured in site settings
  const availableCurrencies = useMemo(() => {
    const exchangeRates = settings?.locale?.exchangeRates;
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
      // If no exchange rates configured, show all currencies
      return CURRENCIES;
    }
    // Only show currencies that have exchange rates configured
    return CURRENCIES.filter((curr) => exchangeRates[curr.code] !== undefined);
  }, [settings?.locale?.exchangeRates]);

  // Track scroll position for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getWhatsAppLink = () => {
    if (!settings?.support?.whatsappNumber) return null;
    const phone = settings.support.whatsappNumber.replace(/\D/g, "");
    const message = encodeURIComponent(
      settings.support?.whatsappMessage || "Hello! I have a question."
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${title}%20${url}`;
        break;
      case "copy":
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
        setShowShareMenu(false);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
      setShowShareMenu(false);
    }
  };

  const handleCurrencyChange = async (currencyCode: string) => {
    await setUserCurrency(currencyCode);
    setShowCurrencyDialog(false);
    toast.success(`Currency changed to ${currencyCode}`);
  };

  const whatsappLink = getWhatsAppLink();

  return (
    <>
      {/* Main Floating Button Container */}
      <div className={styles.container}>
        {/* Scroll to top button - shown above main button when menu is closed */}
        {showScrollTop && !isOpen && (
          <button
            onClick={scrollToTop}
            className={`${styles.menuItem} ${styles.scrollTopClosed}`}
            aria-label="Scroll to top"
          >
            <ChevronUp size={20} />
          </button>
        )}

        {/* Expanded Menu Items */}
        <div className={`${styles.menu} ${isOpen ? styles.menuOpen : ""}`}>
          {/* Scroll to top - inside menu when open */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className={`${styles.menuItem} ${styles.scrollTopOpen}`}
              aria-label="Scroll to top"
            >
              <ChevronUp size={20} />
            </button>
          )}

          {/* Share Button */}
          <div className={styles.menuItemWrapper}>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`${styles.menuItem} ${styles.share}`}
              aria-label="Share"
            >
              <Share2 size={20} />
            </button>
            {/* Share submenu */}
            {showShareMenu && (
              <div className={styles.shareSubmenu}>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.shareOption}
                  aria-label="Share on Facebook"
                  onClick={() => setShowShareMenu(false)}
                >
                  <Facebook size={18} />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(typeof window !== 'undefined' ? document.title : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.shareOption}
                  aria-label="Share on Twitter"
                  onClick={() => setShowShareMenu(false)}
                >
                  <Twitter size={18} />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.shareOption}
                  aria-label="Share on LinkedIn"
                  onClick={() => setShowShareMenu(false)}
                >
                  <Linkedin size={18} />
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(typeof window !== 'undefined' ? document.title + ' ' + window.location.href : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.shareOption}
                  aria-label="Share on WhatsApp"
                  onClick={() => setShowShareMenu(false)}
                >
                  <MessageCircle size={18} />
                </a>
                <button
                  onClick={() => handleShare("copy")}
                  className={styles.shareOption}
                  aria-label="Copy link"
                >
                  <LinkIcon size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Currency Changer */}
          <button
            onClick={() => setShowCurrencyDialog(true)}
            className={`${styles.menuItem} ${styles.currency}`}
            aria-label="Change currency"
          >
            <DollarSign size={20} />
          </button>

          {/* WhatsApp */}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.menuItem} ${styles.whatsapp}`}
              aria-label="Contact on WhatsApp"
            >
              <MessageCircle size={20} />
            </a>
          )}

          {/* Contact/Inquiry */}
          <a
            href="/contact"
            className={`${styles.menuItem} ${styles.inquiry}`}
            aria-label="Contact us"
          >
            <Mail size={20} />
          </a>
        </div>

        {/* Main Toggle Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowShareMenu(false);
          }}
          className={`${styles.mainButton} ${isOpen ? styles.mainButtonOpen : ""}`}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Currency Selection Dialog */}
      <Dialog open={showCurrencyDialog} onOpenChange={setShowCurrencyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Currency</DialogTitle>
            <DialogDescription>
              Choose your preferred currency for viewing prices
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {availableCurrencies.map((curr) => (
              <Button
                key={curr.code}
                variant={currency === curr.code ? "default" : "outline"}
                className="justify-start gap-2"
                onClick={() => handleCurrencyChange(curr.code)}
                disabled={currencyLoading}
              >
                <span className="text-lg">{curr.symbol}</span>
                <span className="flex-1 text-left">{curr.code}</span>
                {currency === curr.code && <Check size={16} />}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
