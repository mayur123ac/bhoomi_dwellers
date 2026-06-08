import { KeywordAnalysisResult } from "./keywordAnalyzer";
import { ScoreResult } from "./leadScoring";
import { InterestLevel } from "./interestDetector";
import { BehaviorAnalysis } from "./behaviorEngine";
import { UrgencyAnalysis } from "./urgencyEngine";
import { TimelineAnalysis } from "./timelineEngine";
import { RiskAnalysis } from "./riskEngine";

export interface DynamicSummary {
  bulletPoints: string[];
  roleInsight: string;
}

export function generateSalesInsights(
  lead: any,
  userRole: string,
  keywords: KeywordAnalysisResult,
  score: ScoreResult,
  interest: InterestLevel,
  behavior: BehaviorAnalysis,
  urgency: UrgencyAnalysis,
  timeline: TimelineAnalysis,
  risk: RiskAnalysis
): DynamicSummary {
  const bulletPoints: string[] = [];

  // Behavioral statement
  bulletPoints.push(`Client categorized as ${behavior.state.toUpperCase()}. ${behavior.insights[0] || ""}`);

  // Urgency statement
  if (urgency.score > 50) {
    bulletPoints.push(`High urgency detected. ${urgency.signals[0] || ""}`);
  }

  // Risk / Momentum statement
  if (risk.riskLevel === "Critical" || risk.riskLevel === "High") {
    bulletPoints.push(`⚠️ Risk Warning: ${risk.riskFactors[0]}`);
  } else if (timeline.momentum !== "Steady") {
    bulletPoints.push(`Engagement Momentum: ${timeline.timelineStatement}`);
  }

  // Loan/Budget context
  if (keywords.hasLoanInterest) {
    bulletPoints.push(`Financial: Loan assistance is a key decision factor.`);
  }

  // --- Role Aware Insights ---
  let roleInsight = "";
  const role = userRole.toLowerCase();

  if (role.includes("receptionist")) {
    if (interest === "GHOSTING" || interest === "DEAD") {
      roleInsight = "Lead is unresponsive. Consider initiating a re-engagement campaign or soft transfer.";
    } else if (urgency.score > 70) {
      roleInsight = "High urgency buyer. Ensure immediate routing to the assigned Sales Manager.";
    } else {
      roleInsight = "Standard pipeline routing. Ensure all basic contact and source info is complete.";
    }
  } else if (role.includes("site head") || role.includes("site_head")) {
    if (lead.mongoVisitDate || lead.siteVisitDate) {
      roleInsight = "Site visit booked. Ensure sales collateral and sample flat are prepared.";
    } else {
      roleInsight = "No site visit yet. Monitor Sales Manager's attempts to schedule a visit.";
    }
  } else if (role.includes("admin")) {
    if (timeline.daysSinceCreation > 30 && interest !== "DEAD") {
      roleInsight = "Operational Bottleneck: Lead stuck in pipeline > 30 days without closure.";
    } else {
      roleInsight = `Pipeline metrics tracking normal. Score: ${score.score}/100.`;
    }
  } else {
    // Default Sales Manager Insight
    if (risk.riskLevel === "High" || risk.riskLevel === "Critical") {
      roleInsight = `Immediate Intervention Required: ${risk.riskFactors[0]}`;
    } else if (urgency.score >= 80) {
      roleInsight = "Closing Probability HIGH. Push for token/booking on the next interaction.";
    } else if (behavior.state === "comparison buyer") {
      roleInsight = "Focus on USP and competitive advantages. Prepare counter-objections.";
    } else {
      roleInsight = `Maintain ${timeline.momentum} momentum. Follow up to push to the next stage.`;
    }
  }

  return { bulletPoints, roleInsight };
}
