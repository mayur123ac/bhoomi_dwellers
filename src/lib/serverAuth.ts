// src/lib/serverAuth.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-side session helpers for Next.js API routes and Server Components.
//
// Phase 2A: Full JWT support via jose.
//   - getServerSession() tries JWT first, falls back to base64 (backward compat)
//   - signSession() creates a signed JWT string (used in login route)
//   - requireOrganization(), requireRole(), requireRoleAndOrganization() — unchanged API
// ─────────────────────────────────────────────────────────────────────────────

import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { CrmSession } from "./tenant";

// ── JWT secret (must be ≥ 32 bytes) ──────────────────────────────────────────
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "[serverAuth] JWT_SECRET is missing or too short. Set a strong secret in .env.local."
    );
  }
  return new TextEncoder().encode(secret);
}

// ── JWT payload shape ─────────────────────────────────────────────────────────
// This is what we sign — must stay stable across deploys for valid sessions.
export interface SessionPayload extends JWTPayload {
  _id:              string;
  name:             string;
  email:            string;
  role:             string;
  isActive:         boolean;
  organizationId:   string;
  organizationSlug: string;
  organizationName: string;
  permissions:      Record<string, boolean>;
}

// ── signSession ───────────────────────────────────────────────────────────────
/**
 * Creates a signed JWT from a session payload.
 * Called by the login route after credential verification.
 *
 * @param payload  The session data to embed in the token
 * @param expiresIn  Expiry (default: 7 days)
 */
export async function signSession(
  payload: Omit<SessionPayload, "iat" | "exp" | "iss" | "aud">,
  expiresIn: string = "7d"
): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setIssuer("crm-saas")
    .sign(getJwtSecret());
}

// ── getServerSession ──────────────────────────────────────────────────────────
/**
 * Parses the crm_session cookie and returns the session object.
 *
 * Decode order (newest → oldest for backward compatibility):
 *   1. Try JWT (Phase 2A+ sessions)
 *   2. Try base64 JSON (Phase 1 sessions — forces re-login on next request)
 *
 * Returns null if there is no session or the token is expired/invalid.
 */
export async function getServerSession(): Promise<CrmSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("crm_session")?.value;

  if (!sessionCookie) return null;

  // ── Strategy 1: JWT (signed, tamper-proof) ────────────────────────────────
  try {
    const { payload } = await jwtVerify(sessionCookie, getJwtSecret(), {
      issuer: "crm-saas",
    });
    return payload as unknown as CrmSession;
  } catch {
    // Not a valid JWT — try base64 fallback
  }

  // ── Strategy 2: base64 JSON (Phase 1 legacy — backward compat only) ───────
  // Sessions encoded this way will still work until the user logs in again
  // and receives a proper JWT.
  try {
    const decodedStr = Buffer.from(sessionCookie, "base64").toString("utf-8");
    const parsed = JSON.parse(decodedStr);
    // Validate minimum required fields
    if (parsed && parsed.role && parsed._id) {
      return parsed as CrmSession;
    }
  } catch {
    // ignore — fall through to null
  }

  return null;
}

// ── requireRole ───────────────────────────────────────────────────────────────
/**
 * Validates that the current session exists and the user has one of the
 * allowed roles. Returns the full session including organizationId.
 */
export async function requireRole(allowedRoles: string[]): Promise<{
  isAuthorized: boolean;
  session: CrmSession | null;
  error: string | null;
  status: number;
}> {
  const session = await getServerSession();

  if (!session || !session.role) {
    return { isAuthorized: false, session: null, error: "Unauthorized", status: 401 };
  }

  const role = session.role.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());

  if (!normalizedAllowedRoles.includes(role)) {
    return {
      isAuthorized: false,
      session,
      error: "Forbidden - Insufficient permissions",
      status: 403,
    };
  }

  return { isAuthorized: true, session, error: null, status: 200 };
}

// ── validateTenantStatus ─────────────────────────────────────────────────────
async function validateTenantStatus(organizationId: string): Promise<{ error: string | null; status: number }> {
  const { query } = await import("./db");
  const [org] = await query(
    `SELECT status, plan_expires_at FROM organizations WHERE id = $1 LIMIT 1`,
    [organizationId]
  ) as any[];

  if (!org) return { error: "Organization not found.", status: 404 };
  if (org.status === "suspended") return { error: "Organization suspended.", status: 403 };
  
  if (org.plan_expires_at && new Date() > new Date(org.plan_expires_at)) {
    if (org.status !== "expired") {
      await query(`UPDATE organizations SET status = 'expired' WHERE id = $1`, [organizationId]);
    }
    return { error: "Plan expired. Please update your subscription.", status: 402 };
  }

  return { error: null, status: 200 };
}

// ── requireOrganization ───────────────────────────────────────────────────────
/**
 * Asserts that the current session is valid AND contains a valid organizationId.
 * Returns organizationId directly for use in tenantQuery() / tenantTransaction().
 */
export async function requireOrganization(): Promise<{
  isAuthorized: boolean;
  organizationId: string;
  session: CrmSession | null;
  error: string | null;
  status: number;
}> {
  const session = await getServerSession();

  if (!session) {
    return { isAuthorized: false, organizationId: "", session: null, error: "Unauthorized", status: 401 };
  }

  if (!session.organizationId) {
    return {
      isAuthorized: false,
      organizationId: "",
      session,
      error: "Session expired — please log in again.",
      status: 401,
    };
  }

  const validation = await validateTenantStatus(session.organizationId);
  if (validation.error) {
    return {
      isAuthorized: false,
      organizationId: "",
      session,
      error: validation.error,
      status: validation.status,
    };
  }

  return {
    isAuthorized: true,
    organizationId: session.organizationId,
    session,
    error: null,
    status: 200,
  };
}

// ── requireRoleAndOrganization ────────────────────────────────────────────────
/**
 * Combines role check + organization validation into one call.
 * The most common pattern in protected API routes.
 */
export async function requireRoleAndOrganization(allowedRoles: string[]): Promise<{
  isAuthorized: boolean;
  organizationId: string;
  session: CrmSession | null;
  error: string | null;
  status: number;
}> {
  const roleResult = await requireRole(allowedRoles);

  if (!roleResult.isAuthorized || !roleResult.session) {
    return {
      isAuthorized: false,
      organizationId: "",
      session: roleResult.session,
      error: roleResult.error,
      status: roleResult.status,
    };
  }

  const { session } = roleResult;

  if (!session.organizationId) {
    return {
      isAuthorized: false,
      organizationId: "",
      session,
      error: "Session expired — please log in again.",
      status: 401,
    };
  }

  const validation = await validateTenantStatus(session.organizationId);
  if (validation.error) {
    return {
      isAuthorized: false,
      organizationId: "",
      session,
      error: validation.error,
      status: validation.status,
    };
  }

  return {
    isAuthorized: true,
    organizationId: session.organizationId,
    session,
    error: null,
    status: 200,
  };
}
