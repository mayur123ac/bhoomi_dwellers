// src/app/api/organizations/[slug]/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/organizations/:slug
//   - Public: check if a slug is available (query param: ?check=true)
//   - Authenticated (company_admin): fetch own organization details
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "@/lib/serverAuth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);

    // ── Slug availability check (public — used during onboarding) ────────────
    // GET /api/organizations/bhoomi-realty?check=true
    if (searchParams.get("check") === "true") {
      const rows = await query(
        `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
        [slug]
      );
      return NextResponse.json({ available: rows.length === 0 }, { status: 200 });
    }

    // ── Authenticated org detail fetch ────────────────────────────────────────
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only members of the org (or super_admin) can see org details
    const rows = await query(
      `SELECT
         o.id,
         o.company_name,
         o.slug,
         o.company_email,
         o.company_phone,
         o.logo,
         o.domain,
         o.subscription_plan,
         o.subscription_ends_at,
         o.is_active,
         o.created_at,
         COUNT(u.id)::int AS user_count
       FROM organizations o
       LEFT JOIN users u ON u.organization_id = o.id
       WHERE o.slug = $1
       GROUP BY o.id
       LIMIT 1`,
      [slug]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: "Organization not found." }, { status: 404 });
    }

    const org = rows[0] as any;

    // Security: only org members or super_admin can read org details
    const isMember = session.organizationId === org.id;
    const isSuperAdmin = session.role === "super_admin";

    if (!isMember && !isSuperAdmin) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json({ organization: org }, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/organizations/[slug]]", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// ── PATCH: Update organization settings (company_admin only) ─────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find org
    const orgRows = await query(
      `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
      [slug]
    );
    if (orgRows.length === 0) {
      return NextResponse.json({ message: "Organization not found." }, { status: 404 });
    }
    const org = orgRows[0] as any;

    // Only company_admin of THIS org (or super_admin) can update it
    const isMemberAdmin =
      session.organizationId === org.id && session.role === "company_admin";
    const isSuperAdmin = session.role === "super_admin";

    if (!isMemberAdmin && !isSuperAdmin) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = await req.json();
    const allowedFields: Record<string, string> = {
      companyName:  "company_name",
      companyPhone: "company_phone",
      logo:         "logo",
      domain:       "domain",
    };

    const setClauses: string[] = [];
    const values: any[] = [];
    let p = 1;

    for (const [clientKey, dbCol] of Object.entries(allowedFields)) {
      if (body[clientKey] !== undefined) {
        setClauses.push(`${dbCol} = $${p++}`);
        values.push(body[clientKey]);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ message: "No fields to update." }, { status: 400 });
    }

    values.push(org.id);
    const updated = await query(
      `UPDATE organizations SET ${setClauses.join(", ")} WHERE id = $${p} RETURNING *`,
      values
    );

    return NextResponse.json(
      { message: "Organization updated.", organization: updated[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[PATCH /api/organizations/[slug]]", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
