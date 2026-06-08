// app/api/loan/route.ts
// Phase 2A: requireOrganization + tenant-scoped queries
import { NextResponse } from "next/server";
import { tenantQuery } from "@/lib/tenantDb";
import { requireOrganization } from "@/lib/serverAuth";
import { audit, AuditAction } from "@/lib/auditLog";

// ── GET: Fetch all loan updates for this org ──────────────────────────────────
export async function GET() {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const loans = await tenantQuery(
      auth.organizationId,
      `SELECT * FROM loan_updates WHERE organization_id = $1 ORDER BY created_at ASC`,
      []
    );
    return NextResponse.json({ success: true, data: loans }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch loans:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch loans" },
      { status: 500 }
    );
  }
}

// ── POST: Save loan update + inject follow-up timeline message ────────────────
export async function POST(req: Request) {
  try {
    const auth = await requireOrganization();
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const body = await req.json();

    if (!body.leadId) {
      return NextResponse.json(
        { success: false, message: "Missing leadId" },
        { status: 400 }
      );
    }

    // Verify lead belongs to this org before inserting
    const leadCheck = await tenantQuery(
      auth.organizationId,
      `SELECT id FROM walkin_enquiries WHERE organization_id = $1 AND id = $2`,
      [body.leadId]
    ) as any[];

    if (leadCheck.length === 0) {
      // It might be a regular lead, try checking there too if needed
      // but usually the frontend passes leadId that works in either table
      const leadCheck2 = await tenantQuery(
        auth.organizationId,
        `SELECT id FROM leads WHERE organization_id = $1 AND id = $2`,
        [body.leadId]
      ) as any[];

      if (leadCheck2.length === 0) {
        return NextResponse.json({ success: false, message: "Lead not found in this organization" }, { status: 404 });
      }
    }

    // 1. Save structured loan data to PostgreSQL
    const rows = await tenantQuery(
      auth.organizationId,
      `INSERT INTO loan_updates (
        organization_id, lead_id, sales_manager_name, created_by,
        status, loan_type,
        amount_req, amount_app, processing_amt, roi, tenure,
        bank, officer, agent, agent_contact,
        emp_type, income, emi, cibil,
        prop_type, prop_value, project, builder,
        phone, alt_phone, email, address,
        doc_pan, doc_aadhaar, doc_salary, doc_bank, doc_property,
        app_date, aprv_date, exp_disb_date, disb_date, notes
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21,$22,$23,$24,$25,$26,
        $27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37
      ) RETURNING *`,
      [
        String(body.leadId),
        body.salesManagerName   || null,
        body.createdBy          || "sales",
        body.status             || "Pending",
        body.loanType           || null,
        body.amountReq          || null,
        body.amountApp          || null,
        body.processingAmt      || null,
        body.roi                || null,
        body.tenure             || null,
        body.bank               || null,
        body.officer            || null,
        body.agent              || null,
        body.agentContact       || null,
        body.empType            || null,
        body.income             || null,
        body.emi                || null,
        body.cibil              || null,
        body.propType           || null,
        body.propValue          || null,
        body.project            || null,
        body.builder            || null,
        body.phone              || null,
        body.altPhone           || null,
        body.email              || null,
        body.address            || null,
        body.docPan             || "Pending",
        body.docAadhaar         || "Pending",
        body.docSalary          || "Pending",
        body.docBank            || "Pending",
        body.docProperty        || "Pending",
        body.appDate            || null,
        body.apprvDate          || null,
        body.expDisbDate        || null,
        body.disbDate           || null,
        body.notes              || null
      ]
    ) as any[];

    const newLoan = rows[0];

    // 2. Build visual summary message
    const summaryMessage = `🏦 Loan Update:
• Loan Required: Yes
• Status: ${body.status || "N/A"}
• Bank Name: ${body.bank || "N/A"}
• Amount Requested: ${body.amountReq || "N/A"}
• Amount Approved: ${body.amountApp || "N/A"}
• CIBIL Score: ${body.cibil || "N/A"}
• Agent Name: ${body.agent || "N/A"}
• Agent Contact: ${body.agentContact || "N/A"}
• Employment Type: ${body.empType || "N/A"}
• Monthly Income: ${body.income || "N/A"}
• Existing EMIs: ${body.emi || "N/A"}
• PAN Card: ${body.docPan || "Pending"}
• Aadhaar Card: ${body.docAadhaar || "Pending"}
• Salary Slips: ${body.docSalary || "Pending"}
• Bank Statements: ${body.docBank || "Pending"}
• Property Docs: ${body.docProperty || "Pending"}
• Notes: ${body.notes || "N/A"}`;

    // 3. Inject into follow_ups table
    await tenantQuery(
      auth.organizationId,
      `INSERT INTO follow_ups (organization_id, lead_id, message, created_by_name, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        String(body.leadId),
        summaryMessage,
        body.salesManagerName || body.createdBy || "sales"
      ]
    );

    await audit({
      organizationId: auth.organizationId,
      userId: auth.session?._id,
      action: "loan.updated",
      entityType: "loan",
      entityId: String(newLoan.id),
      req,
    });

    return NextResponse.json({ success: true, data: newLoan }, { status: 201 });

  } catch (error) {
    console.error("Failed to save loan update:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save loan update" },
      { status: 500 }
    );
  }
}