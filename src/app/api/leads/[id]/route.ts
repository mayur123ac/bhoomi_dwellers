// app/api/leads/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireOrganization } from "@/lib/serverAuth";
import { audit, AuditAction } from "@/lib/auditLog";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const leadId = Number(id);    
    if (isNaN(leadId)) return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });

    const body = await req.json() as Partial<LeadUpdate>;

    const allowed: (keyof LeadUpdate)[] = [
      "name", "contact_no", "email", "source", "budget", "location",
      "channel_partner", "assign_manager", "feedback",
      "interest_status", "status", "site_visit_date",
    ];

    const setClauses: string[] = [];
    const values: any[]        = [];

    for (const key of allowed) {
      if (key in body) {
        values.push(body[key]);
        setClauses.push(`${key} = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(leadId, auth.organizationId);
    const sql = `
      UPDATE leads
      SET ${setClauses.join(", ")}, updated_at = NOW()
      WHERE id = $${values.length - 1} AND organization_id = $${values.length}
      RETURNING *
    `;

    const rows = await query(sql, values) as any[];
    if (rows.length === 0) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    await audit({
      organizationId: auth.organizationId,
      userId: auth.session?._id,
      action: AuditAction.LEAD_UPDATED,
      entityType: "lead",
      entityId: String(leadId),
      metadata: { fields: setClauses.map((c) => c.split(" ")[0]) },
      req,
    });

    return NextResponse.json({ success: true, lead: rows[0] });
    } catch (err: any) {
        console.error(`[PATCH /api/leads/${id}]`, err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

}

interface LeadUpdate {
  name:            string;
  contact_no:      string;
  email:           string;
  source:          string;
  budget:          string;
  location:        string;
  channel_partner: string;
  assign_manager:  string;
  feedback:        string;
  interest_status: string | null;
  status:          string;
  site_visit_date: string | null;
}