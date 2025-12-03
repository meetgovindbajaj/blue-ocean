import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { Types } from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const query: any[] = [{ id }];
    if (Types.ObjectId.isValid(id)) {
      query.push({ _id: new Types.ObjectId(id) });
    }

    const product = await Product.findOne({
      $or: query,
    })
      .populate("category", "id name slug")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        ...(product as any),
        id: (product as any).id || (product as any)._id?.toString(),
      },
    });
  } catch (error) {
    console.error("Admin Product GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // If slug is being changed, check for duplicates
    if (body.slug) {
      const excludeQuery: any = { slug: body.slug, id: { $ne: id } };
      if (Types.ObjectId.isValid(id)) {
        excludeQuery._id = { $ne: new Types.ObjectId(id) };
      }
      const existing = await Product.findOne(excludeQuery);
      if (existing) {
        return NextResponse.json(
          { success: false, error: "A product with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Handle nested objects (prices, size) with dot notation for partial updates
    const updateData: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (key === "prices" && typeof value === "object" && value !== null) {
        // Use dot notation for prices to preserve other price fields
        for (const [priceKey, priceValue] of Object.entries(value as Record<string, any>)) {
          updateData[`prices.${priceKey}`] = priceValue;
        }
      } else if (key === "size" && typeof value === "object" && value !== null) {
        // Use dot notation for size to preserve other size fields
        for (const [sizeKey, sizeValue] of Object.entries(value as Record<string, any>)) {
          updateData[`size.${sizeKey}`] = sizeValue;
        }
      } else {
        updateData[key] = value;
      }
    }

    const updateQuery: any[] = [{ id }];
    if (Types.ObjectId.isValid(id)) {
      updateQuery.push({ _id: new Types.ObjectId(id) });
    }

    const product = await Product.findOneAndUpdate(
      { $or: updateQuery },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("category", "id name slug");

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Revalidate cached pages
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/api/products");
    revalidatePath("/api/recommendations");
    revalidatePath("/api/hero-banners");

    return NextResponse.json({
      success: true,
      product: {
        ...product.toJSON(),
        id: product.id || product._id?.toString(),
      },
    });
  } catch (error) {
    console.error("Admin Product PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const deleteQuery: any[] = [{ id }];
    if (Types.ObjectId.isValid(id)) {
      deleteQuery.push({ _id: new Types.ObjectId(id) });
    }

    const product = await Product.findOneAndDelete({
      $or: deleteQuery,
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Revalidate cached pages
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/api/products");
    revalidatePath("/api/recommendations");
    revalidatePath("/api/hero-banners");

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Admin Product DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
