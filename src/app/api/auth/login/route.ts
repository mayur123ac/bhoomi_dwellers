// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Please provide both a username/email and password." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();

    // Case-insensitive match on email, username, OR name — same as your old MongoDB $regex
    const rows = await query(
      `SELECT * FROM users
       WHERE LOWER(email)    = LOWER($1)
          OR LOWER(username) = LOWER($1)
          OR LOWER(name)     = LOWER($1)
       LIMIT 1`,
      [cleanIdentifier]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No account found with that email or username." },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Plain text password check — same as your current setup
    if (user.password.trim() !== password.trim()) {
      return NextResponse.json(
        { message: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    if (user.is_active === false) {
      return NextResponse.json(
        { message: "Account deactivated. Please contact admin." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        message: "Login successful.",
        user: {
          _id:      String(user.id),  // keeps frontend working — it stores _id in localStorage
          name:     user.name,
          username: user.username,
          email:    user.email,
          role:     user.role,
          isActive: user.is_active,
          password: user.password,   // kept because your profile pages show the password
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "An error occurred during login." },
      { status: 500 }
    );
  }
}