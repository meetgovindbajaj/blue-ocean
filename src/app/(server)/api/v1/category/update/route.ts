import dbConnect from "@/lib/db";
import { buildPopulate } from "@/lib/functions";
import Category from "@/models/Category";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const { categories }: { categories: { id: string; isActive: boolean }[] } =
      await req.json();

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: "No category IDs provided" },
        { status: 400 }
      );
    }
    await dbConnect();
    const results = [];

    for (const category of categories) {
      const updated = await Category.findByIdAndUpdate(
        category.id,
        { isActive: category.isActive },
        {
          new: true,
        }
      )
        .populate(buildPopulate())
        .populate("children", "id name slug");
      results.push(updated);
    }
    return NextResponse.json({
      message: `${results.length} categories updated`,
      data: results,
    });
  } catch (error: unknown) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Update Category Error:", error.message);
    } else {
      console.error("Update Category Error:", error);
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
