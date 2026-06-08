// src/app/api/completed_leads/route.ts
// Phase 2A: requireOrganization + tenant-scoped queries
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireOrganization } from "@/lib/serverAuth";
import { audit, AuditAction } from "@/lib/auditLog";

export async function GET(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const result = await query(
      `SELECT * FROM completed_leads 
       WHERE organization_id = $1 
       ORDER BY completed_at DESC`,
      [auth.organizationId]
    ) as any[];

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    console.error("GET Completed Leads Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { lead_id, id, name, email, phone, budget, propertyType, location, siteVisitDate } = body;
    const resolvedLeadId = lead_id || id || null;

    if (!resolvedLeadId) {
      return NextResponse.json({ success: false, message: "lead_id is required" }, { status: 400 });
    }

    const q = `
      INSERT INTO completed_leads (id, name, email, phone, budget, property_type, location, site_visit_date, organization_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    
    const values = [
      resolvedLeadId,
      name || "Unknown", 
      email || "N/A", 
      phone || "N/A", 
      budget || "N/A", 
      propertyType || "N/A", 
      location || "N/A", 
      siteVisitDate || "Pending",
      auth.organizationId
    ];
    
    const result = await query(q, values) as any[];

    await audit({
      organizationId: auth.organizationId,
      userId: auth.session?._id,
      action: "completed_lead.created",
      entityType: "completed_lead",
      entityId: String(resolvedLeadId),
      req,
    });

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error("PostgreSQL Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}