import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import HeroBanner from "@/models/HeroBanner";

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

    await HeroBanner.findByIdAndUpdate(id, { $inc: { clicks: 1 } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Banner click tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track click" },
      { status: 500 }
    );
  }
}
