import { NextResponse } from "next/server";
import { requireOrganization, requireRoleAndOrganization } from "@/lib/serverAuth";
import { leadRepository } from "@/lib/repositories/leadRepository";

export async function GET(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage") || undefined;
    const source = searchParams.get("source") || undefined;
    const project = searchParams.get("project") || undefined;
    const temperature = searchParams.get("temperature") || undefined;
    
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Filter by assigned executive for 'Executive' role
    // Wait, we need to know the current user's role to restrict visibility.
    // Admin, Site Head, Sales Manager, Executive
    const userRole = auth.session?.role || '';
    let assignedExecutiveId = undefined;

    if (userRole.toLowerCase() === 'executive') {
      assignedExecutiveId = auth.session?._id;
    }

    // TODO: Handle 'Sales Manager' team leads, 'Site Head' project leads

    const leads = await leadRepository.getLeads(auth.organizationId, {
      stage,
      source,
      project,
      leadTemperature: temperature,
      limit,
      offset,
      assignedExecutiveId: assignedExecutiveId ? parseInt(assignedExecutiveId, 10) : undefined
    });

    return NextResponse.json(leads, { status: 200 });
  } catch (error) {
    console.error("GET /api/enterprise/leads error:", error);
    return NextResponse.json({ message: "Error fetching leads." }, { status: 500 });
  }
}
