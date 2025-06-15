import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const { ids }: { ids: string[] } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No category IDs provided" },
        { status: 400 }
      );
    }
    await dbConnect();
    const categories = await Category.find({ _id: { $in: ids } });
    if (categories.length === 0) {
      return NextResponse.json(
        { error: "No matching categories found" },
        { status: 404 }
      );
    }
    for (const cat of categories) {
      await cat.deleteOne(); // triggers your pre-delete hook
    }

    return NextResponse.json({
      message: `${categories.length} categories deleted`,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("Delete Category Error:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
