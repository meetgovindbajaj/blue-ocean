import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LegalDocument from "@/models/LegalDocument";
import { getAuthUser, isAdmin, unauthorizedResponse, forbiddenResponse } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single legal document
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    const { id } = await params;
    await connectDB();

    const document = await LegalDocument.findById(id).lean();
    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        ...(document as any),
        id: (document as any)._id?.toString(),
      },
    });
  } catch (error) {
    console.error("Legal Document GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

// PUT update legal document
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    const { id } = await params;
    await connectDB();

    const body = await request.json();
    const { title, format, content, file, images, isVisible, order } = body;

    const document = await LegalDocument.findById(id);
    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (title !== undefined) document.title = title;
    if (format !== undefined) document.format = format;
    if (content !== undefined) document.content = content;
    if (file !== undefined) document.file = file || undefined;
    if (images !== undefined) document.images = images;
    if (isVisible !== undefined) document.isVisible = isVisible;
    if (order !== undefined) document.order = order;
    document.lastUpdatedBy = user.userId as any;

    await document.save();

    return NextResponse.json({
      success: true,
      document: {
        ...document.toJSON(),
        id: document._id?.toString(),
      },
    });
  } catch (error) {
    console.error("Legal Document PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update document" },
      { status: 500 }
    );
  }
}

// DELETE legal document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (!isAdmin(user.role)) return forbiddenResponse();

    const { id } = await params;
    await connectDB();

    const document = await LegalDocument.findByIdAndDelete(id);
    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Legal Document DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
