export const KEYWORDS = {
  loan: ["loan", "emi", "finance", "bank", "interest rate", "mortgage", "funding", "borrow"],
  urgency: ["urgent", "immediately", "this week", "finalize", "booking", "ready to move", "asap", "soon", "token"],
  budget: ["budget", "price", "cost", "expensive", "cheap", "negotiate", "discount", "offer", "final price"],
  family: ["family", "school", "kids", "wife", "parents", "marriage", "space", "bhk"],
  negative: ["not interested", "later", "stop", "busy", "wrong number", "already purchased", "not looking", "cancelled", "drop"],
  positive: ["interested", "site visit", "good", "liked", "planning", "callback", "details", "brochure", "share"]
};

export type KeywordAnalysisResult = {
  hasLoanInterest: boolean;
  hasUrgency: boolean;
  hasBudgetConcerns: boolean;
  hasFamilyRequirements: boolean;
  hasNegativeSignals: boolean;
  hasPositiveSignals: boolean;
  matchedKeywords: string[];
};

/**
 * Analyzes an array of text strings (e.g. follow-up notes, messages) and detects keyword presence.
 */
export function analyzeKeywords(texts: string[]): KeywordAnalysisResult {
  const combinedText = texts.join(" ").toLowerCase();
  
  const result: KeywordAnalysisResult = {
    hasLoanInterest: false,
    hasUrgency: false,
    hasBudgetConcerns: false,
    hasFamilyRequirements: false,
    hasNegativeSignals: false,
    hasPositiveSignals: false,
    matchedKeywords: []
  };

  if (!combinedText.trim()) return result;

  const checkCategory = (category: keyof typeof KEYWORDS): boolean => {
    const matches = KEYWORDS[category].filter(kw => combinedText.includes(kw));
    if (matches.length > 0) {
      result.matchedKeywords.push(...matches);
      return true;
    }
    return false;
  };

  result.hasLoanInterest = checkCategory("loan");
  result.hasUrgency = checkCategory("urgency");
  result.hasBudgetConcerns = checkCategory("budget");
  result.hasFamilyRequirements = checkCategory("family");
  result.hasNegativeSignals = checkCategory("negative");
  result.hasPositiveSignals = checkCategory("positive");

  // Deduplicate matched keywords
  result.matchedKeywords = Array.from(new Set(result.matchedKeywords));

  return result;
}
