import { NextResponse } from "next/server";
import { query } from "@/lib/db"; // ✅ same as all other routes

export async function GET(req: Request) {
  try {
    const rows = await query("SELECT * FROM walkin_enquiries ORDER BY created_at DESC");
    return NextResponse.json({ success: true, data: rows }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, phone, alt_phone, email, address, occupation, organization,
      budget, configuration, purpose, source, source_other,
      cp_name, cp_company, cp_phone, loan_planned, assignedTo, status,
    } = body;

    if (!name || !phone || !assignedTo) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: name, phone, assignedTo" },
        { status: 400 }
      );
    }

    const rows = await query(`
      INSERT INTO walkin_enquiries (
        name, phone, email, address, occupation, organization,
        budget, configuration, purpose, source,
        alt_phone, source_other, cp_name, cp_company, cp_phone, loan_planned,
        assigned_to, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *`,
      [
        name, phone,
        email         || "N/A",
        address       || "N/A",
        occupation    || "N/A",
        organization  || "N/A",
        budget        || "Pending",
        configuration || "N/A",
        purpose       || "N/A",
        source        || "Direct Walk-in",
        alt_phone     || null,
        source_other  || null,
        cp_name       || null,
        cp_company    || null,
        cp_phone      || null,
        loan_planned  || "Pending",
        assignedTo,
        status        || "Routed",
      ]
    );
    return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}