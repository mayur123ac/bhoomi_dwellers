import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/serverAuth";
import { handleAssistantChat } from "@/lib/ai/assistant/core";
import { tenantQuery } from "@/lib/tenantDb";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, sessionId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get basic tenant info for context
    const orgResult = await tenantQuery(
      session.organizationId,
      `SELECT company_name FROM organizations WHERE id = $1`,
      []
    );

    const companyName = orgResult[0]?.company_name || "Unknown Company";

    // Build the AI context
    const context = {
      companyName,
      crmTitle: "Nexora CRM",
      userName: session.name,
      role: session.role,
      currentDate: new Date().toISOString().split("T")[0]
    };

    // Call the core assistant logic
    const aiResponse = await handleAssistantChat({
      organizationId: session.organizationId,
      userId: session._id,
      sessionId,
      message,
      context
    });

    return NextResponse.json({
      success: true,
      sessionId: aiResponse.sessionId,
      response: aiResponse.response
    });

  } catch (error: any) {
    console.error("AI Test API Error:", error);
    
    // Handle quota specific errors nicely
    if (error instanceof Error && error.name === 'ForbiddenError') {
      return NextResponse.json({ error: "AI token limit reached for this billing cycle." }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to process AI request" },
      { status: 500 }
    );
  }
}
