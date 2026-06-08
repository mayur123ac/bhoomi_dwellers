import { useMemo } from "react";
import { generateLocalIntelligence, LocalLeadIntelligenceResult } from "./localEngine";

export function useLeadIntelligence(lead: any, followUps: any[], userRole: string): LocalLeadIntelligenceResult | null {
  return useMemo(() => {
    if (!lead) return null;
    return generateLocalIntelligence(lead, followUps, userRole);
  }, [lead, followUps, userRole]);
}
