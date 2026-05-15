import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import sourceCloudinary from "@/lib/cloudinary";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import HeroBanner from "@/models/HeroBanner";
import LegalDocument from "@/models/LegalDocument";
import Product from "@/models/Product";
import Profile from "@/models/Profile";
import SiteSettings from "@/models/SiteSettings";
import Tag from "@/models/Tag";

export const dynamic = "force-dynamic";

const MIGRATION_FOLDERS = ["blue_ocean", "avatars"];
const UPLOAD_DELAY_MS = 750;
const MAX_UPLOAD_ATTEMPTS = 5;
const RETRYABLE_STATUS_CODES = new Set([420, 429, 500, 502, 503, 504]);

interface DestinationCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  apiUrl?: string;
  uploadPreset?: string;
}

interface SourceAsset {
  publicId: string;
  secureUrl: string;
  bytes: number;
  width: number;
  height: number;
  folder: string;
}

interface MigratedImage {
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

interface UploadFailure {
  publicId: string;
  folder: string;
  error: string;
}

interface MigrationMapping {
  byPublicId: Map<string, MigratedImage>;
  bySourceUrl: Map<string, MigratedImage>;
}

type ImageLike = {
  id?: string;
  name?: string;
  url?: string;
  thumbnailUrl?: string;
  isThumbnail?: boolean;
  downloadUrl?: string;
  size?: number;
  width?: number;
  height?: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "preview") {
      const folderSummaries = await Promise.all(
        MIGRATION_FOLDERS.map(async (folder) => {
          const assets = await listSourceAssets(folder);
          return {
            folder,
            count: assets.length,
            totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
          };
        }),
      );

      return NextResponse.json({
        success: true,
        folders: folderSummaries,
        total: folderSummaries.reduce((sum, folder) => sum + folder.count, 0),
      });
    }

    if (action !== "run") {
      return NextResponse.json(
        { success: false, error: "Unsupported migration action" },
        { status: 400 },
      );
    }

    const credentials = normalizeCredentials(body.credentials);
    const credentialError = validateCredentials(credentials);
    if (credentialError) {
      return NextResponse.json(
        { success: false, error: credentialError },
        { status: 400 },
      );
    }

    await dbConnect();

    const assetsByFolder = await Promise.all(
      MIGRATION_FOLDERS.map((folder) => listSourceAssets(folder)),
    );
    const assets = assetsByFolder.flat();

    const mapping: MigrationMapping = {
      byPublicId: new Map(),
      bySourceUrl: new Map(),
    };
    const failures: UploadFailure[] = [];
    let skipped = 0;

    for (let index = 0; index < assets.length; index++) {
      const asset = assets[index];
      if (!asset.secureUrl) {
        skipped++;
        continue;
      }

      try {
        const migratedImage = await uploadToDestination(asset, credentials);
        mapping.byPublicId.set(asset.publicId, migratedImage);
        mapping.bySourceUrl.set(asset.secureUrl, migratedImage);
      } catch (error) {
        failures.push({
          publicId: asset.publicId,
          folder: asset.folder,
          error: sanitizeError(error),
        });
      }

      if (index < assets.length - 1) {
        await sleep(UPLOAD_DELAY_MS);
      }
    }

    const dbUpdates = await updateDatabaseReferences(mapping);

    return NextResponse.json({
      success: true,
      summary: {
        total: assets.length,
        migrated: mapping.byPublicId.size,
        failed: failures.length,
        skipped,
        dbUpdated: dbUpdates.total,
      },
      dbUpdates,
      failures,
    });
  } catch (error) {
    console.error("Cloudinary migration error:", error);
    return NextResponse.json(
      { success: false, error: sanitizeError(error) },
      { status: 500 },
    );
  }
}

async function listSourceAssets(folder: string): Promise<SourceAsset[]> {
  const assets: SourceAsset[] = [];
  let nextCursor: string | undefined;

  do {
    const result = await sourceCloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: folder,
      max_results: 500,
      next_cursor: nextCursor,
    });

    for (const resource of result.resources || []) {
      const publicId = resource.public_id || "";
      if (publicId !== folder && !publicId.startsWith(`${folder}/`)) continue;

      assets.push({
        publicId,
        secureUrl: resource.secure_url,
        bytes: resource.bytes || 0,
        width: resource.width || 0,
        height: resource.height || 0,
        folder,
      });
    }

    nextCursor = result.next_cursor;
  } while (nextCursor);

  return assets;
}

function normalizeCredentials(value: unknown): DestinationCredentials {
  const credentials = value as Partial<DestinationCredentials> | undefined;
  return {
    cloudName: (credentials?.cloudName || "").trim(),
    apiKey: (credentials?.apiKey || "").trim(),
    apiSecret: (credentials?.apiSecret || "").trim(),
    apiUrl: (credentials?.apiUrl || "").trim(),
    uploadPreset: (credentials?.uploadPreset || "").trim(),
  };
}

