import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Please provide both a username/email and password." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const cleanIdentifier = identifier.trim(); // 🔥 REMOVED .toLowerCase() — breaks case-sensitive usernames

    // 🔥 All three use case-insensitive regex now
    const user = await User.findOne({
      $or: [
        { email:    { $regex: `^${cleanIdentifier}$`, $options: "i" } },
        { username: { $regex: `^${cleanIdentifier}$`, $options: "i" } },
        { name:     { $regex: `^${cleanIdentifier}$`, $options: "i" } },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { message: "No account found with that email or username." },
        { status: 401 }
      );
    }

    // 🔥 Trim both to avoid hidden space mismatches
    if (user.password.trim() !== password.trim()) {
      return NextResponse.json(
        { message: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { message: "Account deactivated. Please contact admin." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        message: "Login successful.",
        user: {
          _id:      user._id,
          name:     user.name,
          username: user.username,
          email:    user.email,
          role:     user.role,
          isActive: user.isActive,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("🔥 Login error:", error);
    return NextResponse.json(
      { message: "An error occurred during login." },
      { status: 500 }
    );
  }
}
