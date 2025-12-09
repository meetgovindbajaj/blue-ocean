import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Tag from "@/models/Tag";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const active = searchParams.get("active");
    const limit = parseInt(searchParams.get("limit") || "100");
    const page = parseInt(searchParams.get("page") || "1");

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (active === "true") {
      query.isActive = true;
    } else if (active === "false") {
      query.isActive = false;
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
      logo: tag.logo,
      website: tag.website,
      isActive: tag.isActive,
      order: tag.order,
      clicks: tag.clicks || 0,
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
      logo: body.logo,
      website: body.website,
      isActive: body.isActive ?? true,
      // order is auto-set by pre-save hook
    });

    await tag.save();

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/api/tags");

    return NextResponse.json({
      success: true,
      tag: {
        id: tag._id?.toString(),
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        logo: tag.logo,
        website: tag.website,
        isActive: tag.isActive,
        order: tag.order,
        clicks: 0,
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
