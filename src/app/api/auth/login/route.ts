// src/app/api/auth/login/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Phase 2A: bcrypt password comparison + JWT session token
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { signSession } from "@/lib/serverAuth";
import { audit, AuditAction } from "@/lib/auditLog";
import bcrypt from "bcryptjs";

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

    // ── Fetch user + org details ──────────────────────────────────────────────
    const rows = await query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.password,
         u.role,
         u.is_active,
         u.organization_id,
         u.status,
         u.permissions,
         o.slug          AS organization_slug,
         o.company_name  AS organization_name
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE (LOWER(u.email) = LOWER($1) OR LOWER(u.name) = LOWER($1))
       LIMIT 1`,
      [cleanIdentifier]
    );

    if (rows.length === 0) {
      // Don't reveal whether the email exists
      await audit({
        action: AuditAction.LOGIN_FAILURE,
        metadata: { identifier: cleanIdentifier, reason: "user_not_found" },
        req,
        status: "failure",
      });
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    const user = rows[0] as any;

    // ── bcrypt password comparison ────────────────────────────────────────────
    // Supports both:
    //   • bcrypt hashes ($2b$...) — Phase 2A+
    //   • plaintext — legacy, before migration script runs
    const isMatch = user.password
      ? user.password.startsWith("$2b$") || user.password.startsWith("$2a$")
        ? await bcrypt.compare(password.trim(), user.password)
        : user.password.trim() === password.trim()   // plaintext fallback
      : false;

    if (!isMatch) {
      await audit({
        organizationId: user.organization_id,
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.LOGIN_FAILURE,
        metadata: { reason: "wrong_password" },
        req,
        status: "failure",
      });
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // ── Account status checks ─────────────────────────────────────────────────
    if (user.is_active === false) {
      return NextResponse.json(
        { message: "Account deactivated. Please contact your admin." },
        { status: 403 }
      );
    }

    if (user.status && user.status !== "active") {
      const statusMessages: Record<string, string> = {
        invited:   "Please accept your invitation before logging in.",
        suspended: "Your account has been suspended. Contact your admin.",
        deleted:   "This account no longer exists.",
      };
      return NextResponse.json(
        { message: statusMessages[user.status] ?? "Account unavailable." },
        { status: 403 }
      );
    }

    // ── Build JWT payload ─────────────────────────────────────────────────────
    const sessionPayload = {
      _id:              String(user.id),
      name:             user.name,
      email:            user.email,
      role:             user.role,
      isActive:         user.is_active,
      organizationId:   user.organization_id   ?? "",
      organizationSlug: user.organization_slug ?? "",
      organizationName: user.organization_name ?? "",
      permissions:      (typeof user.permissions === "object" && user.permissions) ? user.permissions : {},
    };

    // ── Sign JWT ──────────────────────────────────────────────────────────────
    const token = await signSession(sessionPayload);

    // ── Update last_login_at (fire-and-forget) ────────────────────────────────
    if (user.id) {
      query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]).catch(
        (err) => console.error("[Login] Failed to update last_login_at:", err)
      );
    }

    // ── Audit ─────────────────────────────────────────────────────────────────
    audit({
      organizationId: user.organization_id,
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.LOGIN_SUCCESS,
      metadata: { role: user.role },
      req,
    });

    // ── Response ──────────────────────────────────────────────────────────────
    const response = NextResponse.json(
      {
        message: "Login successful.",
        user: {
          ...sessionPayload,
          password: user.password, // kept for backward compat with frontend state
        },
      },
      { status: 200 }
    );

    // Set signed JWT as HttpOnly cookie
    response.cookies.set({
      name:     "crm_session",
      value:    token,
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Login failed." }, { status: 500 });
  }
}
