export type ChatIntent = 
  | "analytics_overview"
  | "priority_leads"
  | "loan_analysis"
  | "site_visits"
  | "followup_recommendations"
  | "lead_specific_analysis"
  | "unknown";

export interface IntentResult {
  intent: ChatIntent;
  confidence: number;
  extractedEntity?: string; // e.g., lead name or ID if lead_specific_analysis
}

export function detectIntent(query: string): IntentResult {
  const normalized = query.toLowerCase().trim();

  // 1. Total/Analytics
  if (["total", "how many", "count", "analysis", "summary", "overview", "report", "stats"].some(k => normalized.includes(k))) {
    return { intent: "analytics_overview", confidence: 0.9 };
  }

  // 2. Priority/Urgent
  if (["priority", "hot", "best", "top", "urgent"].some(k => normalized.includes(k))) {
    return { intent: "priority_leads", confidence: 0.9 };
  }

  // 3. Loan/Finance
  if (["loan", "finance", "bank", "emi", "mortgage"].some(k => normalized.includes(k))) {
    return { intent: "loan_analysis", confidence: 0.9 };
  }

  // 4. Site Visits
  if (["visit", "site", "scheduled", "meeting", "coming"].some(k => normalized.includes(k))) {
    return { intent: "site_visits", confidence: 0.9 };
  }

  // 5. Suggestions/Next Step
  if (["suggest", "advice", "help", "what should", "next step", "recommend", "action"].some(k => normalized.includes(k))) {
    return { intent: "followup_recommendations", confidence: 0.9 };
  }

  // 6. Lead Specific (Fallback heuristic - if it looks like a name or contains a number)
  // Or we just assume unknown, and route.ts will check the leads array for a name match.
  // We can return a generic "lead_specific_analysis" with low confidence so route.ts knows to search.
  return { intent: "unknown", confidence: 0 };
}
