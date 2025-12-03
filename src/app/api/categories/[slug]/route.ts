import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import { trackEvent, getClientIp } from "@/lib/analytics";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    const category = await Category.findOne({ slug, isActive: true })
      .populate("parent", "id name slug image")
      .populate({
        path: "children",
        select: "id name slug image description isActive",
        match: { isActive: true },
      })
      .lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Track category view using unified analytics
    try {
      const ip = getClientIp(request);
      const userId = request.headers.get("x-user-id");
      const userAgent = request.headers.get("user-agent") || "";
      const referer = request.headers.get("referer") || "";

      // Fire-and-forget: track view
      trackEvent({
        eventType: "category_view",
        entityType: "category",
        entityId: (category as any)._id.toString(),
        entitySlug: (category as any).slug,
        entityName: (category as any).name,
        sessionId: request.headers.get("x-session-id") || undefined,
        userId: userId || undefined,
        ip,
        metadata: { userAgent, referrer: referer },
      }).catch((err: Error) => console.error("Analytics track error:", err));
    } catch (e) {
      // Don't fail the request if analytics fails
      console.error("View tracking error:", e);
    }

    // Build breadcrumbs
    const breadcrumbs = [];
    let currentCategory = category as any;

    // Add current category
    breadcrumbs.unshift({
      id: currentCategory.id || currentCategory._id?.toString(),
      name: currentCategory.name,
      slug: currentCategory.slug,
      url: `/categories?slug=${currentCategory.slug}`,
    });

    // Add parent categories
    if (currentCategory.parent) {
      breadcrumbs.unshift({
        id: currentCategory.parent.id || currentCategory.parent._id?.toString(),
        name: currentCategory.parent.name,
        slug: currentCategory.parent.slug,
        url: `/categories?slug=${currentCategory.parent.slug}`,
      });
    }

    // Add home
    breadcrumbs.unshift({
      id: "home",
      name: "Home",
      slug: "",
      url: "/",
    });

    const transformedCategory = {
      id: (category as any).id || (category as any)._id?.toString(),
      name: (category as any).name,
      slug: (category as any).slug,
      description: (category as any).description,
      image: (category as any).image,
      parent: (category as any).parent
        ? {
            id: (category as any).parent.id || (category as any).parent._id?.toString(),
            name: (category as any).parent.name,
            slug: (category as any).parent.slug,
            image: (category as any).parent.image,
          }
        : null,
      children: ((category as any).children || []).map((child: any) => ({
        id: child.id || child._id?.toString(),
        name: child.name,
        slug: child.slug,
        image: child.image,
        description: child.description,
      })),
      isActive: (category as any).isActive,
    };

    return NextResponse.json(
      {
        success: true,
        category: transformedCategory,
        breadcrumbs,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Category GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}
