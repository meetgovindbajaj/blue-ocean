"use client";

import Script from "next/script";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
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
  );
}

// Export gtag event helper for use throughout the app
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== "undefined" && GA_MEASUREMENT_ID) {
    (window as any).gtag?.("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track page views for client-side navigation
export const trackPageView = (url: string) => {
  if (typeof window !== "undefined" && GA_MEASUREMENT_ID) {
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
  if (typeof window !== "undefined" && GA_MEASUREMENT_ID) {
    (window as any).gtag?.("event", "view_item", {
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
    });
  }
};

export const trackInquiry = (productName?: string) => {
  trackEvent("inquiry_submit", "engagement", productName || "general");
};

export const trackContact = () => {
  trackEvent("contact_form_submit", "engagement");
};
