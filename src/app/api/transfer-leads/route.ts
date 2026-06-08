// app/api/transfer-leads/route.ts
// Phase 2A: requireRoleAndOrganization + tenant-scoped queries
import { NextResponse } from "next/server";
import { tenantTransaction } from "@/lib/tenantDb";
import { requireRoleAndOrganization } from "@/lib/serverAuth";
import { audit, AuditAction } from "@/lib/auditLog";

export async function POST(req: Request) {
  try {
    const auth = await requireRoleAndOrganization(["admin", "company_admin"]);
    if (!auth.isAuthorized) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const body = await req.json();
    const { from, to } = body;

    // ── Validate inputs ──
    if (!from || !to) {
      return NextResponse.json(
        { success: false, message: "Both 'from' and 'to' employee names are required." },
        { status: 400 }
      );
    }

    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, message: "Cannot transfer leads to the same employee." },
        { status: 400 }
      );
    }

    // ── Execute transfer inside a transaction ──
    const transferred = await tenantTransaction(auth.organizationId, async (client, orgId) => {
      const result = await client.query(
        `UPDATE public.walkin_enquiries
         SET assigned_to = $2
         WHERE organization_id = $1 AND assigned_to = $3`,
        [orgId, to.trim(), from.trim()]
      );
      return result.rowCount ?? 0;
    });

    await audit({
      organizationId: auth.organizationId,
      userId: auth.session?._id,
      action: "leads.transferred_bulk",
      metadata: { from: from.trim(), to: to.trim(), count: transferred },
      req,
    });

    return NextResponse.json(
      {
        success: true,
        transferred,
        message: transferred > 0
          ? `${transferred} lead(s) transferred from "${from}" to "${to}".`
          : `No leads found assigned to "${from}".`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST /api/transfer-leads error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Transfer failed." },
      { status: 500 }
    );
  }
}
