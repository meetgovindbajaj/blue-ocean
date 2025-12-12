import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LegalDocument from "@/models/LegalDocument";
import { getAuthUser, isAdmin, unauthorizedResponse, forbiddenResponse } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// GET all legal documents
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    await connectDB();

    const documents = await LegalDocument.find()
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      documents: documents.map((doc: any) => ({
        ...doc,
        id: doc._id?.toString(),
      })),
    });
  } catch (error) {
    console.error("Legal Documents GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch legal documents" },
      { status: 500 }
    );
  }
}

// POST create new legal document
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    await connectDB();

    const body = await request.json();
    const { type, title, format, content, file, images, isVisible, order } = body;

    if (!type || !title || !format) {
      return NextResponse.json(
        { success: false, error: "Type, title, and format are required" },
        { status: 400 }
      );
    }

    // Check if document type already exists
    const existing = await LegalDocument.findOne({ type });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A document with this type already exists" },
        { status: 400 }
      );
    }

    // Generate slug from type
    const slug = type;

    const document = new LegalDocument({
      type,
      title,
      slug,
      format,
      content: content || "",
      file: file || undefined,
      images: images || [],
      isVisible: isVisible ?? false,
      order: order ?? 0,
      lastUpdatedBy: user.userId,
    });

    await document.save();

    return NextResponse.json({
      success: true,
      document: {
        ...document.toJSON(),
        id: document._id?.toString(),
      },
    });
  } catch (error) {
    console.error("Legal Documents POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create legal document" },
      { status: 500 }
    );
  }
}
