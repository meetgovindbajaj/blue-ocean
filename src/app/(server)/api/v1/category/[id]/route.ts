import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import { PopulateOptions } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await dbConnect();
  const buildParentPopulate = (depth = 10): PopulateOptions => {
    const populate: PopulateOptions = {
      path: "parent",
      select: "id name slug parent",
    };
    let current: PopulateOptions = populate;
    for (let i = 1; i < depth; i++) {
      current.populate = {
        path: "parent",
        select: "id name slug parent",
      };
      current = current.populate as PopulateOptions;
    }
    return populate;
  };
  const category = await Category.findById(id)
    .populate(buildParentPopulate())
    .populate({
      path: "children",
      select: "id name slug",
    });
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
