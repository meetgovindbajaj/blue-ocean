import dbConnect from "@/lib/db";
import { buildPopulate } from "@/lib/functions";
import Category from "@/models/Category";
import { NextRequest, NextResponse } from "next/server";
import { QueryFilter } from "../products/route";

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const limit = searchParams.get("limit");
  const search = searchParams.get("search");
  const page = searchParams.get("page") || "1";
  // Input validation
  const limitNum = limit ? Math.min(Math.max(parseInt(limit), 1), 100) : 20;
  const pageNum = Math.max(parseInt(page), 1);
  const skip = (pageNum - 1) * limitNum;

  const query: QueryFilter = { isActive: true };
  // Search functionality with better sanitization
  if (search && search.trim()) {
    const sanitizedSearch = search
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } },
    ];
  }
  // Get total count for pagination
  const totalCount = await Category.countDocuments(query);

  const categoryQuery = Category.find(query)
    .select(
      "id name slug description parent image children isActive createdAt updatedAt"
    )
    .populate(buildPopulate())
    .populate("children", "id name slug")
    .sort({ name: 1 })
    .skip(skip)
    .limit(limitNum)
    .lean(); // Use lean() for better performance

  const categories = await categoryQuery;
  const response = NextResponse.json({
    success: true,
    categories,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(totalCount / limitNum),
    },
    filters: {
      category,
      search,
      sort: ["name"],
      limit: limitNum,
    },
  });
  return response;
}
