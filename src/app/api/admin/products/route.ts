import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { getAuthUser, isAdmin, hasPermission, Permissions, unauthorizedResponse, forbiddenResponse } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const isActive = searchParams.get("isActive");

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (isActive !== null && isActive !== "") {
      query.isActive = isActive === "true";
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "id name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      products: products.map((p: any) => ({
        ...p,
        id: p.id || p._id?.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin Products GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth and permission check
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!await hasPermission(request, Permissions.PRODUCTS_CREATE)) {
      return forbiddenResponse("You don't have permission to create products");
    }

    await connectDB();

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.category) {
      return NextResponse.json(
        { success: false, error: "Name and category are required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Check for duplicate slug
    const existing = await Product.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A product with this slug already exists" },
        { status: 400 }
      );
    }

    const product = new Product({
      ...body,
      slug,
    });

    await product.save();

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/categories");
    revalidatePath("/api/products");
    revalidatePath("/api/recommendations");

    return NextResponse.json({
      success: true,
      product: {
        ...product.toJSON(),
        id: product.id || product._id?.toString(),
      },
    });
  } catch (error) {
    console.error("Admin Products POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
