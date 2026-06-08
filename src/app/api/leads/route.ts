// src/app/api/leads/route.ts
// Phase 2A: requireOrganization + tenant-scoped queries
import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { requireOrganization } from "@/lib/serverAuth";
import { audit, AuditAction } from "@/lib/auditLog";

// ── POST — save uploaded leads to DB ──────────
export async function POST(req: NextRequest) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { leads, fileName, uploadedBy } = body as {
      leads: LeadInput[];
      fileName?: string;
      uploadedBy?: string;
    };

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads provided" }, { status: 400 });
    }

    // ── Quota Check: max_leads ────────────────────────────────────────────────
    const [orgData] = await query(
      `SELECT 
         (SELECT COUNT(*) FROM leads WHERE organization_id = $1) as current_leads,
         max_leads 
       FROM organizations 
       WHERE id = $1`,
      [auth.organizationId]
    ) as any[];

    if (orgData) {
      const currentLeads = parseInt(orgData.current_leads, 10);
      const incomingLeads = leads.length;
      if (currentLeads + incomingLeads > orgData.max_leads) {
        return NextResponse.json(
          { error: `Quota exceeded: Your plan allows a maximum of ${orgData.max_leads} leads. You currently have ${currentLeads} leads. Attempting to add ${incomingLeads} more would exceed your limit.` },
          { status: 403 }
        );
      }
    }

    const result = await transaction(async (client) => {
      // 1. Create upload batch record (scoped to org)
      const batchRes = await client.query(
        `INSERT INTO upload_batches (file_name, row_count, uploaded_by, organization_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [fileName ?? "unknown.xlsx", leads.length, uploadedBy ?? "Caller", auth.organizationId]
      );
      const batchId: string = batchRes.rows[0].id;

      // 1b. Fetch block of sequence numbers for leads
      // Using direct sql inside the transaction to maintain lock integrity and use the same connection
      const seqRes = await client.query(
        `INSERT INTO tenant_sequences (organization_id, entity_type, next_value)
         VALUES ($1, $2, $3 + 1)
         ON CONFLICT (organization_id, entity_type)
         DO UPDATE SET next_value = tenant_sequences.next_value + $3
         RETURNING next_value - $3 AS start_value`,
         [auth.organizationId, 'lead', leads.length]
      );
      const startValue = parseInt(seqRes.rows[0].start_value, 10);
      const leadNumbers = Array.from({ length: leads.length }, (_, i) => startValue + i);

      // 2. Bulk-insert leads
      const values: any[] = [];
      const placeholders = leads.map((lead, i) => {
        const base = i * 12; // 12 values now
        values.push(
          batchId,
          lead.sr_no        ?? null,
          lead.form_no      ?? null,
          lead.lead_date    ?? null,
          lead.name,
          lead.contact_no   ?? null,
          lead.source       ?? null,
          lead.channel_partner ?? null,
          lead.assign_manager  ?? null,
          lead.feedback        ?? "",
          auth.organizationId,
          leadNumbers[i]
        );
        return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11},$${base+12})`;
      });

      const insertRes = await client.query(
        `INSERT INTO leads
           (upload_batch, sr_no, form_no, lead_date, name, contact_no,
            source, channel_partner, assign_manager, feedback, organization_id, lead_number)
         VALUES ${placeholders.join(",")}
         RETURNING id`,
        values
      );

      return { batchId, inserted: insertRes.rowCount ?? 0 };
    });

    await audit({
      organizationId: auth.organizationId,
      userId: auth.session?._id,
      action: "leads.bulk_upload",
      entityType: "upload_batch",
      entityId: result.batchId,
      metadata: { count: result.inserted, fileName },
      req,
    });

    return NextResponse.json({
      success: true,
      batchId:  result.batchId,
      inserted: result.inserted,
    });
  } catch (err: any) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json({ error: err.message ?? "Database error" }, { status: 500 });
  }
}

// ── GET — fetch leads (all or by batch) ────────
export async function GET(req: NextRequest) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batch");
    const limit   = Math.min(Number(searchParams.get("limit") ?? 500), 1000);
    const offset  = Number(searchParams.get("offset") ?? 0);

    let sql = `
      SELECT
        l.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',         f.id,
              'message',    f.message,
              'created_by', f.created_by_name,
              'created_at', f.created_at
            ) ORDER BY f.created_at
          ) FILTER (WHERE f.id IS NOT NULL),
          '[]'
        ) AS follow_ups
      FROM leads l
      LEFT JOIN follow_ups f ON f.lead_id = l.id
      WHERE l.organization_id = $1
    `;
    const params: any[] = [auth.organizationId];

    if (batchId) {
      sql += ` AND l.upload_batch = $${params.length + 1}`;
      params.push(batchId);
    }

    sql += ` GROUP BY l.id ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const rows = await query(sql, params) as any[];

    return NextResponse.json({ leads: rows, count: rows.length });
  } catch (err: any) {
    console.error("[GET /api/leads]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Types ──────────────────────────────────────
interface LeadInput {
  sr_no?:           string;
  form_no?:         string;
  lead_date?:       string;
  name:             string;
  contact_no?:      string;
  source?:          string;
  channel_partner?: string;
  assign_manager?:  string;
  feedback?:        string;
}