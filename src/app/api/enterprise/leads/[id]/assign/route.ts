import { NextResponse } from "next/server";
import { requireOrganization, requireRoleAndOrganization } from "@/lib/serverAuth";
import { leadAssignmentService } from "@/lib/services/leadAssignmentService";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Only managers/admins can assign leads
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return NextResponse.json({ message: "Invalid lead ID" }, { status: 400 });
    }

    const body = await req.json();
    const { executiveId, managerId, reason } = body;

    const assignedBy = parseInt(auth.session?._id || '0', 10);

    const updatedLead = await leadAssignmentService.assignLead({
      leadId,
      organizationId: auth.organizationId,
      executiveId: executiveId || null,
      managerId: managerId || null,
      reason,
      assignedBy
    });

    return NextResponse.json(updatedLead, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/enterprise/leads/[id]/assign error:", error);
    return NextResponse.json({ message: error.message || "Error assigning lead." }, { status: 500 });
  }
}
