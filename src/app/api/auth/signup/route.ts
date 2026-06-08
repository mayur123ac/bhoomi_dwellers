// src/app/api/auth/signup/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Phase 2A: bcrypt password hashing on all signup paths
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { generateSlug } from "@/lib/tenant";
import { audit, AuditAction } from "@/lib/auditLog";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, mode, organizationSlug, companyName, companyEmail } = body;

    // ── Mode A: New company registration ─────────────────────────────────────
    if (mode === "new_company") {
      if (!name || !email || !password || !companyName || !companyEmail) {
        return NextResponse.json(
          { message: "All fields are required: name, email, password, companyName, companyEmail." },
          { status: 400 }
        );
      }

      const slug = generateSlug(companyName);
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

      const result = await transaction(async (client) => {
        const slugCheck = await client.query(
          `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
          [slug]
        );
        if (slugCheck.rows.length > 0) {
          throw new Error(`SLUG_TAKEN:A company with a similar name already exists.`);
        }

        const emailCheck = await client.query(
          `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [email.trim()]
        );
        if (emailCheck.rows.length > 0) {
          throw new Error(`EMAIL_TAKEN:An account with this email already exists.`);
        }

        const orgRes = await client.query(
          `INSERT INTO organizations (company_name, slug, company_email, subscription_plan)
           VALUES ($1, $2, $3, 'free')
           RETURNING id, slug`,
          [companyName.trim(), slug, companyEmail.trim().toLowerCase()]
        );
        const org = orgRes.rows[0];

        await client.query(
          `INSERT INTO users
             (name, email, password, role, is_active, organization_id, status)
           VALUES ($1, $2, $3, 'company_admin', true, $4, 'active')`,
          [name.trim(), email.trim().toLowerCase(), hashedPassword, org.id]
        );

        return { organizationId: org.id, organizationSlug: org.slug };
      });

      await audit({
        organizationId: result.organizationId,
        action: AuditAction.ORG_CREATED,
        entityType: "organization",
        entityId: result.organizationId,
        metadata: { companyName, slug },
        req,
      });

      return NextResponse.json(
        {
          message: "Company registered successfully. You can now log in.",
          organizationSlug: result.organizationSlug,
        },
        { status: 201 }
      );
    }

    // ── Mode B: Join existing org ─────────────────────────────────────────────
    if (mode === "join_org" || !mode) {
      if (!name || !email || !password || !role) {
        return NextResponse.json({ message: "All fields are required." }, { status: 400 });
      }

      let orgId: string | null = null;

      if (organizationSlug) {
        const orgRows = await query(
          `SELECT id FROM organizations WHERE slug = $1 AND is_active = true LIMIT 1`,
          [organizationSlug]
        );
        if (orgRows.length === 0) {
          return NextResponse.json(
            { message: "Organization not found. Please check your invite link." },
            { status: 404 }
          );
        }
        orgId = (orgRows[0] as any).id;
      } else {
        const orgRows = await query(
          `SELECT id FROM organizations WHERE is_active = true ORDER BY created_at ASC LIMIT 1`
        );
        if (orgRows.length > 0) {
          orgId = (orgRows[0] as any).id;
        }
      }

      if (!orgId) {
        return NextResponse.json(
          { message: "No active organization found. Please contact your admin." },
          { status: 400 }
        );
      }

      const existing = await query(
        `SELECT id FROM users
         WHERE LOWER(email) = LOWER($1) AND organization_id = $2
         LIMIT 1`,
        [email.trim(), orgId]
      );
      if (existing.length > 0) {
        return NextResponse.json(
          { message: "Email already exists in this organization." },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

      const newUserRows = await query(
        `INSERT INTO users (name, email, password, role, is_active, organization_id, status)
         VALUES ($1, $2, $3, $4, true, $5, 'active')
         RETURNING id`,
        [name.trim(), email.trim().toLowerCase(), hashedPassword, role, orgId]
      );

      await audit({
        organizationId: orgId,
        userId: (newUserRows[0] as any).id,
        userEmail: email.trim().toLowerCase(),
        action: AuditAction.USER_CREATED,
        entityType: "user",
        entityId: String((newUserRows[0] as any).id),
        metadata: { role, mode: "join_org" },
        req,
      });

      return NextResponse.json(
        { message: "Account registered successfully." },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { message: "Invalid signup mode. Use 'new_company' or 'join_org'." },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("SIGNUP ERROR:", error);
    if (error.message?.startsWith("SLUG_TAKEN:") || error.message?.startsWith("EMAIL_TAKEN:")) {
      const [, msg] = error.message.split(":");
      return NextResponse.json({ message: msg }, { status: 400 });
    }
    return NextResponse.json(
      { message: "An error occurred during registration." },
      { status: 500 }
    );
  }
}