function validateCredentials(
  credentials: DestinationCredentials,
): string | null {
  if (!credentials.cloudName) return "Destination cloud name is required";
  if (!credentials.apiKey) return "Destination API key is required";
  if (!credentials.apiSecret) return "Destination API secret is required";
  return null;
}

async function uploadToDestination(
  asset: SourceAsset,
  credentials: DestinationCredentials,
): Promise<MigratedImage> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params: Record<string, string> = {
    public_id: asset.publicId,
    overwrite: "true",
    timestamp,
  };

  if (credentials.uploadPreset) {
    params.upload_preset = credentials.uploadPreset;
  }

  const signature = signCloudinaryParams(params, credentials.apiSecret);
  const formData = new FormData();
  formData.set("file", asset.secureUrl);
  formData.set("api_key", credentials.apiKey);
  formData.set("signature", signature);
  for (const [key, value] of Object.entries(params)) {
    formData.set(key, value);
  }

  const { response, result } = await uploadWithRetry(
    getUploadEndpoint(credentials),
    formData,
  );

  if (!response.ok) {
    const message = result?.error?.message || "Destination upload failed";
    throw new Error(message);
  }

  return {
    id: result.public_id,
    name: result.original_filename || result.public_id.split("/").pop() || "",
    url: result.secure_url,
    thumbnailUrl: generateThumbnailUrl(result.secure_url),
    isThumbnail: false,
    downloadUrl: generateDownloadUrl(credentials.cloudName, result.public_id),
    size: result.bytes || 0,
    width: result.width || 0,
    height: result.height || 0,
  };
}

async function uploadWithRetry(endpoint: string, formData: FormData) {
  let lastResponse: Response | null = null;
  let lastResult: any = null;

  for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    const result = await response.json().catch(() => null);

    if (response.ok || !RETRYABLE_STATUS_CODES.has(response.status)) {
      return { response, result };
    }

    lastResponse = response;
    lastResult = result;

    if (attempt < MAX_UPLOAD_ATTEMPTS) {
      await sleep(getRetryDelayMs(response, attempt));
    }
  }

  return {
    response: lastResponse as Response,
    result: lastResult,
  };
}

function getRetryDelayMs(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : NaN;

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  return Math.min(30000, 1000 * 2 ** (attempt - 1));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function signCloudinaryParams(
  params: Record<string, string>,
  apiSecret: string,
): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex");
}

function getUploadEndpoint(credentials: DestinationCredentials): string {
  const apiUrl = credentials.apiUrl?.replace(/\/$/, "");
  if (!apiUrl) {
    return `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`;
  }

  if (apiUrl.endsWith("/image/upload")) {
    return apiUrl;
  }

  if (apiUrl.includes("/v1_1/")) {
    return `${apiUrl}/image/upload`;
  }

  return `${apiUrl}/v1_1/${credentials.cloudName}/image/upload`;
}

function generateThumbnailUrl(url: string): string {
  const parts = url.split("/upload/");
  if (parts.length !== 2) return url;
  return `${parts[0]}/upload/c_thumb,w_300,h_300,g_auto/${parts[1]}`;
}

