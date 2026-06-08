// src/app/api/caller-leads/route.ts
// Phase 2A: requireOrganization + tenant-scoped queries
import { NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { requireOrganization } from "@/lib/serverAuth";
import { broadcastUpdate } from "./events/route";
import { audit, AuditAction } from "@/lib/auditLog";

// ── POST: Bulk insert leads from Excel upload ─────────────────────────────────
export async function POST(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { leads = [], fileName, uploadedBy, assignedTo } = body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads provided" }, { status: 400 });
    }

    const result = await transaction(async (client) => {
      const { rows: batchRows } = await client.query(
        `INSERT INTO caller_upload_batches (file_name, row_count, uploaded_by, organization_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [fileName ?? "upload", leads.length, uploadedBy ?? "unknown", auth.organizationId]
      );
      const batchId = batchRows[0].id;

      const ids: number[] = [];
      for (const lead of leads) {
        const { rows } = await client.query(
          `INSERT INTO caller_leads
              (upload_batch, batch_name, sr_no, form_no, lead_date, name,
               contact_no, email, source, channel_partner, assign_manager,
               feedback, uploaded_by, assigned_to, saved_by, organization_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
           RETURNING id`,
          [
            batchId, fileName ?? null,
            lead.sr_no ?? null, lead.form_no ?? null, lead.lead_date ?? null,
            lead.name ?? "Unknown", lead.contact_no ?? null, lead.email ?? null,
            lead.source ?? null, lead.channel_partner ?? null,
            lead.assign_manager ?? null, lead.feedback ?? "",
            uploadedBy ?? "unknown",
            (assignedTo || uploadedBy) ?? "unknown",
            null,
            auth.organizationId
          ]
        );
        ids.push(rows[0].id);
      }
      return { batchId, ids };
    });

    broadcastUpdate({
      type: "leads_uploaded",
      batchId: result.batchId,
      count: leads.length,
      fileName,
      uploadedBy,
      assignedTo: assignedTo || uploadedBy,
      ts: Date.now(),
    });

    await audit({
      organizationId: auth.organizationId,
      userId: auth.session?._id,
      action: "caller_leads.bulk_upload",
      entityType: "caller_upload_batch",
      entityId: result.batchId,
      metadata: { count: leads.length, fileName },
      req,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/caller-leads]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── GET: Fetch all leads ──────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const batch      = searchParams.get("batch");
    const batchesOnly = searchParams.get("batches_only");

    if (batchesOnly === "1") {
      const rows = await query(
        `SELECT id, file_name, row_count, uploaded_by, created_at
         FROM caller_upload_batches 
         WHERE organization_id = $1
         ORDER BY created_at DESC`,
        [auth.organizationId]
      );
      return NextResponse.json({ batches: rows });
    }

    const params: any[] = [auth.organizationId];
    let sql = `
      SELECT cl.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id', cf.id, 'message', cf.message,
               'created_by_name', cf.created_by_name, 'created_at', cf.created_at
             ) ORDER BY cf.created_at ASC
           ) FILTER (WHERE cf.id IS NOT NULL), '[]'
         ) AS follow_ups
       FROM caller_leads cl
       LEFT JOIN caller_follow_ups cf ON cf.lead_id = cl.id
       WHERE cl.organization_id = $1
    `;

    if (batch) {
      sql += ` AND cl.upload_batch::text = $2`;
      params.push(batch);
    }

    sql += ` GROUP BY cl.id ORDER BY cl.created_at DESC`;

    const rows = await query(sql, params);

    return NextResponse.json({ leads: rows });
  } catch (err: any) {
    console.error("[GET /api/caller-leads]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE: Delete entire batch ───────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { batchId } = await req.json();
    if (!batchId) return NextResponse.json({ error: "batchId required" }, { status: 400 });

    // Ensure the batch belongs to this org
    const check = await query(
      `SELECT id FROM caller_upload_batches WHERE id::text = $1 AND organization_id = $2`,
      [batchId, auth.organizationId]
    ) as any[];

    if (check.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    await transaction(async (client) => {
      await client.query(
        `DELETE FROM caller_follow_ups
         WHERE lead_id IN (SELECT id FROM caller_leads WHERE upload_batch::text = $1 AND organization_id = $2)`,
        [batchId, auth.organizationId]
      );
      await client.query(`DELETE FROM caller_leads WHERE upload_batch::text = $1 AND organization_id = $2`, [batchId, auth.organizationId]);
      await client.query(`DELETE FROM caller_upload_batches WHERE id::text = $1 AND organization_id = $2`, [batchId, auth.organizationId]);
    });

    broadcastUpdate({ type: "batch_deleted", batchId, ts: Date.now() });

    await audit({
      organizationId: auth.organizationId,
      userId: auth.session?._id,
      action: "caller_leads.batch_deleted",
      entityType: "caller_upload_batch",
      entityId: String(batchId),
      req,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/caller-leads]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}