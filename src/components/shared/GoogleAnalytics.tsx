"use client";

import Script from "next/script";

type DataLayerEvent = Record<string, unknown>;
type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
    gtag?: GtagFn;
  }
}

// Google Tag Manager ID from environment variable
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
// Legacy GA4 support (optional)
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Mutually exclusive analytics mode selection:
// - If GTM is configured, GTM owns GA4 (do not also load gtag.js)
// - If GTM is not configured, fall back to GA4 via gtag.js
const USE_GTM = Boolean(GTM_ID);
const USE_GA = !USE_GTM && Boolean(GA_MEASUREMENT_ID);

export default function GoogleAnalytics() {
  if (!USE_GTM && !USE_GA) return null;

  return (
    <>
      {/*
        GTM is injected in the RootLayout (head + noscript) when configured.
        Keep this component responsible for GA4 gtag.js ONLY when GTM is absent.
      */}

      {/* GA4 via gtag (ONLY if GTM is NOT used) */}
      {USE_GA && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = window.gtag || gtag;
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                send_page_view: true,
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
        title="Google Tag Manager"
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}

// Helper to push events to dataLayer (used by GTM path)
const pushToDataLayer = (event: DataLayerEvent) => {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
  }
};

// Unified event helper (GA4-correct params; GTM vs GA is mutually exclusive)
export const trackEvent = (
  eventName: string,
  params?: Record<string, unknown>
) => {
  if (typeof window === "undefined") return;

  // GTM path
  if (USE_GTM) {
    pushToDataLayer({
      event: eventName,
      ...(params || {}),
    });
  }

  // GA-only path
  if (USE_GA) {
    window.gtag?.("event", eventName, params);
  }
};

// Track page views for client-side navigation
export const trackPageView = (url: string) => {
  if (typeof window === "undefined") return;

  // For GTM
  if (USE_GTM) {
    pushToDataLayer({
      event: "page_view",
      page_path: url,
    });
  }

  // For GA4
  if (USE_GA) {
    window.gtag?.("config", GA_MEASUREMENT_ID, {
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

  const payload = {
    currency: "USD",
    value: product.price ?? 0,
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
  if (USE_GTM) {
    pushToDataLayer({ event: "view_item", ecommerce: payload });
  }

  // For GA4
  if (USE_GA) {
    window.gtag?.("event", "view_item", payload);
  }
};

export const trackInquiry = (productName?: string) => {
  trackEvent("inquiry_submit", {
    product_name: productName || "general",
  });
};

export const trackContact = () => {
  trackEvent("contact_form_submit");
};
