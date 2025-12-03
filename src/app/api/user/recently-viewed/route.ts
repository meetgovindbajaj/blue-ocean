import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Profile from "@/models/Profile";
import Product from "@/models/Product";
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from "@/lib/apiAuth";

// GET /api/user/recently-viewed - Get user's recently viewed products
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    await dbConnect();

    const user = await User.findById(authUser.userId).select("profile").lean();
    if (!user?.profile) {
      return errorResponse("Profile not found", 404);
    }

    const profile = await Profile.findById(user.profile)
      .select("recentlyViewed")
      .populate({
        path: "recentlyViewed",
        select: "name slug images price salePrice",
        options: { limit: 10 },
      })
      .lean();

    // Format products with proper thumbnail URLs
    const products = (profile?.recentlyViewed || []).map((product: any) => ({
      _id: product._id?.toString(),
      name: product.name,
      slug: product.slug,
      price: product.price,
      salePrice: product.salePrice,
      image: product.images?.[0]?.thumbnailUrl || product.images?.[0]?.url || null,
    }));

    return successResponse({
      products,
    });
  } catch (error) {
    console.error("Get recently viewed error:", error);
    return errorResponse("Failed to get recently viewed products");
  }
}
