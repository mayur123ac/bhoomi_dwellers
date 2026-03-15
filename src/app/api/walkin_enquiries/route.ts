import { NextResponse } from "next/server";
import pool from "@/lib/mongodb"; // ✅ shared pool, remove 'new Pool()'

// Your existing GET and POST handlers stay exactly the same
export async function GET(req: Request) {
  try {
    const result = await pool.query("SELECT * FROM walkin_enquiries ORDER BY created_at DESC");
    return NextResponse.json({ success: true, data: result.rows }, { status: 200 });
  } catch (error: any) {
    console.error("GET walkin_enquiries error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, alt_phone, email, address, occupation, organization, budget, configuration, purpose, source, assignedTo, status } = body;

    const query = `
      INSERT INTO walkin_enquiries 
        (name, phone, alt_phone, email, address, occupation, organization, budget, configuration, purpose, source, assigned_to, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `;
    const values = [name, phone, alt_phone || null, email || "N/A", address || "N/A", occupation || "N/A", organization || "N/A", budget || "Pending", configuration || "N/A", purpose || "N/A", source || "Direct Walk-in", assignedTo, status || "Routed"];

    const result = await pool.query(query, values);
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("POST walkin_enquiries error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}