import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await dbConnect();
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted)
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ message: "Product deleted successfully" });
}
