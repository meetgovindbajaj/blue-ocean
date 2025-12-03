import { NextRequest, NextResponse } from "next/server";
import HeroBanner from "@/models/HeroBanner";
import dbConnect from "@/lib/db";
import { generateCtaLink, transformBanner, transformBanners } from "@/lib/transformers/heroBanner";

// CREATE new banner
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Banner name is required" },
        { status: 400 }
      );
    }

    if (!body.image?.url || !body.image?.id) {
      return NextResponse.json(
        { success: false, error: "Banner image is required" },
        { status: 400 }
      );
    }

    // Transform image to match schema requirements
    const mobileUrl = body.image.mobileUrl;
    body.image = {
      id: body.image.id,
      name: body.image.name || body.image.alt || "Banner Image",
      url: body.image.url,
      thumbnailUrl: body.image.thumbnailUrl || body.image.url || "",
      isThumbnail: body.image.isThumbnail ?? false,
      downloadUrl: body.image.downloadUrl || "",
      size: body.image.size || 0,
      width: body.image.width || 0,
      height: body.image.height || 0,
    };

    // Transform mobileImage if provided
    if (mobileUrl) {
      body.mobileImage = {
        id: `mobile-${body.image.id}`,
        name: "Mobile Banner",
        url: mobileUrl,
        thumbnailUrl: mobileUrl,
        isThumbnail: false,
        downloadUrl: "",
        size: 0,
        width: 0,
        height: 0,
      };
    }

    // Auto-generate ctaLink if not provided
    if (!body.content?.ctaLink) {
      body.content = {
        ...body.content,
        ctaLink: generateCtaLink(body),
      };
    }

    const banner = new HeroBanner(body);
    await banner.save();

    // Populate and transform for consistent response
    const populated = await HeroBanner.findById(banner._id)
      .populate("content.productId", "name slug prices images")
      .populate("content.categoryId", "name slug image")
      .lean();

    return NextResponse.json({
      success: true,
      banner: transformBanner(populated, true),
    });
  } catch (error) {
    console.error("Create banner error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create banner" },
      { status: 500 }
    );
  }
}

// GET all banners (admin view)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status"); // active, inactive, scheduled, expired

    const query: any = {};
    const now = new Date();

    if (status === "active") {
      query.isActive = true;
      query.$or = [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: null, endDate: null },
      ];
    } else if (status === "inactive") {
      query.isActive = false;
    } else if (status === "scheduled") {
      query.startDate = { $gt: now };
    } else if (status === "expired") {
      query.endDate = { $lt: now };
    }

    const [rawBanners, total] = await Promise.all([
      HeroBanner.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("content.productId", "name slug prices images")
        .populate("content.categoryId", "name slug image")
        .lean(),
      HeroBanner.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      banners: transformBanners(rawBanners, true),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get banners error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}
