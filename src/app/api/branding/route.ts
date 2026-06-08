// src/app/api/branding/route.ts
// Phase 3: White-label CRM Branding API
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Fallback branding in case a tenant is not found
const DEFAULT_BRANDING = {
  crm_title: "Nexora CRM",
  logo: null,
  favicon: null,
  primary_color: "#0F172A",
  secondary_color: "#3B82F6",
  sidebar_theme: "dark"
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const domain = searchParams.get("domain");

    if (!slug && !domain) {
      return NextResponse.json({ success: true, data: DEFAULT_BRANDING }, { status: 200 });
    }

    let sql = "";
    let params: any[] = [];

    if (slug) {
      sql = `
        SELECT s.crm_title, s.logo, s.favicon, s.primary_color, s.secondary_color, s.sidebar_theme
        FROM organization_settings s
        JOIN organizations o ON o.id = s.organization_id
        WHERE o.slug = $1 AND o.status = 'active'
        LIMIT 1
      `;
      params = [slug];
    } else if (domain) {
      sql = `
        SELECT s.crm_title, s.logo, s.favicon, s.primary_color, s.secondary_color, s.sidebar_theme
        FROM organization_settings s
        JOIN organizations o ON o.id = s.organization_id
        WHERE s.custom_domain = $1 AND o.status = 'active'
        LIMIT 1
      `;
      params = [domain];
    }

    const rows = await query(sql, params) as any[];

    if (rows.length === 0) {
      // If tenant not found or suspended, return defaults so UI doesn't crash
      return NextResponse.json({ success: true, data: DEFAULT_BRANDING }, { status: 200 });
    }

    // Add cache headers for extremely fast performance
    const response = NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
    response.headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    return response;

  } catch (error: any) {
    console.error("GET /api/branding error:", error);
    // Never crash the branding endpoint, always return default
    return NextResponse.json({ success: true, data: DEFAULT_BRANDING }, { status: 200 });
  }
}
