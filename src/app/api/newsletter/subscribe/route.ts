import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Profile from "@/models/Profile";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
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

    const normalizedEmail = email.toLowerCase().trim();

    // First check if user exists with this email - use their profile
    const user = await User.findOne({ email: normalizedEmail });

    if (user && user.profile) {
      // User exists, update their profile's newsletter preference
      const profile = await Profile.findById(user.profile);

      if (profile) {
        if (profile.preferences?.newsletter) {
          return NextResponse.json({
            success: true,
            message: "You are already subscribed to our newsletter!",
            alreadySubscribed: true,
          });
        }

        // Update newsletter preference
        await Profile.findByIdAndUpdate(user.profile, {
          $set: { "preferences.newsletter": true },
        });

        return NextResponse.json({
          success: true,
          message: "Successfully subscribed to our newsletter!",
        });
      }
    }

    // Check if email exists in profiles (guest subscriber)
    const existingProfile = await Profile.findOne({ email: normalizedEmail });

    if (existingProfile) {
      if (existingProfile.preferences?.newsletter) {
        return NextResponse.json({
          success: true,
          message: "You are already subscribed to our newsletter!",
          alreadySubscribed: true,
        });
      }

      // Update newsletter preference
      await Profile.findByIdAndUpdate(existingProfile._id, {
        $set: { "preferences.newsletter": true },
      });

      return NextResponse.json({
        success: true,
        message: "Successfully subscribed to our newsletter!",
      });
    }

    // Create new profile for guest subscriber
    const newProfile = new Profile({
      name: "Newsletter Subscriber",
      email: normalizedEmail,
      preferences: {
        newsletter: true,
        promotions: true,
        currency: "INR",
        language: "en",
        notifications: {
          email: true,
          sms: false,
          push: false,
        },
      },
    });

    await newProfile.save();

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to our newsletter!",
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
