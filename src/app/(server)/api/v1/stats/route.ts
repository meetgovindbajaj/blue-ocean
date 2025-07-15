import dbConnect from "@/lib/db";
import { getDateRange } from "@/lib/functions";
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

    return NextResponse.json({ skipped: true });
  }

  await ViewStats.create({ type, refId, ip, count: 1, viewedAt: new Date() });
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const range = searchParams.get("range") || "weekly";

  if (!type || !["product", "category"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const result = await ViewStats.aggregate([
    { $match: { type } },
    {
      $group: {
        _id: {
          refId: "$refId",
          ip: "$ip",
          date: {
            $dateTrunc: {
              date: "$viewedAt",
              unit:
                range === "daily"
                  ? "day"
                  : range === "weekly"
                  ? "week"
                  : range === "monthly"
                  ? "month"
                  : range === "yearly"
                  ? "year"
                  : "day",
            },
          },
        },
        count: { $sum: "$count" },
        firstView: { $min: "$viewedAt" },
      },
    },
    {
      $group: {
        _id: {
          refId: "$_id.refId",
          date: "$_id.date",
        },
        totalViews: { $sum: "$count" },
        ipAddresses: { $addToSet: "$_id.ip" },
        firstView: { $min: "$firstView" },
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
        ipAddresses: 1,
        firstView: 1,
        type: { $literal: type },
      },
    },
  ]);

  const response = result.map((r) => {
    const { start, end } = getDateRange(range, r.firstView);
    return {
      name: r.name,
      totalViews: r.totalViews,
      type: r.type,
      ipAddresses: r.ipAddresses.filter(Boolean),
      startDate: start,
      endDate: end,
    };
  });

  return NextResponse.json(response);
}
