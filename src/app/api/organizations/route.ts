// src/app/api/organizations/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/organizations       — List orgs (super_admin only)
// POST /api/organizations       — Register a new company (public — onboarding)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { getServerSession } from "@/lib/serverAuth";
import { generateSlug } from "@/lib/tenant";

// ── POST: Register a new organization ────────────────────────────────────────
// Public endpoint — no auth required.
// Creates the org and the first admin user in a single atomic transaction.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName,
      companyEmail,
      companyPhone,
      adminName,
      adminEmail,
      adminPassword,
    } = body;

    // Validation
    if (!companyName || !companyEmail || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        {
          message:
            "Required fields: companyName, companyEmail, adminName, adminEmail, adminPassword.",
        },
        { status: 400 }
      );
    }

    const slug = generateSlug(companyName);

    const result = await transaction(async (client) => {
      // ── Uniqueness checks ─────────────────────────────────────────────────

      const slugCheck = await client.query(
        `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
        [slug]
      );
      if (slugCheck.rows.length > 0) {
        throw Object.assign(new Error("A company with a similar name already exists."), {
          statusCode: 409,
        });
      }

      const emailCheck = await client.query(
        `SELECT id FROM organizations WHERE LOWER(company_email) = LOWER($1) LIMIT 1`,
        [companyEmail.trim()]
      );
      if (emailCheck.rows.length > 0) {
        throw Object.assign(
          new Error("An organization with this email is already registered."),
          { statusCode: 409 }
        );
      }

      // ── Create organization ───────────────────────────────────────────────
      const orgRes = await client.query(
        `INSERT INTO organizations
           (company_name, slug, company_email, company_phone, subscription_plan, is_active)
         VALUES ($1, $2, $3, $4, 'free', true)
         RETURNING id, slug, company_name`,
        [
          companyName.trim(),
          slug,
          companyEmail.trim().toLowerCase(),
          companyPhone?.trim() ?? null,
        ]
      );
      const org = orgRes.rows[0];

      // ── Create first admin user ───────────────────────────────────────────
      const userRes = await client.query(
        `INSERT INTO users
           (name, email, password, role, is_active, organization_id, status)
         VALUES ($1, $2, $3, 'company_admin', true, $4, 'active')
         RETURNING id, name, email, role`,
        [
          adminName.trim(),
          adminEmail.trim().toLowerCase(),
          adminPassword,          // ⚠️ plaintext — bcrypt in Phase 2
          org.id,
        ]
      );

      return {
        organization: {
          id:          org.id,
          slug:        org.slug,
          companyName: org.company_name,
        },
        admin: userRes.rows[0],
      };
    });

    return NextResponse.json(
      {
        message:  "Organization registered successfully. You can now log in.",
        organization: result.organization,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/organizations]", error);
    return NextResponse.json(
      { message: error.message ?? "Registration failed." },
      { status: error.statusCode ?? 500 }
    );
  }
}

// ── GET: List all organizations (super_admin only) ────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session || session.role !== "super_admin") {
      return NextResponse.json(
        { message: "Forbidden — super_admin access required." },
        { status: 403 }
      );
    }

    const orgs = await query<{
      id: string;
      company_name: string;
      slug: string;
      company_email: string;
      subscription_plan: string;
      is_active: boolean;
      user_count: number;
      created_at: string;
    }>(
      `SELECT
         o.*,
         COUNT(u.id)::int AS user_count
       FROM organizations o
       LEFT JOIN users u ON u.organization_id = o.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );

    return NextResponse.json({ organizations: orgs }, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/organizations]", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
