// app/api/leads/[id]/route.ts
// ─────────────────────────────────────────────
// PATCH /api/leads/:id  — update any lead fields
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = Number(params.id);
    if (isNaN(leadId)) return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });

    const body = await req.json() as Partial<LeadUpdate>;

    // Build dynamic SET clause — only update fields that were sent
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

    values.push(leadId);
    const sql = `
      UPDATE leads
      SET ${setClauses.join(", ")}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `;

    const rows = await query(sql, values);
    if (rows.length === 0) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    return NextResponse.json({ success: true, lead: rows[0] });
  } catch (err: any) {
    console.error(`[PATCH /api/leads/${params.id}]`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Types ──────────────────────────────────────
interface LeadUpdate {
  name:             string;
  contact_no:       string;
  email:            string;
  source:           string;
  budget:           string;
  location:         string;
  channel_partner:  string;
  assign_manager:   string;
  feedback:         string;
  interest_status:  string | null;
  status:           string;
  site_visit_date:  string | null;
}