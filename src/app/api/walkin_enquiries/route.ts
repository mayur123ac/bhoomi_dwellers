import { NextResponse } from "next/server";
import pool from "@/lib/mongodb";

// GET: Fetch all walk-in enquiries
export async function GET(req: Request) {
  try {
    const result = await pool.query(
      "SELECT * FROM walkin_enquiries ORDER BY created_at DESC"
    );
    return NextResponse.json({ success: true, data: result.rows }, { status: 200 });
  } catch (error: any) {
    console.error("GET walkin_enquiries error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create a new walk-in enquiry
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      phone,
      alt_phone,
      email,
      address,
      occupation,
      organization,
      budget,
      configuration,
      purpose,
      source,
      source_other,
      cp_name,
      cp_company,
      cp_phone,
      loan_planned,
      assignedTo,
      status,
    } = body;

    // Validate required fields
    if (!name || !phone || !assignedTo) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: name, phone, assignedTo" },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO walkin_enquiries (
        name, phone, email, address, occupation, organization,
        budget, configuration, purpose, source,
        alt_phone, source_other, cp_name, cp_company, cp_phone, loan_planned,
        assigned_to, status
      )
      VALUES (
        $1,  $2,  $3,  $4,  $5,  $6,
        $7,  $8,  $9,  $10,
        $11, $12, $13, $14, $15, $16,
        $17, $18
      )
      RETURNING *
    `;

    const values = [
      name,                        // $1
      phone,                       // $2
      email       || "N/A",        // $3
      address     || "N/A",        // $4
      occupation  || "N/A",        // $5
      organization|| "N/A",        // $6
      budget      || "Pending",    // $7
      configuration||"N/A",        // $8
      purpose     || "N/A",        // $9
      source      || "Direct Walk-in", // $10
      alt_phone   || null,         // $11
      source_other|| null,         // $12
      cp_name     || null,         // $13
      cp_company  || null,         // $14
      cp_phone    || null,         // $15
      loan_planned|| "Pending",    // $16
      assignedTo,                  // $17
      status      || "Routed",     // $18
    ];

    const result = await pool.query(query, values);
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });

  } catch (error: any) {
    console.error("POST walkin_enquiries error:", error);

    // Give a specific hint if column doesn't exist
    const msg = error.message?.includes("column")
      ? `Schema error — run ALTER TABLE to add missing columns. Detail: ${error.message}`
      : error.message;

    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}