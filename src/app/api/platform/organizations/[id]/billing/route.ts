import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRoleAndOrganization } from "@/lib/serverAuth";

// Super Admin only: Update billing settings for a specific tenant
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRoleAndOrganization(["super_admin"]);
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const { status, max_users, max_leads, plan_expires_at } = await req.json();

    const setClauses: string[] = [];
    const values: any[] = [];
    let p = 1;

    if (status) { setClauses.push(`status = $${p++}`); values.push(status); }
    if (max_users !== undefined) { setClauses.push(`max_users = $${p++}`); values.push(max_users); }
    if (max_leads !== undefined) { setClauses.push(`max_leads = $${p++}`); values.push(max_leads); }
    if (plan_expires_at !== undefined) { setClauses.push(`plan_expires_at = $${p++}`); values.push(plan_expires_at ? new Date(plan_expires_at) : null); }

    if (setClauses.length === 0) {
      return NextResponse.json({ message: "No fields provided to update." }, { status: 400 });
    }

    values.push(id);
    const updated = await query(
      `UPDATE organizations SET ${setClauses.join(", ")} WHERE id = $${p} RETURNING id`,
      values
    ) as any[];

    if (updated.length === 0) {
      return NextResponse.json({ message: "Organization not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Billing settings updated successfully." });

  } catch (error: any) {
    console.error("PATCH /api/platform/organizations/[id]/billing error:", error);
    return NextResponse.json({ message: "Error updating billing settings." }, { status: 500 });
  }
}
