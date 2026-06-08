// src/app/api/receptionist/assigned/route.ts
// Phase 2A: requireOrganization + tenant-scoped queries
import { NextResponse } from "next/server";
import { tenantQuery } from "@/lib/tenantDb";
import { requireOrganization } from "@/lib/serverAuth";

// GET /api/receptionist/assigned?name=Receptionist
export async function GET(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Query param 'name' is required" },
        { status: 400 }
      );
    }

    const rows = await tenantQuery(
      auth.organizationId,
      `SELECT * FROM walkin_enquiries
       WHERE organization_id = $1 AND assigned_to = $2
       ORDER BY created_at DESC`,
      [name] 
    ) as any[];

    return NextResponse.json({ success: true, data: rows, total: rows.length }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}