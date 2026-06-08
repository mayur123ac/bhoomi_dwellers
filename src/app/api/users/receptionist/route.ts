// app/api/users/receptionist/route.ts
import { NextResponse } from "next/server";
import { tenantQuery } from "@/lib/tenantDb";
import { requireOrganization } from "@/lib/serverAuth";

export async function GET() {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const receptionists = await tenantQuery(
      auth.organizationId,
      `SELECT id, name, username, email, role, is_active as "isActive"
       FROM users
       WHERE organization_id = $1
         AND LOWER(role) = 'receptionist'
         AND is_active = true
       ORDER BY name ASC`,
      []
    );

    // Map id → _id so any frontend code using _id keeps working
    const mapped = receptionists.map(u => ({ ...u, _id: String(u.id) }));

    return NextResponse.json(
      { success: true, data: mapped },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching receptionists:", error);
    return NextResponse.json(
      { success: false, message: "Server Error fetching receptionists" },
      { status: 500 }
    );
  }
}