import { NextResponse } from "next/server";
import pool from "@/lib/mongodb";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // ✅ await params first
    const body = await req.json();
    const { name, status } = body;

    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (name !== undefined)   { fields.push(`name = $${i++}`);   values.push(name); }
    if (status !== undefined) { fields.push(`status = $${i++}`); values.push(status); }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, message: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    const query = `UPDATE walkin_enquiries SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error("PUT walkin_enquiries error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // ✅ await params first
    await pool.query(`DELETE FROM walkin_enquiries WHERE id = $1`, [id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE walkin_enquiries error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}