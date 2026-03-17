import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb"; // Adjust this path if your db connection file is somewhere else!
import User from "@/models/User"; // Adjust this path if your user model is somewhere else!

export async function GET() {
  try {
    await connectMongoDB();
    
    // Using $regex to make it case-insensitive (handles "receptionist", "Receptionist", etc.)
    const receptionists = await User.find({ role: { $regex: /^receptionist$/i } });

    return NextResponse.json(
      { success: true, data: receptionists },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching receptionists:", error);
    return NextResponse.json(
      { success: false, message: "Server Error fetching receptionists" },
      { status: 500 }
    );
  }
}