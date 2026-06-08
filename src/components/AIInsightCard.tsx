import React from "react";
import { useLeadIntelligence } from "@/lib/ai/useLeadIntelligence";
import { FaRobot, FaFire, FaThermometerHalf, FaSnowflake, FaTimesCircle, FaCheckCircle, FaExclamationTriangle, FaBolt, FaGhost, FaSkull, FaChartLine, FaArrowRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface AIInsightCardProps {
  lead: any;
  followUps: any[];
  userRole: string;
  isDark: boolean;
}

export default function AIInsightCard({ lead, followUps, userRole, isDark }: AIInsightCardProps) {
  const insight = useLeadIntelligence(lead, followUps, userRole);
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!insight) return null;

  // Temperature visual mapping
  let tempColor = "text-blue-500 bg-blue-500/10 border-blue-500/30";
  let TempIcon = FaThermometerHalf;
  
  if (insight.status === "HOT") {
    tempColor = "text-orange-500 bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)]";
    TempIcon = FaFire;
  } else if (insight.status === "WARM") {
    tempColor = "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
    TempIcon = FaThermometerHalf;
  } else if (insight.status === "ACTIVE") {
    tempColor = "text-cyan-500 bg-cyan-500/10 border-cyan-500/30";
    TempIcon = FaBolt;
  } else if (insight.status === "WATCHLIST") {
    tempColor = "text-purple-500 bg-purple-500/10 border-purple-500/30";
    TempIcon = FaExclamationTriangle;
  } else if (insight.status === "COLD") {
    tempColor = "text-gray-400 bg-gray-500/10 border-gray-500/30";
    TempIcon = FaSnowflake;
  } else if (insight.status === "GHOSTING") {
    tempColor = "text-slate-400 bg-slate-500/10 border-slate-500/30";
    TempIcon = FaGhost;
  } else if (insight.status === "DEAD") {
    tempColor = "text-red-500 bg-red-500/10 border-red-500/30";
    TempIcon = FaSkull;
  }

  // Hard override for closed leads
  if (lead.status === "Completed" || lead.status === "Closing" || !!lead.closingDate) {
    tempColor = "text-green-500 bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
    TempIcon = FaCheckCircle;
  }

  // Risk Indicator
  const isHighRisk = insight.risk.riskLevel === "Critical" || insight.risk.riskLevel === "High";
  const riskColor = isHighRisk ? "text-red-400 bg-red-400/10 border-red-400/20" : "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-4 rounded-2xl border overflow-hidden transition-all duration-300 relative group
        ${isDark 
          ? "bg-[#0b0c10]/80 backdrop-blur-xl border-[#1f2937] shadow-[0_8px_30px_rgb(0,0,0,0.4)]" 
          : "bg-white/90 backdrop-blur-xl border-indigo-100 shadow-[0_8px_30px_rgb(0,0,0,0.05)]"
        }`}
    >
      {/* Decorative Glow */}
      {isDark && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
      )}
      
      {/* Header */}
      <div 
        className={`px-5 py-4 flex items-center justify-between cursor-pointer border-b transition-colors relative z-10
          ${isDark ? "border-[#1f2937] hover:bg-[#1f2937]/30" : "border-indigo-50 hover:bg-indigo-50/50"}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isDark ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white" : "bg-gradient-to-br from-[#00AEEF] to-[#9E217B] text-white"}`}>
            <FaRobot className="text-lg" />
          </div>
          <div>
            <h3 className={`font-black text-sm tracking-wide ${isDark ? "text-purple-300" : "text-purple-800"}`}>Lead Intelligence Engine</h3>
            <p className={`text-[10px] font-medium tracking-widest uppercase ${isDark ? "text-gray-500" : "text-indigo-400"}`}>AI Predicts: {insight.behavior.state}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Urgency</span>
            <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
              <div className={`h-full rounded-full ${insight.urgency.score > 70 ? "bg-red-500" : insight.urgency.score > 40 ? "bg-yellow-500" : "bg-blue-500"}`} style={{ width: `${insight.urgency.score}%` }} />
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 transition-all ${tempColor}`}>
            <TempIcon className="text-xs" />
            {insight.status}
          </span>
          <div className="flex flex-col items-end">
            <span className={`text-sm font-black ${isDark ? "text-gray-200" : "text-gray-800"}`}>
              {insight.score}<span className={`text-[10px] font-bold ${isDark ? "text-gray-600" : "text-gray-400"}`}>/100</span>
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Conv. Prob.</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-5 relative z-10">
        
        {/* Dynamic Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`px-3 py-2 rounded-xl border flex flex-col gap-1 ${riskColor}`}>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Risk Level</span>
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <FaExclamationTriangle /> {insight.risk.riskLevel}
            </div>
          </div>
          <div className={`px-3 py-2 rounded-xl border flex flex-col gap-1 ${isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Momentum</span>
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <FaChartLine /> {insight.timeline.momentum}
            </div>
          </div>
        </div>

        {/* Smart Summary */}
        <div>
          <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isDark ? "text-gray-500" : "text-indigo-400"}`}>
            AI Analysis <div className={`flex-1 h-[1px] ${isDark ? "bg-gray-800" : "bg-indigo-50"}`} />
          </h4>
          <ul className={`text-sm space-y-2.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            {insight.summary.map((line, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDark ? "bg-purple-500" : "bg-[#00AEEF]"}`} />
                <span className="leading-snug font-medium opacity-90">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Recommender */}
        <div className={`p-4 rounded-xl border relative overflow-hidden ${isDark ? "bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-indigo-500/20" : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100"}`}>
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>Suggested Strategy</h4>
          <p className={`text-sm font-semibold leading-relaxed flex items-start gap-2 ${isDark ? "text-indigo-200" : "text-indigo-900"}`}>
            <FaArrowRight className="mt-1 flex-shrink-0 text-indigo-500 text-xs" />
            {insight.suggestedAction}
          </p>
        </div>

        {/* Role Insight */}
        {insight.roleInsight && (
          <div className={`px-3 py-2 rounded-lg border text-xs leading-relaxed flex items-center gap-2.5 ${isDark ? "bg-[#1f2937]/50 border-[#374151] text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
            <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isDark ? "bg-gray-800 text-gray-400" : "bg-white text-gray-500"}`}>Role Context</div>
            <p className="font-medium">{insight.roleInsight}</p>
          </div>
        )}
      </div>

      {/* Expandable Debug/Breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-t overflow-hidden ${isDark ? "border-[#1f2937] bg-[#0f1115]" : "border-indigo-100 bg-white"}`}
          >
            <div className="p-5">
              <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDark ? "text-gray-500" : "text-indigo-400"}`}>Scoring Telemetry</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {insight.scoreBreakdown.map((rule, idx) => (
                  <div key={idx} className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-2 ${rule.includes("(+") ? (isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700") : (isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-700")}`}>
                    {rule.includes("(+") ? <FaCheckCircle className="opacity-70" /> : <FaTimesCircle className="opacity-70" />}
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
