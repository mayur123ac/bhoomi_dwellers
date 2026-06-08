import { NextResponse } from "next/server";

// ============================================================================
// NEXORA LEAD INTELLIGENCE ENGINE v3.0
// Natural CRM Conversation Engine — No External APIs Required
// ============================================================================

// ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────
interface Lead {
  id: string | number;
  name: string;
  phone?: string;
  email?: string;
  budget?: string;
  salesBudget?: string;
  source?: string;
  status?: string;
  created_at?: string;
  assigned_to?: string;
  leadInterestStatus?: string;
  loanPlanned?: string;
  loanStatus?: string;
  loanAmtReq?: string;
  loanAmtApp?: string;
  mongoVisitDate?: string;
  propType?: string;
  useType?: string;
  planningPurchase?: string;
  is_lost_lead?: boolean;
  closingDate?: string;
  address?: string;
  cpName?: string;
  altPhone?: string;
  [key: string]: any;
}

interface LeadIntelligence {
  score: number;
  priority: "Very High" | "High" | "Medium" | "Low";
  temperature: "🔥 HOT" | "♨️ WARM" | "✅ ACTIVE" | "👀 WATCHLIST" | "🧊 COLD" | "👻 GHOSTING" | "💀 DEAD";
  urgencyScore: number;
  conversionProbability: number;
  dropOffRisk: "Critical" | "High" | "Medium" | "Low";
  buyerType: string;
  suggestions: string[];
  behaviorInsights: string[];
  timelineInsights: string[];
  riskFlags: string[];
  nextBestAction: string;
  followUpWindow: string;
  salesOpportunity: string | null;
  inactivityDays: number;
}

interface DetectedIntent {
  type: string;
  confidence: number;
  subType?: string;
  entities: {
    name?: string;
    id?: string;
    location?: string;
    budget?: string;
    propType?: string;
    phone?: string;
    source?: string;
  };
}

// ============================================================================
// SESSION MEMORY — in-memory last referenced lead per request context
// (In production, pass session context via body)
// ============================================================================
// We use a simple map keyed by a session token passed in the request body
const sessionMemory = new Map<string, { lastLeadId?: string; lastLeadName?: string; lastIntent?: string }>();

function getSession(token: string) {
  if (!sessionMemory.has(token)) sessionMemory.set(token, {});
  return sessionMemory.get(token)!;
}

function setSession(token: string, data: Partial<{ lastLeadId: string; lastLeadName: string; lastIntent: string }>) {
  const existing = getSession(token);
  sessionMemory.set(token, { ...existing, ...data });
  // Clean up old sessions (keep map small)
  if (sessionMemory.size > 500) {
    const firstKey = sessionMemory.keys().next().value;
    if (firstKey) sessionMemory.delete(firstKey);
  }
}

// ============================================================================
// MODULE 1 — ADVANCED NATURAL LANGUAGE INTENT CLASSIFIER
// Handles natural sentences, broken English, Hindi-English mix,
// short forms, incomplete phrases, voice-style queries.
// ============================================================================

// Normalise query: lowercase, remove extra spaces, transliterate common hindi
function normaliseQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    // Hindi/Hinglish transliterations to English equivalents
    .replace(/\bdikhao\b/g, "show")
    .replace(/\bbatao\b/g, "tell")
    .replace(/\bkaro\b/g, "do")
    .replace(/\bkab\b/g, "when")
    .replace(/\bkya\b/g, "what")
    .replace(/\bkitna\b/g, "how much")
    .replace(/\bkaun\b/g, "which")
    .replace(/\bwala\b/g, "lead")
    .replace(/\bwali\b/g, "lead")
    .replace(/\bnumber bhejo\b/g, "phone number")
    .replace(/\bcontact bhejo\b/g, "phone number")
    .replace(/\bkyun\b/g, "why")
    .replace(/\bkaise\b/g, "how")
    .replace(/\bsab\b/g, "all")
    .replace(/\baaj\b/g, "today")
    .replace(/\bkal\b/g, "tomorrow")
    .replace(/\bpaisa\b/g, "budget")
    .replace(/\bghar\b/g, "property")
    .replace(/\bflat\b/g, "property")
    .replace(/\bmakaan\b/g, "property")
    .replace(/\bgaahak\b/g, "customer")
    .replace(/\bkhareedna\b/g, "buy")
    .replace(/\bkhareed\b/g, "buy")
    .replace(/\bdekhna\b/g, "visit")
    .replace(/\bdekhne\b/g, "visit");
}

// Fuzzy token match: does the query contain ANY of the given tokens?
function matchesAny(q: string, tokens: string[]): boolean {
  return tokens.some(t => q.includes(t));
}

// Score-based matching: returns how many patterns match
function scoreMatch(q: string, tokens: string[]): number {
  return tokens.filter(t => q.includes(t)).length;
}

