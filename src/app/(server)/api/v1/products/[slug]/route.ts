import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { PopulateOptions } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await dbConnect();

  const buildPopulate = (depth = 10): PopulateOptions => {
    const populate: PopulateOptions = {
      path: "category",
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

  const product = await Product.findOne({ slug, isActive: true }).populate(
    buildPopulate()
  );

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const breadcrumbs = [];
  let cat = product.category;
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

  return NextResponse.json({ ...product.toObject(), breadcrumbs });
}
