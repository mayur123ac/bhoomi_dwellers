import { KeywordAnalysisResult } from "./keywordAnalyzer";
import { InterestLevel } from "./interestDetector";

/**
 * Generates an actionable suggested next step based on lead data.
 */
export function generateSuggestedAction(
  lead: any,
  kw: KeywordAnalysisResult,
  score: number,
  daysSinceLastActivity: number
): string {
  const isClosed = lead.status === "Completed" || lead.status === "Closing" || !!lead.closingDate;
  if (isClosed) {
    return "Lead is closed. Ensure all paperwork and handover tasks are complete.";
  }

  const isLost = lead.is_lost_lead || (lead.status || "").toLowerCase() === "lost";
  if (isLost) {
    return "Lead marked as dead or ghosting. No immediate follow-up required unless requested.";
  }

  if (kw.hasNegativeSignals) {
    return "Customer expressed hesitation or negative signals. Wait a few days before reaching out softly, or drop lead if strictly not interested.";
  }

  if (kw.hasUrgency) {
    return "Customer showing high urgency. Contact immediately to finalize booking or property selection.";
  }

  if (kw.hasLoanInterest) {
    return "Share detailed EMI breakdown and loan eligibility details from partnered banks.";
  }

  if ((lead.mongoVisitDate || lead.siteVisitDate) && daysSinceLastActivity >= 1) {
    return "Site visit completed. Follow up to ask for feedback, address objections, and push for token/booking.";
  }

  if (kw.hasBudgetConcerns) {
    return "Customer is budget conscious. Share flexible payment plans, current discounts, or alternative affordable units.";
  }

  if (score >= 75 && daysSinceLastActivity >= 1) {
    return "Hot lead. Keep momentum high. Schedule a call today to close open loops.";
  }

  if (daysSinceLastActivity > 5) {
    return `Customer becoming inactive (no contact in ${daysSinceLastActivity} days). Send a warm re-engagement message or new property update.`;
  }

  return "Maintain regular engagement. Share relevant property brochures or invite for a site visit.";
}
