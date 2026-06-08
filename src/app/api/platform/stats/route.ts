// src/app/api/platform/stats/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/platformAuth";

export async function GET(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    // Run aggregate queries concurrently for speed
    const [orgsRes, usersRes, leadsRes, recentOrgsRes] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as new_this_month
        FROM organizations
      `),
      query(`
        SELECT COUNT(*) as total FROM users WHERE is_active = true
      `),
      query(`
        SELECT COUNT(*) as total FROM walkin_enquiries
      `),
      query(`
        SELECT id, company_name as name, slug, status, created_at 
        FROM organizations 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
    ]) as any[];

    const orgStats = orgsRes[0] || { total: 0, active: 0, new_this_month: 0 };
    const totalUsers = usersRes[0]?.total || 0;
    const totalLeads = leadsRes[0]?.total || 0;
    const recentOrgs = recentOrgsRes || [];

    return NextResponse.json({
      success: true,
      data: {
        organizations: {
          total: parseInt(orgStats.total, 10),
          active: parseInt(orgStats.active, 10),
          newThisMonth: parseInt(orgStats.new_this_month, 10)
        },
        users: {
          total: parseInt(totalUsers, 10)
        },
        leads: {
          total: parseInt(totalLeads, 10)
        },
        recentOrganizations: recentOrgs
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Platform GET Stats Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error", error: error.message || String(error), stack: error.stack }, { status: 500 });
  }
}
