import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

// Exchange rates relative to USD (fallback if API fails)
const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.5,
  CNY: 7.24,
};

// Fetch current exchange rates
async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD"
    );
    if (response.ok) {
      const data = await response.json();
      return data.rates;
    }
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
  }
  return DEFAULT_EXCHANGE_RATES;
}

// Convert price from one currency to another
function convertPrice(
  price: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return price;

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  // Convert: fromCurrency -> USD -> toCurrency
  const priceInUSD = price / fromRate;
  return priceInUSD * toRate;
}

// GET site settings
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const refreshRates = searchParams.get("refreshRates") === "true";

    let settings = await SiteSettings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await SiteSettings.create({
        siteName: "Furniture Store",
        contact: { email: "contact@example.com" },
      });
    }

    // If refreshRates is requested, fetch latest rates from external API and update
    let ratesUpdated = false;
    if (refreshRates) {
      try {
        const latestRates = await getExchangeRates();

        // Filter to only include our supported currencies
        const supportedCurrencies = ["USD", "INR", "EUR", "GBP", "AED", "SAR", "CAD", "AUD", "JPY", "CNY"];
        const filteredRates: Record<string, number> = {};

        for (const currency of supportedCurrencies) {
          if (latestRates[currency]) {
            filteredRates[currency] = Number(latestRates[currency].toFixed(4));
          } else {
            filteredRates[currency] = DEFAULT_EXCHANGE_RATES[currency] || 1;
          }
        }

        // Update the settings with new exchange rates
        settings.locale = {
          ...settings.locale,
          exchangeRates: filteredRates,
        };
        settings.markModified("locale");
        settings.markModified("locale.exchangeRates");
        await settings.save();

        ratesUpdated = true;
        console.log("Exchange rates updated from external API:", filteredRates);
      } catch (rateError) {
        console.error("Failed to refresh exchange rates:", rateError);
      }
    }

    // Convert to plain object and handle Map conversion
    const settingsObj = settings.toObject();

    // Handle exchangeRates Map conversion
    if (settingsObj.locale?.exchangeRates) {
      if (settingsObj.locale.exchangeRates instanceof Map) {
        settingsObj.locale.exchangeRates = Object.fromEntries(
          settingsObj.locale.exchangeRates
        );
      }
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...settingsObj,
        id: settingsObj._id?.toString(),
      },
      ratesUpdated,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// UPDATE site settings
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Find existing settings to check for currency change
    let settings = await SiteSettings.findOne();
    const oldCurrency = settings?.locale?.currency || "USD";
    const newCurrency = body.locale?.currency;

    // Check if currency is changing
    const isCurrencyChanging = newCurrency && newCurrency !== oldCurrency;

    if (!settings) {
      settings = new SiteSettings(body);
      await settings.save();
    } else {
      // Remove fields that shouldn't be updated
      const { _id, id, __v, createdAt, updatedAt, ...updateBody } = body;

      // Apply updates to the existing document
      Object.assign(settings, updateBody);

      // Mark locale as modified to ensure nested object changes are detected
      if (updateBody.locale) {
        settings.markModified("locale");
        settings.markModified("locale.exchangeRates");
      }

      // Mark about as modified to ensure nested object changes are detected
      if (updateBody.about) {
        settings.markModified("about");
        settings.markModified("about.services");
        settings.markModified("about.team");
      }

      await settings.save();
    }

    // If currency changed, bulk update all product prices
    if (isCurrencyChanging) {
      try {
        const rates = await getExchangeRates();

        // Get all products
        const products = await Product.find({});

        // Bulk update operations
        const bulkOps = products.map((product: any) => {
          const oldRetail = product.prices.retail || 0;
          const oldWholesale = product.prices.wholesale || 0;

          // Convert prices from old currency to new currency
          const newRetail = Number(
            convertPrice(oldRetail, oldCurrency, newCurrency, rates).toFixed(2)
          );
          const newWholesale = Number(
            convertPrice(oldWholesale, oldCurrency, newCurrency, rates).toFixed(
              2
            )
          );

          // Recalculate effective price
          const discount = product.prices.discount || 0;
          const newEffectivePrice = Number(
            (newRetail * (1 - discount / 100)).toFixed(2)
          );

          return {
            updateOne: {
              filter: { _id: product._id },
              update: {
                $set: {
                  "prices.retail": newRetail,
                  "prices.wholesale": newWholesale,
                  "prices.effectivePrice": newEffectivePrice,
                },
              },
            },
          };
        });

        if (bulkOps.length > 0) {
          await Product.bulkWrite(bulkOps);
          console.log(
            `Bulk updated ${bulkOps.length} products from ${oldCurrency} to ${newCurrency}`
          );
        }
      } catch (priceError) {
        console.error("Failed to bulk update product prices:", priceError);
        // Don't fail the settings update, just log the error
      }
    }

    // Revalidate all pages since settings affect the whole site
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/contact");
    revalidatePath("/faq");
    revalidatePath("/products");
    revalidatePath("/api/settings");
    revalidatePath("/api/products");

    const settingsObj = settings.toObject();

    return NextResponse.json({
      success: true,
      settings: {
        ...settingsObj,
        id: settings._id?.toString(),
      },
      pricesUpdated: isCurrencyChanging,
      currencyChanged: isCurrencyChanging
        ? { from: oldCurrency, to: newCurrency }
        : null,
    });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

