// src/app/api/platform/organizations/route.ts
import { NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/platformAuth";
import { audit } from "@/lib/auditLog";
import bcrypt from "bcryptjs";

// ── GET: List all tenants ─────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    const sql = `
      SELECT 
        o.id, o.company_name as name, o.slug, o.status, o.created_at, o.max_users, o.max_leads,
        s.crm_title, s.custom_domain,
        (SELECT email FROM users u WHERE u.organization_id = o.id AND u.role = 'company_admin' ORDER BY u.created_at ASC LIMIT 1) as admin_email,
        (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) as total_users,
        (SELECT COUNT(*) FROM walkin_enquiries we WHERE we.organization_id = o.id) as total_leads
      FROM organizations o
      LEFT JOIN organization_settings s ON s.organization_id = o.id
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const rows = await query(sql, [limit, offset]);
    
    const countSql = `SELECT COUNT(*) FROM organizations`;
    const countRes = await query(countSql) as any[];
    const total = parseInt(countRes[0].count, 10);

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Platform GET Orgs Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ── POST: Create new tenant (Atomic Transaction) ──────────────────────────────
export async function POST(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { 
      companyName, companyEmail, adminName, adminEmail, 
      temporaryPassword, slug, customDomain, crmTitle,
      primaryColor, secondaryColor, plan
    } = body;

    // Validate inputs
    if (!companyName || !companyEmail || !adminName || !adminEmail || !temporaryPassword || !slug) {
      return NextResponse.json({ success: false, message: "Missing required fields, including company email" }, { status: 400 });
    }

    // Slug validation (alphanumeric and dashes only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ success: false, message: "Slug can only contain lowercase letters, numbers, and dashes" }, { status: 400 });
    }

    // Check slug uniqueness
    const slugCheck = await query(`SELECT id FROM organizations WHERE slug = $1`, [slug]) as any[];
    if (slugCheck.length > 0) {
      return NextResponse.json({ success: false, message: "Slug is already taken" }, { status: 409 });
    }

    // Check email uniqueness globally
    const emailCheck = await query(`SELECT id FROM users WHERE email = $1`, [adminEmail]) as any[];
    if (emailCheck.length > 0) {
      return NextResponse.json({ success: false, message: "Admin email is already in use by another user" }, { status: 409 });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    // Default plan limits (could be dynamic based on 'plan' input)
    let maxUsers = 10;
    let maxLeads = 10000;
    if (plan === "growth") { maxUsers = 50; maxLeads = 50000; }
    if (plan === "enterprise") { maxUsers = 1000; maxLeads = 1000000; }

    const newOrg = await transaction(async (client) => {
      // 1. Create Organization
      const orgRes = await client.query(
        `INSERT INTO organizations 
         (company_name, slug, company_email, status, created_by_super_admin, max_users, max_leads, plan_started_at)
         VALUES ($1, $2, $3, 'active', $4, $5, $6, NOW())
         RETURNING id`,
        [companyName, slug, companyEmail, auth.session._id, maxUsers, maxLeads]
      );
      const orgId = orgRes.rows[0].id;

      // 2. Create Organization Settings
      await client.query(
        `INSERT INTO organization_settings
         (organization_id, crm_title, custom_domain, primary_color, secondary_color)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          orgId, 
          crmTitle || `${companyName} CRM`, 
          customDomain || null, 
          primaryColor || '#0F172A', 
          secondaryColor || '#3B82F6'
        ]
      );

      // 3. Create Company Admin User
      await client.query(
        `INSERT INTO users 
         (name, email, password, role, is_active, organization_id, status)
         VALUES ($1, $2, $3, 'company_admin', true, $4, 'active')`,
        [adminName, adminEmail, passwordHash, orgId]
      );

      return orgId;
    });

    await audit({
      userId: auth.session._id,
      action: "platform.organization.created",
      entityType: "organization",
      entityId: String(newOrg),
      metadata: { slug, companyName, adminEmail },
      req,
      isPlatformAction: true
    });

    return NextResponse.json({ 
      success: true, 
      message: "Organization created successfully",
      data: { id: newOrg, slug }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Platform POST Orgs Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
