import { NextResponse } from "next/server";
import { tenantQuery } from "@/lib/tenantDb";
import { requireRoleAndOrganization } from "@/lib/serverAuth";

export async function GET() {
  try {
    const auth = await requireRoleAndOrganization(["admin", "company_admin"]);
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    // Fetch limits and stats in a single query
    const [usageData] = await tenantQuery(
      auth.organizationId,
      `SELECT 
         o.status,
         o.plan_started_at,
         o.plan_expires_at,
         o.max_users,
         o.max_leads,
         (SELECT COUNT(*) FROM users WHERE organization_id = $1) as current_users,
         (SELECT COUNT(*) FROM leads WHERE organization_id = $1) as current_leads
       FROM organizations o
       WHERE o.id = $1`,
      []
    ) as any[];

    if (!usageData) {
      return NextResponse.json({ message: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: usageData.status,
      plan_started_at: usageData.plan_started_at,
      plan_expires_at: usageData.plan_expires_at,
      max_users: usageData.max_users,
      max_leads: usageData.max_leads,
      current_users: parseInt(usageData.current_users, 10),
      current_leads: parseInt(usageData.current_leads, 10),
    });

  } catch (error: any) {
    console.error("GET /api/org/billing/usage error:", error);
    return NextResponse.json({ message: "Error fetching billing usage." }, { status: 500 });
  }
}
