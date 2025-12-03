import { NextResponse } from "next/server";
import { getGoogleOAuthUrl } from "@/lib/auth";

export async function GET() {
  const url = getGoogleOAuthUrl();
  return NextResponse.redirect(url);
}
