import { NextRequest, NextResponse } from "next/server";
import { deleteImage, getImageDetails, updateImage } from "@/lib/cloudinary";

// GET - Get image details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // The ID might be URL encoded, decode it
    const publicId = decodeURIComponent(id);

    const image = await getImageDetails(publicId);

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error) {
    console.error("Get image error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get image details" },
      { status: 500 }
    );
  }
}

// PUT - Update/Replace image
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const publicId = decodeURIComponent(id);
    const body = await request.json();

    if (!body.image) {
      return NextResponse.json(
        { success: false, error: "No image data provided" },
        { status: 400 }
      );
    }

    const folder = body.folder || "blue_ocean";
    const image = await updateImage(publicId, body.image, { folder });

    return NextResponse.json({
      success: true,
      image,
      message: "Image updated successfully",
    });
  } catch (error) {
    console.error("Update image error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update image" },
      { status: 500 }
    );
  }
}

// DELETE - Delete image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const publicId = decodeURIComponent(id);

    const success = await deleteImage(publicId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to delete image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
