import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const category = await Category.findById(id);
    if (!category)
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    await category.deleteOne();
    return NextResponse.json({ message: "Deleted" });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("Delete Category Error:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
