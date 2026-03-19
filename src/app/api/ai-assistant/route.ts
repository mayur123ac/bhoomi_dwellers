import { NextResponse } from "next/server";
import { Bot, User, Send, BarChart2, AlertTriangle, Landmark, CalendarDays,
  Lightbulb, ClipboardList, Wifi, Flame } from "lucide-react";
function analyzeLead(lead: any) {
  const suggestions: string[] = [];
  let score = 0;

  const interest    = (lead.leadInterestStatus || "").toLowerCase();
  const loanPlanned = (lead.loanPlanned || "").toLowerCase();
  const loanStatus  = (lead.loanStatus || "").toLowerCase();
  const visitDate   = lead.mongoVisitDate;
  const planning    = lead.planningPurchase || "";
  const useType     = (lead.useType || "").toLowerCase();
  const propType    = lead.propType || "";
  const source      = lead.source || "";

  if (interest === "interested")         { score += 40; suggestions.push("Lead is actively interested — prioritize immediate follow-up."); }
  else if (interest === "maybe")         { score += 20; suggestions.push("Lead is undecided — send property brochure and schedule a callback."); }
  else if (interest === "not interested"){ score -= 10; suggestions.push("Lead marked not interested — try one final attempt before archiving."); }

  if (loanPlanned === "yes") {
    score += 15;
    if (loanStatus === "approved")         { score += 25; suggestions.push("Loan is approved — this is a HIGH PRIORITY deal. Schedule closing meeting immediately."); }
    else if (loanStatus === "in progress") { score += 10; suggestions.push("Loan is in progress — follow up on pending documents with the bank agent."); }
    else if (loanStatus === "rejected")    { score -= 5;  suggestions.push("Loan was rejected — suggest a co-applicant option or alternative bank/NBFC."); }
    else                                   {              suggestions.push("Loan is required but not yet tracked — initiate loan discussion in next call."); }
  } else if (loanPlanned === "no")  { score += 10; suggestions.push("Cash buyer — high confidence. Focus on property finalization."); }
  else if (loanPlanned === "not sure")    {              suggestions.push("Loan is undecided — connect them with your loan agent for a free assessment."); }

  if (visitDate)              { score += 20; suggestions.push("Site visit is scheduled — confirm 24 hours before and prepare property highlights."); }
  else if (interest === "interested")    {              suggestions.push("No site visit scheduled yet — propose 2-3 date options immediately."); }

  if (planning === "Immediate")          { score += 15; suggestions.push("Immediate purchase intent — fast-track all approvals and documentation."); }
  else if (planning === "Next 3 Months") { score += 8;  suggestions.push("3-month purchase timeline — maintain weekly touchpoints and send project updates."); }

  if (useType.includes("invest"))        { suggestions.push("Investment buyer — highlight ROI, rental yield, and appreciation data for the project."); }
  else if (useType.includes("self") || useType.includes("personal")) { suggestions.push("Self-use buyer — emphasize lifestyle features, amenities, and neighborhood quality."); }

  if (propType && propType !== "Pending") { suggestions.push(`Interested in ${propType} — ensure you show only matching inventory units.`); }

  const sourceTips: Record<string, string> = {
    "Channel Partner": "Channel Partner lead — keep the CP updated on status to maintain the relationship.",
    "Facebook":        "Facebook lead — typically needs more nurturing. Share video walkthroughs.",
    "Instagram":       "Instagram lead — visual buyer. Send high-quality project imagery.",
    "Website":         "Website lead — actively researching. Share a detailed brochure and pricing.",
    "Referral":        "Referral lead — high trust. Fast-track this and ensure a premium experience.",
  };
  if (sourceTips[source]) suggestions.push(sourceTips[source]);

  let priority = "Low";
  if (score >= 70)      priority = "Very High";
  else if (score >= 50) priority = "High";
  else if (score >= 30) priority = "Medium";

  return { score: Math.min(score, 100), priority, suggestions };
}

