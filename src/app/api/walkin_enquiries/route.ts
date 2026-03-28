import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit  = Math.min(parseInt(searchParams.get("limit")  ?? "20", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0",  10), 0);

    const [rows, countRows] = await Promise.all([
      query(
        "SELECT * FROM walkin_enquiries ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      ),
      query("SELECT COUNT(*)::int AS total FROM walkin_enquiries"),
    ]);

    const total: number = countRows[0]?.total ?? 0;
    return NextResponse.json({ success: true, data: rows, total }, { status: 200 });
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
      cp_name, cp_company, cp_phone, loan_planned,
      assignedTo,
      assigned_receptionist, // ← NEW: receptionist name if self-assigned
      status,
    } = body;

    if (!name || !phone || !assignedTo) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: name, phone, assignedTo" },
        { status: 400 }
      );
    }

    const rows = await query(
      `INSERT INTO walkin_enquiries (
        name, phone, email, address, occupation, organization,
        budget, configuration, purpose, source,
        alt_phone, source_other, cp_name, cp_company, cp_phone, loan_planned,
        assigned_to, assigned_receptionist, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
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
        assigned_receptionist || null, // ← NEW param at position $18
        status        || "Routed",
      ]
    );

    return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}