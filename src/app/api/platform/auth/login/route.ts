// src/app/api/platform/auth/login/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signSession } from "@/lib/serverAuth";
import { audit } from "@/lib/auditLog";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Fetch super_admin
    const users = await query(
      `SELECT id, name, email, password_hash, role, is_active 
       FROM super_admins 
       WHERE email = $1`,
      [email.toLowerCase().trim()]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = users[0];

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, message: "This account has been deactivated" },
        { status: 403 }
      );
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 3. Update last login
    await query(`UPDATE super_admins SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    // 4. Generate strict platform JWT
    // Notice: NO organizationId is included.
    const token = await signSession({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: "super_admin",
    });

    // 5. Audit log
    await audit({
      userId: user.id,
      action: "platform.login.success",
      entityType: "super_admin",
      entityId: user.id,
      req,
      isPlatformAction: true // custom flag or just omitting orgId
    });

    // 6. Set Cookie
    const response = NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: "super_admin",
        },
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "crm_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Platform Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