function generateDownloadUrl(cloudName: string, publicId: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/fl_attachment/${publicId}`;
}

function replaceImage(
  image: ImageLike | null | undefined,
  mapping: MigrationMapping,
) {
  if (!image) return { image, changed: false };

  const replacement =
    (image.id ? mapping.byPublicId.get(image.id) : undefined) ||
    (image.url ? mapping.bySourceUrl.get(image.url) : undefined) ||
    (image.url ? getReplacementByUrl(image.url, mapping) : undefined);

  if (!replacement) return { image, changed: false };

  return {
    image: {
      ...image,
      ...replacement,
    },
    changed: true,
  };
}

function replaceUrl(url: unknown, mapping: MigrationMapping): string | null {
  if (typeof url !== "string" || !url) return null;

  const direct = mapping.bySourceUrl.get(url);
  if (direct) return direct.url;

  return getReplacementByUrl(url, mapping)?.url || null;
}

function getReplacementByUrl(
  url: string,
  mapping: MigrationMapping,
): MigratedImage | undefined {
  const publicId = extractPublicId(url);
  return publicId ? mapping.byPublicId.get(publicId) : undefined;
}

function extractPublicId(url: string): string | null {
  if (!url.includes("cloudinary.com") || !url.includes("/upload/")) return null;

  const [, afterUpload] = url.split("/upload/");
  const cleanPath = afterUpload.split("?")[0].split("#")[0];
  const segments = cleanPath.split("/");
  const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
  const publicPath =
    versionIndex >= 0 ? segments.slice(versionIndex + 1).join("/") : cleanPath;

  if (!publicPath) return null;
  return publicPath.replace(/\.[^/.]+$/, "");
}

async function updateDatabaseReferences(mapping: MigrationMapping) {
  const [
    products,
    categories,
    banners,
    tags,
    profiles,
    siteSettings,
    legalDocuments,
  ] = await Promise.all([
    Product.find({}).select("images").lean(),
    Category.find({}).select("image").lean(),
    HeroBanner.find({}).select("image mobileImage").lean(),
    Tag.find({}).select("logo").lean(),
    Profile.find({ avatar: { $exists: true, $nin: [null, ""] } })
      .select("avatar")
      .lean(),
    SiteSettings.find({}).lean(),
    LegalDocument.find({}).lean(),
  ]);

  const productOps = products.flatMap((product: any) => {
    let changed = false;
    const images = (product.images || []).map((image: ImageLike) => {
      const result = replaceImage(image, mapping);
      changed ||= result.changed;
      return result.image;
    });

    return changed
      ? [
          {
            updateOne: {
              filter: { _id: product._id },
              update: { $set: { images } },
            },
          },
        ]
      : [];
  });

  const categoryOps = categories.flatMap((category: any) => {
    const result = replaceImage(category.image, mapping);
    return result.changed
      ? [
          {
            updateOne: {
              filter: { _id: category._id },
              update: { $set: { image: result.image } },
            },
          },
        ]
      : [];
  });

  const bannerOps = banners.flatMap((banner: any) => {
    const updates: Record<string, unknown> = {};
    const image = replaceImage(banner.image, mapping);
    const mobileImage = replaceImage(banner.mobileImage, mapping);

    if (image.changed) updates.image = image.image;
    if (mobileImage.changed) updates.mobileImage = mobileImage.image;

    return Object.keys(updates).length
      ? [
          {
            updateOne: {
              filter: { _id: banner._id },
              update: { $set: updates },
            },
          },
        ]
      : [];
  });

  const tagOps = tags.flatMap((tag: any) => {
    const result = replaceImage(tag.logo, mapping);
    return result.changed
      ? [
          {
            updateOne: {
              filter: { _id: tag._id },
              update: { $set: { logo: result.image } },
            },
          },
        ]
      : [];
  });

  const profileOps = profiles.flatMap((profile: any) => {
    const avatar = replaceUrl(profile.avatar, mapping);
    return avatar
      ? [
          {
            updateOne: {
              filter: { _id: profile._id },
              update: { $set: { avatar } },
            },
          },
        ]
      : [];
  });

  const siteSettingOps = siteSettings.flatMap((settings: any) => {
    const set: Record<string, unknown> = {};

    setUrlIfMapped(set, "logo.url", settings.logo?.url, mapping);
    setUrlIfMapped(set, "favicon", settings.favicon, mapping);
    setUrlIfMapped(set, "seo.ogImage", settings.seo?.ogImage, mapping);

    const team = settings.about?.team || [];
    team.forEach((member: any, index: number) => {
      setUrlIfMapped(set, `about.team.${index}.image`, member.image, mapping);
    });

    const factoryImages = settings.about?.factory?.images || [];
    factoryImages.forEach((image: any, index: number) => {
      setUrlIfMapped(
        set,
        `about.factory.images.${index}.url`,
        image.url,
        mapping,
      );
    });

    return Object.keys(set).length
      ? [
          {
            updateOne: {
              filter: { _id: settings._id },
              update: { $set: set },
            },
          },
        ]
      : [];
  });

  const legalDocumentOps = legalDocuments.flatMap((document: any) => {
    const set: Record<string, unknown> = {};

    setUrlIfMapped(set, "file.url", document.file?.url, mapping);
    (document.images || []).forEach((image: any, index: number) => {
      setUrlIfMapped(set, `images.${index}.url`, image.url, mapping);
    });

    return Object.keys(set).length
      ? [
          {
            updateOne: {
              filter: { _id: document._id },
              update: { $set: set },
            },
          },
        ]
      : [];
  });

  const results = await Promise.all([
    runBulkWrite(Product, productOps),
    runBulkWrite(Category, categoryOps),
    runBulkWrite(HeroBanner, bannerOps),
    runBulkWrite(Tag, tagOps),
    runBulkWrite(Profile, profileOps),
    runBulkWrite(SiteSettings, siteSettingOps),
    runBulkWrite(LegalDocument, legalDocumentOps),
  ]);

  const keys = [
    "products",
    "categories",
    "heroBanners",
    "tags",
    "profiles",
    "siteSettings",
    "legalDocuments",
  ];

  return results.reduce(
    (summary, count, index) => {
      summary[keys[index]] = count;
      summary.total += count;
      return summary;
    },
    { total: 0 } as Record<string, number>,
  );
}

function setUrlIfMapped(
  set: Record<string, unknown>,
  path: string,
  currentUrl: unknown,
  mapping: MigrationMapping,
) {
  const replacement = replaceUrl(currentUrl, mapping);
  if (replacement) {
    set[path] = replacement;
  }
}

async function runBulkWrite(model: any, operations: any[]) {
  if (operations.length === 0) return 0;
  await model.bulkWrite(operations, { ordered: false });
  return operations.length;
}

function sanitizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Cloudinary migration failed";
}
