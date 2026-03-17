import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

// POST: Add new employee
export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();
    await connectMongoDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "Email already exists." }, { status: 400 });
    }

    await User.create({
      name,
      email,
      password,
      role,
      isActive: true,
    });

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
    // 🔥 Make sure you remove `.select("-password")` if it exists!
    const users = await User.find().sort({ createdAt: -1 });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching employees." }, { status: 500 });
  }
}

// PUT: Update active/inactive status
export async function PUT(req: Request) {
  try {
    const { userId, isActive } = await req.json();
    await connectMongoDB();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Employee status updated successfully." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error updating status." }, { status: 500 });
  }
}


// 🔥 NEW: DELETE method to allow the Trash icon to remove users
export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();
    await connectMongoDB();

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Error deleting employee." }, { status: 500 });
  }
}