import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const data = await req.json();
    const updated = await Category.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("parent", "id name slug");
    return NextResponse.json(updated);
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
