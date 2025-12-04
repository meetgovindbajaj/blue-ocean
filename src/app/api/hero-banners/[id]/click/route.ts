import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import HeroBanner from "@/models/HeroBanner";
import { trackEvent, getClientIp } from "@/lib/analytics";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid banner ID" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get banner details for analytics
    const banner = await HeroBanner.findById(id).select("name").lean();

    // Update the direct counter on the banner
    await HeroBanner.findByIdAndUpdate(id, { $inc: { clicks: 1 } });

    // Also track via analytics system for proper reporting
    const ip = getClientIp(request);
    await trackEvent({
      eventType: "banner_click",
      entityType: "banner",
      entityId: id,
      entityName: (banner as any)?.name || "Unknown Banner",
      ip,
      skipDedup: true, // Count all banner clicks
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Banner click tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track click" },
      { status: 500 }
    );
  }
}
