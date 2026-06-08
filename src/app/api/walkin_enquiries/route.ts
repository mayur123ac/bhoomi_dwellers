// app/api/walkin_enquiries/route.ts
// Phase 2A: requireOrganization + tenant-scoped queries
import { NextResponse } from "next/server";
import { tenantQuery } from "@/lib/tenantDb";
import { requireOrganization } from "@/lib/serverAuth";
import { audit, AuditAction } from "@/lib/auditLog";

export async function GET(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
    // Allow bulk admin fetches (> 1000 = bypass cap), otherwise cap at 500
    const limit = rawLimit > 1000 ? rawLimit : Math.min(rawLimit, 500);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

    const [rows, countRows] = await Promise.all([
      tenantQuery(
        auth.organizationId,
        `SELECT * FROM walkin_enquiries 
         WHERE organization_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [limit, offset]
      ),
      tenantQuery(
        auth.organizationId,
        "SELECT COUNT(*)::int AS total FROM walkin_enquiries WHERE organization_id = $1",
        []
      ),
    ]) as any;

    const total: number = countRows[0]?.total ?? 0;
    return NextResponse.json({ success: true, data: rows, total }, { status: 200 });
  } catch (error: any) {
    console.error("GET Enquiries Error:", error);
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
    const {
      name, phone, alt_phone, email, address, occupation, organization,
      budget, configuration, purpose, source, source_other,
      referral_name,
      cp_name, cp_company, cp_phone, loan_planned,
      assignedTo,
      assigned_receptionist,
      status,
      is_global_shared,
      overseeing_site_head
    } = body;

    if (!name || !phone || !assignedTo) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: name, phone, assignedTo" },
        { status: 400 }
      );
    }

    const rows = await tenantQuery(
      auth.organizationId,
      `INSERT INTO walkin_enquiries (
        organization_id, name, phone, email, address, occupation, organization,
        budget, configuration, purpose, source,
        alt_phone, source_other, referral_name,
        cp_name, cp_company, cp_phone,
        loan_planned, assigned_to, assigned_receptionist, status,
        is_global_shared, overseeing_site_head
      )
      VALUES (
        $1,  $2,  $3,  $4,  $5,  $6,  $7,
        $8,  $9,  $10, $11,
        $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20, $21,
        $22, $23
      )
      RETURNING *`,
      [
        name,                               // $2
        phone,                              // $3
        email || "N/A",                     // $4
        address || "N/A",                   // $5
        occupation || "N/A",                // $6
        organization || "N/A",              // $7
        budget || "Pending",                // $8
        configuration || "N/A",             // $9
        purpose || "N/A",                   // $10
        source || "Direct Walk-in",         // $11
        alt_phone || null,                  // $12
        source_other || null,               // $13
        referral_name || null,              // $14
        cp_name || null,                    // $15
        cp_company || null,                 // $16
        cp_phone || null,                   // $17
        loan_planned || "Pending",          // $18
        assignedTo,                         // $19
        assigned_receptionist || null,      // $20
        status || "Routed",                 // $21
        is_global_shared || false,          // $22
        overseeing_site_head || null        // $23
      ]
    ) as any[];

    await audit({
      organizationId: auth.organizationId,
      userId: auth.session?._id,
      action: "enquiry.created",
      entityType: "walkin_enquiry",
      entityId: String(rows[0].id),
      metadata: { name, phone },
      req,
    });

    return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("POST Enquiry Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}