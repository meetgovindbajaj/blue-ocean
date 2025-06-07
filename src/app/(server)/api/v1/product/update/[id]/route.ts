import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await dbConnect();
  const data = await req.json();
  const updated = await Product.findByIdAndUpdate(id, data, {
    new: true,
  });
  return NextResponse.json(updated);
}
