import dbConnect from "@/lib/db";
import { buildPopulate } from "@/lib/functions";
import Category from "@/models/Category";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await dbConnect();
  const category = await Category.findOne({ slug: id })
    .populate(buildPopulate())
    .populate("children", "id name slug");
  if (!category)
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  const breadcrumbs = [];
  let cat = category;
  while (cat) {
    breadcrumbs.unshift({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      url: `/category/${cat.slug}`,
    });
    cat = cat.parent;
  }
  breadcrumbs.unshift({ id: "home", name: "Home", slug: "home", url: "/" });
  const subCategories = category.children.map(
    (child: { id: string; name: string; slug: string }) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      url: `/category/${child.slug}`,
    })
  );
  return NextResponse.json({
    ...category.toObject(),
    breadcrumbs,
    subCategories,
  });
}
