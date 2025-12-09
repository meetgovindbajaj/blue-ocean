import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Tag from "@/models/Tag";

export const dynamic = "force-dynamic";

// GET - List tags (public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    // const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    const query: any = { isActive: true };

    // if (featured === "true") {
    //   query.isFeatured = true;
    // }

    const [tags, total] = await Promise.all([
      Tag.find(query)
        .sort({ order: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Tag.countDocuments(query),
    ]);

    const transformedTags = tags.map((tag: any) => ({
      id: tag.id || tag._id?.toString(),
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      image: tag.image,
      logo: tag.logo,
      website: tag.website,
      isFeatured: tag.isFeatured,
    }));

    return NextResponse.json({
      success: true,
      tags: transformedTags,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Tags GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
