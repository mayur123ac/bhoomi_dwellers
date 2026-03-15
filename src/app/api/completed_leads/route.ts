import { NextResponse } from "next/server";
import { Pool } from "pg"; 

// Initialize your PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
});

// 🔥 REQUIRED FOR THE TABLE TO SHOW DATA 🔥
export async function GET(req: Request) {
  try {
    const result = await pool.query("SELECT * FROM completed_leads ORDER BY completed_at DESC");
    return NextResponse.json({ success: true, data: result.rows }, { status: 200 });
  } catch (error: any) {
    console.error("GET Completed Leads Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 🔥 SECURE POST ROUTE TO SAVE COMPLETED LEADS 🔥
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lead_id, name, email, phone, budget, propertyType, location, siteVisitDate } = body;

    const query = `
      INSERT INTO completed_leads (lead_id, name, email, phone, budget, property_type, location, site_visit_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    
    // Strict fallbacks prevent PostgreSQL NOT NULL crashes
    const values = [
      lead_id || "N/A",
      name || "Unknown", 
      email || "N/A", 
      phone || "N/A", 
      budget || "N/A", 
      propertyType || "N/A", 
      location || "N/A", 
      siteVisitDate || "Completed"
    ];
    
    const result = await pool.query(query, values);

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("PostgreSQL Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}