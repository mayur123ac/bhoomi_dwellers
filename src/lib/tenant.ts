// src/lib/tenant.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tenant resolution and validation utilities.
//
// This module is the single source of truth for:
//   1. Extracting organization context from an incoming request
//   2. Asserting that a resource belongs to the current tenant
//   3. Building tenant-scoped WHERE clauses for raw SQL queries
//
// Architecture note:
//   Currently uses cookie-session-based tenant resolution (login-time).
//   The extractOrganizationFromRequest() function is designed so that
//   subdomain-based or header-based resolution can be added later
//   WITHOUT changing call sites — just update the resolution strategy
//   inside this function.
// ─────────────────────────────────────────────────────────────────────────────

import type { NextRequest } from "next/server";
import { TenantViolationError } from "./errors";

// ── Session shape (must match what login sets in crm_session cookie) ──────────
export interface CrmSession {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  organizationId: string;      // UUID of the user's organization
  organizationSlug: string;    // e.g. "bhoomi-realty"
}

// ── Tenant Resolution ─────────────────────────────────────────────────────────

/**
 * Extracts the organization context from an incoming API request.
 *
 * Resolution order (highest priority first):
 *   1. crm_session cookie (current method — login sets organizationId)
 *   2. X-Organization-Slug header (future: server-to-server calls)
 *   3. Subdomain parsing (future: subdomain-based routing)
 *
 * Returns null if no organization context can be determined.
 * API routes should call getServerSession() from serverAuth.ts instead,
 * which already parses the cookie. Use this in middleware where you need
 * the org without a full session parse.
 */
export function extractOrganizationIdFromRequest(req: NextRequest): string | null {
  // Strategy 1: crm_session cookie (primary method)
  const sessionCookie = req.cookies.get("crm_session")?.value;
  if (sessionCookie) {
    try {
      const session = JSON.parse(
        Buffer.from(sessionCookie, "base64").toString("utf-8")
      ) as Partial<CrmSession>;
      if (session.organizationId) return session.organizationId;
    } catch {
      // malformed cookie — fall through to other strategies
    }
  }

  // Strategy 2: X-Organization-Id header (future server-to-server / API keys)
  const headerOrgId = req.headers.get("x-organization-id");
  if (headerOrgId) return headerOrgId;

  // Strategy 3: Subdomain extraction (future: bhoomi.yoursaas.com)
  // const host = req.headers.get("host") ?? "";
  // const subdomain = extractSubdomain(host);
  // if (subdomain) { ... resolve slug to UUID ... }

  return null;
}

/**
 * Extracts the organization slug from an incoming request.
 * Follows the same resolution order as extractOrganizationIdFromRequest().
 */
export function extractOrganizationSlugFromRequest(req: NextRequest): string | null {
  const sessionCookie = req.cookies.get("crm_session")?.value;
  if (sessionCookie) {
    try {
      const session = JSON.parse(
        Buffer.from(sessionCookie, "base64").toString("utf-8")
      ) as Partial<CrmSession>;
      if (session.organizationSlug) return session.organizationSlug;
    } catch {
      // ignore
    }
  }

  const headerSlug = req.headers.get("x-organization-slug");
  if (headerSlug) return headerSlug;

  return null;
}

// ── Tenant Ownership Assertion ────────────────────────────────────────────────

/**
 * Verifies that a database record belongs to the requesting tenant.
 *
 * Use this when you've fetched a record by ID and need to confirm it
 * actually belongs to the current session's organization.
 *
 * @throws {TenantViolationError} if the resource belongs to a different org
 *
 * @example
 * const lead = await query(`SELECT * FROM leads WHERE id = $1`, [id]);
 * assertOrganizationOwnership(lead[0].organization_id, session.organizationId);
 */
export function assertOrganizationOwnership(
  resourceOrganizationId: string | null | undefined,
  sessionOrganizationId: string
): void {
  if (!resourceOrganizationId) {
    // Unscoped resource — this is a data integrity problem, reject it
    throw new TenantViolationError(
      "Resource has no organization_id — cannot verify tenant ownership."
    );
  }

  if (resourceOrganizationId !== sessionOrganizationId) {
    // Log this — it may indicate an attack or a bug in query construction
    console.error(
      `[TENANT VIOLATION] Attempt to access resource of org ${resourceOrganizationId} ` +
      `by session of org ${sessionOrganizationId}.`
    );
    throw new TenantViolationError();
  }
}

// ── Tenant-Safe SQL Helpers ───────────────────────────────────────────────────

/**
 * Appends a tenant-scoping WHERE clause to a SQL fragment.
 *
 * This is a convenience helper for building raw SQL queries that are
 * guaranteed to be scoped to a single organization.
 *
 * @param organizationId - UUID of the current tenant
 * @param tableAlias     - Optional table alias (e.g. "l" for "l.organization_id")
 *
 * @example
 * const { clause, param } = tenantWhereClause(organizationId, "l");
 * const sql = `SELECT * FROM leads l WHERE ${clause} ORDER BY created_at DESC`;
 * const rows = await query(sql, [param]);
 */
export function tenantWhereClause(
  organizationId: string,
  tableAlias?: string,
  paramIndex = 1
): { clause: string; param: string } {
  const col = tableAlias
    ? `${tableAlias}.organization_id`
    : "organization_id";
  return {
    clause: `${col} = $${paramIndex}`,
    param: organizationId,
  };
}

/**
 * Generates a slug from a company name.
 * "Bhoomi Realty Pvt Ltd" → "bhoomi-realty-pvt-ltd"
 */
export function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")      // remove special chars
    .replace(/\s+/g, "-")               // spaces to hyphens
    .replace(/-+/g, "-")                // collapse multiple hyphens
    .replace(/^-|-$/g, "");             // trim leading/trailing hyphens
}