function detectIntent(query: string, leads: Lead[], sessionToken: string): DetectedIntent {
  const q = normaliseQuery(query);
  const session = getSession(sessionToken);
  const entities: DetectedIntent["entities"] = {};

  // ── EDIT / MODIFY GUARD (must check first) ────────────────────────────
  const editSignals = [
    "edit", "update", "change", "modify", "delete", "remove", "alter", "set budget",
    "set phone", "update phone", "update budget", "update status", "change status",
    "delete lead", "remove lead", "update email", "change name", "edit name",
    "update name", "reassign", "assign to", "transfer lead"
  ];
  if (matchesAny(q, editSignals)) return { type: "edit_guard", confidence: 1.0, entities };

  // ── EXTRACT LEAD ID from query e.g. "#102", "lead 102", "id 102" ──────
  const idMatch = q.match(/(?:#|lead\s+|id\s+|no\s*\.?\s*)(\d{1,6})/);
  if (idMatch) entities.id = idMatch[1];

  // ── EXTRACT LOCATION hints (major Indian cities/areas) ────────────────
  const locationKeywords = [
    "andheri", "thane", "pune", "mumbai", "navi mumbai", "kalyan", "dombivali",
    "bandra", "dadar", "borivali", "malad", "goregaon", "vikhroli", "ghatkopar",
    "panvel", "ulhasnagar", "mira road", "bhiwandi", "nashik", "nagpur", "aurangabad",
    "wakad", "hinjewadi", "kharadi", "hadapsar", "baner", "viman nagar", "kalyani nagar",
    "pimple saudagar", "koregaon park", "camp", "shivajinagar", "pimpri", "chinchwad",
    "delhi", "ncr", "gurgaon", "noida", "bangalore", "bengaluru", "hyderabad", "chennai",
    "kolkata", "ahmedabad", "surat", "vadodara", "indore", "bhopal", "lucknow", "jaipur"
  ];
  for (const loc of locationKeywords) {
    if (q.includes(loc)) { entities.location = loc; break; }
  }

  // ── EXTRACT PROPERTY TYPE hints ────────────────────────────────────────
  const propTypes = ["1bhk", "2bhk", "3bhk", "4bhk", "studio", "villa", "plot", "shop", "office", "penthouse", "duplex", "row house"];
  for (const pt of propTypes) {
    if (q.includes(pt)) { entities.propType = pt; break; }
  }

  // ── EXTRACT LEAD NAME from leads list ─────────────────────────────────
  for (const lead of leads) {
    const nameLower = (lead.name || "").toLowerCase();
    const firstName = nameLower.split(" ")[0];
    if (
      (nameLower.length > 2 && q.includes(nameLower)) ||
      (firstName.length > 2 && q.includes(firstName))
    ) {
      entities.name = lead.name;
      entities.id = String(lead.id);
      break;
    }
  }

  // ── PRONOUN RESOLUTION — "his", "her", "their", "this lead" ──────────
  const pronouns = ["his", "her", "their", "this lead", "this customer", "this client", "this person", "the lead", "the customer"];
  if (matchesAny(q, pronouns) && !entities.id && session.lastLeadId) {
    entities.id = session.lastLeadId;
    entities.name = session.lastLeadName;
  }

  // ── INTENT SCORING ────────────────────────────────────────────────────
  // Each intent has a list of signal words/phrases. We pick the highest scorer.

  const intentScores: Record<string, number> = {};

  // PHONE / CONTACT
  intentScores.phone_lookup = scoreMatch(q, [
    "phone", "mobile", "number", "contact", "call number", "whatsapp number",
    "contact number", "cell", "telephone", "mob number", "ph no", "ph", "num",
    "give number", "show number", "client phone", "lead number", "customer number"
  ]);

  // LEAD DETAIL
  intentScores.lead_detail = scoreMatch(q, [
    "detail", "profile", "info", "information", "about", "tell me about", "show me",
    "full detail", "complete detail", "customer detail", "lead detail", "client detail",
    "show detail", "who is", "requirement", "what does", "show lead", "about lead",
    "customer requirement", "full info", "complete info"
  ]);
  // Boost lead_detail if we have an entity
  if (entities.id || entities.name) intentScores.lead_detail = (intentScores.lead_detail || 0) + 2;

  // BUDGET / FINANCE
  intentScores.budget_lookup = scoreMatch(q, [
    "budget", "price", "cost", "affordability", "how much", "paisa", "amount", "range",
    "financial capacity", "budget range", "property price", "pricing", "value"
  ]);

  // PRIORITY / HOT LEADS
  intentScores.priority_leads = scoreMatch(q, [
    "priority", "hot", "best", "top", "highest", "important", "urgent", "critical",
    "focus", "interested", "which lead", "serious", "ready to buy", "serious buyer",
    "high intent", "conversion", "most interested", "who is interested", "who wants",
    "which customer", "active buyer", "which lead should", "most likely",
    "potential", "promising", "who should i call", "who to call first",
    "high priority", "top priority"
  ]);

  // INACTIVE / FOLLOW UP
  intentScores.inactive_leads = scoreMatch(q, [
    "inactive", "silent", "ghost", "no response", "not responding", "follow up",
    "followup", "cold", "dead", "pending followup", "not contacted", "old lead",
    "who to call today", "which lead needs", "stale", "dormant", "no contact",
    "not replied", "not called", "pending", "not active", "long time",
    "not heard", "not engaged", "follow-up pending"
  ]);

  // LOAN
  intentScores.loan_analysis = scoreMatch(q, [
    "loan", "finance", "bank", "emi", "sanction", "mortgage", "nbfc", "approved loan",
    "rejected loan", "loan status", "loan required", "needs loan", "wants loan",
    "loan lead", "emi customer", "finance customer", "bank loan", "home loan",
    "loan wala", "finance required", "who needs loan", "approved", "in progress loan"
  ]);

  // SITE VISIT
  intentScores.site_visits = scoreMatch(q, [
    "visit", "site visit", "site inspection", "coming today", "visit scheduled",
    "upcoming visit", "tomorrow visit", "visit date", "who is visiting",
    "visit leads", "visit customers", "scheduled visit", "visit today", "visit list",
    "site visit today", "site visit tomorrow", "site inspection today",
    "who is coming", "upcoming site", "visit schedule"
  ]);

  // ANALYTICS / OVERVIEW
  intentScores.analytics = scoreMatch(q, [
    "analysis", "summary", "overview", "report", "stats", "statistics", "pipeline",
    "dashboard", "breakdown", "performance", "monthly", "weekly", "total leads",
    "lead report", "sales report", "crm analysis", "conversion report",
    "pipeline overview", "show stats", "lead summary", "pipeline stats"
  ]);

  // CLOSING
  intentScores.closing_analysis = scoreMatch(q, [
    "closing", "closed", "deal", "won", "conversion", "close", "booking",
    "finalization", "ready to book", "booking stage", "deal close",
    "finalize", "high chance", "which deal", "deals closed", "closings",
    "completed", "finished deal"
  ]);

  // COUNT
  intentScores.count = scoreMatch(q, [
    "total", "how many", "count", "number of leads", "how much leads",
    "total leads", "lead count", "lead number"
  ]);

  // SUGGESTIONS
  intentScores.suggestions = scoreMatch(q, [
    "suggest", "advice", "help", "what should", "next step", "recommend",
    "what to do", "guide", "strategy", "should i", "tell me what", "action",
    "plan", "approach", "what next", "where to start", "whom to call",
    "what should i do", "tell me strategy", "best approach"
  ]);

  // REAL TIME ALERTS
  intentScores.real_time_alerts = scoreMatch(q, [
    "alert", "notify", "today", "now", "urgent", "asap", "right now",
    "live update", "current status", "what is happening", "current pipeline",
    "today's summary", "any alerts", "today update"
  ]);

  // SOURCE ANALYSIS
  intentScores.source_analysis = scoreMatch(q, [
    "source", "channel", "facebook", "instagram", "referral", "cp lead",
    "channel partner", "website lead", "google", "social media", "organic",
    "campaign", "where leads from", "which source", "lead source",
    "source breakdown", "source performance"
  ]);

  // LOCATION ANALYSIS
  intentScores.location_analysis = scoreMatch(q, [
    "location", "area", "city", "zone", "locality", "place", "region", "sector",
    "which area", "which city", "location wise", "area wise", "city wise"
  ]);
  if (entities.location) intentScores.location_analysis = (intentScores.location_analysis || 0) + 3;

  // RISK
  intentScores.risk_analysis = scoreMatch(q, [
    "risk", "losing", "drop", "competitor", "losing deal", "at risk", "danger",
    "warn", "might lose", "could lose", "drop off", "churn", "high risk",
    "critical lead", "danger zone"
  ]);

  // INVESTOR ANALYSIS
  intentScores.investor_analysis = scoreMatch(q, [
    "invest", "investor", "roi", "yield", "rental", "investment buyer",
    "rental income", "investment property", "returns", "appreciation"
  ]);

  // PROPERTY TYPE ANALYSIS
  intentScores.proptype_analysis = scoreMatch(q, [
    "1bhk", "2bhk", "3bhk", "bhk", "flat type", "property type", "configuration",
    "unit type", "which flat", "which property"
  ]);
  if (entities.propType) intentScores.proptype_analysis = (intentScores.proptype_analysis || 0) + 2;

  // ── PICK WINNER ───────────────────────────────────────────────────────
  let bestIntent = "unknown";
  let bestScore = 0;

  for (const [intent, score] of Object.entries(intentScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  // Special override: if we have a clear id/name and a phone question → phone_lookup
  if ((entities.id || entities.name) && matchesAny(q, ["phone", "mobile", "number", "contact", "whatsapp", "call"])) {
    bestIntent = "phone_lookup";
  }

  // Override: pronoun context with a detail question
  if (session.lastLeadId && matchesAny(q, ["budget", "requirement", "status", "loan", "property", "what is", "tell me", "detail", "info", "visit"])) {
    entities.id = entities.id || session.lastLeadId;
    entities.name = entities.name || session.lastLeadName;
    if (bestScore < 2) bestIntent = "lead_detail";
  }

  return {
    type: bestScore > 0 ? bestIntent : (entities.id || entities.name ? "lead_detail" : "unknown"),
    confidence: bestScore > 0 ? Math.min(bestScore / 5, 1) : 0.2,
    entities,
    subType: undefined,
  };
}

// ============================================================================
// MODULE 2 — FLEXIBLE LEAD SEARCH ENGINE
// Finds leads by name (partial), ID, phone, location, budget, propType
// ============================================================================
function findRelevantLeads(
  leads: Lead[],
  entities: DetectedIntent["entities"],
  limit = 5
): Lead[] {
  if (!leads.length) return [];

  const results: Array<{ lead: Lead; score: number }> = [];

  for (const lead of leads) {
    let score = 0;

    if (entities.id) {
      if (String(lead.id) === String(entities.id)) score += 100;
    }

    if (entities.name) {
      const nLower = (lead.name || "").toLowerCase();
      const eLower = entities.name.toLowerCase();
      if (nLower === eLower) score += 80;
      else if (nLower.includes(eLower) || eLower.includes(nLower.split(" ")[0])) score += 50;
    }

    if (entities.location) {
      const addr = ((lead.address || "") + " " + (lead.propType || "") + " " + (lead.useType || "")).toLowerCase();
      if (addr.includes(entities.location)) score += 40;
    }

    if (entities.propType) {
      const pt = (lead.propType || lead.configuration || "").toLowerCase();
      if (pt.includes(entities.propType)) score += 35;
    }

    if (entities.budget) {
      const bud = (lead.salesBudget || lead.budget || "").toLowerCase();
      if (bud.includes(entities.budget)) score += 25;
    }

    if (score > 0) results.push({ lead, score });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.lead);
}

// ============================================================================
// MODULE 3 — BEHAVIOR ENGINE
// ============================================================================
function classifyBuyerBehavior(lead: Lead): string {
  const interest = (lead.leadInterestStatus || "").toLowerCase();
  const loan = (lead.loanPlanned || "").toLowerCase();
  const loanStatus = (lead.loanStatus || "").toLowerCase();
  const planning = (lead.planningPurchase || "").toLowerCase();
  const useType = (lead.useType || "").toLowerCase();
  const hasVisit = !!lead.mongoVisitDate;

  if (loanStatus === "approved" && hasVisit && interest === "interested") return "🏆 High-Intent Buyer";
  if (useType.includes("invest") || useType.includes("investment")) return "💼 Investor Mindset";
  if (useType.includes("self") || useType.includes("personal")) return "🏠 Family Buyer";
  if (loan === "not sure" && planning === "") return "🔍 Comparison Buyer";
  if (interest === "interested" && hasVisit) return "⚡ Active Buyer";
  if (interest === "interested" && !hasVisit) return "🎯 Engaged Prospect";
  if (interest === "maybe") return "🤔 Passive Buyer";
  if (planning.includes("immediate")) return "🚀 Urgent Buyer";
  if (planning.includes("3 month")) return "📅 Planned Buyer";
  if (interest === "not interested") return "❄️ Cold Lead";
  return "🔄 Researching";
}

// ============================================================================
// MODULE 4 — TIMELINE ENGINE
// ============================================================================
function analyzeTimeline(lead: Lead): { inactivityDays: number; insights: string[] } {
  const now = new Date();
  const createdDate = lead.created_at ? new Date(lead.created_at) : now;
  const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / 86400000);
  let lastActivityDate = createdDate;
  const insights: string[] = [];

  if (lead.mongoVisitDate) {
    const visitDate = new Date(lead.mongoVisitDate);
    const daysToVisit = Math.floor((visitDate.getTime() - now.getTime()) / 86400000);
    if (daysToVisit >= 0) {
      insights.push(`Site visit is ${daysToVisit === 0 ? "TODAY" : daysToVisit === 1 ? "TOMORROW" : `in ${daysToVisit} days`} — prepare property highlights immediately.`);
    } else {
      insights.push(`Site visit occurred ${Math.abs(daysToVisit)} days ago — post-visit follow-up is overdue.`);
    }
    if (visitDate > lastActivityDate) lastActivityDate = visitDate;
  }

  const inactivityDays = Math.floor((now.getTime() - lastActivityDate.getTime()) / 86400000);

  if (inactivityDays === 0) insights.push("Active today — excellent engagement window.");
  else if (inactivityDays === 1) insights.push("Last activity was yesterday — re-engage while memory is fresh.");
  else if (inactivityDays >= 2 && inactivityDays <= 4) insights.push(`${inactivityDays} days of silence — follow-up urgency rising.`);
  else if (inactivityDays >= 5 && inactivityDays <= 9) insights.push(`${inactivityDays} days inactive — conversion probability decreasing rapidly.`);
  else if (inactivityDays >= 10 && inactivityDays <= 20) insights.push(`${inactivityDays} days without contact — likely comparing competitors.`);
  else if (inactivityDays > 20) insights.push(`${inactivityDays} days inactive — critical drop-off risk.`);

  if (daysSinceCreation <= 2) insights.push("Fresh lead — highest intent window, act immediately.");
  if (daysSinceCreation >= 30) insights.push(`Lead is ${daysSinceCreation} days old — long-tail strategy needed.`);

  return { inactivityDays, insights };
}

// ============================================================================
// MODULE 5 — URGENCY ENGINE
// ============================================================================
function calculateUrgency(lead: Lead): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];
  const interest = (lead.leadInterestStatus || "").toLowerCase();
  const loanStatus = (lead.loanStatus || "").toLowerCase();
  const planning = (lead.planningPurchase || "").toLowerCase();
  const hasVisit = !!lead.mongoVisitDate;

  if (planning.includes("immediate")) { score += 35; signals.push("Immediate purchase intent"); }
  if (loanStatus === "approved") { score += 30; signals.push("Loan approved"); }
  if (loanStatus === "in progress") { score += 15; signals.push("Active loan processing"); }
  if (hasVisit) { score += 20; signals.push("Site visit confirmed"); }
  if (interest === "interested") { score += 20; signals.push("Confirmed interest"); }
  if (planning.includes("3 month")) { score += 10; signals.push("3-month purchase window"); }
  if ((lead.loanPlanned || "").toLowerCase() === "yes") { score += 5; signals.push("Loan financing planned"); }

  return { score: Math.min(score, 100), signals };
}

// ============================================================================
// MODULE 6 — RISK ENGINE
// ============================================================================
function assessRisk(lead: Lead, inactivityDays: number): { level: "Critical" | "High" | "Medium" | "Low"; flags: string[] } {
  const flags: string[] = [];
  let riskScore = 0;

  if (inactivityDays >= 14) { riskScore += 40; flags.push("⚠️ Extended silence — competitor may have closed the deal"); }
  else if (inactivityDays >= 7) { riskScore += 25; flags.push("📉 Week-long inactivity — lead is cooling fast"); }
  else if (inactivityDays >= 3) { riskScore += 10; flags.push("🕐 Short inactivity — follow up before interest drops"); }

  if ((lead.loanStatus || "").toLowerCase() === "rejected") { riskScore += 30; flags.push("🏦 Loan rejected — financial barrier may block conversion"); }
  if ((lead.leadInterestStatus || "").toLowerCase() === "not interested") { riskScore += 35; flags.push("❌ Marked not interested — recovery attempt required"); }
  if ((lead.leadInterestStatus || "").toLowerCase() === "maybe") { riskScore += 15; flags.push("🤔 Undecided — competitor may convert them first"); }
  if (!lead.mongoVisitDate && (lead.planningPurchase || "").toLowerCase().includes("immediate")) {
    riskScore += 20; flags.push("🚨 Immediate buyer with no site visit — opportunity leaking");
  }

  const level: "Critical" | "High" | "Medium" | "Low" =
    riskScore >= 60 ? "Critical" : riskScore >= 35 ? "High" : riskScore >= 15 ? "Medium" : "Low";

  return { level, flags };
}

// ============================================================================
// MODULE 7 — LEAD TEMPERATURE
// ============================================================================
function getLeadTemperature(score: number, urgencyScore: number, inactivityDays: number, isLost: boolean): LeadIntelligence["temperature"] {
  if (isLost) return "💀 DEAD";
  if (inactivityDays > 30) return "👻 GHOSTING";
  if (score >= 75 && urgencyScore >= 60) return "🔥 HOT";
  if (score >= 55 && urgencyScore >= 40) return "♨️ WARM";
  if (score >= 35) return "✅ ACTIVE";
  if (inactivityDays >= 10) return "🧊 COLD";
  if (score < 20) return "👀 WATCHLIST";
  return "✅ ACTIVE";
}

// ============================================================================
// MODULE 8 — FOLLOW-UP INTELLIGENCE
// ============================================================================
function generateFollowUpStrategy(lead: Lead, inactivityDays: number): { window: string; strategy: string } {
  const hour = new Date().getHours();
  const interest = (lead.leadInterestStatus || "").toLowerCase();
  const loanStatus = (lead.loanStatus || "").toLowerCase();

  const window =
    (hour >= 9 && hour <= 11) ? "Today 9AM–11AM (optimal window)" :
      (hour >= 17 && hour <= 19) ? "This evening 5PM–7PM (high response rate)" :
        "Tomorrow 10AM–12PM";

  const strategy =
    inactivityDays >= 7 ? "WhatsApp first, then call if no response in 2 hours" :
      inactivityDays >= 3 ? "Phone call with fresh project update or price revision offer" :
        (interest === "interested" && loanStatus === "approved") ? "Closing meeting invitation — strike while financially ready" :
          (interest === "interested" && !lead.mongoVisitDate) ? "Site visit scheduling — propose 2-3 specific date options" :
            interest === "maybe" ? "Send property brochure + ROI data, then follow up in 24 hours" :
              "Check in call with updated project information";

  return { window, strategy };
}

// ============================================================================
// MODULE 9 — CONVERSION PROBABILITY
// ============================================================================
function calculateConversionProbability(lead: Lead, score: number, urgencyScore: number, inactivityDays: number): number {
  let p = score * 0.5 + urgencyScore * 0.3;
  if (inactivityDays >= 14) p -= 25;
  else if (inactivityDays >= 7) p -= 15;
  else if (inactivityDays >= 3) p -= 8;
  if (lead.mongoVisitDate) p += 15;
  if ((lead.loanStatus || "").toLowerCase() === "approved") p += 20;
  if ((lead.planningPurchase || "").toLowerCase().includes("immediate")) p += 10;
  if ((lead.leadInterestStatus || "").toLowerCase() === "not interested") p -= 40;
  if (lead.is_lost_lead) p = Math.max(p - 50, 2);
  return Math.max(2, Math.min(98, Math.round(p)));
}

// ============================================================================
// MODULE 10 — MASTER LEAD ANALYZER
// ============================================================================
function analyzeLeadDeep(lead: Lead): LeadIntelligence {
  const interest = (lead.leadInterestStatus || "").toLowerCase();
  const loanPlanned = (lead.loanPlanned || "").toLowerCase();
  const loanStatus = (lead.loanStatus || "").toLowerCase();
  const planning = lead.planningPurchase || "";
  const useType = (lead.useType || "").toLowerCase();
  const source = lead.source || "";
  const propType = lead.propType || "";

  const suggestions: string[] = [];
  const behaviorInsights: string[] = [];
  let score = 0;

  if (interest === "interested") score += 40;
  else if (interest === "maybe") score += 20;
  else if (interest === "not interested") score -= 10;

  if (loanPlanned === "yes") {
    score += 15;
    if (loanStatus === "approved") score += 25;
    else if (loanStatus === "in progress") score += 10;
    else if (loanStatus === "rejected") score -= 5;
  } else if (loanPlanned === "no") score += 10;

  if (lead.mongoVisitDate) score += 20;
  if (planning === "Immediate") score += 15;
  else if (planning === "Next 3 Months") score += 8;

  const timeline = analyzeTimeline(lead);
  const urgency = calculateUrgency(lead);
  const risk = assessRisk(lead, timeline.inactivityDays);
  const followUp = generateFollowUpStrategy(lead, timeline.inactivityDays);
  const buyerType = classifyBuyerBehavior(lead);
  const temperature = getLeadTemperature(score, urgency.score, timeline.inactivityDays, !!lead.is_lost_lead);
  const conversionProbability = calculateConversionProbability(lead, score, urgency.score, timeline.inactivityDays);

  // Smart contextual suggestions
  if (interest === "interested" && loanStatus === "approved" && lead.mongoVisitDate)
    suggestions.push("🎯 PRIME CLOSING OPPORTUNITY — All signals aligned. Schedule closing meeting today.");
  else if (interest === "interested" && !lead.mongoVisitDate)
    suggestions.push("📍 Site visit is the missing piece — propose specific dates immediately.");
  else if (interest === "interested" && loanStatus === "approved")
    suggestions.push("💰 Loan cleared + strong interest — schedule site visit to seal the deal.");
  else if (interest === "maybe")
    suggestions.push("🔍 Undecided — send comparison sheet and connect with loan advisor.");
  else if (interest === "not interested")
    suggestions.push("📞 One final strategic attempt — address the core objection.");

  if (loanStatus === "approved") suggestions.push("🏦 Loan approved — fast-track all documentation immediately.");
  else if (loanStatus === "in progress") suggestions.push("📄 Loan in progress — follow up on pending KYC documents.");
  else if (loanStatus === "rejected") suggestions.push("🔄 Loan rejected — suggest co-applicant or alternate NBFC/bank.");
  else if (loanPlanned === "yes") suggestions.push("🏦 Loan needed but not tracked — connect with loan partner now.");

  if (planning === "Immediate") suggestions.push("⚡ Immediate purchase intent — fast-track all approvals.");
  if (planning === "Next 3 Months") suggestions.push("📅 3-month window — weekly touchpoints + project updates.");

  if (useType.includes("invest")) {
    suggestions.push("📊 Investment buyer — present rental yield, appreciation data and ROI.");
    behaviorInsights.push("Investor profile: price-sensitive, ROI-driven decision making.");
  } else if (useType.includes("self") || useType.includes("personal")) {
    suggestions.push("🏠 Self-use buyer — emphasise lifestyle, amenities, connectivity.");
    behaviorInsights.push("End-user profile: emotionally-driven, quality and location focused.");
  }

  if (propType && propType !== "Pending")
    suggestions.push(`🏢 Prefers ${propType} — show only matching inventory to avoid decision fatigue.`);

  const sourceTips: Record<string, string> = {
    "Channel Partner": "🤝 CP lead — keep the partner informed to maintain trust and future referrals.",
    "Facebook": "📱 Facebook lead — share video walkthroughs and project stories.",
    "Instagram": "📸 Instagram lead — visual buyer. High-quality imagery drives decisions.",
    "Website": "🌐 Website lead — actively researching. Share brochure and transparent pricing.",
    "Referral": "⭐ Referral lead — highest trust. Deliver premium experience for more referrals.",
  };
  if (sourceTips[source]) suggestions.push(sourceTips[source]);

  behaviorInsights.push(...timeline.insights);
  if (timeline.inactivityDays === 0) behaviorInsights.push("Active today — high responsiveness window open.");
  else if (timeline.inactivityDays >= 5) behaviorInsights.push("Prolonged silence — evaluation phase or competitive comparison.");

  let salesOpportunity: string | null = null;
  if (loanStatus === "approved" && interest === "interested")
    salesOpportunity = "🚀 HIGH-PROBABILITY CLOSE — Loan ready + confirmed interest. Move to finalization now.";
  else if (interest === "interested" && lead.mongoVisitDate && timeline.inactivityDays <= 2)
    salesOpportunity = "💡 POST-VISIT MOMENTUM — Strike while visit experience is fresh.";
  else if (planning === "Immediate" && !lead.mongoVisitDate)
    salesOpportunity = "⏰ URGENT BUYER WITH NO VISIT — Schedule immediately or lose to competitor.";

  const priority: LeadIntelligence["priority"] =
    score >= 70 ? "Very High" : score >= 50 ? "High" : score >= 30 ? "Medium" : "Low";

  return {
    score: Math.min(score, 100),
    priority, temperature,
    urgencyScore: urgency.score,
    conversionProbability,
    dropOffRisk: risk.level,
    buyerType, suggestions, behaviorInsights,
    timelineInsights: timeline.insights,
    riskFlags: risk.flags,
    nextBestAction: followUp.strategy,
    followUpWindow: followUp.window,
    salesOpportunity,
    inactivityDays: timeline.inactivityDays,
  };
}

// ============================================================================
// MODULE 11 — PIPELINE ANALYTICS
// ============================================================================
function generatePipelineAnalytics(leads: Lead[]) {
  const now = new Date();
  const active = leads.filter(l => !l.is_lost_lead);
  const lost = leads.filter(l => l.is_lost_lead);
  const closing = leads.filter(l => l.status === "Closing" || !!l.closingDate);
  const interested = leads.filter(l => (l.leadInterestStatus || "").toLowerCase() === "interested");
  const maybe = leads.filter(l => (l.leadInterestStatus || "").toLowerCase() === "maybe");
  const notInterested = leads.filter(l => (l.leadInterestStatus || "").toLowerCase() === "not interested");
  const visits = leads.filter(l => l.mongoVisitDate);
  const loanActive = leads.filter(l => (l.loanPlanned || "").toLowerCase() === "yes");
  const loanApproved = leads.filter(l => (l.loanStatus || "").toLowerCase() === "approved");
  const loanInProgress = leads.filter(l => (l.loanStatus || "").toLowerCase() === "in progress");
  const immediate = leads.filter(l => l.planningPurchase === "Immediate");

  const inactiveLeads = active.filter(l => {
    if (!l.created_at) return false;
    const d = Math.floor((now.getTime() - new Date(l.created_at).getTime()) / 86400000);
    return d >= 3 && l.leadInterestStatus !== "Not Interested";
  });

  const highPotential = leads
    .map(l => ({ lead: l, intel: analyzeLeadDeep(l) }))
    .filter(({ intel }) => intel.score >= 50)
    .sort((a, b) => b.intel.score - a.intel.score);

  const alerts: string[] = [];
  if (immediate.length > 0) alerts.push(`🚨 ${immediate.length} lead(s) with immediate purchase intent need urgent attention.`);
  if (loanApproved.length > 0) alerts.push(`🏦 ${loanApproved.length} loan-approved lead(s) — closing opportunities available now.`);
  if (inactiveLeads.length > 0) alerts.push(`⚠️ ${inactiveLeads.length} lead(s) becoming inactive — engagement risk rising.`);
  const visitsToday = visits.filter(l => l.mongoVisitDate && new Date(l.mongoVisitDate).toDateString() === now.toDateString());
  if (visitsToday.length > 0) alerts.push(`📅 ${visitsToday.length} site visit(s) scheduled for today.`);
  const hotLeads = highPotential.filter(({ intel }) => intel.temperature === "🔥 HOT");
  if (hotLeads.length > 0) alerts.push(`🔥 ${hotLeads.length} HOT lead(s) in your pipeline require immediate action.`);

  return {
    total: leads.length,
    active: active.length, lost: lost.length, closing: closing.length,
    interested: interested.length, maybe: maybe.length, notInterested: notInterested.length,
    visits: visits.length,
    loanActive: loanActive.length, loanApproved: loanApproved.length, loanInProgress: loanInProgress.length,
    immediate: immediate.length, inactiveCount: inactiveLeads.length,
    highPotential, alerts,
    conversionRate: leads.length > 0 ? ((closing.length / leads.length) * 100).toFixed(1) : "0.0",
    lossRate: leads.length > 0 ? ((lost.length / leads.length) * 100).toFixed(1) : "0.0",
  };
}

// ============================================================================
// MODULE 12 — RESPONSE RENDERERS
// ============================================================================
function renderLeadDetail(lead: Lead, intel: LeadIntelligence, requestedField?: string): string {

  // Phone-specific response
  if (requestedField === "phone") {
    const primary = lead.phone || "Not available";
    const alt = lead.altPhone || lead.alt_phone;
    let r = `📞 Contact Details for ${lead.name} (#${lead.id}):\n\n`;
    r += `  • Primary: ${primary}\n`;
    if (alt && alt !== "N/A") r += `  • Alt: ${alt}\n`;
    if (lead.email && lead.email !== "N/A") r += `  • Email: ${lead.email}\n`;
    return r;
  }

  // Budget-specific response
  if (requestedField === "budget") {
    const bud = lead.salesBudget || lead.budget || "Not specified";
    return `💰 Budget for ${lead.name} (#${lead.id}): ${bud}\n\nProperty preference: ${lead.propType || "Not set"} | Use: ${lead.useType || "Not set"} | Timeline: ${lead.planningPurchase || "Not set"}`;
  }

  // Full detail
  let r = `━━━ LEAD INTELLIGENCE: ${lead.name} (#${lead.id}) ━━━\n\n`;
  r += `📊 AI SCORES:\n`;
  r += `  • Score: ${intel.score}/100  |  Priority: ${intel.priority}  |  Temperature: ${intel.temperature}\n`;
  r += `  • Urgency: ${intel.urgencyScore}/100  |  Conversion: ${intel.conversionProbability}%  |  Risk: ${intel.dropOffRisk}\n`;
  r += `  • Buyer Type: ${intel.buyerType}\n\n`;

  r += `📋 OVERVIEW:\n`;
  r += `  • Budget: ${lead.salesBudget || lead.budget || "Not specified"}\n`;
  r += `  • Property: ${lead.propType || "Pending"}  |  Use: ${lead.useType || "N/A"}\n`;
  r += `  • Interest: ${lead.leadInterestStatus || "Not assessed"}  |  Timeline: ${lead.planningPurchase || "N/A"}\n`;
  r += `  • Source: ${lead.source || "Unknown"}  |  Phone: ${lead.phone || "N/A"}\n`;
  r += `  • Last Activity: ${intel.inactivityDays === 0 ? "Today" : intel.inactivityDays === 1 ? "Yesterday" : `${intel.inactivityDays} days ago`}\n`;
  r += `  • Site Visit: ${lead.mongoVisitDate ? lead.mongoVisitDate.slice(0, 10) : "Not scheduled"}\n\n`;

  r += `🏦 LOAN:\n`;
  r += `  • Planned: ${lead.loanPlanned || "N/A"}  |  Status: ${lead.loanStatus || "N/A"}\n\n`;

  if (intel.salesOpportunity) r += `💡 OPPORTUNITY:\n  ${intel.salesOpportunity}\n\n`;

  if (intel.riskFlags.length > 0) {
    r += `⚠️ RISKS:\n`;
    intel.riskFlags.forEach(f => r += `  ${f}\n`);
    r += `\n`;
  }

  if (intel.behaviorInsights.length > 0) {
    r += `🧠 BEHAVIOR:\n`;
    intel.behaviorInsights.slice(0, 2).forEach(i => r += `  • ${i}\n`);
    r += `\n`;
  }

  r += `🎯 ACTIONS:\n`;
  intel.suggestions.slice(0, 3).forEach((s, i) => r += `  ${i + 1}. ${s}\n`);
  r += `\n`;
  r += `📞 NEXT STEP: ${intel.nextBestAction}\n`;
  r += `⏰ BEST WINDOW: ${intel.followUpWindow}`;

  return r;
}

function renderAnalyticsSummary(analytics: ReturnType<typeof generatePipelineAnalytics>): string {
  let r = `━━━ NEXORA LEAD INTELLIGENCE REPORT ━━━\n\n`;
  if (analytics.alerts.length > 0) {
    r += `🔔 LIVE ALERTS:\n`;
    analytics.alerts.forEach(a => r += `  ${a}\n`);
    r += `\n`;
  }
  r += `📊 PIPELINE:\n`;
  r += `  • Total: ${analytics.total}  |  Active: ${analytics.active}  |  Lost: ${analytics.lost}  |  Closing: ${analytics.closing}\n`;
  r += `  • Conversion: ${analytics.conversionRate}%  |  Loss Rate: ${analytics.lossRate}%\n\n`;
  r += `💡 INTEREST:  Interested: ${analytics.interested}  |  Maybe: ${analytics.maybe}  |  Not Interested: ${analytics.notInterested}\n\n`;
  r += `🏦 LOANS:  Active: ${analytics.loanActive}  |  Approved: ${analytics.loanApproved}  |  In Progress: ${analytics.loanInProgress}\n\n`;
  r += `📅 OPS:  Visits: ${analytics.visits}  |  Immediate Buyers: ${analytics.immediate}  |  Inactive (3d+): ${analytics.inactiveCount}\n\n`;
  if (analytics.highPotential.length > 0) {
    r += `🏆 TOP LEADS:\n`;
    analytics.highPotential.slice(0, 3).forEach(({ lead, intel }, i) => {
      r += `  ${i + 1}. ${lead.name} (#${lead.id}) — ${intel.temperature} | ${intel.score}/100 | ${intel.conversionProbability}% conversion\n`;
      if (intel.salesOpportunity) r += `     → ${intel.salesOpportunity}\n`;
    });
  }
  return r;
}

// ============================================================================
// MAIN POST HANDLER
// ============================================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawQuery: string = body.query || "";
    const leads: Lead[] = body.leads || [];
    const sessionToken: string = body.sessionToken || "default";

    if (!rawQuery.trim()) {
      return NextResponse.json({ response: "Please type a question about your leads." });
    }

    if (!leads.length) {
      return NextResponse.json({ response: "No lead data found. Make sure your leads are synced and try again." });
    }

    const intent = detectIntent(rawQuery, leads, sessionToken);
    const session = getSession(sessionToken);

    // ── EDIT GUARD ─────────────────────────────────────────────────────────
    if (intent.type === "edit_guard") {
      return NextResponse.json({
        response:
          "🔒 Nexora AI does not have permission to modify CRM records.\n\n" +
          "Please use the official CRM forms or admin controls to update lead information.\n\n" +
          "I can still help you with:\n" +
          "  • Viewing lead details\n  • Analysis and insights\n  • Follow-up recommendations\n  • Pipeline reports",
      });
    }

    // ── RESOLVE LEAD FROM ENTITIES ─────────────────────────────────────────
    let resolvedLeads = findRelevantLeads(leads, intent.entities, 5);

    // If we found exactly one lead (by id or exact name), update session memory
    if (resolvedLeads.length === 1 && (intent.entities.id || intent.entities.name)) {
      setSession(sessionToken, {
        lastLeadId: String(resolvedLeads[0].id),
        lastLeadName: resolvedLeads[0].name,
        lastIntent: intent.type,
      });
    }

    // ── COUNT ──────────────────────────────────────────────────────────────
    if (intent.type === "count") {
      const active = leads.filter(l => !l.is_lost_lead).length;
      const lost = leads.filter(l => l.is_lost_lead).length;
      return NextResponse.json({
        response: `Your pipeline has ${leads.length} total leads — ${active} active and ${lost} marked as lost.`,
      });
    }

    // ── PHONE LOOKUP ───────────────────────────────────────────────────────
    if (intent.type === "phone_lookup") {
      if (!resolvedLeads.length) {
        return NextResponse.json({
          response: "I couldn't find that lead. Please provide the lead name or ID to look up the contact details.",
        });
      }
      const lead = resolvedLeads[0];
      const intel = analyzeLeadDeep(lead);
      setSession(sessionToken, { lastLeadId: String(lead.id), lastLeadName: lead.name });
      return NextResponse.json({ response: renderLeadDetail(lead, intel, "phone") });
    }

    // ── BUDGET LOOKUP ──────────────────────────────────────────────────────
    if (intent.type === "budget_lookup" && (intent.entities.id || intent.entities.name)) {
      if (!resolvedLeads.length) {
        return NextResponse.json({ response: "Please specify which lead's budget you want to check." });
      }
      const lead = resolvedLeads[0];
      const intel = analyzeLeadDeep(lead);
      setSession(sessionToken, { lastLeadId: String(lead.id), lastLeadName: lead.name });
      return NextResponse.json({ response: renderLeadDetail(lead, intel, "budget") });
    }

    // ── LEAD DETAIL ────────────────────────────────────────────────────────
    if (intent.type === "lead_detail" || (resolvedLeads.length === 1 && (intent.entities.id || intent.entities.name))) {
      if (!resolvedLeads.length) {
        return NextResponse.json({
          response: "I couldn't locate that lead. Try using the lead name, #ID, or phone number.",
        });
      }
      const lead = resolvedLeads[0];
      const intel = analyzeLeadDeep(lead);
      setSession(sessionToken, { lastLeadId: String(lead.id), lastLeadName: lead.name });
      return NextResponse.json({ response: renderLeadDetail(lead, intel) });
    }

    // ── ANALYTICS / OVERVIEW ───────────────────────────────────────────────
    if (intent.type === "analytics") {
      const analytics = generatePipelineAnalytics(leads);
      return NextResponse.json({ response: renderAnalyticsSummary(analytics) });
    }

    // ── REAL-TIME ALERTS ───────────────────────────────────────────────────
    if (intent.type === "real_time_alerts") {
      const analytics = generatePipelineAnalytics(leads);
      if (!analytics.alerts.length) {
        return NextResponse.json({ response: "✅ No urgent alerts right now. Your pipeline looks healthy." });
      }
      let r = `🔔 REAL-TIME PIPELINE ALERTS:\n\n`;
      analytics.alerts.forEach((a, i) => r += `${i + 1}. ${a}\n`);
      return NextResponse.json({ response: r });
    }

    // ── PRIORITY / MOST INTERESTED LEADS ─────────────────────────────────
    if (intent.type === "priority_leads") {
      const scored = leads
        .map(l => ({ lead: l, intel: analyzeLeadDeep(l) }))
        .sort((a, b) => {
          // Sort by: interested first, then score, then conversion
          const aInt = (a.lead.leadInterestStatus || "").toLowerCase() === "interested" ? 1 : 0;
          const bInt = (b.lead.leadInterestStatus || "").toLowerCase() === "interested" ? 1 : 0;
          if (bInt !== aInt) return bInt - aInt;
          return b.intel.score - a.intel.score;
        })
        .slice(0, 5);

      let r = `🏆 TOP PRIORITY LEADS — NEXORA INTELLIGENCE:\n\n`;
      scored.forEach(({ lead, intel }, i) => {
        r += `${i + 1}. ${lead.name} (#${lead.id})\n`;
        r += `   ${intel.temperature} | Score: ${intel.score}/100 | ${intel.priority} Priority\n`;
        r += `   Buyer: ${intel.buyerType}\n`;
        r += `   Conversion: ${intel.conversionProbability}%  |  Risk: ${intel.dropOffRisk}\n`;
        r += `   Budget: ${lead.salesBudget || lead.budget || "N/A"}  |  Interest: ${lead.leadInterestStatus || "Pending"}\n`;
        r += `   Last Active: ${intel.inactivityDays === 0 ? "Today" : `${intel.inactivityDays}d ago`}\n`;
        if (intel.salesOpportunity) r += `   💡 ${intel.salesOpportunity}\n`;
        r += `   → ${intel.nextBestAction}\n\n`;
      });

      r += `💬 Want details on any specific lead? Ask "tell me about [name]"`;
      return NextResponse.json({ response: r });
    }

    // ── LOAN ANALYSIS ──────────────────────────────────────────────────────
    if (intent.type === "loan_analysis") {
      const loanLeads = leads.filter(l =>
        (l.loanPlanned || "").toLowerCase() === "yes" ||
        (l.loanStatus && l.loanStatus !== "N/A")
      );
      if (!loanLeads.length) {
        return NextResponse.json({ response: "No leads with active loan tracking found in your pipeline." });
      }
      const approved = loanLeads.filter(l => (l.loanStatus || "").toLowerCase() === "approved");
      const inProgress = loanLeads.filter(l => (l.loanStatus || "").toLowerCase() === "in progress");
      const rejected = loanLeads.filter(l => (l.loanStatus || "").toLowerCase() === "rejected");

      let r = `🏦 LOAN INTELLIGENCE REPORT:\n\n`;
      r += `${loanLeads.length} loan-tracked leads:\n`;
      r += `  ✅ Approved: ${approved.length}  |  📄 In Progress: ${inProgress.length}  |  ❌ Rejected: ${rejected.length}\n\n`;

      if (approved.length > 0) {
        r += `🚀 CLOSE THESE NOW (approved loans):\n`;
        approved.forEach((l, i) => {
          r += `  ${i + 1}. ${l.name} (#${l.id}) — Approved: ${l.loanAmtApp || "—"} | Budget: ${l.salesBudget || "N/A"}\n`;
          r += `     → Schedule closing meeting today.\n`;
        });
        r += `\n`;
      }
      if (inProgress.length > 0) {
        r += `📋 DOCUMENT FOLLOW-UP NEEDED:\n`;
        inProgress.forEach((l, i) => r += `  ${i + 1}. ${l.name} (#${l.id}) — Req: ${l.loanAmtReq || "—"}\n`);
        r += `\n`;
      }
      if (rejected.length > 0) {
        r += `🔄 ALTERNATE FINANCING NEEDED:\n`;
        rejected.forEach((l, i) => r += `  ${i + 1}. ${l.name} (#${l.id}) — Suggest co-applicant or alternate bank.\n`);
      }
      return NextResponse.json({ response: r });
    }

    // ── SITE VISITS ────────────────────────────────────────────────────────
    if (intent.type === "site_visits") {
      const visitLeads = leads.filter(l => l.mongoVisitDate);
      if (!visitLeads.length) {
        return NextResponse.json({ response: "No site visits are currently scheduled in your pipeline." });
      }
      const now = new Date();
      const today = visitLeads.filter(l => new Date(l.mongoVisitDate!).toDateString() === now.toDateString());
      const upcoming = visitLeads.filter(l => new Date(l.mongoVisitDate!) > now && new Date(l.mongoVisitDate!).toDateString() !== now.toDateString());
      const past = visitLeads.filter(l => new Date(l.mongoVisitDate!) < now);

      let r = `📅 SITE VISIT INTELLIGENCE:\n\n`;
      r += `Total: ${visitLeads.length}  |  Today: ${today.length}  |  Upcoming: ${upcoming.length}  |  Past: ${past.length}\n\n`;

      if (today.length > 0) {
        r += `🚨 TODAY — PREPARE NOW:\n`;
        today.forEach((l, i) => {
          r += `  ${i + 1}. ${l.name} (#${l.id})\n`;
          r += `     ${new Date(l.mongoVisitDate!).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} | Budget: ${l.salesBudget || "N/A"} | ${l.propType || "TBD"}\n`;
          r += `     → Prepare matching inventory list and pricing sheet.\n\n`;
        });
      }
      if (upcoming.length > 0) {
        r += `📆 UPCOMING:\n`;
        upcoming.forEach((l, i) => {
          const d = Math.ceil((new Date(l.mongoVisitDate!).getTime() - now.getTime()) / 86400000);
          r += `  ${i + 1}. ${l.name} (#${l.id}) — in ${d} day(s) | ${l.mongoVisitDate!.slice(0, 10)}\n`;
        });
        r += `\n`;
      }
      const overdue = past.filter(l => Math.floor((now.getTime() - new Date(l.mongoVisitDate!).getTime()) / 86400000) >= 1);
      if (overdue.length > 0) {
        r += `⚠️ POST-VISIT FOLLOW-UP OVERDUE:\n`;
        overdue.slice(0, 3).forEach(l => {
          const d = Math.floor((now.getTime() - new Date(l.mongoVisitDate!).getTime()) / 86400000);
          r += `  • ${l.name} (#${l.id}) — ${d}d since visit\n`;
        });
      }
      return NextResponse.json({ response: r });
    }

    // ── INACTIVE LEADS ─────────────────────────────────────────────────────
    if (intent.type === "inactive_leads") {
      const now = new Date();
      const inactive = leads
        .filter(l => !l.is_lost_lead && l.leadInterestStatus !== "Not Interested")
        .map(l => ({
          lead: l,
          days: Math.floor((now.getTime() - new Date(l.created_at || now).getTime()) / 86400000),
          intel: analyzeLeadDeep(l),
        }))
        .filter(({ days }) => days >= 2)
        .sort((a, b) => b.days - a.days);

      if (!inactive.length) {
        return NextResponse.json({ response: "✅ All leads are active! No significant inactivity detected." });
      }
      let r = `👻 INACTIVE LEAD REPORT — ${inactive.length} leads need re-engagement:\n\n`;
      const critical = inactive.filter(({ days }) => days >= 10);
      const warning = inactive.filter(({ days }) => days >= 5 && days < 10);
      const mild = inactive.filter(({ days }) => days >= 2 && days < 5);

      if (critical.length > 0) {
        r += `🔴 CRITICAL (10+ days):\n`;
        critical.slice(0, 3).forEach(({ lead, days, intel }) => {
          r += `  • ${lead.name} (#${lead.id}) — ${days}d silent | ${intel.temperature}\n`;
          r += `    → ${intel.nextBestAction}\n`;
        });
        r += `\n`;
      }
      if (warning.length > 0) {
        r += `🟡 WARNING (5–9 days):\n`;
        warning.slice(0, 3).forEach(({ lead, days }) => r += `  • ${lead.name} (#${lead.id}) — ${days}d quiet\n`);
        r += `\n`;
      }
      if (mild.length > 0) {
        r += `🟢 MILD (2–4 days):\n`;
        mild.slice(0, 3).forEach(({ lead, days }) => r += `  • ${lead.name} (#${lead.id}) — ${days}d\n`);
      }
      return NextResponse.json({ response: r });
    }

    // ── RISK ANALYSIS ──────────────────────────────────────────────────────
    if (intent.type === "risk_analysis") {
      const risky = leads
        .filter(l => !l.is_lost_lead)
        .map(l => ({ lead: l, intel: analyzeLeadDeep(l) }))
        .filter(({ intel }) => intel.dropOffRisk === "Critical" || intel.dropOffRisk === "High")
        .sort((a, b) => b.intel.score - a.intel.score);

      if (!risky.length) {
        return NextResponse.json({ response: "✅ No critical risk leads detected." });
      }
      let r = `⚠️ RISK INTELLIGENCE — ${risky.length} at-risk leads:\n\n`;
      risky.slice(0, 5).forEach(({ lead, intel }) => {
        r += `• ${lead.name} (#${lead.id}) — ${intel.dropOffRisk} Risk | ${intel.temperature}\n`;
        if (intel.riskFlags[0]) r += `  ${intel.riskFlags[0]}\n`;
        r += `  Action: ${intel.nextBestAction}\n\n`;
      });
      return NextResponse.json({ response: r });
    }

    // ── CLOSING ANALYSIS ───────────────────────────────────────────────────
    if (intent.type === "closing_analysis") {
      const closingLeads = leads.filter(l => l.status === "Closing" || !!l.closingDate);
      const nearClose = leads
        .filter(l => !l.is_lost_lead && l.status !== "Closing")
        .map(l => ({ lead: l, intel: analyzeLeadDeep(l) }))
        .filter(({ intel }) => intel.conversionProbability >= 60)
        .sort((a, b) => b.intel.conversionProbability - a.intel.conversionProbability);

      let r = `🤝 CLOSING INTELLIGENCE:\n\n`;
      r += `Closed: ${closingLeads.length} deals | Rate: ${leads.length > 0 ? ((closingLeads.length / leads.length) * 100).toFixed(1) : 0}%\n\n`;

      if (nearClose.length > 0) {
        r += `🎯 NEAR-CLOSE (≥60% probability):\n`;
        nearClose.slice(0, 4).forEach(({ lead, intel }) => {
          r += `  • ${lead.name} (#${lead.id}) — ${intel.conversionProbability}% | ${intel.temperature}\n`;
          if (intel.salesOpportunity) r += `    💡 ${intel.salesOpportunity}\n`;
          r += `    → ${intel.nextBestAction}\n\n`;
        });
      } else {
        r += `No leads currently at ≥60% conversion probability.\n`;
        r += `Focus on nurturing interested leads and scheduling site visits to move them closer.`;
      }
      return NextResponse.json({ response: r });
    }

    // ── SUGGESTIONS ────────────────────────────────────────────────────────
    if (intent.type === "suggestions") {
      const analytics = generatePipelineAnalytics(leads);
      const best = analytics.highPotential[0];
      if (!best) return NextResponse.json({ response: "No high-potential leads found to recommend." });

      let r = `🧠 NEXORA STRATEGIC RECOMMENDATION:\n\n`;
      if (analytics.alerts.length > 0) {
        r += `🔔 Immediate Attention:\n`;
        analytics.alerts.slice(0, 2).forEach(a => r += `  ${a}\n`);
        r += `\n`;
      }
      r += `🏆 Best Lead to Act on NOW:\n`;
      r += `  ${best.lead.name} (#${best.lead.id}) — ${best.intel.temperature}\n`;
      r += `  Score: ${best.intel.score}/100 | Conversion: ${best.intel.conversionProbability}%\n`;
      if (best.intel.salesOpportunity) r += `  💡 ${best.intel.salesOpportunity}\n`;
      r += `  → ${best.intel.nextBestAction}\n  ⏰ ${best.intel.followUpWindow}\n\n`;
      r += `📋 Today's Priorities:\n`;
      let n = 1;
      if (analytics.loanApproved > 0) r += `  ${n++}. Close ${analytics.loanApproved} loan-approved lead(s).\n`;
      if (analytics.inactiveCount > 0) r += `  ${n++}. Re-engage ${analytics.inactiveCount} inactive lead(s).\n`;
      if (analytics.visits > 0) r += `  ${n++}. Prepare for ${analytics.visits} scheduled visit(s).\n`;
      if (analytics.immediate > 0) r += `  ${n++}. Fast-track ${analytics.immediate} immediate buyer(s).\n`;
      return NextResponse.json({ response: r });
    }

    // ── LOCATION ANALYSIS ──────────────────────────────────────────────────
    if (intent.type === "location_analysis" && intent.entities.location) {
      const loc = intent.entities.location;
      const locLeads = leads.filter(l => {
        const combined = ((l.address || "") + " " + (l.propType || "") + " " + (l.useType || "")).toLowerCase();
        return combined.includes(loc);
      });
      if (!locLeads.length) {
        return NextResponse.json({ response: `No leads found specifically for ${loc}. The location data depends on what's been filled in lead profiles.` });
      }
      let r = `📍 LEADS LOOKING IN ${loc.toUpperCase()}:\n\n`;
      locLeads.forEach((l, i) => {
        r += `${i + 1}. ${l.name} (#${l.id}) — ${l.salesBudget || "N/A"} | ${l.propType || "TBD"} | ${l.leadInterestStatus || "Pending"}\n`;
      });
      return NextResponse.json({ response: r });
    }

    // ── PROPERTY TYPE ANALYSIS ─────────────────────────────────────────────
    if (intent.type === "proptype_analysis" && intent.entities.propType) {
      const pt = intent.entities.propType;
      const ptLeads = leads.filter(l =>
        (l.propType || l.configuration || "").toLowerCase().includes(pt)
      );
      if (!ptLeads.length) {
        return NextResponse.json({ response: `No leads found specifically for ${pt.toUpperCase()}.` });
      }
      let r = `🏢 LEADS INTERESTED IN ${pt.toUpperCase()}:\n\n`;
      ptLeads.forEach((l, i) => {
        const intel = analyzeLeadDeep(l);
        r += `${i + 1}. ${l.name} (#${l.id}) — ${l.salesBudget || "N/A"} | ${intel.temperature} | ${l.leadInterestStatus || "Pending"}\n`;
      });
      return NextResponse.json({ response: r });
    }

    // ── SOURCE ANALYSIS ────────────────────────────────────────────────────
    if (intent.type === "source_analysis") {
      const sourceMap: Record<string, Lead[]> = {};
      leads.forEach(l => {
        const src = l.source || "Unknown";
        if (!sourceMap[src]) sourceMap[src] = [];
        sourceMap[src].push(l);
      });
      const sorted = Object.entries(sourceMap).sort((a, b) => b[1].length - a[1].length);
      const closing = leads.filter(l => l.status === "Closing" || !!l.closingDate);
      let r = `📊 LEAD SOURCE PERFORMANCE:\n\n`;
      sorted.forEach(([src, srcLeads]) => {
        const closed = closing.filter(l => l.source === src).length;
        const rate = srcLeads.length > 0 ? ((closed / srcLeads.length) * 100).toFixed(1) : "0.0";
        r += `  ${src}: ${srcLeads.length} leads | ${closed} closed | ${rate}% conversion\n`;
      });
      if (sorted[0]) r += `\n🏆 Top Source: ${sorted[0][0]} (${sorted[0][1].length} leads)`;
      return NextResponse.json({ response: r });
    }

    // ── INVESTOR ANALYSIS ──────────────────────────────────────────────────
    if (intent.type === "investor_analysis") {
      const investors = leads.filter(l =>
        (l.useType || "").toLowerCase().includes("invest") ||
        (l.purpose || "").toLowerCase().includes("invest")
      );
      if (!investors.length) {
        return NextResponse.json({ response: "No investment buyers found in your current pipeline." });
      }
      let r = `💼 INVESTOR LEADS (${investors.length}):\n\n`;
      investors.forEach((l, i) => {
        const intel = analyzeLeadDeep(l);
        r += `${i + 1}. ${l.name} (#${l.id})\n`;
        r += `   Budget: ${l.salesBudget || "N/A"} | ${intel.temperature} | ${l.leadInterestStatus || "Pending"}\n`;
        r += `   → Present ROI data, rental yield, and appreciation projections.\n\n`;
      });
      return NextResponse.json({ response: r });
    }

    // ── UNKNOWN QUERY (fallback) ────────────────────────────────────────────
    const analytics = generatePipelineAnalytics(leads);
    let r = `🤖 NEXORA INTELLIGENCE ENGINE\n\n`;
    if (analytics.alerts.length > 0) {
      r += `🔔 LIVE ALERTS:\n`;
      analytics.alerts.slice(0, 2).forEach(a => r += `  ${a}\n`);
      r += `\n`;
    }
    r += `I couldn't identify your exact request. Try asking:\n\n`;
    r += `  • "which lead is most interested" or "hot leads"\n`;
    r += `  • "show me [lead name]" or "tell me about lead #102"\n`;
    r += `  • "phone number of [name]"\n`;
    r += `  • "who needs a loan" or "loan status"\n`;
    r += `  • "site visits today" or "upcoming visits"\n`;
    r += `  • "inactive leads" or "who to follow up"\n`;
    r += `  • "leads overview" or "pipeline report"\n`;
    r += `  • "risk analysis" or "closing leads"\n`;
    r += `  • "what should I do next" or "suggest strategy"`;
    return NextResponse.json({ response: r });

  } catch (err) {
    console.error("Nexora AI Engine error:", err);
    return NextResponse.json(
      { response: "Intelligence engine encountered an error. Please try again." },
      { status: 500 }
    );
  }
}