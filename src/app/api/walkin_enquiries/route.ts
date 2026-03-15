import { NextResponse } from "next/server";
import { Pool } from "pg";

// 🚀 Connection Object
const pool = new Pool({
  user: "postgres",
  password: "8369787919", // Put your actual password back here (8369787919)
  host: "localhost",
  port: 5432,
  database: "bhoomi_crm"
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Extract exactly what we need from the frontend
    const { 
      name, phone, alt_phone, email, address, occupation, organization, 
      budget, configuration, purpose, source, assignedTo, status 
    } = body;

    // 2. Exactly 13 columns mapped to exactly 13 placeholders ($1 to $13)
    const query = `
      INSERT INTO walkin_enquiries (
        name, phone, alt_phone, email, address, occupation, organization, 
        budget, configuration, purpose, source, assigned_to, status, 
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *;
    `;
    
    // 3. Exactly 13 values in the array to match the $ placeholders
    const values = [
      name, phone, alt_phone, email, address, occupation, organization, 
      budget, configuration, purpose, source, assignedTo, status || 'Routed'
    ];

    const result = await pool.query(query, values);
    const savedEnquiry = result.rows[0];

    return NextResponse.json({ success: true, data: savedEnquiry }, { status: 201 });
  } catch (error) {
    console.error("POSTGRES ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to save to Walk-in Database" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const query = `SELECT * FROM walkin_enquiries ORDER BY created_at DESC;`;
    const result = await pool.query(query);

    return NextResponse.json({ success: true, data: result.rows }, { status: 200 });
  } catch (error) {
    console.error("GET ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch leads" }, { status: 500 });
  }
}