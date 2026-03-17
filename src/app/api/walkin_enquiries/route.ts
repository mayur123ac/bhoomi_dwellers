import { NextResponse } from "next/server";
import pool from "@/lib/mongodb"; // Keeping your existing pool import

// GET: Fetch all walk-in enquiries
export async function GET(req: Request) {
  try {
    const result = await pool.query("SELECT * FROM walkin_enquiries ORDER BY created_at DESC");
    return NextResponse.json({ success: true, data: result.rows }, { status: 200 });
  } catch (error: any) {
    console.error("GET walkin_enquiries error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create a new walk-in enquiry (Updated with Loan & CP fields)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Extract ALL fields including the newly added ones
    const { 
      name, phone, alt_phone, email, address, occupation, organization, 
      budget, configuration, purpose, source, 
      source_other, cp_name, cp_company, cp_phone, loan_planned, // 🔥 NEW FIELDS
      assignedTo, status 
    } = body;

    const query = `
      INSERT INTO walkin_enquiries 
        (name, phone, alt_phone, email, address, occupation, organization, budget, configuration, purpose, source, source_other, cp_name, cp_company, cp_phone, loan_planned, assigned_to, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    // Map values strictly to the $1-$18 placeholders
    const values = [
      name, 
      phone, 
      alt_phone || null, 
      email || "N/A", 
      address || "N/A", 
      occupation || "N/A", 
      organization || "N/A", 
      budget || "Pending", 
      configuration || "N/A", 
      purpose || "N/A", 
      source || "Direct Walk-in", 
      source_other || null,         // 🔥 Handling new field
      cp_name || null,              // 🔥 Handling new field
      cp_company || null,           // 🔥 Handling new field
      cp_phone || null,             // 🔥 Handling new field
      loan_planned || "Pending",    // 🔥 Handling new field
      assignedTo, 
      status || "Routed"
    ];

    const result = await pool.query(query, values);
    
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("POST walkin_enquiries error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}