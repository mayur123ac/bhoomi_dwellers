// app/api/leads/transfer/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST /api/leads/transfer
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lead_id, transfer_to, transfer_note, transferred_by } = body as {
      lead_id:        number | string;
      transfer_to:    string;
      transfer_note:  string;
      transferred_by: string;
    };

    // ── Validation ──────────────────────────────────────────────────
    if (!lead_id || !transfer_to || !transferred_by) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: lead_id, transfer_to, transferred_by" },
        { status: 400 }
      );
    }

    if (!transfer_note || transfer_note.trim().length < 50) {
      return NextResponse.json(
        { success: false, message: "transfer_note must be at least 50 characters" },
        { status: 400 }
      );
    }

    // ── 1. Verify lead exists before doing anything ──────────────────
    const existing = await query(
      `SELECT id, assigned_receptionist FROM walkin_enquiries WHERE id = $1`,
      [lead_id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    const transferMessage =
      `🔄 Lead Transferred by ${transferred_by} (Receptionist) → ${transfer_to}\n\nHandover Summary:\n${transfer_note.trim()}`;

    // ── 2. Insert follow-up — same shape as your followups/route.ts ──
    const followUpRows = await query(
      `INSERT INTO follow_ups (lead_id, message, created_by_name, site_visit_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        String(lead_id),
        transferMessage,
        transferred_by,
        null,              // no site visit date on transfer
      ]
    );

    // ── 3. Update assigned_to ONLY — assigned_receptionist untouched ─
    const updatedLead = await query(
      `UPDATE walkin_enquiries
       SET assigned_to = $1
       WHERE id = $2
       RETURNING *`,
      [transfer_to, lead_id]
    );

    // Map follow-up to the same shape your frontend expects
    const fu = followUpRows[0];

    return NextResponse.json(
      {
        success: true,
        message: `Lead #${lead_id} transferred to ${transfer_to}`,
        data: {
          lead: updatedLead[0],
          followUp: {
            _id:              String(fu.id),
            leadId:           String(fu.lead_id),
            salesManagerName: fu.created_by_name || "",
            createdBy:        fu.created_by_name || "receptionist",
            message:          fu.message,
            siteVisitDate:    fu.site_visit_date || null,
            createdAt:        fu.created_at,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/leads/transfer]", error);
    return NextResponse.json(
      { success: false, message: error.message ?? "Transfer failed" },
      { status: 500 }
    );
  }
}