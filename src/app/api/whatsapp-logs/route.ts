// src/app/api/whatsapp-logs/route.ts
// Phase 2A: requireOrganization + tenant-scoped queries
import { NextResponse } from "next/server";
import { tenantQuery } from "@/lib/tenantDb";
import { requireOrganization } from "@/lib/serverAuth";

export async function POST(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { lead_id, sender_name, sender_number, recipient_number, message_preview } = await req.json();

    // Verify lead belongs to this org
    const leadCheck = await tenantQuery(
      auth.organizationId,
      `SELECT id FROM walkin_enquiries WHERE organization_id = $1 AND id = $2
       UNION ALL
       SELECT id FROM leads WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [lead_id]
    ) as any[];

    if (leadCheck.length === 0) {
      return NextResponse.json({ success: false, message: "Lead not found" }, { status: 404 });
    }

    await tenantQuery(
      auth.organizationId,
      `INSERT INTO public.whatsapp_logs 
       (organization_id, lead_id, sender_name, sender_number, recipient_number, message_preview, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [lead_id, sender_name, sender_number, recipient_number, message_preview]
    );

    // Also log in follow_ups timeline
    await tenantQuery(
      auth.organizationId,
      `INSERT INTO public.follow_ups (organization_id, lead_id, message, created_by_name, site_visit_date)
       VALUES ($1, $2, $3, $4, NULL)`,
      [
        lead_id,
        `📱 WhatsApp sent by ${sender_name}: "${message_preview}"`,
        sender_name
      ]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("WhatsApp log error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to log" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const lead_id = searchParams.get("lead_id");

    const logs = await tenantQuery(
      auth.organizationId,
      `SELECT * FROM public.whatsapp_logs 
       WHERE organization_id = $1 AND lead_id = $2
       ORDER BY sent_at DESC`,
      [lead_id]
    );

    return NextResponse.json({ success: true, data: logs });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}