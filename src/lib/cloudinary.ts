import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name:
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryImage {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  isThumbnail: boolean;
  downloadUrl: string;
  size: number;
  width: number;
  height: number;
}

export interface UploadOptions {
  folder?: string;
  transformation?: object[];
  publicId?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
}

// Generate thumbnail URL from original URL
export function generateThumbnailUrl(
  url: string,
  width = 300,
  height = 300
): string {
  if (!url) return "";

  // Check if it's a Cloudinary URL
  if (url.includes("cloudinary.com")) {
    // Insert transformation before the version or file name
    const parts = url.split("/upload/");
    if (parts.length === 2) {
      return `${parts[0]}/upload/c_thumb,w_${width},h_${height},g_auto/${parts[1]}`;
    }
  }
  return url;
}

// Generate download URL
export function generateDownloadUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    flags: "attachment",
    secure: true,
  });
}

// Upload image to Cloudinary
export async function uploadImage(
  file: Buffer | string,
  options: UploadOptions = {}
): Promise<CloudinaryImage> {
  const {
    folder = "blue_ocean",
    transformation = [],
    publicId,
    resourceType = "image",
  } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
      transformation,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const uploadCallback = (
      error: UploadApiErrorResponse | undefined,
      result: UploadApiResponse | undefined
    ) => {
      if (error) {
        reject(new Error(error.message));
        return;
      }

      if (!result) {
        reject(new Error("No result from Cloudinary"));
        return;
      }

      const imageData: CloudinaryImage = {
        id: result.public_id,
        name:
          result.original_filename || result.public_id.split("/").pop() || "",
        url: result.secure_url,
        thumbnailUrl: generateThumbnailUrl(result.secure_url),
        isThumbnail: false,
        downloadUrl: generateDownloadUrl(result.public_id),
        size: result.bytes,
        width: result.width,
        height: result.height,
      };

      resolve(imageData);
    };

    if (typeof file === "string" && file.startsWith("data:")) {
      // Base64 upload
      cloudinary.uploader.upload(file, uploadOptions, uploadCallback);
    } else if (typeof file === "string") {
      // URL upload
      cloudinary.uploader.upload(file, uploadOptions, uploadCallback);
    } else {
      // Buffer upload
      cloudinary.uploader
        .upload_stream(uploadOptions, uploadCallback)
        .end(file);
    }
  });
}

// Upload multiple images
export async function uploadMultipleImages(
  files: (Buffer | string)[],
  options: UploadOptions = {}
): Promise<CloudinaryImage[]> {
  const uploadPromises = files.map((file, index) =>
    uploadImage(file, {
      ...options,
      publicId: options.publicId ? `${options.publicId}_${index}` : undefined,
    })
  );

  return Promise.all(uploadPromises);
}

// Delete image from Cloudinary
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Failed to delete image:", error);
    return false;
  }
}

// Delete multiple images
export async function deleteMultipleImages(
  publicIds: string[]
): Promise<{ deleted: string[]; failed: string[] }> {
  const results = await Promise.allSettled(
    publicIds.map((id) => deleteImage(id))
  );

  const deleted: string[] = [];
  const failed: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      deleted.push(publicIds[index]);
    } else {
      failed.push(publicIds[index]);
    }
  });

  return { deleted, failed };
}

// Get image details
export async function getImageDetails(
  publicId: string
): Promise<CloudinaryImage | null> {
  try {
    const result = await cloudinary.api.resource(publicId);

    return {
      id: result.public_id,
      name: result.public_id.split("/").pop() || "",
      url: result.secure_url,
      thumbnailUrl: generateThumbnailUrl(result.secure_url),
      isThumbnail: false,
      downloadUrl: generateDownloadUrl(result.public_id),
      size: result.bytes,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("Failed to get image details:", error);
    return null;
  }
}

// List images in a folder
export async function listImages(
  folder: string,
  options: { maxResults?: number; nextCursor?: string } = {}
): Promise<{ images: CloudinaryImage[]; nextCursor?: string }> {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: folder,
      max_results: options.maxResults || 50,
      next_cursor: options.nextCursor,
    });

    const images: CloudinaryImage[] = result.resources.map((resource: any) => ({
      id: resource.public_id,
      name: resource.public_id.split("/").pop() || "",
      url: resource.secure_url,
      thumbnailUrl: generateThumbnailUrl(resource.secure_url),
      isThumbnail: false,
      downloadUrl: generateDownloadUrl(resource.public_id),
      size: resource.bytes,
      width: resource.width,
      height: resource.height,
    }));

    return {
      images,
      nextCursor: result.next_cursor,
    };
  } catch (error) {
    console.error("Failed to list images:", error);
    return { images: [] };
  }
}

// Update image (replace)
export async function updateImage(
  publicId: string,
  file: Buffer | string,
  options: UploadOptions = {}
): Promise<CloudinaryImage> {
  // Delete old image first
  await deleteImage(publicId);

  // Upload new image with same public ID
  return uploadImage(file, {
    ...options,
    publicId,
  });
}

export default cloudinary;
