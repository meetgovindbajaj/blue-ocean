import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    const authToken: string = (await cookies()).get("authToken")?.value || "";

    if (!authToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }
    const decryptedAuthToken = jwt.verify(
      authToken,
      process.env.JWT_SECRET
    ) as jwt.JwtPayload;

    if (!decryptedAuthToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = decryptedAuthToken?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();
    const userData = await User.findById({ _id: userId }).populate("profile");
    if (!userData) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    console.log({ userData });

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.error();
  }
}

export const runtime = "nodejs"; // ensure Node runtime (DB-friendly)
export const dynamic = "force-dynamic"; // avoid caching; always fresh auth
