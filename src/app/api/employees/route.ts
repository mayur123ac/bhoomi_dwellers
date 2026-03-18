import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

// POST: Add new employee
export async function POST(req: Request) {
  try {
    const { name, username, email, password, role } = await req.json();
    await connectMongoDB();

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ message: "Email already exists." }, { status: 400 });
    }

    const existingUsername = await User.findOne({ username: username?.trim() });
    if (existingUsername) {
      return NextResponse.json({ message: "Username already taken." }, { status: 400 });
    }

    await User.create({ name, username: username?.trim(), email, password, role, isActive: true });
    return NextResponse.json({ message: "Employee added successfully." }, { status: 201 });

  } catch (error) {
    console.log("🔥 THE DATABASE ERROR IS:", error);
    return NextResponse.json({ message: "Error adding employee." }, { status: 500 });
  }
}

// GET: Fetch all employees
export async function GET() {
  try {
    await connectMongoDB();
    const users = await User.find().sort({ createdAt: -1 });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching employees." }, { status: 500 });
  }
}

// PUT: Update employee — handles both status toggle AND full profile edit
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;
    await connectMongoDB();

    if (!userId) {
      return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    // 🔥 FULL EDIT: if editData is present, update all fields
    if (body.editData) {
      const { name, username, email, password, role } = body.editData;

      // Check username conflict (exclude current user)
      if (username) {
        const existingUsername = await User.findOne({
          username: username.trim(),
          _id: { $ne: userId },
        });
        if (existingUsername) {
          return NextResponse.json({ message: "Username already taken by another user." }, { status: 400 });
        }
      }

      // Check email conflict (exclude current user)
      if (email) {
        const existingEmail = await User.findOne({
          email: email.trim().toLowerCase(),
          _id: { $ne: userId },
        });
        if (existingEmail) {
          return NextResponse.json({ message: "Email already in use by another user." }, { status: 400 });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          ...(name     && { name }),
          ...(username && { username: username.trim() }),
          ...(email    && { email: email.trim().toLowerCase() }),
          ...(password && { password }),
          ...(role     && { role }),
        },
        { new: true }
      );

      if (!updatedUser) {
        return NextResponse.json({ message: "User not found." }, { status: 404 });
      }

      return NextResponse.json(
        { message: "Employee updated successfully.", user: updatedUser },
        { status: 200 }
      );
    }

    // 🔥 STATUS TOGGLE: if only isActive is present
    if (typeof body.isActive === "boolean") {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { isActive: body.isActive },
        { new: true }
      );

      if (!updatedUser) {
        return NextResponse.json({ message: "User not found." }, { status: 404 });
      }

      return NextResponse.json({ message: "Employee status updated successfully." }, { status: 200 });
    }

    return NextResponse.json({ message: "No valid update data provided." }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ message: "Error updating employee." }, { status: 500 });
  }
}

// DELETE: Permanently remove an employee
export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();
    await connectMongoDB();

    if (!userId) {
      return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully." }, { status: 200 });

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Error deleting employee." }, { status: 500 });
  }
}