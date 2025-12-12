import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Profile from "@/models/Profile";
import Product from "@/models/Product";
import { sendEmail } from "@/lib/email";
import {
  getAuthUser,
  isAdmin,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface ProductInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  prices: {
    retail: number;
  };
  images: Array<{
    url: string;
    thumbnailUrl?: string;
    isThumbnail?: boolean;
  }>;
}

function generateProductEmailHtml(
  products: ProductInfo[],
  subject: string,
  message: string,
  recipientName: string
): string {
  const productCards = products
    .map((product) => {
      const thumbnail =
        product.images?.find((img) => img.isThumbnail)?.url ||
        product.images?.[0]?.url ||
        "";
      const price = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(product.prices?.retail || 0);

      return `
      <tr>
        <td style="padding: 15px 0; border-bottom: 1px solid #eee;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 120px; vertical-align: top;">
                ${
                  thumbnail
                    ? `<img src="${thumbnail}" alt="${product.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;" />`
                    : `<div style="width: 100px; height: 100px; background-color: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #999;">No Image</span>
                  </div>`
                }
              </td>
              <td style="padding-left: 15px; vertical-align: top;">
                <h3 style="margin: 0 0 8px; color: #333; font-size: 16px;">${product.name}</h3>
                <p style="margin: 0 0 8px; color: #666; font-size: 14px; line-height: 1.4;">
                  ${product.description?.substring(0, 100)}${product.description?.length > 100 ? "..." : ""}
                </p>
                <p style="margin: 0 0 12px; color: #3b82f6; font-weight: bold; font-size: 18px;">${price}</p>
                <a href="${APP_URL}/products/${product.slug}" style="display: inline-block; padding: 8px 16px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px;">
                  View Product
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #3b82f6; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${subject}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 40px 20px;">
                  <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                    Hi ${recipientName},
                  </p>
                  <p style="margin: 16px 0 0; color: #666; font-size: 16px; line-height: 1.6;">
                    ${message.replace(/\n/g, "<br>")}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 30px;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    ${productCards}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; text-align: center;">
                  <a href="${APP_URL}/products" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Browse All Products
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                    You received this email because you subscribed to product updates.<br/>
                    <a href="${APP_URL}/settings" style="color: #3b82f6;">Manage your preferences</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// GET - Get subscribers count and list
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const emailType = searchParams.get("emailType") || "newsletter";

    // Filter based on email type
    const query = emailType === "newsletter"
      ? { "preferences.newsletter": true }
      : { "preferences.promotions": true };

    // Get all profiles with the specified preference enabled
    const subscribedProfiles = await Profile.find(query)
      .select("name email")
      .lean();

    return NextResponse.json({
      success: true,
      count: subscribedProfiles.length,
      emailType,
      subscribers: subscribedProfiles.map((p: any) => ({
        name: p.name,
        email: p.email,
      })),
    });
  } catch (error) {
    console.error("Get subscribers error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}

// Fire-and-forget email sending function
async function sendEmailsInBackground(
  profiles: any[],
  products: any[],
  subject: string,
  message: string
) {
  for (const profile of profiles) {
    try {
      const html = generateProductEmailHtml(
        products as unknown as ProductInfo[],
        subject,
        message,
        profile.name || "Valued Customer"
      );

      await sendEmail({
        to: profile.email,
        subject,
        html,
        text: `${message}\n\nView products at: ${APP_URL}/products`,
      });
    } catch (err) {
      console.error(`Failed to send email to ${profile.email}:`, err);
    }
  }
}

// POST - Send product notification email (fire and forget)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    await connectDB();

    const body = await request.json();
    const { productIds, subject, message, emailType = "newsletter" } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one product is required" },
        { status: 400 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Fetch products
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .select("id name slug description prices images")
      .lean();

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid products found" },
        { status: 400 }
      );
    }

    // Filter based on email type - newsletter or promotion subscribers
    const query = emailType === "newsletter"
      ? { "preferences.newsletter": true }
      : { "preferences.promotions": true };

    // Get all profiles with the specified preference enabled
    const subscribedProfiles = await Profile.find(query)
      .select("name email")
      .lean();

    if (subscribedProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No ${emailType} subscribers to send emails to`,
        queued: 0,
      });
    }

    // Fire and forget - start sending emails in background without awaiting
    sendEmailsInBackground(subscribedProfiles, products, subject, message).catch(
      (err) => console.error("Background email sending error:", err)
    );

    // Return immediately with queued count
    return NextResponse.json({
      success: true,
      message: `Emails queued for ${subscribedProfiles.length} ${emailType} subscriber(s)`,
      queued: subscribedProfiles.length,
      products: products.length,
      emailType,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
