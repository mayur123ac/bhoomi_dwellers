import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

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
    // THIS IS THE CRUCIAL LINE WE NEED:
    console.log("🔥 THE DATABASE ERROR IS:", error); 
    
    return NextResponse.json({ message: "Error adding employee." }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectMongoDB();
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching employees." }, { status: 500 });
  }
}

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