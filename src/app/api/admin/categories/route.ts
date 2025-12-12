import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Category from "@/models/Category";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== null && isActive !== "") {
      query.isActive = isActive === "true";
    }

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      Category.find(query)
        .populate("parent", "id name slug")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Category.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      categories: categories.map((c: any) => ({
        ...c,
        id: c.id || c._id?.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin Categories GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
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

    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A category with this slug already exists" },
        { status: 400 }
      );
    }

    // Ensure image has required fields if provided
    if (body.image) {
      body.image = {
        ...body.image,
        isThumbnail: body.image.isThumbnail ?? true,
        name: body.image.name || "",
        thumbnailUrl: body.image.thumbnailUrl || body.image.url || "",
        downloadUrl: body.image.downloadUrl || "",
        size: body.image.size || 0,
        width: body.image.width || 0,
        height: body.image.height || 0,
      };
    }

    const category = new Category({
      ...body,
      slug,
    });

    await category.save();

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/products");
    revalidatePath("/api/categories");

    return NextResponse.json({
      success: true,
      category: {
        ...category.toJSON(),
        id: category.id || category._id?.toString(),
      },
    });
  } catch (error) {
    console.error("Admin Categories POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    );
  }
}
