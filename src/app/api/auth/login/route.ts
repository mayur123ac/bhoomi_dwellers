import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    await connectMongoDB();

    // 🔥 Fix 1: Clean the email (remove spaces and make lowercase)
    const cleanEmail = email.trim().toLowerCase();

    // 1. Find the user
    const user = await User.findOne({ email: cleanEmail });

    // 🔥 Fix 2: Tell us EXACTLY if the email is missing
    if (!user) {
      return NextResponse.json({ message: "DEBUG: Email not found in database." }, { status: 401 });
    }

    // 🔥 Fix 3: Tell us EXACTLY if the password is wrong
    if (user.password !== password) {
      return NextResponse.json({ message: "DEBUG: Password does not match." }, { status: 401 });
    }

    // 4. STRICT SYSTEM ACCESS GATE
    if (user.isActive === false) {
      return NextResponse.json(
        { message: "Account deactivated please contact admin" }, 
        { status: 403 }
      );
    }

    // 5. If everything passes, log them in
    return NextResponse.json({
      message: "Login successful.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "An error occurred during login." }, { status: 500 });
  }
}