export async function POST(req: Request) {
  try {
    const body  = await req.json();
    const query = (body.query || "").toLowerCase().trim();
    const leads: any[] = body.leads || [];

    if (!leads.length) {
      return NextResponse.json({ response: "No lead data found. Please make sure your leads are synced and try again." });
    }

    // ── TOTAL / COUNT ──
    if (query.includes("total") || query.includes("how many") || query.includes("count")) {
      return NextResponse.json({ response: `You currently have ${leads.length} total leads assigned to you.` });
    }

    // ── PIPELINE OVERVIEW ──
    if (["analysis", "summary", "overview", "leads", "report"].some(k => query.includes(k))) {
      const interested   = leads.filter(l => (l.leadInterestStatus||"").toLowerCase() === "interested").length;
      const notInt       = leads.filter(l => (l.leadInterestStatus||"").toLowerCase() === "not interested").length;
      const maybe        = leads.filter(l => (l.leadInterestStatus||"").toLowerCase() === "maybe").length;
      const visits       = leads.filter(l => l.mongoVisitDate).length;
      const loanActive   = leads.filter(l => (l.loanPlanned||"").toLowerCase() === "yes").length;
      const loanApproved = leads.filter(l => (l.loanStatus||"").toLowerCase() === "approved").length;
      const highPriority = leads.filter(l => analyzeLead(l).score >= 50);

      let response = `Here's your current Leads overview:\n\n`;
      response += `1) Total Leads: ${leads.length}\n`;
      response += `2) Interested: ${interested}\n`;
      response += `3) Maybe: ${maybe}\n`;
      response += `4) Not Interested: ${notInt}\n`;
      response += `5) Site Visits Scheduled: ${visits}\n`;
      response += `6) Loans Active: ${loanActive}\n`;
      response += `7) Loans Approved: ${loanApproved}\n`;
      response += `8) High Priority Leads: ${highPriority.length}\n`;

      if (highPriority.length > 0) {
        response += `\nYour top leads to focus on right now:\n`;
        highPriority.slice(0, 3).forEach(l => {
          response += `- #${l.id} — ${l.name} (Score: ${analyzeLead(l).score}/100)\n`;
        });
      }

      return NextResponse.json({ response });
    }

    // ── HIGH PRIORITY ──
    if (["priority", "hot", "best", "top"].some(k => query.includes(k))) {
      const scored = [...leads].sort((a, b) => analyzeLead(b).score - analyzeLead(a).score);
      let response = `Here are your top priority leads ranked by AI score:\n\n`;
      scored.slice(0, 5).forEach((l, i) => {
        const a = analyzeLead(l);
        response += `${i + 1}. ${l.name} (#${l.id})\n`;
        response += `   • Priority: ${a.priority} | Score: ${a.score}/100\n`;
        response += `   • Budget: ${l.salesBudget || l.budget || "N/A"}\n`;
        response += `   • Interest: ${l.leadInterestStatus || "Pending"}\n\n`;
      });
      return NextResponse.json({ response });
    }

    // ── LOAN SUMMARY ──
    if (["loan", "finance", "bank", "emi"].some(k => query.includes(k))) {
      const loanLeads = leads.filter(l =>
        (l.loanPlanned||"").toLowerCase() === "yes" ||
        (l.loanStatus && l.loanStatus !== "N/A")
      );
      if (!loanLeads.length) {
        return NextResponse.json({ response: "No leads with active loan tracking found in your Leads." });
      }
      let response = `Here's a summary of all loan-tracked leads:\n\n`;
      loanLeads.forEach((l, i) => {
        response += `${i + 1}. ${l.name} (#${l.id})\n`;
        response += `   • Loan Status: ${l.loanStatus || "Not tracked"}\n`;
        response += `   • Amount Requested: ${l.loanAmtReq || "—"}\n`;
        response += `   • Amount Approved: ${l.loanAmtApp || "—"}\n\n`;
      });
      return NextResponse.json({ response });
    }

    // ── SITE VISITS ──
    if (["visit", "site", "scheduled"].some(k => query.includes(k))) {
      const visitLeads = leads.filter(l => l.mongoVisitDate);
      if (!visitLeads.length) {
        return NextResponse.json({ response: "No site visits are scheduled yet in your Leads overview." });
      }
      let response = `Here are all upcoming scheduled site visits:\n\n`;
      visitLeads.forEach((l, i) => {
        response += `${i + 1}. ${l.name} (#${l.id})\n`;
        response += `   • Visit Date: ${(l.mongoVisitDate||"").slice(0, 10)}\n`;
        response += `   • Budget: ${l.salesBudget || "N/A"}\n`;
        response += `   • Interest: ${l.leadInterestStatus || "Pending"}\n\n`;
      });
      return NextResponse.json({ response });
    }

    // ── SUGGESTIONS / NEXT STEP ──
    if (["suggest", "advice", "help", "what should", "next step", "recommend"].some(k => query.includes(k))) {
      const scored = [...leads].sort((a, b) => analyzeLead(b).score - analyzeLead(a).score);
      const best = scored[0];
      if (!best) return NextResponse.json({ response: "No leads found to analyze right now." });

      const a = analyzeLead(best);
      let response = `Based on your current Leads Overview, here's what I recommend you focus on:\n\n`;
      response += `Your best lead to act on right now is ${best.name} (#${best.id}).\n\n`;
      response += `• AI Score: ${a.score}/100\n`;
      response += `• Priority: ${a.priority}\n`;
      response += `• Budget: ${best.salesBudget || best.budget || "N/A"}\n\n`;
      response += `Suggested actions:\n`;
      a.suggestions.slice(0, 4).forEach((s, i) => { response += `${i + 1}. ${s}\n`; });
      return NextResponse.json({ response });
    }

    // ── SPECIFIC LEAD BY NAME OR ID ──
    const matched = leads.find(l => {
      const nameLower = (l.name || "").toLowerCase();
      const leadId    = String(l.id || "");
      return (
        query.includes(nameLower) ||
        (nameLower.split(" ")[0] && query.includes(nameLower.split(" ")[0])) ||
        query.includes(leadId)
      );
    });

    if (matched) {
      const a = analyzeLead(matched);
      let response = `Here's a full breakdown for ${matched.name} (#${matched.id}):\n\n`;

      response += `Overview:\n`;
      response += `• Budget: ${matched.salesBudget || matched.budget || "Not specified"}\n`;
      response += `• Property Type: ${matched.propType || "Pending"}\n`;
      response += `• Interest Level: ${matched.leadInterestStatus || "Not assessed"}\n`;
      response += `• Use Type: ${matched.useType || "Not specified"}\n`;
      response += `• Purchase Timeline: ${matched.planningPurchase || "Not specified"}\n`;
      response += `• Source: ${matched.source || "Unknown"}\n`;
      response += `• Phone: ${matched.phone || "N/A"}\n`;
      response += `• Site Visit: ${matched.mongoVisitDate ? matched.mongoVisitDate.slice(0, 10) : "Not scheduled"}\n\n`;

      response += `Loan Details:\n`;
      response += `• Loan Planned: ${matched.loanPlanned || "Not confirmed"}\n`;
      response += `• Loan Status: ${matched.loanStatus || "N/A"}\n\n`;

      response += `AI Analysis:\n`;
      response += `• Score: ${a.score}/100\n`;
      response += `• Priority: ${a.priority}\n\n`;

      response += `Recommended Actions:\n`;
      a.suggestions.forEach((s, i) => { response += `${i + 1}. ${s}\n`; });

      return NextResponse.json({ response });
    }

    // ── DEFAULT HELP ──
    return NextResponse.json({
      response:
        "Here's what I can help you with:\n\n" +
        "• Type a client name or lead ID to get a full analysis\n" +
        "• Ask for a 'leads overview' to see complete stats\n" +
        "• Ask for 'high priority leads' to see your top leads\n" +
        "• Ask for a 'loan summary' to review all loan-tracked leads\n" +
        "• Ask for 'site visits' to see all upcoming visits\n" +
        "• Ask me to 'suggest' what you should do next",
    });

  } catch (err) {
    console.error("AI Assistant error:", err);
    return NextResponse.json(
      { response: "Something went wrong on my end. Please try again." },
      { status: 500 }
    );
  }
}