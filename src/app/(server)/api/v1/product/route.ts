import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  const products = await Product.find()
    .select(
      "id name slug description prices images category isActive createdAt updatedAt"
    )
    .populate("category", "id name slug")
    .sort({ createdAt: -1 });
  return NextResponse.json(products);
}
