import { KeywordAnalysisResult } from "./keywordAnalyzer";
import { TimelineAnalysis } from "./timelineEngine";

export interface RiskAnalysis {
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  riskFactors: string[];
}

export function detectRisks(
  lead: any,
  followUps: any[],
  keywords: KeywordAnalysisResult,
  timeline: TimelineAnalysis
): RiskAnalysis {
  const riskFactors: string[] = [];
  let riskScore = 0; // 0 to 100 risk scale

  // 1. Inactivity Risks
  if (timeline.daysSinceLastInteraction > 5) {
    riskScore += 40;
    riskFactors.push("High chance of losing lead due to delayed follow-up.");
  } else if (timeline.daysSinceLastInteraction > 2) {
    riskScore += 15;
  }

  // 2. Keyword/Objection Risks
  if (keywords.hasNegativeSignals) {
    riskScore += 35;
    riskFactors.push("Direct objections detected in recent communication.");
  }
  
  if (keywords.hasBudgetConcerns) {
    riskScore += 25;
    riskFactors.push("Pricing mismatch or budget objection noted.");
  }

  // 3. Competitor / Behavior Risks
  // If the lead is engaging but has objections, they are probably comparing.
  if (followUps.length > 2 && keywords.hasNegativeSignals && timeline.momentum === "Steady") {
    riskFactors.push("Lead is actively comparing competitors or negotiating hard.");
  }

  // 4. Stagnation Risk
  if (timeline.daysSinceCreation > 30 && !lead.mongoVisitDate) {
    riskScore += 20;
    riskFactors.push("Lead is stagnating. Over 30 days active with no site visit.");
  }

  let riskLevel: RiskAnalysis["riskLevel"] = "Low";
  if (riskScore >= 70) riskLevel = "Critical";
  else if (riskScore >= 45) riskLevel = "High";
  else if (riskScore >= 25) riskLevel = "Medium";

  if (riskFactors.length === 0) {
    riskFactors.push("No immediate risk factors detected.");
  }

  return { riskLevel, riskFactors };
}
