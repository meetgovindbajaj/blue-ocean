import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LegalDocument from "@/models/LegalDocument";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET single legal document by slug (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    await connectDB();

    const document = await LegalDocument.findOne({
      slug,
      isVisible: true
    }).lean();

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        type: (document as any).type,
        title: (document as any).title,
        slug: (document as any).slug,
        format: (document as any).format,
        content: (document as any).content,
        file: (document as any).file,
        images: (document as any).images,
        updatedAt: (document as any).updatedAt,
      },
    });
  } catch (error) {
    console.error("Legal Document public GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}
