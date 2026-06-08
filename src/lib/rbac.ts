// src/lib/rbac.ts
// ─────────────────────────────────────────────────────────────────────────────
// Centralized Role-Based Access Control helpers for frontend components.
//
// NEXORA MULTI-TENANT ARCHITECTURE:
//   Platform Level:  super_admin       — manages all orgs, billing, quotas
//   Organization Level:
//     company_admin  — tenant owner/admin, manages employees & CRM
//     site_head      — site-level manager, limited access
//     sales_manager  — manages sales leads
//     receptionist   — handles walk-in enquiries
//     caller         — handles caller leads
//
// IMPORTANT:
//   - company_admin is the Organization Admin role
//   - super_admin is NOT an org admin and should NOT access employee management
//   - All role comparisons MUST be lowercase-normalized
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes a role string to lowercase and trims whitespace.
 * Handles all known DB variants:
 *   "company_admin", "Company_Admin", "admin", "Admin", "ADMIN"
 */
export function normalizeRole(role?: string | null): string {
  return (role ?? "").toLowerCase().trim();
}

// ── Organization Admin role values ────────────────────────────────────────────
// The canonical value is "company_admin", but legacy data may have "admin".
// Both are treated as the Organization Admin (tenant owner).
export const ORG_ADMIN_ROLES = ["company_admin", "admin"] as const;

// ── Non-admin org roles (employees — NO access to employee management) ────────
export const RESTRICTED_ROLES = [
  "receptionist",
  "sales_manager",
  "sales manager",
  "manager",
  "site_head",
  "site head",
  "caller",
  "employee",
] as const;

// ── Platform-level role ───────────────────────────────────────────────────────
export const SUPER_ADMIN_ROLE = "super_admin";

// ── Permission Checks ─────────────────────────────────────────────────────────

/**
 * Returns true if the role is an Organization Admin (company_admin or admin).
 * These users have full access to employee management, settings, etc.
 *
 * @example
 * const isAdmin = isOrgAdmin(user?.role);
 */
export function isOrgAdmin(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return ORG_ADMIN_ROLES.includes(normalized as typeof ORG_ADMIN_ROLES[number]);
}

/**
 * Returns true if the role is a platform super_admin.
 * Super admins should NOT access employee management (they're above tenants).
 */
export function isSuperAdmin(role?: string | null): boolean {
  return normalizeRole(role) === SUPER_ADMIN_ROLE;
}

/**
 * Returns true if the role can manage employees:
 * - company_admin ✅
 * - admin         ✅ (legacy/canonical)
 * - super_admin   ❌ (platform level, not org level)
 * - all others    ❌
 */
export function canManageEmployees(role?: string | null): boolean {
  return isOrgAdmin(role) && !isSuperAdmin(role);
}

/**
 * Returns true if the role is a site_head (limited admin).
 */
export function isSiteHead(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === "site_head" || normalized === "site head";
}

/**
 * Returns true if the role can see the full admin dashboard.
 * Includes company_admin, admin, and site_head.
 */
export function canAccessAdminDashboard(role?: string | null): boolean {
  return isOrgAdmin(role) || isSiteHead(role);
}

/**
 * Returns the correct dashboard redirect path based on role.
 * Used after login to direct users to their appropriate view.
 */
export function getDashboardPath(role: string | null | undefined, orgSlug?: string): string {
  const normalized = normalizeRole(role);
  
  if (normalized === "super_admin") {
    return "/platform-admin/dashboard";
  }

  const base = `/org/${orgSlug || ""}/dashboard`;

  if (normalized === "receptionist") return `${base}/receptionist`;
  if (normalized === "sales manager" || normalized === "sales_manager" || normalized === "manager") return `${base}/sales`;
  if (normalized === "caller" || normalized === "sales") return `${base}/caller`;
  // company_admin, admin, site_head, and anything else → main dashboard
  return base;
}
