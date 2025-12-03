import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import connectDB from "@/lib/db";
import Category from "@/models/Category";
import { Types } from "mongoose";

// Helper to revalidate category-related caches
const revalidateCategories = () => {
  try {
    revalidatePath("/", "page");
    revalidatePath("/categories", "page");
  } catch (e) {
    // Ignore revalidation errors in development
  }
};

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

    const category = await Category.findOne({
      $or: query,
    })
      .populate("parent", "id name slug")
      .lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category: {
        ...(category as any),
        id: (category as any).id || (category as any)._id?.toString(),
      },
    });
  } catch (error) {
    console.error("Admin Category GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch category" },
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

    if (body.slug) {
      const excludeQuery: any = { slug: body.slug, id: { $ne: id } };
      if (Types.ObjectId.isValid(id)) {
        excludeQuery._id = { $ne: new Types.ObjectId(id) };
      }
      const existing = await Category.findOne(excludeQuery);
      if (existing) {
        return NextResponse.json(
          { success: false, error: "A category with this slug already exists" },
          { status: 400 }
        );
      }
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

    const updateQuery: any[] = [{ id }];
    if (Types.ObjectId.isValid(id)) {
      updateQuery.push({ _id: new Types.ObjectId(id) });
    }

    // Get the current category to compare parent/children changes
    const currentCategory = await Category.findOne({ $or: updateQuery });
    if (!currentCategory) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Track parent and children changes before update
    const oldParentId = currentCategory.parent?.toString() || null;
    const newParentId =
      body.parent !== undefined ? body.parent?.toString() || null : oldParentId; // If parent not in body, keep old value
    const parentChanged =
      body.parent !== undefined && oldParentId !== newParentId;

    const oldChildren = (currentCategory.children || []).map((c: any) =>
      c.toString()
    );
    const newChildren =
      body.children !== undefined
        ? (body.children || []).map((c: any) => c.toString())
        : oldChildren; // If children not in body, keep old value
    const childrenChanged =
      body.children !== undefined &&
      JSON.stringify(oldChildren.sort()) !== JSON.stringify(newChildren.sort());

    // Handle parent change BEFORE updating the category
    if (parentChanged) {
      // Remove from old parent's children array
      if (oldParentId) {
        await Category.findByIdAndUpdate(
          oldParentId,
          { $pull: { children: currentCategory._id } },
          { new: true }
        );
      }
      // Add to new parent's children array
      if (newParentId) {
        await Category.findByIdAndUpdate(
          newParentId,
          { $addToSet: { children: currentCategory._id } },
          { new: true }
        );
      }
    }

    // Handle children change BEFORE updating the category
    if (childrenChanged) {
      const removedChildren = oldChildren.filter(
        (c: string) => !newChildren.includes(c)
      );
      const addedChildren = newChildren.filter(
        (c: string) => !oldChildren.includes(c)
      );

      // Set removed children's parent to null
      if (removedChildren.length > 0) {
        await Category.updateMany(
          { _id: { $in: removedChildren } },
          { $set: { parent: null } }
        );
      }

      // Set added children's parent to this category
      if (addedChildren.length > 0) {
        // Also remove these children from their previous parents' children arrays
        const addedCats = await Category.find({
          _id: { $in: addedChildren },
        }).select("parent");
        for (const addedCat of addedCats) {
          if (
            addedCat.parent &&
            addedCat.parent.toString() !== currentCategory._id.toString()
          ) {
            await Category.findByIdAndUpdate(addedCat.parent, {
              $pull: { children: addedCat._id },
            });
          }
        }

        // Now set the parent of added children
        await Category.updateMany(
          { _id: { $in: addedChildren } },
          { $set: { parent: currentCategory._id } }
        );
      }
    }

    // Update the category (skip middleware since we handled parent/children above)
    // @ts-ignore - _skipMiddleware is a custom option for our middleware
    const category = await Category.findOneAndUpdate(
      { $or: updateQuery },
      body,
      { new: true, runValidators: true, _skipMiddleware: true }
    ).populate("parent", "id name slug");

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Revalidate cached pages
    revalidateCategories();

    return NextResponse.json({
      success: true,
      category: {
        ...category.toJSON(),
        id: category.id || category._id?.toString(),
      },
    });
  } catch (error) {
    console.error("Admin Category PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
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

    const category = await Category.findOne({
      $or: deleteQuery,
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    await category.deleteOne();

    // Revalidate cached pages
    revalidateCategories();

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Admin Category DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
