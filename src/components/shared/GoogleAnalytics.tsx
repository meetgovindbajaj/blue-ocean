"use client";

import Script from "next/script";

// Google Tag Manager ID from environment variable
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
// Legacy GA4 support (optional)
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  // Return null if neither is configured
  if (!GTM_ID && !GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      {/* Google Tag Manager - Script (if configured) */}
      {GTM_ID && (
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
      )}

      {/* Google Analytics 4 - Script (if configured) */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}
    </>
  );
}

// GTM Noscript component - should be placed right after <body> tag
export function GoogleTagManagerNoscript() {
  if (!GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}

// Helper to push events to dataLayer (works with both GTM and GA4)
const pushToDataLayer = (event: Record<string, any>) => {
  if (typeof window !== "undefined") {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push(event);
  }
};

// Export gtag event helper for use throughout the app
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window === "undefined") return;

  // For GTM - push to dataLayer
  if (GTM_ID) {
    pushToDataLayer({
      event: action,
      event_category: category,
      event_label: label,
      value: value,
    });
  }

  // For GA4 - use gtag
  if (GA_MEASUREMENT_ID) {
    (window as any).gtag?.("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track page views for client-side navigation
export const trackPageView = (url: string) => {
  if (typeof window === "undefined") return;

  // For GTM
  if (GTM_ID) {
    pushToDataLayer({
      event: "page_view",
      page_path: url,
    });
  }

  // For GA4
  if (GA_MEASUREMENT_ID) {
    (window as any).gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track ecommerce events
export const trackProductView = (product: {
  id: string;
  name: string;
  category?: string;
  price?: number;
}) => {
  if (typeof window === "undefined") return;

  const eventData = {
    event: "view_item",
    currency: "USD",
    value: product.price || 0,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
      },
    ],
  };

  // For GTM
  if (GTM_ID) {
    pushToDataLayer(eventData);
  }

  // For GA4
  if (GA_MEASUREMENT_ID) {
    (window as any).gtag?.("event", "view_item", eventData);
  }
};

export const trackInquiry = (productName?: string) => {
  trackEvent("inquiry_submit", "engagement", productName || "general");
};

export const trackContact = () => {
  trackEvent("contact_form_submit", "engagement");
};
