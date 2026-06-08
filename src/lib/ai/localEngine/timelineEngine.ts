export interface TimelineAnalysis {
  daysSinceCreation: number;
  daysSinceLastInteraction: number;
  momentum: "Accelerating" | "Steady" | "Stalling" | "Decaying";
  timelineStatement: string;
}

export function analyzeTimeline(lead: any, followUps: any[]): TimelineAnalysis {
  const creationDate = new Date(lead.createdAt || Date.now());
  const daysSinceCreation = Math.floor((Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let daysSinceLastInteraction = daysSinceCreation;
  let interactionDensity = 0;

  if (followUps.length > 0) {
    const lastInteractionStr = followUps[followUps.length - 1].createdAt;
    daysSinceLastInteraction = Math.floor((Date.now() - new Date(lastInteractionStr).getTime()) / (1000 * 60 * 60 * 24));
    
    // Check interactions in the last 7 days
    const recentInteractions = followUps.filter(f => {
      const d = new Date(f.createdAt);
      return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
    }).length;
    interactionDensity = recentInteractions;
  }

  let momentum: TimelineAnalysis["momentum"] = "Steady";
  let timelineStatement = "";

  if (daysSinceLastInteraction > 7) {
    momentum = "Decaying";
    timelineStatement = `Lead has been inactive for ${daysSinceLastInteraction} days. Conversion probability is decreasing rapidly.`;
  } else if (daysSinceLastInteraction > 3) {
    momentum = "Stalling";
    timelineStatement = `Momentum is stalling. No interactions in the last ${daysSinceLastInteraction} days.`;
  } else if (interactionDensity >= 3) {
    momentum = "Accelerating";
    timelineStatement = `Lead engagement is increasing with ${interactionDensity} interactions in the past week.`;
  } else {
    momentum = "Steady";
    timelineStatement = `Standard engagement cycle. Maintained steady interaction over ${daysSinceCreation} days.`;
  }

  return { daysSinceCreation, daysSinceLastInteraction, momentum, timelineStatement };
}
