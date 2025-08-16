import dbConnect from "@/lib/db";
import { TokenType } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email }: { email: string } = body;
    if (!email) {
      return new NextResponse("Email is required", {
        status: 400,
      });
    }
    const user = await User.findOne({ email }, { _id: 1 });
    await Token.findOneAndDelete({
      user: user._id,
      type: TokenType.AUTH,
    });
    const res = NextResponse.json({ success: true });
    res.cookies.set("authToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // clear immediately
    });
    return res;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
