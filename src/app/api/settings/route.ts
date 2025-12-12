import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

// GET public site settings (excludes sensitive data)
export async function GET() {
  try {
    await connectDB();

    let settings = await SiteSettings.findOne().lean();

    // Create default settings if none exist
    if (!settings) {
      const newSettings = await SiteSettings.create({
        siteName: "Furniture Store",
        contact: { email: "contact@example.com" },
      });
      settings = newSettings.toObject();
    }

    // Return only public-safe fields
    const publicSettings = {
      siteName: (settings as any).siteName,
      tagline: (settings as any).tagline,
      logo: (settings as any).logo,
      about: (settings as any).about,
      contact: {
        email: (settings as any).contact?.email,
        phone: (settings as any).contact?.phone,
        address: (settings as any).contact?.address,
        city: (settings as any).contact?.city,
        state: (settings as any).contact?.state,
        country: (settings as any).contact?.country,
        postalCode: (settings as any).contact?.postalCode,
        mapUrl: (settings as any).contact?.mapUrl,
      },
      socialLinks: (settings as any).socialLinks,
      businessHours: (settings as any).businessHours,
      footer: (settings as any).footer,
      seo: (settings as any).seo,
      support: {
        whatsappNumber: (settings as any).support?.whatsappNumber,
        whatsappMessage: (settings as any).support?.whatsappMessage,
      },
      locale: {
        ...(settings as any).locale,
        // Convert Map to plain object if needed
        exchangeRates: (settings as any).locale?.exchangeRates instanceof Map
          ? Object.fromEntries((settings as any).locale.exchangeRates)
          : (settings as any).locale?.exchangeRates || {},
      },
      faq: ((settings as any).faq || []).filter((item: any) => item.isActive !== false),
    };

    return NextResponse.json(
      {
        success: true,
        settings: publicSettings,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Public Settings GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
