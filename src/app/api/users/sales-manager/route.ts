// app/api/users/sales-manager/route.ts
import { NextResponse } from "next/server";
import { tenantQuery } from "@/lib/tenantDb";
import { requireOrganization } from "@/lib/serverAuth";

export async function GET() {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    // Case-insensitive match — same behaviour as the old MongoDB $regex
    const managers = await tenantQuery(
      auth.organizationId,
      `SELECT id, name
       FROM users
       WHERE organization_id = $1
         AND LOWER(role) = 'sales manager'
         AND is_active = true
       ORDER BY name ASC`,
      []
    );

    // Return { success, data } — same shape the receptionist page already expects
    return NextResponse.json(
      { success: true, data: managers },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("GET /api/users/sales-manager error:", error);
    require('fs').appendFileSync('d:/CRM-SaasV2/frontend/api-error.log', new Date().toISOString() + ' ERROR: ' + error.stack + '\n');
    return NextResponse.json(
      { success: false, message: "Failed to fetch managers", error: error.message },
      { status: 500 }
    );
  }
}
