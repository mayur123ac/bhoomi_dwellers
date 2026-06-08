// src/lib/platform.ts
// ─────────────────────────────────────────────────────────────────────────────
// Platform-level (super_admin) access control foundation.
//
// Architecture:
//   Platform (this file)
//   ├── super_admins  — platform operators, can manage all organizations
//   └── organizations
//       ├── company_admin
//       ├── manager
//       ├── employee
//       ├── receptionist
//       └── sales
//
// super_admin is NOT organization-scoped. They operate above all tenants.
// Regular org-level auth is handled by serverAuth.ts.
//
// DO NOT implement full super admin UI yet — only the foundation.
// ─────────────────────────────────────────────────────────────────────────────

import { getServerSession } from "./serverAuth";
import type { CrmSession } from "./tenant";

// ── isSuperAdmin ──────────────────────────────────────────────────────────────
/**
 * Returns true if the current session belongs to a platform super_admin.
 * Super admins are NOT bound to any organization — they manage the platform.
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getServerSession();
  return session?.role === "super_admin";
}

// ── requireSuperAdmin ─────────────────────────────────────────────────────────
/**
 * Asserts the current session is a platform super_admin.
 * Returns a typed result for consistent API route handling.
 *
 * @example
 * const auth = await requireSuperAdmin();
 * if (!auth.ok) return NextResponse.json({ message: auth.error }, { status: auth.status });
 * // auth.session is now available
 */
export async function requireSuperAdmin(): Promise<
  | { ok: true; session: CrmSession }
  | { ok: false; error: string; status: 401 | 403 }
> {
  const session = await getServerSession();

  if (!session) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  if (session.role !== "super_admin") {
    return {
      ok: false,
      error: "Forbidden — platform super_admin access required.",
      status: 403,
    };
  }

  return { ok: true, session };
}

// ── Platform-level access check ───────────────────────────────────────────────
/**
 * Returns true if the current user can access a given organization.
 * - super_admin: can access ALL organizations
 * - company_admin / others: can only access their own organization
 */
export async function canAccessOrganization(targetOrgId: string): Promise<boolean> {
  const session = await getServerSession();
  if (!session) return false;
  if (session.role === "super_admin") return true;
  return session.organizationId === targetOrgId;
}

// ── Platform role constants ───────────────────────────────────────────────────
export const PLATFORM_ROLES = {
  SUPER_ADMIN: "super_admin",
} as const;

export const ORG_ROLES = {
  COMPANY_ADMIN: "company_admin",
  MANAGER:       "manager",
  EMPLOYEE:      "employee",
  RECEPTIONIST:  "receptionist",
  SALES:         "sales",
} as const;

export type OrgRole = typeof ORG_ROLES[keyof typeof ORG_ROLES];

/**
 * All roles that are allowed to manage organization-level settings.
 * Use as: requireRoleAndOrganization(ADMIN_ROLES)
 */
export const ADMIN_ROLES: OrgRole[] = [ORG_ROLES.COMPANY_ADMIN];

/**
 * Roles that can manage leads and enquiries.
 */
export const LEAD_MANAGER_ROLES: OrgRole[] = [
  ORG_ROLES.COMPANY_ADMIN,
  ORG_ROLES.MANAGER,
];
