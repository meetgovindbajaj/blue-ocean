import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LegalDocument from "@/models/LegalDocument";

export const dynamic = "force-dynamic";

// GET all visible legal documents (public)
export async function GET() {
  try {
    await connectDB();

    const documents = await LegalDocument.find({ isVisible: true })
      .select("type title slug format order")
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      documents: documents.map((doc: any) => ({
        type: doc.type,
        title: doc.title,
        slug: doc.slug,
        format: doc.format,
        order: doc.order,
      })),
    });
  } catch (error) {
    console.error("Legal Documents public GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch legal documents" },
      { status: 500 }
    );
  }
}
