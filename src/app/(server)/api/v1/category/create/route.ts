import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await dbConnect();
  const data = await req.json();
  const newCategory = new Category(data);
  await newCategory.save();
  return NextResponse.json(newCategory);
}
