import { KeywordAnalysisResult } from "./keywordAnalyzer";

export interface UrgencyAnalysis {
  score: number; // 0 - 100
  level: "Critical" | "High" | "Medium" | "Low" | "None";
  signals: string[];
}

export function calculateUrgency(
  lead: any,
  followUps: any[],
  keywords: KeywordAnalysisResult
): UrgencyAnalysis {
  let score = 0;
  const signals: string[] = [];

  const planning = (lead.planningPurchase || "").toLowerCase();
  const loanPlanned = (lead.loanPlanned || "").toLowerCase();
  
  // 1. Timeline signals
  if (planning.includes("immediate")) {
    score += 40;
    signals.push("Immediate purchase timeframe specified.");
  } else if (planning.includes("3 months")) {
    score += 15;
    signals.push("Short-term (3 months) purchase horizon.");
  }

  // 2. Financial readiness signals
  if (loanPlanned === "yes" && keywords.hasLoanInterest) {
    score += 25;
    signals.push("Active loan processing / financial readiness detected.");
  } else if (loanPlanned === "no") {
    score += 30; // Cash buyers are urgent if they are ready
    signals.push("Cash buyer - no loan delays.");
  }

  // 3. Activity signals
  if (lead.mongoVisitDate || lead.siteVisitDate) {
    score += 30;
    signals.push("Site visit completed or scheduled.");
  }

  if (keywords.hasUrgency) {
    score += 20;
    signals.push("Verbal/written urgency detected in follow-up notes.");
  }

  // Decay based on inactivity
  if (followUps.length > 0) {
    const lastInteractionStr = followUps[followUps.length - 1].createdAt;
    const daysSince = lastInteractionStr 
      ? (Date.now() - new Date(lastInteractionStr).getTime()) / (1000 * 60 * 60 * 24)
      : 0;
      
    if (daysSince > 5) {
      score -= (daysSince * 2); // Decay 2 points per day inactive
      signals.push(`Urgency decaying due to ${Math.floor(daysSince)} days of inactivity.`);
    }
  } else {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  let level: UrgencyAnalysis["level"] = "None";
  if (score >= 80) level = "Critical";
  else if (score >= 60) level = "High";
  else if (score >= 35) level = "Medium";
  else if (score > 0) level = "Low";

  return { score, level, signals };
}
