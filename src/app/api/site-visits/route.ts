// src/app/api/site-visits/route.ts
// Phase 2A: requireOrganization + tenant-scoped queries
import { NextResponse } from "next/server";
import { tenantQuery } from "@/lib/tenantDb";
import { requireOrganization } from "@/lib/serverAuth";

export async function GET(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("lead_id");

    // ✅ Lead-specific history
    if (leadId) {
      const rows = await tenantQuery(
        auth.organizationId,
        `SELECT * FROM public.site_visits 
         WHERE organization_id = $1 AND lead_id = $2
         ORDER BY visit_date ASC`,
        [leadId]
      );
      return NextResponse.json({ success: true, data: rows });
    }

    // ✅ Dashboard: today's visits
    const now = new Date();
    const todayStr = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]; // today's date in IST

    // Store as UTC bounds covering the full IST day
    const svStart = new Date(todayStr + "T00:00:00.000+05:30");
    const svEnd   = new Date(todayStr + "T23:59:59.999+05:30");

    const rows = await tenantQuery(
      auth.organizationId,
      `SELECT sv.*, we.name as lead_name, we.assigned_to
       FROM public.site_visits sv
       JOIN public.walkin_enquiries we ON we.id = sv.lead_id
       WHERE sv.organization_id = $1 AND sv.visit_date >= $2 AND sv.visit_date <= $3
       ORDER BY sv.visit_date ASC`,
      [svStart.toISOString(), svEnd.toISOString()]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { lead_id, visit_date, created_by, role, notes } = await req.json();

    if (!lead_id || !visit_date || !created_by) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (new Date(visit_date) < new Date()) {
      return NextResponse.json(
        { success: false, message: "Cannot schedule a visit in the past" },
        { status: 400 }
      );
    }

    const existing = await tenantQuery(
      auth.organizationId,
      `SELECT id FROM public.site_visits 
       WHERE organization_id = $1 AND lead_id = $2 AND visit_date = $3 AND status != 'cancelled'`,
      [lead_id, visit_date]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { success: false, message: "A visit already exists at this date/time" },
        { status: 409 }
      );
    }

    const result = await tenantQuery(
      auth.organizationId,
      `INSERT INTO public.site_visits (organization_id, lead_id, visit_date, created_by, role, status, notes)
       VALUES ($1, $2, $3, $4, $5, 'scheduled', $6)
       RETURNING *`,
      [lead_id, visit_date, created_by, role || "Sales Manager", notes || ""]
    );

    return NextResponse.json({ success: true, data: result[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json(
        { success: false, message: "A visit is already scheduled for this lead at this exact date/time." },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id, status, notes, visit_date } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 2; // start at 2 because $1 is organizationId

    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }
    if (notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(notes);
    }
    if (visit_date !== undefined) {
      if (new Date(visit_date) < new Date()) {
        return NextResponse.json(
          { success: false, message: "Cannot reschedule to a past date" },
          { status: 400 }
        );
      }
      fields.push(`visit_date = $${idx++}`);
      values.push(visit_date);
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, message: "Nothing to update" }, { status: 400 });
    }

    values.push(id);
    const result = await tenantQuery(
      auth.organizationId,
      `UPDATE public.site_visits SET ${fields.join(", ")} 
       WHERE organization_id = $1 AND id = $${idx}
       RETURNING *`,
      values
    );

    return NextResponse.json({ success: true, data: result[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}