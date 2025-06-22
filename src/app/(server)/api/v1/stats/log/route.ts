import dbConnect from "@/lib/db";
import ViewStats from "@/models/ViewStats";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { type, refId } = await req.json();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  console.log(`Logging view for type: ${type}, refId: ${refId}, IP: ${ip}`);

  if (!["product", "category"].includes(type) || !refId) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const recent = await ViewStats.findOne({
    refId,
    type,
    ip,
    viewedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // last 5 mins
  });
  if (recent) return NextResponse.json({ skipped: true });
  await ViewStats.create({ type, refId, ip });
  return NextResponse.json({ success: true });
}
