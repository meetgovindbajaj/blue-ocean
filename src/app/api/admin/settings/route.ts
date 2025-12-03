import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

// GET site settings
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

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        id: (settings as any)._id?.toString(),
      },
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

    // Find existing or create new
    let settings = await SiteSettings.findOne();

    if (!settings) {
      settings = new SiteSettings(body);
    } else {
      // Update with new values
      Object.assign(settings, body);
    }

    await settings.save();

    // Revalidate all pages since settings affect the whole site
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/contact");
    revalidatePath("/faq");

    return NextResponse.json({
      success: true,
      settings: {
        ...settings.toObject(),
        id: settings._id?.toString(),
      },
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

    // Revalidate affected pages
    revalidatePath("/");
    if (section === "about") revalidatePath("/about");
    if (section === "contact") revalidatePath("/contact");

    return NextResponse.json({
      success: true,
      settings: {
        ...settings.toObject(),
        id: settings._id?.toString(),
      },
    });
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
