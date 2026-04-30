//monitoring/daily-stats/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const today     = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay   = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    // All active users
    const users = await query(`
      SELECT id, name, role FROM public.users
      WHERE role IN ('Sales Manager', 'Site Head', 'Receptionist') AND is_active = true
      ORDER BY role, name
    `);

    // Lead counts per employee
    const leadCounts = await query(`
      SELECT assigned_to AS name, COUNT(*) AS total
      FROM public.walkin_enquiries
      WHERE assigned_to IS NOT NULL AND assigned_to != ''
      GROUP BY assigned_to
    `);

    // Follow-ups done TODAY per employee
    const followUpsToday = await query(`
      SELECT created_by_name AS name, COUNT(*) AS count
      FROM public.follow_ups
      WHERE created_at >= $1 AND created_at < $2
        AND message NOT LIKE '%🔄 Lead Transferred%'
        AND message NOT LIKE '%✅ Lead Marked as Closing%'
      GROUP BY created_by_name
    `, [startOfDay, endOfDay]);

    // WhatsApp messages sent TODAY
    const waToday = await query(`
      SELECT sender_name AS name, COUNT(*) AS count
      FROM public.whatsapp_logs
      WHERE sent_at >= $1 AND sent_at < $2
      GROUP BY sender_name
    `, [startOfDay, endOfDay]);

    // Site visits today
    // REPLACE the old siteVisitsToday query with:
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const svStart    = new Date(todayStr + "T00:00:00.000Z");
    const svEnd      = new Date(todayStr + "T23:59:59.999Z");

    const siteVisitRows = await query(
    `SELECT sv.*, we.name, we.assigned_to, we.status as lead_status
    FROM public.site_visits sv
    JOIN public.walkin_enquiries we ON we.id = sv.lead_id
    WHERE sv.visit_date >= $1 AND sv.visit_date <= $2`,
    [svStart.toISOString(), svEnd.toISOString()]
    );

    const siteVisitsToday     = siteVisitRows;
    const completedVisitsToday = siteVisitRows.filter((v: any) => v.status === "completed").length;
    const pendingVisitsToday   = siteVisitRows.filter((v: any) => v.status === "scheduled").length;

    // Leads with NO follow-up today per manager
    const leadsNoFollowUp = await query(`
      SELECT we.id, we.name, we.assigned_to
      FROM public.walkin_enquiries we
      WHERE we.status NOT IN ('Closing', 'Closed', 'Completed')
        AND we.assigned_to IS NOT NULL AND we.assigned_to != ''
        AND NOT EXISTS (
          SELECT 1 FROM public.follow_ups f
          WHERE f.lead_id = we.id AND f.created_at >= $1 AND f.created_at < $2
        )
    `, [startOfDay, endOfDay]);

    // Build maps
    const leadMap: Record<string, number>  = {};
    leadCounts.forEach((r: any) => { leadMap[r.name] = parseInt(r.total); });

    const fupMap: Record<string, number>   = {};
    followUpsToday.forEach((r: any) => { fupMap[r.name] = parseInt(r.count); });

    const waMap: Record<string, number>    = {};
    waToday.forEach((r: any) => { waMap[r.name] = parseInt(r.count); });

    const noFupByManager: Record<string, any[]> = {};
    leadsNoFollowUp.forEach((l: any) => {
      if (!noFupByManager[l.assigned_to]) noFupByManager[l.assigned_to] = [];
      noFupByManager[l.assigned_to].push({ id: l.id, name: l.name });
    });

    const stats = users.map((u: any) => ({
      name:           u.name,
      role:           u.role,
      totalLeads:     leadMap[u.name] || 0,
      followUpsToday: fupMap[u.name]  || 0,
      waToday:        waMap[u.name]   || 0,
      pendingLeads:   noFupByManager[u.name]?.length || 0,
      noFupLeads:     noFupByManager[u.name] || [],
      requiredToday:  leadMap[u.name] || 0,
      remainingToday: Math.max(0, (leadMap[u.name] || 0) - (fupMap[u.name] || 0)),
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats,
        siteVisitsToday,
        date: today.toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long", year:"numeric" }),
        totalFollowUpsToday: followUpsToday.reduce((a: number, r: any) => a + parseInt(r.count), 0),
        totalWaToday: waToday.reduce((a: number, r: any) => a + parseInt(r.count), 0),
      }
    });
  } catch (error) {
    console.error("Daily stats error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch stats" }, { status: 500 });
  }
}