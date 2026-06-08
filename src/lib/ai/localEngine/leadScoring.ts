import { KeywordAnalysisResult } from "./keywordAnalyzer";

export interface LeadScoreFactors {
  hasSiteVisit: boolean;
  hasRecentFollowUp: boolean;
  daysSinceLastActivity: number;
  keywordAnalysis: KeywordAnalysisResult;
  isClosed: boolean;
  isLost: boolean;
}

export interface ScoreResult {
  score: number;
  breakdown: string[];
}

export function calculateLeadScore(lead: any, followUps: any[], keywords: KeywordAnalysisResult): ScoreResult {
  let score = 50; // Base starting score
  const breakdown: string[] = [];
  
  const isLost = lead.is_lost_lead || (lead.status || "").toLowerCase() === "lost";
  const isClosed = lead.status === "Completed" || lead.status === "Closing" || !!lead.closingDate;
  const hasSiteVisit = !!lead.mongoVisitDate || !!lead.siteVisitDate || followUps.some(f => f.siteVisitDate);

  let lastActivityMs = new Date(lead.created_at || Date.now()).getTime();
  if (followUps && followUps.length > 0) {
    const fuDates = followUps.map(f => new Date(f.createdAt || f.created_at || Date.now()).getTime());
    lastActivityMs = Math.max(...fuDates);
  }
  const daysSinceLastActivity = Math.floor((Date.now() - lastActivityMs) / (1000 * 60 * 60 * 24));
  const hasRecentFollowUp = daysSinceLastActivity <= 2 && followUps.length > 0;

  if (isLost) {
    return { score: 0, breakdown: ["Lead is lost or totally not interested (-100)"] };
  }
  
  if (isClosed) {
    return { score: 100, breakdown: ["Lead is marked as closed (+100)"] };
  }

  // 1. Site Visit
  if (hasSiteVisit) {
    score += 20;
    breakdown.push("Site visit completed (+20)");
  }

  // 2. Activity & Recency
  if (hasRecentFollowUp && daysSinceLastActivity <= 2) {
    score += 10;
    breakdown.push("Recent follow-up activity (+10)");
  } else if (daysSinceLastActivity > 10) {
    score -= 15;
    breakdown.push("Inactive for > 10 days (-15)");
  } else if (daysSinceLastActivity > 5) {
    score -= 5;
    breakdown.push("Inactive for > 5 days (-5)");
  }

  // 3. Keyword Signals
  const kw = keywords;
  
  if (kw.hasNegativeSignals) {
    score -= 30;
    breakdown.push("Negative keywords detected (-30)");
  }

  if (kw.hasUrgency) {
    score += 15;
    breakdown.push("Urgency keywords detected (+15)");
  }

  if (kw.hasLoanInterest) {
    score += 10;
    breakdown.push("Loan/EMI interest detected (+10)");
  }

  if (kw.hasPositiveSignals) {
    score += 10;
    breakdown.push("Positive keywords detected (+10)");
  }

  if (kw.hasBudgetConcerns) {
    // Budget concerns show high engagement, but also a hurdle. Slightly positive intent.
    score += 5;
    breakdown.push("Discussed pricing/budget (+5)");
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return { score, breakdown };
}
