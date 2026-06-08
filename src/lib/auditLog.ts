// src/lib/auditLog.ts
// ─────────────────────────────────────────────────────────────────────────────
// Audit log helper — append-only security event recording.
//
// Usage:
//   import { audit } from "@/lib/auditLog";
//
//   await audit({
//     organizationId: session.organizationId,
//     userId: session._id,
//     userEmail: session.email,
//     action: "lead.delete",
//     entityType: "lead",
//     entityId: String(leadId),
//     metadata: { reason: "duplicate" },
//     req,
//   });
//
// Rules:
//   - NEVER update or delete audit_logs rows
//   - Failures are logged to console but NEVER throw — don't let audit
//     failures break the primary operation
// ─────────────────────────────────────────────────────────────────────────────

import { query } from "./db";
import type { NextRequest } from "next/server";

export const AuditAction = {
  LOGIN_SUCCESS:        "login.success",
  LOGIN_FAILURE:        "login.failure",
  LOGOUT:               "logout",
  PASSWORD_CHANGED:     "auth.password_changed",

  USER_CREATED:         "user.created",
  USER_UPDATED:         "user.updated",
  USER_DELETED:         "user.deleted",
  USER_STATUS_CHANGED:  "user.status_changed",

  LEAD_CREATED:         "lead.created",
  LEAD_UPDATED:         "lead.updated",
  LEAD_DELETED:         "lead.deleted",
  LEAD_TRANSFERRED:     "lead.transferred",
  LEAD_LOST:            "lead.lost",
  LEAD_RESTORED:        "lead.restored",

  ORG_CREATED:          "org.created",
  ORG_UPDATED:          "org.updated",

  ROLE_CREATED:         "role.created",
  ROLE_DELETED:         "role.deleted",

  TENANT_VIOLATION:     "security.tenant_violation",
  UNAUTHORIZED_ACCESS:  "security.unauthorized",
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

export interface AuditEntry {
  organizationId?: string | null;
  userId?: string | number | null;
  userEmail?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  status?: "success" | "failure" | "warning";
  req?: NextRequest | Request | null;
  isPlatformAction?: boolean; // If true, logs to platform_audit_logs instead
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    const ipAddress   = extractIp(entry.req);
    const userAgent   = extractUserAgent(entry.req);

    if (entry.isPlatformAction) {
      await query(
        `INSERT INTO platform_audit_logs
           (user_id, action, entity_type, entity_id, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6::inet, $7)`,
        [
          entry.userId           ? String(entry.userId) : null,
          entry.action,
          entry.entityType       ?? null,
          entry.entityId         ?? null,
          JSON.stringify(entry.metadata ?? {}),
          ipAddress,
          userAgent,
        ]
      );
    } else {
      await query(
        `INSERT INTO audit_logs
           (organization_id, user_id, user_email, action,
            entity_type, entity_id, metadata,
            ip_address, user_agent, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::inet, $9, $10)`,
        [
          entry.organizationId   ?? null,
          entry.userId           ? String(entry.userId) : null,
          entry.userEmail        ?? null,
          entry.action,
          entry.entityType       ?? null,
          entry.entityId         ?? null,
          JSON.stringify(entry.metadata ?? {}),
          ipAddress,
          userAgent,
          entry.status           ?? "success",
        ]
      );
    }
  } catch (err) {
    console.error("[auditLog] Failed to write audit entry:", err);
  }
}

function extractIp(req?: NextRequest | Request | null): string | null {
  if (!req) return null;
  try {
    const headers = req.headers;
    if (headers instanceof Headers) {
      const forwarded = headers.get("x-forwarded-for");
      if (forwarded) return forwarded.split(",")[0].trim();
      return headers.get("x-real-ip") ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}

function extractUserAgent(req?: NextRequest | Request | null): string | null {
  if (!req) return null;
  try {
    const headers = req.headers;
    if (headers instanceof Headers) {
      return headers.get("user-agent") ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}
