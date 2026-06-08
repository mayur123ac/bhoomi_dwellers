// app/api/followups/route.ts
// Phase 2A: requireOrganization + tenant-scoped queries
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireOrganization } from "@/lib/serverAuth";
import { audit, AuditAction } from "@/lib/auditLog";

// GET: Fetch all follow-up messages for this org
export async function GET() {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const messages = await query(
      `SELECT * FROM follow_ups 
       WHERE organization_id = $1 
       ORDER BY created_at ASC`,
      [auth.organizationId]
    ) as any[];

    // Return same shape as old MongoDB response so frontend needs no changes
    const mapped = messages.map(m => ({
      _id:              String(m.id),
      leadId:           String(m.lead_id),
      salesManagerName: m.created_by_name || "",
      createdBy:        m.created_by_name || "sales",
      message:          m.message,
      siteVisitDate:    m.site_visit_date || null,
      createdAt:        m.created_at,
    }));

    return NextResponse.json({ success: true, data: mapped }, { status: 200 });

  } catch (error) {
    console.error("GET followups error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST: Save a new follow-up message
export async function POST(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { leadId, salesManagerName, createdBy, message, siteVisitDate } = body;

    if (!leadId || !message) {
      return NextResponse.json(
        { success: false, message: "Missing fields: leadId and message are required" },
        { status: 400 }
      );
    }

    const rows = await query(
      `INSERT INTO follow_ups (lead_id, message, created_by_name, site_visit_date, organization_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        String(leadId),
        message,
        salesManagerName || createdBy || "sales",
        siteVisitDate    || null,
        auth.organizationId
      ]
    ) as any[];

    const m = rows[0];

    // Fire and forget audit
    audit({
      organizationId: auth.organizationId,
      userId: auth.session?._id,
      action: "followup.created",
      entityType: "follow_up",
      entityId: String(m.id),
      req,
    });

    // Return same shape as old MongoDB response
    return NextResponse.json({
      success: true,
      data: {
        _id:              String(m.id),
        leadId:           String(m.lead_id),
        salesManagerName: m.created_by_name || "",
        createdBy:        m.created_by_name || "sales",
        message:          m.message,
        siteVisitDate:    m.site_visit_date || null,
        createdAt:        m.created_at,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("POST followups error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save message" },
      { status: 500 }
    );
  }
}
