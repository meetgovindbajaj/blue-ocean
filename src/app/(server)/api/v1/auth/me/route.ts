import dbConnect from "@/lib/db";
import { TokenType } from "@/lib/properties";
import Token from "@/models/Token";
import User from "@/models/User";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "No authorization token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Invalid authorization token" },
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded;
    try {
      const secret = new TextEncoder().encode(JWT_SECRET!);

      const { payload } = await jwtVerify(token, secret);
      decoded = payload as {
        userId: string;
        id: string;
        email: string;
        name: string;
        role: string;
        emailVerified: boolean;
      };
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Check if token exists in database
    const tokenDoc = await Token.findOne({
      token,
      type: TokenType.AUTH,
      user: decoded.userId || decoded.id,
    });

    if (!tokenDoc) {
      return NextResponse.json(
        { success: false, error: "Token not found in database" },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (tokenDoc.expiresAt && tokenDoc.expiresAt < new Date()) {
      // Clean up expired token
      await Token.deleteOne({ _id: tokenDoc._id });
      return NextResponse.json(
        { success: false, error: "Token has expired" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await User.findById(decoded.userId || decoded.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.isVerified,
          isVerified: user.isVerified,
          status: user.status,
          authType: user.authType,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
