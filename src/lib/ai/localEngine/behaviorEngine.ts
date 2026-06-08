import { KeywordAnalysisResult } from "./keywordAnalyzer";

export type BehaviorState = 
  | "active buyer" 
  | "passive buyer" 
  | "researching" 
  | "ghosting" 
  | "cold lead" 
  | "high intent" 
  | "comparison buyer" 
  | "investor mindset" 
  | "family buyer";

export interface BehaviorAnalysis {
  state: BehaviorState;
  insights: string[];
}

export function analyzeBehavior(
  lead: any,
  followUps: any[],
  keywords: KeywordAnalysisResult
): BehaviorAnalysis {
  const insights: string[] = [];
  const followUpCount = followUps.length;
  
  // Basic properties
  const planning = (lead.planningPurchase || "").toLowerCase();
  const useType = (lead.useType || "").toLowerCase();
  
  let state: BehaviorState = "researching"; // default

  // Determine Mindset
  if (useType.includes("invest")) {
    state = "investor mindset";
    insights.push("Client is evaluating based on ROI and rental yields.");
  } else if (keywords.hasFamilyRequirements) {
    state = "family buyer";
    insights.push("Client is prioritizing family-centric amenities and lifestyle factors.");
  }

  // Determine Engagement
  if (followUpCount === 0) {
    state = "cold lead";
    insights.push("No engagement history established yet.");
  } else if (followUpCount >= 3 && lead.mongoVisitDate) {
    state = "active buyer";
    insights.push("Client shows sustained engagement and willingness to visit.");
    if (keywords.hasLoanInterest || planning.includes("immediate")) {
      state = "high intent";
      insights.push("Strong financial and timeline alignment indicates imminent closure possibility.");
    }
  } else if (followUpCount >= 2 && !keywords.hasPositiveSignals && keywords.hasNegativeSignals) {
    state = "comparison buyer";
    insights.push("Client is likely evaluating alternatives. Objections noted in follow-ups.");
  } else if (followUpCount > 0 && !lead.mongoVisitDate && planning.includes("months")) {
    state = "passive buyer";
    insights.push("Client is engaging but keeping a slow timeline.");
  }

  // Check for ghosting (last interaction > 7 days ago but they had some activity before)
  if (followUpCount > 0) {
    const lastInteractionStr = followUps[followUps.length - 1].createdAt;
    const daysSince = lastInteractionStr 
      ? (Date.now() - new Date(lastInteractionStr).getTime()) / (1000 * 60 * 60 * 24)
      : 0;
      
    if (daysSince > 7) {
      state = "ghosting";
      insights.push(`Client has stopped responding for over ${Math.floor(daysSince)} days.`);
    }
  }

  return { state, insights };
}
