import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Token from "@/models/Token";
import { TokenType } from "@/lib/properties";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const type = searchParams.get("type");

    if (!token || !type) {
      return NextResponse.json({ valid: false });
    }

    // Map type string to TokenType enum
    let tokenType: TokenType | undefined;
    switch (type) {
      case "reset_password":
        tokenType = TokenType.RESET_PASSWORD;
        break;
      case "email_verification":
        tokenType = TokenType.EMAIL_VERIFICATION;
        break;
      default:
        return NextResponse.json({ valid: false });
    }

    // Check if token exists and is not expired
    const tokenDoc = await Token.findOne({
      token,
      type: tokenType,
      expiresAt: { $gt: new Date() },
    });

    return NextResponse.json({
      valid: !!tokenDoc,
    });
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json({ valid: false });
  }
}
