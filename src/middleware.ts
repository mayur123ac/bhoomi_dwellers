// src/middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
// Next.js Edge Middleware — Phase 4
//
// Changes from Phase 3:
//   - Migrated from /dashboard to dynamic /org/[slug] routing
//   - Strictly enforces that the JWT's slug matches the URL's slug
//   - Blocks cross-tenant URL access
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ── Configuration ─────────────────────────────────────────────────────────────
export const config = {
  matcher: [
    "/org/:path*",
    "/platform-admin/:path*",
    "/api/:path*", 
  ],
};

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:3001";

// ── JWT secret ────────────────────────────────────────────────────────────────
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

// ── Session shape ─────────────────────────────────────────────────────────────
interface MiniSession {
  _id?: string;
  role?: string;
  organizationId?: string;
  organizationSlug?: string;
  impersonator_id?: string;
}

async function parseSession(token: string): Promise<MiniSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: "crm-saas",
    });
    return payload as MiniSession;
  } catch {
    // legacy fallback
  }
  try {
    const decoded = atob(token);
    const parsed = JSON.parse(decoded);
    if (parsed && parsed.role && parsed._id) {
      return parsed as MiniSession;
    }
  } catch {}
  return null;
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const host = request.headers.get("host") || "";

  // 1. Subdomain Extraction
  let detectedSubdomain = null;
  if (host !== BASE_DOMAIN && host.endsWith(`.${BASE_DOMAIN}`)) {
    detectedSubdomain = host.replace(`.${BASE_DOMAIN}`, "");
  }

  // 2. URL Slug Extraction for /org/[slug]
  let urlSlug = detectedSubdomain;
  if (pathname.startsWith("/org/")) {
    const parts = pathname.split("/");
    if (parts.length > 2) {
      urlSlug = parts[2]; // /org/bhoomi/... -> bhoomi
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", pathname);
  if (urlSlug) {
    requestHeaders.set("x-tenant-slug", urlSlug);
  }

  // 3. Public APIs
  const isPublicApi = pathname.startsWith("/api/auth") || 
                      pathname.startsWith("/api/branding") ||
                      pathname.startsWith("/api/platform/auth/login");

  if (isPublicApi) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 4. Route Categories
  const isOrgRoute = pathname.startsWith("/org/");
  const isOrgLogin = isOrgRoute && pathname.includes("/login");
  const isPlatformAdmin = pathname.startsWith("/platform-admin");
  const isPlatformApi = pathname.startsWith("/api/platform");
  const isTenantApi = pathname.startsWith("/api") && !isPlatformApi && !isPublicApi;

  if (!isOrgRoute && !isPlatformAdmin && !isPlatformApi && !isTenantApi) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Allow unauthenticated access to the dynamic login page and platform login
  if (isOrgLogin || pathname === "/platform-admin/login" || pathname === "/") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── AUTHENTICATION ────────────────────────────────────────────────────────
  const sessionCookie = request.cookies.get("crm_session")?.value;
  if (!sessionCookie) {
    if (isPlatformApi || isTenantApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const redirectTarget = isPlatformAdmin ? "/platform-admin/login" : urlSlug ? `/org/${urlSlug}/login` : "/";
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  const user = await parseSession(sessionCookie);
  if (!user || !user.role) {
    if (isPlatformApi || isTenantApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const redirectTarget = isPlatformAdmin ? "/platform-admin/login" : urlSlug ? `/org/${urlSlug}/login` : "/";
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  const role = user.role.toLowerCase();

  if (user.organizationId)   requestHeaders.set("x-organization-id",   user.organizationId);
  if (user.organizationSlug) requestHeaders.set("x-organization-slug", user.organizationSlug);
  if (user._id)              requestHeaders.set("x-user-id",           user._id);
  if (user.role)             requestHeaders.set("x-user-role",         user.role);
  if (user.impersonator_id)  requestHeaders.set("x-impersonator-id",   user.impersonator_id);

  // ── PLATFORM BOUNDARIES ─────────────────────────────────────────────────
  if (isPlatformAdmin || isPlatformApi) {
    if (role !== "super_admin") {
      if (isPlatformApi) return NextResponse.json({ error: "Forbidden: Platform access required" }, { status: 403 });
      return NextResponse.redirect(new URL(user.organizationSlug ? `/org/${user.organizationSlug}/dashboard` : "/", request.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── TENANT BOUNDARIES ───────────────────────────────────────────────────
  if (isOrgRoute || isTenantApi) {
    if (role === "super_admin") {
      if (!user.impersonator_id) {
        if (isTenantApi) return NextResponse.json({ error: "Forbidden: Super Admins cannot access tenant APIs directly." }, { status: 403 });
        return NextResponse.redirect(new URL("/platform-admin/dashboard", request.url));
      }
    }

    // CROSS-TENANT PREVENTION
    // If accessing /org/tata/dashboard but JWT is for bhoomi -> block!
    if (isOrgRoute && urlSlug && user.organizationSlug && urlSlug !== user.organizationSlug) {
      return NextResponse.redirect(new URL(`/org/${user.organizationSlug}/dashboard`, request.url));
    }

    // ── ROLE-BASED ROUTING ────────────────────────────────────────────────
    if (isOrgRoute && urlSlug) {
      const basePath = `/org/${urlSlug}/dashboard`;
      
      if (role === "sales manager" || role === "manager") {
        if (!pathname.startsWith(`${basePath}/sales`)) {
          return NextResponse.redirect(new URL(`${basePath}/sales`, request.url));
        }
      } else if (role === "receptionist") {
        if (!pathname.startsWith(`${basePath}/receptionist`)) {
          return NextResponse.redirect(new URL(`${basePath}/receptionist`, request.url));
        }
      } else if (role === "site_head" || role === "site head" || role === "employee") {
        const forbiddenPaths = [
          `${basePath}/employees`, `${basePath}/settings`, `${basePath}/caller`,
          `${basePath}/sales`, `${basePath}/receptionist`,
        ];
        if (forbiddenPaths.some((p) => pathname.startsWith(p))) {
          return NextResponse.redirect(new URL(basePath, request.url));
        }
      } else if (role === "caller" || role === "sales") {
        if (!pathname.startsWith(`${basePath}/caller`)) {
          return NextResponse.redirect(new URL(`${basePath}/caller`, request.url));
        }
      }
    }
    
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}
