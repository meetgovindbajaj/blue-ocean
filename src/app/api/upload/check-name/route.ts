import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name:
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name parameter is required" },
        { status: 400 }
      );
    }

    // Sanitize the name the same way it will be sanitized during upload
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-");

    // Check if an image with this public_id exists in the blue_ocean folder
    const publicId = `blue_ocean/${sanitizedName}`;

    try {
      // Try to get the resource - if it exists, the name is taken
      await cloudinary.api.resource(publicId);
      // If we get here, the resource exists
      return NextResponse.json({
        success: true,
        available: false,
        sanitizedName,
      });
    } catch (error: any) {
      // If the error is "not found", the name is available
      if (error?.error?.http_code === 404 || error?.http_code === 404) {
        return NextResponse.json({
          success: true,
          available: true,
          sanitizedName,
        });
      }
      // Some other error occurred
      throw error;
    }
  } catch (error) {
    console.error("Check name error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check name availability" },
      { status: 500 }
    );
  }
}
