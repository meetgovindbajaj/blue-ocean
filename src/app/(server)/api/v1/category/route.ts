import dbConnect from "@/lib/db";
import { buildPopulate } from "@/lib/functions";
import Category from "@/models/Category";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  const categories = await Category.find()
    .populate(buildPopulate())
    .populate("children", "id name slug")
    .sort({ name: 1 });
  return NextResponse.json(categories);
}
