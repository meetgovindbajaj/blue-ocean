import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Inquiry from "@/models/Inquiry";
import { sendContactFormEmail } from "@/lib/email";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, phone, subject, message, productId } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "Name, email, subject, and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length < 10) {
      return NextResponse.json(
        { success: false, error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Message cannot exceed 1000 characters" },
        { status: 400 }
      );
    }

    // Check if user is logged in - require authentication
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Please login to send a message" },
        { status: 401 }
      );
    }

    // Create inquiry in database
    const inquiry = new Inquiry({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || undefined,
      message: message.trim(),
      productId: productId || undefined,
      userId: currentUser?.userId || undefined,
      status: "pending",
      priority: "medium",
    });

    await inquiry.save();

    // Send email notification to support
    const emailResult = await sendContactFormEmail({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    if (!emailResult.success) {
      console.error("Failed to send contact form email:", emailResult.error);
      // Don't fail the request if email fails - inquiry is saved
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your message! We'll get back to you soon.",
      inquiryId: inquiry._id,
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
