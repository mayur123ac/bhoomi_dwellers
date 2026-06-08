// src/app/api/roles/route.ts
// Phase 2A: requireRoleAndOrganization + tenant-scoped queries
import { NextResponse } from "next/server";
import { tenantQuery } from "@/lib/tenantDb";
import { requireOrganization, requireRoleAndOrganization } from "@/lib/serverAuth";
import { audit, AuditAction } from "@/lib/auditLog";

// ── GET: Fetch roles for this org ─────────────────────────────────────────────
export async function GET() {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const roles = await tenantQuery(
      auth.organizationId,
      `SELECT id, name FROM roles
       WHERE organization_id = $1
       ORDER BY name ASC`,
      []
    );

    const mapped = (roles as any[]).map((r) => ({ ...r, _id: String(r.id) }));
    return NextResponse.json(mapped, { status: 200 });

  } catch (error) {
    console.error("GET /api/roles error:", error);
    return NextResponse.json({ message: "Error fetching roles." }, { status: 500 });
  }
}

// ── POST: Add a new role ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const auth = await requireRoleAndOrganization(["admin", "company_admin"]);
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ message: "Role name is required." }, { status: 400 });
    }

    // Conflict check — scoped to this org
    const existing = await tenantQuery(
      auth.organizationId,
      `SELECT id FROM roles WHERE organization_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
      [name.trim()]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ message: "Role already exists in this organization." }, { status: 400 });
    }

    const [newRole] = await tenantQuery(
      auth.organizationId,
      `INSERT INTO roles (organization_id, name) VALUES ($1, $2) RETURNING id, name`,
      [name.trim()]
    ) as any[];

    await audit({
      organizationId: auth.organizationId,
      userId: auth.session?._id,
      userEmail: auth.session?.email,
      action: AuditAction.ROLE_CREATED,
      entityType: "role",
      entityId: String(newRole.id),
      metadata: { roleName: newRole.name },
      req,
    });

    return NextResponse.json({ ...newRole, _id: String(newRole.id) }, { status: 201 });

  } catch (error) {
    console.error("POST /api/roles error:", error);
    return NextResponse.json({ message: "Error creating role." }, { status: 500 });
  }
}