import { analyzeKeywords, KeywordAnalysisResult } from "./keywordAnalyzer";
import { calculateLeadScore, ScoreResult } from "./leadScoring";
import { detectLeadInterest, InterestLevel } from "./interestDetector";
import { generateSuggestedAction } from "./followupEngine";
import { analyzeBehavior, BehaviorAnalysis } from "./behaviorEngine";
import { calculateUrgency, UrgencyAnalysis } from "./urgencyEngine";
import { analyzeTimeline, TimelineAnalysis } from "./timelineEngine";
import { detectRisks, RiskAnalysis } from "./riskEngine";
import { generateSalesInsights, DynamicSummary } from "./salesInsights";

export interface LocalLeadIntelligenceResult {
  score: number;
  scoreBreakdown: ScoreResult["breakdown"];
  status: InterestLevel;
  urgency: UrgencyAnalysis;
  behavior: BehaviorAnalysis;
  timeline: TimelineAnalysis;
  risk: RiskAnalysis;
  keywords?: KeywordAnalysisResult;
  summary: string[];
  suggestedAction: string;
  roleInsight: string;
}

export function generateLocalIntelligence(
  lead: any,
  followUps: any[],
  userRole: string
): LocalLeadIntelligenceResult {
  
  const textsToAnalyze: string[] = [];
  if (lead.notes) textsToAnalyze.push(lead.notes);
  if (followUps && followUps.length > 0) {
    followUps.forEach(f => {
      if (f.message) textsToAnalyze.push(f.message);
    });
  }

  // 1. Keyword Extraction
  const keywords = analyzeKeywords(textsToAnalyze);

  // 2. Timeline Analysis
  const timeline = analyzeTimeline(lead, followUps);

  // 3. Behavior Engine
  const behavior = analyzeBehavior(lead, followUps, keywords);

  // 4. Urgency Engine
  const urgency = calculateUrgency(lead, followUps, keywords);

  // 5. Score Calculation
  const scoreResult = calculateLeadScore(lead, followUps, keywords);

  // 6. Risk Engine
  const risk = detectRisks(lead, followUps, keywords, timeline);

  // 7. Interest / Temperature Detection
  const isLost = lead.is_lost_lead || (lead.status || "").toLowerCase() === "lost";
  const status = detectLeadInterest(
    scoreResult.score,
    urgency.score,
    timeline.daysSinceLastInteraction,
    isLost
  );

  // 8. Follow-up Strategy
  const suggestedAction = generateSuggestedAction(
    lead,
    keywords,
    scoreResult.score,
    timeline.daysSinceLastInteraction
  );

  // 9. Aggregated Summaries
  const insights = generateSalesInsights(
    lead,
    userRole,
    keywords,
    scoreResult,
    status,
    behavior,
    urgency,
    timeline,
    risk
  );

  return {
    score: scoreResult.score,
    scoreBreakdown: scoreResult.breakdown,
    status,
    urgency,
    behavior,
    timeline,
    risk,
    keywords,
    summary: insights.bulletPoints,
    suggestedAction,
    roleInsight: insights.roleInsight,
  };
}

// Export all modules
export * from "./keywordAnalyzer";
export * from "./leadScoring";
export * from "./interestDetector";
export * from "./followupEngine";
export * from "./behaviorEngine";
export * from "./urgencyEngine";
export * from "./timelineEngine";
export * from "./riskEngine";
export * from "./salesInsights";
export * from "./intentClassifier";
