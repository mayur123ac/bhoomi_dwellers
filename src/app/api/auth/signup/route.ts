import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    await connectMongoDB();

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "Email already exists." }, { status: 400 });
    }

    // 🔥 2. Create the user WITHOUT the strict role block
    await User.create({
      name,
      email,
      password: password, 
      role: role, // Keep the exact casing they select (e.g., "Admin", "Sales Manager")
      isActive: true, // 🔥 Set to TRUE so they can log in instantly without hitting the deactivation wall
    });

    return NextResponse.json({ message: "Account registered successfully." }, { status: 201 });
  } catch (error) {
    console.log("SIGNUP ERROR:", error);
    return NextResponse.json({ message: "An error occurred during registration." }, { status: 500 });
  }
}