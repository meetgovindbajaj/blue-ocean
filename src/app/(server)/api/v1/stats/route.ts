import dbConnect from "@/lib/db";
import ViewStats from "@/models/ViewStats";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { type, refId } = await req.json();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

  if (!type || !refId || !["product", "category"].includes(type)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const existing = await ViewStats.findOne({ type, refId, ip });
  if (existing) {
    const diff = Date.now() - new Date(existing.viewedAt).getTime();
    if (diff >= 5 * 60 * 1000) {
      existing.count += 1;
      existing.viewedAt = new Date();
      await existing.save();
      return NextResponse.json({ updated: true });
    }
    console.log("Skipping view log update due to recent view");

    return NextResponse.json({ skipped: true });
  }

  await ViewStats.create({ type, refId, ip, count: 1, viewedAt: new Date() });
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const range = searchParams.get("range") || "daily";

  if (!type || !["product", "category"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const groupFormat = {
    daily: { $dateToString: { format: "%Y-%m-%d", date: "$viewedAt" } },
    weekly: { $isoWeek: "$viewedAt" },
    monthly: { $dateToString: { format: "%Y-%m", date: "$viewedAt" } },
    yearly: { $dateToString: { format: "%Y", date: "$viewedAt" } },
  }[range];
  console.log(type, range, groupFormat);

  const result = await ViewStats.aggregate([
    { $match: { type } },
    {
      $group: {
        _id: {
          refId: "$refId",
          period: groupFormat,
        },
        totalViews: { $sum: "$count" },
      },
    },
    {
      $lookup: {
        from: type === "product" ? "products" : "categories",
        localField: "_id.refId",
        foreignField: "_id",
        as: "refInfo",
      },
    },
    { $unwind: "$refInfo" },
    {
      $project: {
        name: "$refInfo.name",
        totalViews: 1,
        period: "$_id.period",
      },
    },
    { $sort: { period: 1 } },
  ]);
  console.log("Stats Result:", result);

  return NextResponse.json(result);
}
