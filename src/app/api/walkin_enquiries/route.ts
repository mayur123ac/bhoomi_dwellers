//walkin_enquiries/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

    // Because this uses SELECT *, the new Site Head columns will be fetched automatically
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
    console.error("GET Enquiries Error:", error);
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
      assigned_receptionist,
      status,
      // NEW FIELDS FOR SITE HEAD LOGIC:
      is_global_shared,
      overseeing_site_head
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
      alt_phone, source_other, cp_name, cp_company, cp_phone,
      loan_planned, assigned_to, assigned_receptionist, status,
      is_global_shared, overseeing_site_head
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10,
      $11, $12, $13, $14, $15,
      $16, $17, $18, $19,
      $20, $21
    )
    RETURNING *`,
      [
        name,                                // $1
        phone,                               // $2
        email || "N/A",              // $3
        address || "N/A",              // $4
        occupation || "N/A",              // $5
        organization || "N/A",              // $6
        budget || "Pending",          // $7
        configuration || "N/A",              // $8
        purpose || "N/A",              // $9
        source || "Direct Walk-in",   // $10
        alt_phone || null,               // $11
        source_other || null,               // $12
        cp_name || null,               // $13
        cp_company || null,               // $14
        cp_phone || null,               // $15
        loan_planned || "Pending",          // $16
        assignedTo,                          // $17
        assigned_receptionist || null,       // $18
        status || "Routed",           // $19
        is_global_shared || false,           // $20 (Defaults to false)
        overseeing_site_head || null         // $21 (Defaults to null)
      ]
    );

    return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("POST Enquiry Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}