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

// GET - Get subscribers count and list, or check send status
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    const { searchParams } = new URL(request.url);

    // Check if this is a status check request
    const trackingId = searchParams.get("trackingId");
    if (trackingId) {
      const result = emailSendResults.get(trackingId);
      if (!result) {
        return NextResponse.json({
          success: false,
          error: "Tracking ID not found or expired",
        }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        trackingId,
        ...result,
        duration: result.completedAt
          ? result.completedAt - result.startedAt
          : Date.now() - result.startedAt,
      });
    }

    await connectDB();

    const emailType = searchParams.get("emailType") || "newsletter";

    // Filter based on email type
    // Use $ne: false to also match profiles where the field doesn't exist (defaults to true)
    const query = emailType === "newsletter"
      ? { "preferences.newsletter": { $ne: false } }
      : { "preferences.promotions": { $ne: false } };

    // Get all profiles with the specified preference enabled (or not explicitly disabled)
    const subscribedProfiles = await Profile.find(query)
      .select("name email preferences")
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

// Email send results tracking
interface EmailSendResult {
  status: "in_progress" | "completed";
  total: number;
  sent: number;
  failed: number;
  errors: string[];
  startedAt: number;
  completedAt?: number;
}

// Global tracking for background email sending (keyed by tracking ID)
const emailSendResults = new Map<string, EmailSendResult>();

// Clean up old results after 1 hour
function cleanupOldResults() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, value] of emailSendResults) {
    if (value.startedAt < oneHourAgo) {
      emailSendResults.delete(key);
    }
  }
}

// Get send results by tracking ID
export function getEmailSendResult(trackingId: string): EmailSendResult | null {
  return emailSendResults.get(trackingId) || null;
}

// Fire-and-forget email sending function with tracking
// Sends a single email with all recipients in BCC for efficiency and privacy
async function sendEmailsInBackground(
  profiles: any[],
  products: any[],
  subject: string,
  message: string,
  trackingId: string
) {
  const result: EmailSendResult = {
    status: "in_progress",
    total: profiles.length,
    sent: 0,
    failed: 0,
    errors: [],
    startedAt: Date.now(),
  };
  emailSendResults.set(trackingId, result);

  try {
    // Extract all email addresses
    const recipients = profiles.map((p: any) => p.email).filter(Boolean);

    if (recipients.length === 0) {
      result.failed = profiles.length;
      result.errors.push("No valid email addresses found");
    } else {
      // Generate HTML with generic greeting (since we're sending to multiple recipients)
      const html = generateProductEmailHtml(
        products as unknown as ProductInfo[],
        subject,
        message,
        "Valued Customer"
      );

      // Send single email with all recipients in BCC for privacy
      const emailResult = await sendEmail({
        to: recipients, // Pass array of all recipients
        subject,
        html,
        text: `${message}\n\nView products at: ${APP_URL}/products`,
      });

      if (emailResult.success) {
        result.sent = recipients.length;
        result.failed = 0;
      } else {
        result.sent = 0;
        result.failed = recipients.length;
        const errorMsg = emailResult.error instanceof Error
          ? emailResult.error.message
          : String(emailResult.error || "Unknown error");
        result.errors.push(`Bulk send failed: ${errorMsg}`);
      }
    }
  } catch (err) {
    result.failed = profiles.length;
    result.errors.push(`Bulk send error: ${err instanceof Error ? err.message : "Unknown error"}`);
    console.error("Failed to send bulk email:", err);
  }

  // Mark as completed
  result.status = "completed";
  result.completedAt = Date.now();

  // Log final results
  console.log(`Email send complete [${trackingId}]: ${result.sent} sent, ${result.failed} failed out of ${result.total}`);
  if (result.errors.length > 0) {
    console.log(`Email errors [${trackingId}]:`, result.errors);
  }

  // Cleanup old results periodically
  cleanupOldResults();
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
    // Use $ne: false to also match profiles where the field doesn't exist (defaults to true)
    const query = emailType === "newsletter"
      ? { "preferences.newsletter": { $ne: false } }
      : { "preferences.promotions": { $ne: false } };

    // Get all profiles with the specified preference enabled (or not explicitly disabled)
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

    // Generate a tracking ID for this send batch
    const trackingId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Fire and forget - start sending emails in background without awaiting
    sendEmailsInBackground(subscribedProfiles, products, subject, message, trackingId).catch(
      (err) => console.error("Background email sending error:", err)
    );

    // Return immediately with queued count and tracking ID
    return NextResponse.json({
      success: true,
      message: `Emails queued for ${subscribedProfiles.length} ${emailType} subscriber(s)`,
      queued: subscribedProfiles.length,
      products: products.length,
      emailType,
      trackingId, // Return tracking ID so frontend can poll for status
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
