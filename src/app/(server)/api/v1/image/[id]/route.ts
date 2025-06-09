import { NextRequest } from "next/server";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import { google } from "googleapis";

// This route handles image processing requests, allowing for transformations like resizing, blurring, and format conversion.
// It supports both local file system images and images hosted on Google Drive.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const { id: imageId } = await params;
  const width = searchParams.get("w")
    ? parseInt(searchParams.get("w")!, 10)
    : null;
  const height = searchParams.get("h")
    ? parseInt(searchParams.get("h")!, 10)
    : null;
  const requestedQuality = searchParams.get("q")
    ? parseInt(searchParams.get("q")!, 10)
    : null;
  const isOriginal = searchParams.get("o") === "1"; // Not used in this route, but can be extended for cover images
  const isBlurred = searchParams.get("blur") === "1";
  const isInfo = searchParams.get("i") === "1"; // Not used in this route, but can be extended for metadata
  const isThumbnail = searchParams.get("t") === "1";
  const grayscale = searchParams.get("grayscale") === "1";
  const format = isThumbnail ? "webp" : searchParams.get("format") || ""; // jpeg, png, webp
  const useDrive = searchParams.get("d") !== "0"; // default is Google Drive

  let imageBuffer: Buffer;
  let contentType = "image/webp"; // default content-type
  const fallbackPath = path.join(
    process.cwd(),
    "public",
    "images",
    "fallback.webp"
  );
  try {
    if (useDrive) {
      // 🔗 Google Drive image fetch
      const imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;
      if (isInfo) {
        const auth = process.env.GOOGLE_API_KEY_2;

        const drive = google.drive({ version: "v3", auth });
        const response = await drive.files.get({
          fileId: imageId,
          fields:
            "id, name, mimeType, webContentLink, imageMediaMetadata, webViewLink, thumbnailLink, size",
        });
        if (!response.data) {
          return new Response("Image not found", { status: 404 });
        }
        if (
          response.data?.mimeType &&
          response.data?.mimeType.startsWith("image/")
        ) {
          return new Response(JSON.stringify(response.data), {
            headers: { "Content-Type": "application/json" },
          });
        } else {
          return new Response("Not an image file", { status: 400 });
        }
      } else {
        const res = await fetch(imageUrl);

        if (!res.ok) throw new Error("Failed to fetch from Google Drive");
        const arrayBuffer = await res.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }
    } else {
      // 📁 Local file system fetch
      const localPath = path.join(process.cwd(), "public", "images", imageId);

      if (!(await fs.pathExists(localPath)))
        throw new Error("Image not found locally");

      imageBuffer = await fs.readFile(localPath);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.warn(
        `Image fetch failed for ${imageId}, using fallback.`,
        error.message
      );
    } else {
      console.warn(`Image fetch failed for ${imageId}, using fallback.`, error);
    }
    if (!(await fs.pathExists(fallbackPath))) {
      return new Response("Fallback image not found", { status: 500 });
    }
    imageBuffer = await fs.readFile(fallbackPath);
  }
  try {
    const ext = path.extname(imageId).toLowerCase();

    // For non-transformable formats
    if (
      [".ico", ".svg", ".gif"].includes(ext) &&
      !width &&
      !height &&
      !isBlurred &&
      !grayscale &&
      !isThumbnail &&
      !format
    ) {
      return new Response(new Uint8Array(imageBuffer), {
        headers: {
          "Content-Type":
            ext === ".svg"
              ? "image/svg+xml"
              : ext === ".gif"
              ? "image/gif"
              : "image/x-icon",
          "Cache-Control":
            "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400, immutable",
        },
      });
    }

    // 🛠️ Apply image transformations
    let transformer = sharp(imageBuffer);

    if (width || height) {
      transformer = transformer.resize({
        width: width || undefined,
        height: height || undefined,
        // withoutEnlargement: true, // Prevents enlarging smaller images
        kernel: sharp.kernel.lanczos3, // Use Lanczos3 for better quality
        position: "center", // Center the image if resizing
        background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background for PNG/WebP
        fit: isOriginal ? "inside" : "cover", // Use cover for thumbnails, inside for others
      });
    }

    if (grayscale) transformer = transformer.grayscale();
    if (isBlurred || isThumbnail) transformer = transformer.blur(5); // Apply a blur effect

    const quality = isThumbnail ? 20 : requestedQuality || 80; // Default quality for thumbnails is lower

    switch (format) {
      case "jpeg":
      case "jpg":
        transformer = transformer.jpeg({ quality });
        contentType = "image/jpeg";
        break;
      case "png":
        transformer = transformer.png({ quality });
        contentType = "image/png";
        break;
      case "avif":
        transformer = transformer.avif({ quality });
        contentType = "image/avif";
        break;
      case "gif":
        // only first frame supported
        transformer = transformer.gif();
        contentType = "image/gif";
        break;
      case "svg": // SVG -> PNG/WebP conversion
        transformer = transformer.png();
        contentType = "image/png";
        break;
      case "webp":
      default:
        transformer = transformer.webp({ quality });
        contentType = "image/webp";
        break;
    }

    const outputBuffer = await transformer.toBuffer();

    return new Response(new Uint8Array(outputBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400, immutable", // Cache for 30 days with revalidation
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Image processing error:", error.message);
    } else {
      console.error("Image processing error:", error);
    }
    return new Response("Error processing image", { status: 500 });
  }
}
