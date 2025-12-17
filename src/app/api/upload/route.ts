import { NextRequest, NextResponse } from "next/server";
import { uploadImage, uploadMultipleImages, CloudinaryImage } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let images: CloudinaryImage[] = [];
    let folder = "blue_ocean";

    if (contentType.includes("multipart/form-data")) {
      // Handle form data upload
      const formData = await request.formData();
      const files = formData.getAll("files") as File[];
      folder = (formData.get("folder") as string) || "blue_ocean";
      const customName = (formData.get("customName") as string) || "";

      if (!files || files.length === 0) {
        return NextResponse.json(
          { success: false, error: "No files provided" },
          { status: 400 }
        );
      }

      // Convert files to buffers and upload
      const uploadPromises = files.map(async (file, index) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        // Use custom name as public ID if provided (sanitize it for Cloudinary)
        const sanitizedName = customName
          ? customName.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-")
          : undefined;
        const publicId = sanitizedName
          ? files.length > 1
            ? `${sanitizedName}-${index + 1}`
            : sanitizedName
          : undefined;
        return uploadImage(buffer, { folder, publicId });
      });

      images = await Promise.all(uploadPromises);
    } else if (contentType.includes("application/json")) {
      // Handle base64 or URL upload
      const body = await request.json();
      folder = body.folder || "blue_ocean";

      if (body.images && Array.isArray(body.images)) {
        // Multiple images (base64 or URLs)
        images = await uploadMultipleImages(body.images, { folder });
      } else if (body.image) {
        // Single image (base64 or URL)
        const image = await uploadImage(body.image, { folder });
        images = [image];
      } else {
        return NextResponse.json(
          { success: false, error: "No image data provided" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported content type" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      images,
      message: `Successfully uploaded ${images.length} image(s)`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload image(s)" },
      { status: 500 }
    );
  }
}

// GET - List images from a folder
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || "blue_ocean";
    const maxResults = parseInt(searchParams.get("limit") || "50");
    const nextCursor = searchParams.get("cursor") || undefined;

    const { listImages } = await import("@/lib/cloudinary");
    const result = await listImages(folder, { maxResults, nextCursor });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("List images error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list images" },
      { status: 500 }
    );
  }
}
