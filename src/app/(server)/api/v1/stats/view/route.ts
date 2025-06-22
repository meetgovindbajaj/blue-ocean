import dbConnect from "@/lib/db";
import ViewStats from "@/models/ViewStats";
import { startOfDay, subDays, subMonths, subWeeks, subYears } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const refId = searchParams.get("refId");
  const type = searchParams.get("type");

  if (!refId || !type) {
    return NextResponse.json(
      { error: "Missing refId or type" },
      { status: 400 }
    );
  }

  const now = new Date();

  const views = await ViewStats.find({ refId, type });

  const daily = views.filter(
    (v) => v.viewedAt >= startOfDay(subDays(now, 1))
  ).length;
  const weekly = views.filter((v) => v.viewedAt >= subWeeks(now, 1)).length;
  const monthly = views.filter((v) => v.viewedAt >= subMonths(now, 1)).length;
  const yearly = views.filter((v) => v.viewedAt >= subYears(now, 1)).length;

  return NextResponse.json({ daily, weekly, monthly, yearly });
}
