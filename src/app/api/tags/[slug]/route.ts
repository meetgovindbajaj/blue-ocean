import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Tag from "@/models/Tag";

// GET - Get single tag by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const tag = await Tag.findOne({ slug, isActive: true }).lean();

    if (!tag) {
      return NextResponse.json(
        { success: false, error: "Tag not found" },
        { status: 404 }
      );
    }

    // Increment impressions
    await Tag.findByIdAndUpdate((tag as any)._id, { $inc: { impressions: 1 } });

    return NextResponse.json({
      success: true,
      tag: {
        id: (tag as any).id || (tag as any)._id?.toString(),
        name: (tag as any).name,
        slug: (tag as any).slug,
        description: (tag as any).description,
        image: (tag as any).image,
        logo: (tag as any).logo,
        website: (tag as any).website,
        isFeatured: (tag as any).isFeatured,
      },
    });
  } catch (error) {
    console.error("Tag GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tag" },
      { status: 500 }
    );
  }
}
