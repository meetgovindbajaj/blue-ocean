import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Tag from "@/models/Tag";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "100");
    const page = parseInt(searchParams.get("page") || "1");

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

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
      isActive: tag.isActive,
      isFeatured: tag.isFeatured,
      order: tag.order,
      clicks: tag.clicks || 0,
      impressions: tag.impressions || 0,
      createdAt: tag.createdAt,
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
    console.error("Admin Tags GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const existing = await Tag.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A tag with this name already exists" },
        { status: 400 }
      );
    }

    const tag = new Tag({
      name: body.name,
      slug,
      description: body.description,
      image: body.image,
      logo: body.logo,
      website: body.website,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false,
      order: body.order ?? 0,
    });

    await tag.save();

    return NextResponse.json({
      success: true,
      tag: {
        id: tag._id?.toString(),
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        image: tag.image,
        logo: tag.logo,
        website: tag.website,
        isActive: tag.isActive,
        isFeatured: tag.isFeatured,
        order: tag.order,
        clicks: 0,
        impressions: 0,
        createdAt: tag.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin Tags POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create tag" },
      { status: 500 }
    );
  }
}
