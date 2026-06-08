// src/app/api/platform/organizations/[id]/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/platformAuth";
import { audit } from "@/lib/auditLog";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireSuperAdmin();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const orgId = id;
    if (!orgId) return NextResponse.json({ error: "Invalid organization ID" }, { status: 400 });

    const body = await req.json();
    const allowedFields = ["status", "max_users", "max_leads", "storage_limit", "plan_expires_at"];
    
    const setClauses: string[] = [];
    const values: any[] = [];
    
    for (const key of allowedFields) {
      if (key in body) {
        values.push(body[key]);
        setClauses.push(`${key} = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    values.push(orgId);
    const sql = `
      UPDATE organizations 
      SET ${setClauses.join(", ")}, updated_at = NOW() 
      WHERE id = $${values.length} 
      RETURNING *
    `;

    const result = await query(sql, values) as any[];

    if (result.length === 0) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    await audit({
      userId: auth.session._id,
      action: "platform.organization.updated",
      entityType: "organization",
      entityId: String(orgId),
      metadata: { fields: setClauses.map(c => c.split(" ")[0]), updatedBy: auth.session.email },
      req,
      isPlatformAction: true
    });

    return NextResponse.json({ success: true, data: result[0] }, { status: 200 });

  } catch (error: any) {
    console.error(`[PATCH /api/platform/organizations/${id}] Error:`, error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
