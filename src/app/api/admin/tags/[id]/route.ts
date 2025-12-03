import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Tag from "@/models/Tag";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const tag = await Tag.findById(id).lean();

    if (!tag) {
      return NextResponse.json(
        { success: false, error: "Tag not found" },
        { status: 404 }
      );
    }

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
        isActive: (tag as any).isActive,
        isFeatured: (tag as any).isFeatured,
        order: (tag as any).order,
        clicks: (tag as any).clicks || 0,
        impressions: (tag as any).impressions || 0,
        createdAt: (tag as any).createdAt,
      },
    });
  } catch (error) {
    console.error("Admin Tag GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tag" },
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

    // Check if slug exists on different tag
    const existing = await Tag.findOne({ slug, _id: { $ne: id } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A tag with this name already exists" },
        { status: 400 }
      );
    }

    const updateData: any = {
      name: body.name,
      slug,
    };

    if (body.description !== undefined) updateData.description = body.description;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
    if (body.order !== undefined) updateData.order = body.order;

    const tag = await Tag.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!tag) {
      return NextResponse.json(
        { success: false, error: "Tag not found" },
        { status: 404 }
      );
    }

    // Revalidate cached pages
    revalidatePath("/");
    revalidatePath("/api/tags");

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
        clicks: tag.clicks || 0,
        impressions: tag.impressions || 0,
      },
    });
  } catch (error) {
    console.error("Admin Tag PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update tag" },
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

    const tag = await Tag.findByIdAndDelete(id);

    if (!tag) {
      return NextResponse.json(
        { success: false, error: "Tag not found" },
        { status: 404 }
      );
    }

    // Revalidate cached pages
    revalidatePath("/");
    revalidatePath("/api/tags");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Tag DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
