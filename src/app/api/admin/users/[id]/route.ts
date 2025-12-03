import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { Types } from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const query: any[] = [{ id }];
    if (Types.ObjectId.isValid(id)) {
      query.push({ _id: new Types.ObjectId(id) });
    }

    const user = await User.findOne({
      $or: query,
    })
      .select("-passwordHash -twoFactorSecret -googleId")
      .populate("profile")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        ...(user as any),
        id: (user as any).id || (user as any)._id?.toString(),
      },
    });
  } catch (error) {
    console.error("Admin User GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // Don't allow changing sensitive fields
    delete body.passwordHash;
    delete body.twoFactorSecret;
    delete body.googleId;

    const updateQuery: any[] = [{ id }];
    if (Types.ObjectId.isValid(id)) {
      updateQuery.push({ _id: new Types.ObjectId(id) });
    }

    const user = await User.findOneAndUpdate(
      { $or: updateQuery },
      { $set: body },
      { new: true, runValidators: true }
    ).select("-passwordHash -twoFactorSecret -googleId");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user.toJSON(),
        id: user.id || user._id?.toString(),
      },
    });
  } catch (error) {
    console.error("Admin User PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const deleteQuery: any[] = [{ id }];
    if (Types.ObjectId.isValid(id)) {
      deleteQuery.push({ _id: new Types.ObjectId(id) });
    }

    const user = await User.findOneAndDelete({
      $or: deleteQuery,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Admin User DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
