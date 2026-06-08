// src/app/api/org/settings/branding/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "@/lib/serverAuth";
import { audit } from "@/lib/auditLog";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.organizationId || !session.role) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Only Company Admins can change branding
    if (session.role.toLowerCase() !== "company_admin" && session.role.toLowerCase() !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden: Only admins can update branding" }, { status: 403 });
    }

    const body = await req.json();
    const { crm_title, logo, favicon, primary_color, secondary_color, sidebar_theme } = body;

    const setClauses: string[] = [];
    const values: any[] = [];
    
    const allowedFields = { crm_title, logo, favicon, primary_color, secondary_color, sidebar_theme };
    
    Object.entries(allowedFields).forEach(([key, value]) => {
      if (value !== undefined) {
        values.push(value);
        setClauses.push(`${key} = $${values.length}`);
      }
    });

    if (setClauses.length === 0) {
      return NextResponse.json({ success: false, message: "No valid fields provided" }, { status: 400 });
    }

    values.push(session.organizationId);
    
    const sql = `
      UPDATE organization_settings
      SET ${setClauses.join(", ")}, updated_at = NOW()
      WHERE organization_id = $${values.length}
      RETURNING crm_title, logo, primary_color, secondary_color
    `;

    const result = await query(sql, values) as any[];

    if (result.length === 0) {
      // Possible that the record doesn't exist yet, although it should have been created during onboarding
      return NextResponse.json({ success: false, message: "Organization settings not found" }, { status: 404 });
    }

    await audit({
      organizationId: session.organizationId,
      userId: session._id,
      userEmail: session.email,
      action: "org.branding.updated",
      entityType: "organization",
      entityId: session.organizationId,
      metadata: { fields_updated: Object.keys(allowedFields).filter(k => allowedFields[k as keyof typeof allowedFields] !== undefined) },
      req
    });

    return NextResponse.json({ success: true, data: result[0] }, { status: 200 });

  } catch (error: any) {
    console.error("PATCH /api/org/settings/branding error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