// PATCH - partial update for specific sections
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { success: false, error: "Section and data are required" },
        { status: 400 }
      );
    }

    // Check for currency change if updating locale section
    let isCurrencyChanging = false;
    let oldCurrency = "USD";
    let newCurrency = "";

    if (section === "locale" && data.currency) {
      const existingSettings = await SiteSettings.findOne();
      oldCurrency = existingSettings?.locale?.currency || "USD";
      newCurrency = data.currency;
      isCurrencyChanging = newCurrency !== oldCurrency;
    }

    // Build update object using dot notation for nested fields
    const updateData: Record<string, any> = {};

    if (typeof data === "object" && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        updateData[`${section}.${key}`] = value;
      }
    } else {
      updateData[section] = data;
    }

    const settings = await SiteSettings.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true }
    );

    // If currency changed, bulk update all product prices
    if (isCurrencyChanging) {
      try {
        const rates = await getExchangeRates();

        // Get all products
        const products = await Product.find({});

        // Bulk update operations
        const bulkOps = products.map((product: any) => {
          const oldRetail = product.prices.retail || 0;
          const oldWholesale = product.prices.wholesale || 0;

          // Convert prices from old currency to new currency
          const newRetail = Number(
            convertPrice(oldRetail, oldCurrency, newCurrency, rates).toFixed(2)
          );
          const newWholesale = Number(
            convertPrice(oldWholesale, oldCurrency, newCurrency, rates).toFixed(
              2
            )
          );

          // Recalculate effective price
          const discount = product.prices.discount || 0;
          const newEffectivePrice = Number(
            (newRetail * (1 - discount / 100)).toFixed(2)
          );

          return {
            updateOne: {
              filter: { _id: product._id },
              update: {
                $set: {
                  "prices.retail": newRetail,
                  "prices.wholesale": newWholesale,
                  "prices.effectivePrice": newEffectivePrice,
                },
              },
            },
          };
        });

        if (bulkOps.length > 0) {
          await Product.bulkWrite(bulkOps);
          console.log(
            `Bulk updated ${bulkOps.length} products from ${oldCurrency} to ${newCurrency}`
          );
        }
      } catch (priceError) {
        console.error("Failed to bulk update product prices:", priceError);
      }
    }

    // Revalidate affected pages
    revalidatePath("/");
    revalidatePath("/api/settings");
    if (section === "about") revalidatePath("/about");
    if (section === "contact") revalidatePath("/contact");
    if (section === "faq") revalidatePath("/faq");
    if (section === "locale") {
      revalidatePath("/products");
      revalidatePath("/api/products");
    }

    // Convert Map to plain object for exchangeRates
    const settingsObjPatch = settings.toObject
      ? settings.toObject()
      : { ...settings };

    // Handle exchangeRates Map conversion
    if (settingsObjPatch.locale?.exchangeRates) {
      if (settingsObjPatch.locale.exchangeRates instanceof Map) {
        settingsObjPatch.locale.exchangeRates = Object.fromEntries(
          settingsObjPatch.locale.exchangeRates
        );
      }
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...settingsObjPatch,
        id: settings._id?.toString(),
      },
      pricesUpdated: isCurrencyChanging,
      currencyChanged: isCurrencyChanging
        ? { from: oldCurrency, to: newCurrency }
        : null,
    });
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
