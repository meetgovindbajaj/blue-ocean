import dbConnect from "@/lib/db";
import { TokenType } from "@/lib/properties";
import Token from "@/models/Token";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    // Verify JWT token to get user ID
    let _decoded;
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

      const { payload } = await jwtVerify(token, secret);
      _decoded = payload as {
        userId: string;
        id: string;
      };
    } catch (jwtError) {
      // Even if token is invalid, we should still try to clean it up
      console.error("JWT verification failed during logout:", jwtError);
    }

    // Remove the specific token from database
    await Token.deleteOne({
      token,
      type: TokenType.AUTH,
    });

    // If we have a valid user ID, optionally remove all auth tokens for this user
    // (uncomment the following lines if you want to log out from all devices)
    /*
    if (_decoded && (_decoded.userId || _decoded.id)) {
      await Token.deleteMany({
        user: _decoded.userId || _decoded.id,
        type: TokenType.AUTH,
      });
    }
    */

    // Clear the HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );

    // Clear the auth cookie
    response.cookies.set("authToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    // Even if there's an error, clear the cookie and return success
    // because the client should be logged out regardless
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
        warning: "There was an issue cleaning up server-side session",
      },
      { status: 200 }
    );

    response.cookies.set("authToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}
