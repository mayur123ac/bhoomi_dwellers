//api/users/site-head/route.ts
import { NextResponse } from "next/server";
import { tenantQuery } from "@/lib/tenantDb";
import { requireOrganization } from "@/lib/serverAuth";

export async function GET(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    // CHANGED: Using the "users" table and SELECT * to avoid column name mismatches
    const rows = await tenantQuery(
      auth.organizationId,
      `SELECT * FROM users 
       WHERE organization_id = $1 AND (LOWER(role) LIKE '%site%head%' 
          OR LOWER(role) = 'site_head') 
       ORDER BY name ASC`,
      []
    );

    return NextResponse.json({ 
      success: true, 
      data: rows 
    }, { status: 200 });

  } catch (error: any) {
    // This logs the EXACT error to your VS Code terminal
    console.error("🚨 DB Query Failed in Site Head API:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}