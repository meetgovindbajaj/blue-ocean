import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();
    const newProduct = new Product(data);
    await newProduct.save();
    return NextResponse.json(newProduct);
  } catch (error: unknown) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Create Product Error:", error.message);
    } else {
      console.error("Create Product Error:", error);
    }
    return NextResponse.json(
      { message: "Server error", error: errorMessage },
      { status: 500 }
    );
  }
}

// ✅ Check if category exists
// const categoryExists = await Category.findById(category);
// if (!categoryExists) {
//   return NextResponse.json(
//     { message: "Invalid category" },
//     { status: 400 }
//   );
// }

// ✅ Validate required fields
// if (
//   !name ||
//   !slug ||
//   !description ||
//   !prices?.retail ||
//   !category ||
//   !images?.length
// ) {
//   return NextResponse.json(
//     { message: "Missing required fields" },
//     { status: 400 }
//   );
// }
