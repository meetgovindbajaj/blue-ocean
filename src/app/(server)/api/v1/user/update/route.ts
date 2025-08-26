import dbConnect from "@/lib/db";
import User from "@/models/User";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

interface UpdateUserData {
  name?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify<{
      userId: string;
    }>(token, secret);
    const decoded = payload;

    const updateData: UpdateUserData = await request.json();

    // Validate required fields
    if (updateData.name && updateData.name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long" },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      {
        $set: {
          ...(updateData.name && { name: updateData.name.trim() }),
          ...(updateData.phone && { phone: updateData.phone.trim() }),
          ...(updateData.address && { address: updateData.address }),
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);

    if (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
