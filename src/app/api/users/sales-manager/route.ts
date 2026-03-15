import { NextResponse } from "next/server";
import User from "@/models/User"; 
import { connectMongoDB } from "@/lib/mongodb"; 

export async function GET() {
  try {
    await connectMongoDB();
    
    // Case-insensitive search for "Sales Manager"
    const managers = await User.find({ 
      role: { $regex: new RegExp("^sales manager$", "i") } 
    }).select("name _id");

    return NextResponse.json({ success: true, data: managers }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch managers:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch managers" }, { status: 500 });
  }
}