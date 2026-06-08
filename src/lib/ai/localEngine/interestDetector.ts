export type InterestLevel = "HOT" | "WARM" | "ACTIVE" | "WATCHLIST" | "COLD" | "GHOSTING" | "DEAD";

export function detectLeadInterest(
  score: number, 
  urgencyScore: number, 
  daysInactive: number, 
  isLost: boolean
): InterestLevel {
  if (isLost) return "DEAD";
  
  if (daysInactive > 14) return "GHOSTING";
  if (daysInactive > 7) return "WATCHLIST";

  if (score >= 75 || urgencyScore >= 80) return "HOT";
  if (score >= 50 || urgencyScore >= 50) return "WARM";
  if (score >= 30) return "ACTIVE";
  
  return "COLD";
}
