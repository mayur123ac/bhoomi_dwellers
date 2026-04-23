//dashboard/page.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaThLarge, FaClipboardList, FaUsers, FaIdCard,
  FaSearch, FaBell, FaChevronLeft, FaPhoneAlt, FaComments,
  FaCheckCircle, FaCalendarAlt, FaTimes,
  FaFileInvoice, FaPaperPlane, FaMicrophone, FaWhatsapp, FaTable, FaChartPie, FaEyeSlash, FaUniversity, FaFileAlt, FaCheck, FaClock, FaHandshake, FaExchangeAlt, FaBriefcase, FaDownload
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  CartesianGrid, PieChart, Pie,
} from "recharts";

// ─── SUN/MOON ICONS ───────────────────────────────────────────────────────────
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// ─── THEME TOKEN BUILDER — MAGENTA ACCENT ────────────────────────
// ─── THEME TOKEN BUILDER — MAGENTA ACCENT ────────────────────────
function buildTheme(isDark: boolean) {
  return {
    pageWrap: isDark ? "bg-[#0A0A0F] text-white" : "text-[#1A1A1A]",
    mainBg: isDark ? "bg-[#121212a]" : "bg-transparent",
    sidebar: "bg-[#1a1a1a] border-r border-[#2a2a2a]",
    header: isDark ? "bg-[#1a1a1a] border-b border-[#2a2a2a]" : "bg-white border-b border-[#9CA3AF]",
    headerGlass: isDark ? {} : { boxShadow: "0 1px 0 #9CA3AF, 0 4px 16px rgba(158,33,123,0.06)" },
    card: isDark
      ? "bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#9E217B]/50 hover:bg-[#1e1e1e]"
      : "bg-gradient-to-r from-[#f1f5ff] via-[#eef2ff] to-[#f5f3ff] border border-indigo-300 hover:border-[#9E217B]/40 hover:shadow-[0_-4px_16px_2px_rgba(158,33,123,0.2),0_0_24px_6px_rgba(158,33,123,0.12),0_4px_16px_rgba(0,0,0,0.08)]",
    cardGlass: isDark ? {} : { boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(158,33,123,0.07), 0 12px 28px rgba(0,0,0,0.08)" },
    cardClosing: isDark ? "bg-yellow-900/10 border border-yellow-500/30 hover:border-yellow-400/60" : "bg-amber-50 border border-amber-200 hover:border-amber-400/60",
    tableWrap: isDark ? "bg-[#1a1a1a] border border-[#2a2a2a]" : "bg-white border border-indigo-300",
    tableGlass: isDark ? {} : { boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(158,33,123,0.06), 0 16px 36px rgba(0,0,0,0.09)" },
    tableHead: isDark ? "bg-[#222]" : "bg-[#F1F5F9] border-b border-indigo-300",
    tableRow: isDark ? "hover:bg-[#252525]" : "hover:bg-[#F8FAFC] border-b border-indigo-200",
    tableDivide: isDark ? "divide-[#2a2a2a]" : "divide-[#E5E7EB]",
    tableBorder: isDark ? "border-b border-[#2a2a2a]" : "border-b border-[#D1D5DB]",
    tableBorder1: isDark ? "border-t border-[#2a2a2a]" : "border-t border-[#D1D5DB]",
    inputBg: isDark ? "bg-[#1a1a1a] border border-[#333]" : "bg-white border border-indigo-300",
    inputInner: isDark ? "bg-[#121212] border border-[#333]" : "bg-white border border-indigo-300",
    inputFocus: isDark ? "focus:border-[#9E217B]" : "focus:border-[#9E217B]",
    settingsBg: isDark ? "bg-[#222] border border-[#2a2a2a]" : "bg-[#F8FAFC] border border-indigo-300",
    settingsBgGl: isDark ? {} : { boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)" },
    innerBlock: isDark ? "bg-[#121212] border border-[#333]" : "bg-white border border-indigo-200",
    modalCard: isDark ? "bg-[#1a1a1a] border border-[#2a2a2a]" : "bg-white border border-indigo-300",
    modalGlass: isDark ? {} : { boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(158,33,123,0.08), 0 32px 72px rgba(0,0,0,0.16)" },
    modalInner: isDark ? "bg-[#121212] border border-[#333]" : "bg-[#F8FAFC] border border-indigo-300",
    modalHeader: isDark ? "bg-[#151515]" : "bg-[#F1F5F9]",
    dropdown: isDark ? "bg-[#1a1a1a] border border-[#2a2a2a]" : "bg-white border border-indigo-200",
    dropdownGlass: isDark ? {} : { boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 20px rgba(158,33,123,0.08), 0 20px 40px rgba(0,0,0,0.10)" },
    dropdownItem: isDark ? "hover:bg-[#222] border-[#222]" : "hover:bg-[#F8FAFC] border-[#F0F0F0]",
    text: isDark ? "text-white" : "text-[#1A1A1A]",
    textMuted: isDark ? "text-gray-400" : "text-[#6B7280]",
    textFaint: isDark ? "text-gray-500" : "text-[#9CA3AF]",
    textHeader: isDark ? "text-xs text-gray-500 uppercase" : "text-xs text-[#6B7280] uppercase",
    navActive: isDark ? "bg-[#9E217B]/20 border-[#9E217B]/60 text-[#d946a8]" : "bg-[#2A2A2A] text-[#9E217B] border-transparent",
    navInactive: isDark ? "text-gray-500 hover:text-gray-300 hover:bg-white/5 border-transparent" : "text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white border-transparent",
    navIndicator: isDark ? "bg-[#9E217B] shadow-[0_0_10px_2px_rgba(158,33,123,0.5)]" : "bg-[#9E217B] shadow-[0_0_8px_rgba(158,33,123,0.4)]",
    toggleWrap: isDark ? "bg-[#1C1C2A] border border-[#2A2A38] text-yellow-300" : "bg-white border border-indigo-200 text-[#9E217B]",
    chatArea: isDark ? "bg-[#0a0a0a]" : "bg-[#F8FAFC]",
    chatBubbleAi: isDark ? "bg-[#141414] border border-[#1f1f1f] text-gray-200" : "bg-white border border-[#E5E7EB] text-[#1A1A1A] shadow-sm",
    chatBubbleUser: isDark ? "bg-[#9E217B] text-white" : "bg-[#9E217B] text-white",
    chatInput: isDark ? "bg-[#111] border border-[#222] hover:border-[#333] focus-within:border-[#9E217B]/50" : "bg-white border-[#E5E7EB] hover:border-[#9CA3AF] focus-within:border-[#9E217B]/50",
    chatInputInner: isDark ? "bg-[#111] border border-[#222]" : "bg-white border-[#E5E7EB]",
    chatPanel: isDark ? "bg-[#1a1a1a] border border-[#333]" : "bg-white border-[#D1D5DB]",
    chatPanelGl: isDark ? {} : { boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(158,33,123,0.06), 0 16px 36px rgba(0,0,0,0.09)" },
    statGlow1: isDark ? "bg-[#9E217B]/10" : "bg-[#9E217B]/10",
    statGlow2: isDark ? "bg-[#d946a8]/10" : "bg-[#d946a8]/10",
    statGlow3: isDark ? "bg-blue-600/10" : "bg-indigo-400/10",
    statGlow4: isDark ? "bg-yellow-500/10" : "bg-amber-400/10",
    statGlow5: isDark ? "bg-green-600/10" : "bg-emerald-400/10",
    accentText: isDark ? "text-[#d946a8]" : "text-[#9E217B]",
    accentBg: isDark ? "bg-[#9E217B]/10 text-[#d946a8] border border-[#9E217B]/30" : "bg-[#9E217B]/10 text-[#9E217B] border border-[#9E217B]/30",
    sectionTitle: isDark ? "text-[#d946a8]" : "text-[#9E217B]",
    sectionBorder: isDark ? "border-[#9E217B]/20" : "border-[#9E217B]/25",
    btnPrimary: isDark ? "bg-[#9E217B] hover:bg-[#b8268f] text-white shadow-md" : "bg-[#9E217B] hover:bg-[#8a1d6b] text-white shadow-sm",
    btnSecondary: isDark ? "bg-[#00AEEF] hover:bg-[#0099d4] text-white shadow-md" : "bg-[#00AEEF] hover:bg-[#0099d4] text-white shadow-sm",
    btnDanger: isDark ? "bg-[#3B1F1F] text-[#F28B82] hover:bg-red-900/40 border border-red-900/30" : "bg-[#9E217B]/10 text-[#9E217B] hover:bg-[#9E217B] hover:text-white border border-[#9E217B]/30",
    btnWarning: isDark ? "bg-yellow-600 hover:bg-yellow-500 text-white shadow-md" : "bg-amber-500 hover:bg-amber-400 text-white shadow-sm",
    btnClosingBadge: isDark ? "bg-yellow-900/20 border border-yellow-500/40 text-yellow-400" : "bg-amber-50 border border-amber-400/60 text-amber-600",
    logoBg: isDark ? "bg-[#9E217B] shadow-lg shadow-[#9E217B]/30" : "bg-[#9E217B] shadow-lg shadow-[#9E217B]/30",
    chartColors: isDark
      ? ["#d946a8", "#e879b8", "#00AEEF", "#f97316", "#4ade80", "#fbbf24", "#60a5fa"]
      : ["#9E217B", "#00AEEF", "#0077b6", "#f97316", "#4ade80", "#fbbf24", "#d946a8"],
    visitPieColors: ["#9E217B", "#00AEEF", "#f97316", "#4ade80", "#fbbf24", "#e879b8", "#60a5fa", "#34d399"],
    tooltipBg: isDark ? "#1a1a1a" : "rgba(255,255,255,0.98)",
    tooltipColor: isDark ? "#fff" : "#1A1A1A",
    tooltipBorder: isDark ? "1px solid rgba(158,33,123,0.3)" : "1px solid #E5E7EB",
    tooltipShadow: isDark ? "0 8px 24px rgba(158, 33, 123, 0.35)" : "0_0_10px_rgba(236,72,153,0.6),0_0_20px_rgba(236,72,153,0.4)",
    legendColor: isDark ? "#9ca3af" : "#6B7280",
    fupDefault: isDark ? "bg-[#1f0a18] border border-[#9E217B]/30" : "bg-pink-50 border border-pink-200",
    fupLoan: isDark ? "bg-blue-900/20 border border-blue-600/40" : "bg-blue-50 border border-blue-200",
    fupSalesform: isDark ? "bg-[#222] border border-[#444]" : "bg-white border border-[#D1D5DB]",
    fupClosing: isDark ? "bg-yellow-900/20 border border-yellow-600/40" : "bg-amber-50 border border-amber-300",
    statusRouted: isDark ? "text-[#d946a8] border border-[#9E217B]/30 bg-[#9E217B]/10" : "text-[#9E217B] border-[#9E217B]/30 bg-[#9E217B]/10",
    statusVisit: isDark ? "text-orange-400 border border-orange-500/30 bg-orange-500/10" : "text-orange-500 border-orange-400/40 bg-orange-50",
    statusClosing: isDark ? "text-yellow-400 border border-yellow-500/40 bg-yellow-500/10" : "text-amber-600 border-amber-400/50 bg-amber-50",
    select: isDark ? "bg-[#121212] border border-[#333] text-white focus:border-[#9E217B]" : "bg-white border border-indigo-300 text-[#1A1A1A] focus:border-[#9E217B]",
    selectSmall: isDark ? "bg-[#222] border border-[#333] text-white" : "bg-white border border-indigo-200 text-[#6B7280]",
    scroll: isDark ? "scrollbar-dark" : "scrollbar-light",
  };
}

// ============================================================================
// SHARED REAL-TIME DATA HOOK
// ============================================================================
function useAdminData() {
  const [managers, setManagers] = useState<any[]>([]);
  const [siteHeads, setSiteHeads] = useState<any[]>([]);
  const [receptionists, setReceptionists] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      let smData: any[] = [];
      const resUsers = await fetch("/api/users/sales-manager");
      if (resUsers.ok) { const j = await resUsers.json(); smData = j.data || []; }

      let shData: any[] = [];
      const resSiteHeads = await fetch("/api/users/site-head");
      if (resSiteHeads.ok) { const j = await resSiteHeads.json(); shData = j.data || []; }

      let recData: any[] = [];
      const resRec = await fetch("/api/users/receptionist");
      if (resRec.ok) { const j = await resRec.json(); recData = j.data || j; }
      else {
        const alt = await fetch("/api/users?role=receptionist");
        if (alt.ok) { const j = await alt.json(); recData = j.data || []; }
      }

      let pgLeads: any[] = [];
      const resLeads = await fetch("/api/walkin_enquiries");
      if (resLeads.ok) { const j = await resLeads.json(); pgLeads = Array.isArray(j.data) ? j.data : []; }

      let mongoFollowUps: any[] = [];
      const resFups = await fetch("/api/followups");
      if (resFups.ok) { const j = await resFups.json(); mongoFollowUps = Array.isArray(j.data) ? j.data : []; }

      const mergedLeads = pgLeads.map((lead: any) => {
        const leadFups = mongoFollowUps.filter((f: any) => String(f.leadId) === String(lead.id));
        const salesForms = leadFups.filter((f: any) => f.message?.includes("Detailed Salesform Submitted"));
        const latestFormMsg = salesForms.length > 0 ? salesForms[salesForms.length - 1].message : "";

        const extractField = (fieldName: string) => {
          if (!latestFormMsg) return "Pending";
          const match = latestFormMsg.match(new RegExp(`• ${fieldName}: (.*)`));
          return match ? match[1].trim() : "Pending";
        };

        const loanUpdates = leadFups.filter((f: any) => f.message?.includes("🏦 Loan Update:"));
        let loanStatus = "N/A", loanAmtReq = "N/A", loanAmtApp = "N/A", loanRequired = "Pending";
        if (loanUpdates.length > 0) {
          const lm = loanUpdates[loanUpdates.length - 1].message;
          const ms = lm.match(/• Status: (.*)/); if (ms) loanStatus = ms[1].trim();
          const mr = lm.match(/• Amount Requested: (.*)/); if (mr) loanAmtReq = mr[1].trim();
          const ma = lm.match(/• Amount Approved: (.*)/); if (ma) loanAmtApp = ma[1].trim();
          const mlr = lm.match(/• Loan Required: (.*)/); if (mlr) loanRequired = mlr[1].trim();
        }

        const fupsWithDate = leadFups.filter((f: any) => f.siteVisitDate && f.siteVisitDate.trim() !== "");
        const latestVisitDate = fupsWithDate.length > 0 ? fupsWithDate[fupsWithDate.length - 1].siteVisitDate : null;
        const activeBudget = extractField("Budget") !== "Pending" ? extractField("Budget") : lead.budget;

        const sfLoanPlanned = extractField("Loan Planned");
        const derivedLoanPlanned =
          sfLoanPlanned !== "Pending" ? sfLoanPlanned :
            loanRequired !== "Pending" ? loanRequired :
              (lead.loan_planned || "Pending");

        return {
          ...lead,
          propType: extractField("Property Type"),
          salesBudget: activeBudget,
          useType: extractField("Use Type") !== "Pending" ? extractField("Use Type") : (lead.purpose || "Pending"),
          planningPurchase: extractField("Planning to Purchase"),
          decisionMaker: extractField("Decision Maker"),
          loanPlanned: derivedLoanPlanned,
          leadInterestStatus: extractField("Lead Status"),
          loanStatus, loanAmtReq, loanAmtApp, loanRequired,
          source: lead.source, sourceOther: lead.source_other,
          cpName: lead.cp_name, cpCompany: lead.cp_company, cpPhone: lead.cp_phone,
          altPhone: lead.alt_phone, address: lead.address,
          mongoVisitDate: latestVisitDate,
          status: latestVisitDate ? "Visit Scheduled" : lead.status,
        };
      });

      setManagers(smData);
      setSiteHeads(shData);
      setReceptionists(recData);
      setAllLeads(mergedLeads);
      setFollowUps(mongoFollowUps);
      setIsLoading(false);
    } catch (e) { console.error("Admin data sync failed", e); }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 5000);
    return () => clearInterval(interval);
  }, []);

  return { managers, receptionists, siteHeads, allLeads, followUps, isLoading, refetch: fetchAdminData };
}

// ============================================================================
// HELPER BADGES
// ============================================================================
function InterestBadge({ status, size = "md", isDark }: { status: string; size?: "sm" | "md"; isDark?: boolean }) {
  const colorMap: Record<string, string> = {
    "Interested": isDark ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-green-300 text-green-700 bg-green-50",
    "Not Interested": isDark ? "border-red-500/40 text-red-400 bg-red-500/10" : "border-red-300 text-red-700 bg-red-50",
    "Maybe": isDark ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" : "border-yellow-300 text-yellow-700 bg-yellow-50",
  };
  const cls = colorMap[status] ?? (isDark ? "border-[#9E217B]/30 text-[#d946a8] bg-[#9E217B]/10" : "border-[#9E217B]/30 text-[#9E217B] bg-[#9E217B]/10");
  const sz = size === "sm" ? "text-[9px] px-2 py-0.5" : "text-[10px] px-3 py-1";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border inline-flex items-center justify-center gap-1 flex-shrink-0 leading-none ${cls}`}>
      <FaUniversity className="text-[7px] mb-[1px]" />{status}
    </span>
  );
}

function LoanStatusBadge({ status, isDark }: { status: string; isDark?: boolean }) {
  const s = (status || "").toLowerCase();
  if (!s || s === "n/a") return null;
  let cls = isDark ? "border-gray-500/30 text-gray-400 bg-gray-500/10" : "border-gray-300 text-gray-700 bg-gray-50";
  if (s === "approved") cls = isDark ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-green-300 text-green-700 bg-green-50";
  if (s === "rejected") cls = isDark ? "border-red-500/40 text-red-400 bg-red-500/10" : "border-red-300 text-red-700 bg-red-50";
  if (s === "in progress") cls = isDark ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" : "border-yellow-300 text-yellow-700 bg-yellow-50";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 flex-shrink-0 ${cls}`}>
      <FaUniversity className="text-[7px]" />{status}
    </span>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatDate = (ds: string) => {
  if (!ds || ds === "Pending" || ds === "N/A" || ds === "Completed") return "-";
  try { return new Date(ds).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return ds; }
};
const downloadCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert("No data to export.");
    return;
  }
  const headers = Object.keys(data[0]);
  const csvRows = data.map(row =>
    headers.map(fieldName => JSON.stringify(row[fieldName] ?? "")).join(",")
  );
  const csvString = [headers.join(","), ...csvRows].join("\r\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const formatLeadForExport = (l: any) => ({
  "Lead ID": l.id,
  "Client Name": l.name,
  "Budget": l.salesBudget || l.budget || "N/A",
  "Configuration": l.propType || l.configuration || "N/A",
  "Purpose": l.useType || l.purpose || "N/A",
  "Phone": l.phone,
  "Alt Phone": l.altPhone || l.alt_phone || "N/A",
  "Source": l.source || "N/A",
  "Status": l.status || "Routed",
  "Interest Level": l.leadInterestStatus || "N/A",
  "Loan Status": l.loanStatus || "N/A",
  "CP Name": l.cpName || l.cp_name || "N/A",
  "CP Phone": l.cpPhone || l.cp_phone || "N/A",
  "Site Visit Date": l.mongoVisitDate ? new Date(l.mongoVisitDate).toLocaleDateString("en-IN") : "N/A",
  "Assigned Manager": l.assigned_to || "Unassigned",
  "Assigned Receptionist": l.assigned_receptionist || "N/A",
  "Created At": l.created_at ? new Date(l.created_at).toLocaleDateString("en-IN") : "N/A",
});
const maskPhone = (phone: any, userRole: string = "admin", isOwner: boolean = true) => {
  if (!phone || phone === "N/A") return "N/A";
  const c = String(phone).replace(/[^a-zA-Z0-9]/g, "");
  if (c.length <= 5) return c;

  // 1. Full visibility for Admin OR if the user is the direct owner of the lead
  if (userRole === "admin" || isOwner) {
    return c;
  }
  // 2. Restricted visibility for Site Head viewing a global/shared lead
  if (userRole === "site_head" && !isOwner) {
    return `${c.slice(0, 2)}XXXXXX${c.slice(-2)}`;
  }
  // 3. Default fallback masking 
  return `${c.slice(0, 2)}*****${c.slice(-3)}`;
};
// ============================================================================
// MAIN LAYOUT SHELL
// ============================================================================
export default function AdminAtlasDashboard() {
  const router = useRouter();
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [user, setUser] = useState<any>({ name: "Admin", role: "Admin", email: "", password: "" });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(false);

  type CrmNotif = { id: string; line1: string; line2: string; type: "lead" | "visit" };

  const [notifQueue, setNotifQueue] = useState<CrmNotif[]>([]);
  const [activeNotif, setActiveNotif] = useState<CrmNotif | null>(null);
  const [notifCount, setNotifCount] = useState(0);

  const theme = useMemo(() => buildTheme(isDark), [isDark]);
  const { managers, receptionists, siteHeads, allLeads, followUps, isLoading, refetch } = useAdminData();

  // ── Helper to get accurate Creator Name & Role ──
  const getCreatorInfo = (lead: any) => {
    if (lead.assigned_receptionist) {
      return { name: lead.assigned_receptionist, role: "Receptionist" };
    }
    if (lead.assigned_to) {
      const isSiteHead = siteHeads.some((sh: any) => sh.name === lead.assigned_to);
      return { name: lead.assigned_to, role: isSiteHead ? "Site Head" : "Manager" };
    }
    return { name: "System", role: "Admin" };
  };

  // ── Permanent History List for the Dropdown ──
  // ── Permanent History List for the Dropdown ──
  const notificationHistory = useMemo(() => {
    const history: (CrmNotif & { rawDate: number })[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allLeads.forEach((lead: any) => {
      // 1. Add Leads (1 Day Expiration)
      const createdDate = new Date(lead.created_at || 0);
      createdDate.setHours(0, 0, 0, 0);
      const createdDiffDays = (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

      if (createdDiffDays <= 1) {
        const formattedId = String(lead.id).padStart(3, '0');
        const creatorInfo = getCreatorInfo(lead);

        history.push({
          id: `hist_lead_${lead.id}`,
          line1: `New Lead · ${formattedId} - ${lead.name}`,
          line2: `${creatorInfo.name} (${creatorInfo.role})`,
          type: "lead",
          rawDate: new Date(lead.created_at || 0).getTime(),
        });
      }

      // 2. Add Site Visits (Visible up to 3 days before, expires 2 days after)
      if (lead.mongoVisitDate) {
        const visitDateObj = new Date(lead.mongoVisitDate);
        visitDateObj.setHours(0, 0, 0, 0);
        const diffDays = (visitDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays >= -3 && diffDays <= 2) {
          const visitDate = new Date(lead.mongoVisitDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

          // 👇 FIXED: Determine Accurate Role for Assignee
          const assigneeName = lead.assigned_to || lead.assigned_receptionist || "Unassigned";
          let role = "Sales Manager";
          if (siteHeads.some((sh: any) => sh.name === assigneeName)) {
            role = "Site Head";
          } else if (receptionists.some((r: any) => r.name === assigneeName)) {
            role = "Receptionist";
          }

          history.push({
            id: `hist_visit_${lead.id}_${lead.mongoVisitDate}`,
            line1: `Site Visit · ${visitDate}`,
            line2: `${assigneeName} (${role}) - ${lead.name}`,
            type: "visit",
            rawDate: new Date(lead.mongoVisitDate).getTime(),
          });
        }
      }
    });
    return history.sort((a, b) => b.rawDate - a.rawDate).slice(0, 20);
  }, [allLeads, siteHeads, receptionists]); // Added receptionists here
  // ── Load User & Fetch Live Password ──
  useEffect(() => {
    const storedUser = localStorage.getItem("crm_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // 👇 THIS IS THE MISSING CODE THAT GETS THE PASSWORD 👇
      const fetchLivePassword = async () => {
        try {
          const res = await fetch("/api/employees");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              const liveUser = data.find((u: any) => u.email === parsedUser.email);
              if (liveUser?.password) {
                setUser((prev: any) => ({ ...prev, password: liveUser.password }));
              }
            }
          }
        } catch { }
      };
      fetchLivePassword();
    }
    const returnTab = localStorage.getItem("return_tab");
    if (returnTab) { setActiveView(returnTab); localStorage.removeItem("return_tab"); }
  }, []);

  // ── Toast Notification Queue Populator ──
  // ── Toast Notification Queue Populator ──
  useEffect(() => {
    if (!allLeads || allLeads.length === 0) return;

    let storedIds: string[] = [];
    try {
      const item = localStorage.getItem("crm_shown_notif_ids");
      storedIds = item ? JSON.parse(item) : [];
      if (!Array.isArray(storedIds)) storedIds = [];
    } catch (e) { storedIds = []; }

    const seenSet = new Set(storedIds);
    const fresh: CrmNotif[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allLeads.forEach((lead: any) => {
      // Notification 1: New Lead (1 Day Expiration)
      const leadNotifId = `lead_${lead.id}`;
      if (!seenSet.has(leadNotifId)) {
        const createdDate = new Date(lead.created_at || 0);
        createdDate.setHours(0, 0, 0, 0);
        const createdDiffDays = (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

        if (createdDiffDays <= 1) {
          const formattedId = String(lead.id).padStart(3, '0');
          const creatorInfo = getCreatorInfo(lead);

          fresh.push({
            id: leadNotifId,
            line1: `New Lead · ${formattedId} - ${lead.name}`,
            line2: `${creatorInfo.name} (${creatorInfo.role})`,
            type: "lead"
          });
          seenSet.add(leadNotifId);
        }
      }

      // Notification 2: Site Visit
      const visitNotifId = `visit_${lead.id}_${lead.mongoVisitDate}`;
      if (!seenSet.has(visitNotifId) && lead.mongoVisitDate) {
        const visitDateObj = new Date(lead.mongoVisitDate);
        visitDateObj.setHours(0, 0, 0, 0);
        const diffDays = (visitDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays >= -3 && diffDays <= 2) {
          const visitDate = new Date(lead.mongoVisitDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

          // 👇 FIXED: Determine Accurate Role
          const assigneeName = lead.assigned_to || lead.assigned_receptionist || "Unassigned";
          let role = "Sales Manager";
          if (siteHeads.some((sh: any) => sh.name === assigneeName)) {
            role = "Site Head";
          } else if (receptionists.some((r: any) => r.name === assigneeName)) {
            role = "Receptionist";
          }

          fresh.push({
            id: visitNotifId,
            line1: `Site Visit · ${visitDate}`,
            line2: `${assigneeName} (${role}) - ${lead.name}`,
            type: "visit"
          });
          seenSet.add(visitNotifId);
        }
      }
    });

    if (fresh.length > 0) {
      setNotifQueue(prev => [...prev, ...fresh]);
      setNotifCount(c => c + fresh.length);
      try {
        localStorage.setItem("crm_shown_notif_ids", JSON.stringify(Array.from(seenSet)));
      } catch (e) { }
    }
  }, [allLeads, siteHeads, receptionists]); // Added receptionists here// Added receptionists here

  // ── Trigger Popup Display (2 Seconds) ──
  useEffect(() => {
    if (activeNotif || notifQueue.length === 0) return;

    const nextNotif = notifQueue[0];
    setActiveNotif(nextNotif);
    setNotifQueue(prev => prev.slice(1));

    const timer = setTimeout(() => {
      setActiveNotif(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeNotif, notifQueue]);

  const handleLogout = () => { localStorage.removeItem("crm_user"); router.push("/"); };

  const menuItems = [
    { id: "dashboard", icon: FaThLarge, label: "Overview" },
    { id: "receptionist", icon: FaClipboardList, label: "Receptionist" },
    { id: "sales", icon: FaUsers, label: "Sales Managers" },
    { id: "site_head", icon: FaUniversity, label: "Site Heads" },
    { id: "caller", icon: FaPhoneAlt, label: "Caller Panel" },
    { id: "employees", icon: FaIdCard, label: "Add Employee" },
  ];

  const handleMenuClick = (itemId: string) => {
    if (itemId === "employees") {
      router.push("/dashboard/employees");
    } else if (itemId === "caller") {
      router.push("/dashboard/employees?tab=callers");
    } else {
      setActiveView(itemId);
      setIsSidebarHovered(false);
    }
  };

  return (
    <div
      className={`flex h-screen font-sans overflow-hidden relative transition-colors duration-300 ${theme.pageWrap}`}
      style={isDark ? {} : { background: "linear-gradient(135deg, #fdf0f8 0%, #f8fafc 30%, #faf0fb 62%, #f8fafc 78%, #fce8f6 100%)" }}
    >
      <AnimatePresence>
        {isSidebarHovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 pointer-events-none backdrop-blur-[1px]" />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ width: "80px" }} animate={{ width: isSidebarHovered ? "240px" : "80px" }} transition={{ duration: 0.2, ease: "easeInOut" }}
        onMouseEnter={() => setIsSidebarHovered(true)} onMouseLeave={() => setIsSidebarHovered(false)}
        className={`fixed left-0 top-0 h-screen border-r z-50 flex flex-col py-6 overflow-hidden shadow-2xl ${theme.sidebar}`}
      >
        <div className="flex items-center px-5 mb-10 whitespace-nowrap">
          <div className={`w-10 h-10 min-w-[40px] rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg ${theme.logoBg}`}>B</div>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: isSidebarHovered ? 1 : 0 }} className="ml-4 font-bold text-lg text-white tracking-wide">Bhoomi CRM</motion.span>
        </div>
        <nav className="flex flex-col gap-2 px-3 flex-1">
          {menuItems.map((item) => {
            const isActive = activeView === item.id && item.id !== "employees" && item.id !== "caller";
            return (
              <div
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`flex items-center px-3 py-3.5 rounded-xl cursor-pointer transition-colors whitespace-nowrap relative group
                  ${isActive ? "bg-[#9E217B]/20 text-[#d946a8]" : "text-gray-400 hover:bg-[#252525] hover:text-gray-200"}`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#9E217B] rounded-r-full shadow-[0_0_8px_rgba(158,33,123,0.6)]" />
                )}
                <item.icon className="w-5 h-5 min-w-[20px] ml-1" />
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: isSidebarHovered ? 1 : 0 }} className={`ml-5 font-semibold text-sm ${isActive ? "text-[#d946a8]" : ""}`}>
                  {item.label}
                </motion.span>
              </div>
            );
          })}
        </nav>
      </motion.aside>

      <div className={`flex-1 flex flex-col pl-[80px] h-screen overflow-hidden ${theme.mainBg}`}>
        <header className={`h-16 flex items-center justify-between px-8 z-30 transition-colors duration-300 relative ${theme.header}`} style={theme.headerGlass}>
          <h1 className={`font-bold text-lg capitalize tracking-wide flex items-center gap-3 ${theme.text}`}>
            {activeView.replace("_", " ")}
            <span className={`${theme.settingsBg} ${theme.textMuted} px-2 py-0.5 rounded text-xs border`}>Admin</span>
          </h1>

          <div className="flex items-center gap-6">
            <button onClick={() => setIsDark(!isDark)} aria-label="Toggle theme"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center cursor-pointer justify-center shadow-sm ${theme.toggleWrap}`}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            <div className="relative">
              <div className="relative cursor-pointer" onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); setNotifCount(0); }}>
                <FaBell className={`${theme.textMuted} hover:text-[#9E217B] transition-colors w-5 h-5`} />
                {notifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#9E217B] rounded-full text-[9px] font-black text-white flex items-center justify-center">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </div>

              {isNotifOpen && (
                <div className={`absolute top-12 right-0 w-[320px] border rounded-xl shadow-2xl flex flex-col z-50 animate-fadeIn ${theme.dropdown}`} style={theme.dropdownGlass}>
                  <div className={`p-4 border-b flex justify-between items-center ${theme.tableBorder}`}>
                    <h3 className={`font-bold text-sm flex items-center gap-2 ${theme.text}`}>
                      <FaBell className="text-[#9E217B]" /> Recent Notifications
                    </h3>
                    <button onClick={() => setIsNotifOpen(false)} className={`${theme.textMuted} hover:text-red-500`}><FaTimes className="text-xs" /></button>
                  </div>
                  <div className={`max-h-[360px] overflow-y-auto ${theme.scroll}`}>
                    {notificationHistory.length === 0 ? (
                      <p className={`p-6 text-center text-xs ${theme.textMuted}`}>No notifications yet.</p>
                    ) : (
                      notificationHistory.map((n) => (
                        <div key={n.id} className={`p-4 border-b last:border-b-0 transition-colors flex items-start gap-3 ${isDark ? "hover:bg-white/5 border-[#333]" : "hover:bg-black/5 border-[#E5E7EB]"}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${n.type === "visit" ? "bg-orange-500" : "bg-[#25D366]"}`}>
                            {n.type === "visit" ? <FaCalendarAlt className="text-[12px]" /> : <FaBriefcase className="text-[12px]" />}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${theme.text}`}>{n.line1}</p>
                            <p className={`text-[10px] mt-1 ${theme.textMuted}`}>{n.line2}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm hover:opacity-80 transition-opacity border
                  ${isDark ? "border-[#9E217B]/40 text-[#d946a8] bg-[#9E217B]/15" : "border-[#9E217B]/40 text-[#9E217B] bg-[#9E217B]/10"}`}>
                {String(user?.name || "A").charAt(0).toUpperCase()}
              </div>
              {isProfileOpen && (
                <div className={`absolute top-12 right-0 w-64 border rounded-xl shadow-2xl p-5 z-50 animate-fadeIn ${theme.dropdown}`} style={theme.dropdownGlass}>
                  <div className="mb-4">
                    <h3 className={`font-bold text-lg ${theme.text}`}>{user?.name || "Admin"}</h3>
                    <p className={`text-sm truncate ${theme.textMuted}`}>{user?.email || "admin@bhoomi.com"}</p>
                  </div>
                  <hr className={`mb-4 ${theme.tableBorder}`} />
                  <div className="space-y-4 mb-6 text-sm">
                    <p className={`flex justify-between items-center ${theme.textMuted}`}>Role:
                      <span className={`font-bold capitalize px-2 py-0.5 rounded border ${isDark ? "text-[#d946a8] bg-[#9E217B]/10 border-[#9E217B]/30" : "text-[#9E217B] bg-[#9E217B]/10 border-[#9E217B]/30"}`}>{user?.role || "Admin"}</span>
                    </p>
                    <div>
                      <p className={`text-xs mb-1 ${theme.textMuted}`}>Password</p>
                      <div className={`flex items-center justify-between border p-2 rounded-md ${theme.innerBlock}`}>
                        <span className={`font-mono tracking-widest text-xs ${theme.text}`}>{showPassword ? (user?.password || "N/A") : "••••••••"}</span>
                        <button onClick={() => setShowPassword(!showPassword)} className={`${theme.textMuted} cursor-pointer`}>
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleLogout} className={`w-full py-2.5 rounded-lg font-semibold transition-colors cursor-pointer ${theme.btnDanger}`}>Logout</button>
                </div>
              )}
            </div>

            {/* 👇 NEW: UPDATED POPUP TOAST WITH DYNAMIC ICONS 👇 */}
            {activeNotif && (
              <div className="absolute top-[68px] right-4 z-[999] animate-fadeIn">
                <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl border min-w-[280px] max-w-[360px]
                  ${isDark ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-[#E5E7EB]"}`}
                  style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>

                  {/* Dynamic Icon Box */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${activeNotif.type === "visit" ? "bg-orange-500" : "bg-[#25D366]"}`}>
                    {activeNotif.type === "visit" ? (
                      <FaCalendarAlt className="text-white text-lg" />
                    ) : (
                      <FaBriefcase className="text-white text-lg" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-[#1A1A1A]"}`}>{activeNotif.line1}</p>
                    <p className={`text-[11px] mt-0.5 truncate ${isDark ? "text-gray-400" : "text-[#6B7280]"}`}>{activeNotif.line2}</p>
                  </div>
                  <button onClick={() => setActiveNotif(null)} className={`flex-shrink-0 mt-0.5 p-0.5 rounded cursor-pointer transition-colors ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
                    <FaTimes className="text-[10px]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className={`flex-1 overflow-hidden transition-colors duration-300 ${theme.mainBg}`}>
          {activeView === "dashboard" && <DashboardOverview managers={managers} siteHeads={siteHeads} allLeads={allLeads} isLoading={isLoading} user={user} theme={theme} isDark={isDark} receptionists={receptionists} followUps={followUps} onNavigateToSales={(lead: any) => {
            const isSiteHead = siteHeads.some((sh: any) => sh.name === lead.assigned_to);
            const isReceptionist = receptionists.some((r: any) => r.name === lead.assigned_receptionist);
            const targetTab = isSiteHead ? "site_head" : isReceptionist ? "receptionist" : "sales";
            localStorage.setItem("crm_drill_lead", JSON.stringify({ ...lead, _drillTab: targetTab }));
            setActiveView(targetTab);
          }} />}
          {activeView === "sales" && <AdminSalesView managers={managers} allLeads={allLeads} followUps={followUps} isLoading={isLoading} adminUser={user} refetch={refetch} theme={theme} isDark={isDark} />}
          {activeView === "site_head" && <AdminSiteHeadView siteHeads={siteHeads} allLeads={allLeads} followUps={followUps} isLoading={isLoading} adminUser={user} refetch={refetch} theme={theme} isDark={isDark} />}
          {activeView === "receptionist" && (
            <ReceptionistView
              receptionists={receptionists}
              allLeads={allLeads}
              followUps={followUps}
              isLoading={isLoading}
              refetch={refetch}
              adminUser={user}
              theme={theme}
              isDark={isDark}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD ANALYTICS
// ============================================================================
function DashboardAnalytics({ leads, theme, isDark }: { leads: any[]; theme: any; isDark: boolean }) {
  const [pieMode, setPieMode] = useState<"interest" | "loan" | "usetype" | "loanrequired" | "visits">("interest");
  const [barMode, setBarMode] = useState<"weekly" | "source" | "cp">("weekly");

  const interestData = useMemo(() => {
    const c: Record<string, number> = { Interested: 0, "Not Interested": 0, Maybe: 0, Pending: 0 };
    leads.forEach(l => { const s = l.leadInterestStatus; if (s && s !== "Pending" && c[s] !== undefined) c[s]++; else c["Pending"]++; });
    return Object.entries(c).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const loanPieData = useMemo(() => {
    const c: Record<string, number> = { Approved: 0, "In Progress": 0, Rejected: 0, "N/A": 0 };
    leads.forEach(l => { const s = l.loanStatus; if (s && c[s] !== undefined) c[s]++; else c["N/A"]++; });
    return Object.entries(c).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const useTypeData = useMemo(() => {
    const c: Record<string, number> = {};
    leads.forEach(l => { const ut = (l.useType && l.useType !== "Pending") ? l.useType : (l.purpose || "Unknown"); c[ut] = (c[ut] || 0) + 1; });
    return Object.entries(c).filter(([k]) => k !== "Unknown").map(([name, value]) => ({ name, value }));
  }, [leads]);

  const loanRequiredData = useMemo(() => {
    const c: Record<string, number> = { Yes: 0, No: 0, "Not Sure": 0, Pending: 0 };
    leads.forEach(l => {
      const lp = l.loanPlanned;
      if (lp && c[lp] !== undefined) c[lp]++;
      else c["Pending"]++;
    });
    return Object.entries(c).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const visitData = useMemo(() => {
    const scheduled = leads.filter(l => l.mongoVisitDate).length;
    return [{ name: "Scheduled", value: scheduled }, { name: "Pending", value: leads.length - scheduled }];
  }, [leads]);

  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    leads.forEach(l => {
      if (!l.created_at) return;
      const d = new Date(l.created_at);
      if (Math.floor((now.getTime() - d.getTime()) / 86400000) < 7) counts[d.getDay()]++;
    });
    return days.map((day, i) => ({ day, leads: counts[i] }));
  }, [leads]);

  const weeklyTotal = weeklyData.reduce((a, b) => a + b.leads, 0);

  const sourceData = useMemo(() => {
    const c: Record<string, number> = {};
    leads.forEach(l => { const src = l.source || "Unknown"; c[src] = (c[src] || 0) + 1; });
    return Object.entries(c).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [leads]);
  const cpData = useMemo(() => {
    const c: Record<string, number> = {};
    leads.forEach(l => {
      // 1. Grab the name from whichever property exists
      const actualCpName = l.cpName || l.cp_name;

      // 2. Verify it's a Channel Partner AND that we have a valid name
      if (
        l.source === "Channel Partner" &&
        actualCpName &&
        actualCpName !== "N/A" &&
        actualCpName !== "—"
      ) {
        // 3. Trim whitespace to prevent duplicates like "Broker" and "Broker "
        const cleanName = actualCpName.trim();

        // 4. Increment the count
        c[cleanName] = (c[cleanName] || 0) + 1;
      }
    });
    return Object.entries(c).map(([cp, count]) => ({ cp, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [leads]);

  const interestColors: Record<string, string> = { Interested: "#4ade80", "Not Interested": "#f87171", Maybe: "#fbbf24", Pending: "#6b7280" };
  const loanColors: Record<string, string> = { Approved: "#4ade80", "In Progress": "#fbbf24", Rejected: "#f87171", "N/A": "#6b7280" };
  const useTypeColors: Record<string, string> = { "Self Use": "#9E217B", Investment: "#34d399", "Personal use": "#f87171", "N/A": "#6b7280" };
  const loanReqColors: Record<string, string> = { Yes: "#9E217B", No: "#6b7280", "Not Sure": "#fbbf24", Pending: "#374151" };
  const visitColors: Record<string, string> = { Scheduled: "#f97316", Pending: "#374151" };

  const pieData = pieMode === "interest" ? interestData : pieMode === "loan" ? loanPieData : pieMode === "usetype" ? useTypeData : pieMode === "loanrequired" ? loanRequiredData : visitData;
  const pieColors = pieMode === "interest" ? interestColors : pieMode === "loan" ? loanColors : pieMode === "usetype" ? useTypeColors : pieMode === "loanrequired" ? loanReqColors : visitColors;
  const totalLeads = leads.length;

  const BAR_COLORS = theme.chartColors;

  const BarTip = ({ active, payload, label }: any) => active && payload?.length
    ? <div className="rounded-lg px-3 py-2 text-xs shadow-xl" style={{ backgroundColor: theme.tooltipBg, color: theme.tooltipColor, border: theme.tooltipBorder }}><p className={theme.textMuted}>{label || payload[0].name}</p><p className="font-bold">{payload[0].value}</p></div>
    : null;

  const PieTip = ({ active, payload }: any) => active && payload?.length
    ? <div className="rounded-lg px-3 py-2 text-xs shadow-xl" style={{ backgroundColor: theme.tooltipBg, color: theme.tooltipColor, border: theme.tooltipBorder }}><p className="font-bold mb-1">{payload[0].name}</p><p>{payload[0].value} leads</p></div>
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* BAR CHART */}
      <div className={`${theme.card} rounded-2xl p-5`} style={theme.cardGlass}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`${theme.text} font-bold text-sm flex items-center gap-2`}>
              <FaChartPie className={`text-[#9E217B] text-xs`} />
              {barMode === "weekly" ? "Leads Added This Week" : barMode === "cp" ? "Leads by Channel Partner" : "Lead Source Distribution"}
            </h3>
            {barMode === "weekly" && <p className="text-[#9E217B] text-xs mt-0.5 font-semibold">{weeklyTotal} total this week</p>}
            {barMode === "cp" && <p className="text-[#9E217B] text-xs mt-0.5 font-semibold">{cpData.reduce((a, b) => a + b.count, 0)} CP leads total</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                let data = [];
                let name = "";
                if (barMode === "weekly") { data = weeklyData; name = "Weekly_Leads"; }
                else if (barMode === "cp") { data = cpData; name = "CP_Leads"; }
                else { data = sourceData; name = "Source_Distribution"; }
                downloadCSV(data, `${name}.csv`);
              }}
              className={`p-2 border rounded-lg transition-colors hover:opacity-80 ${isDark ? 'bg-[#222] border-[#333] text-white' : 'bg-white border-indigo-200 text-indigo-600'}`}
              title="Export Bar Chart Data"
            >
              <FaDownload size={12} />
            </button>
            <select value={barMode} onChange={e => setBarMode(e.target.value as any)}
              className={`${theme.select} rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer appearance-none`}>
              <option value="weekly">Leads This Week</option>
              <option value="source">Lead Source Distribution</option>
              <option value="cp">Channel Partner Leads</option>
            </select>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          {barMode === "weekly" ? (
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2a2a2a" : "#E5E7EB"} />
              <XAxis dataKey="day" tick={{ fill: theme.legendColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: theme.legendColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <RechartsTooltip content={<BarTip />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="leads" radius={[6, 6, 0, 0]}>
                {weeklyData.map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          ) : barMode === "cp" ? (
            <BarChart data={cpData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2a2a2a" : "#E5E7EB"} />
              <XAxis dataKey="cp" tick={{ fill: theme.legendColor, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: theme.legendColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <RechartsTooltip content={<BarTip />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {cpData.map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={sourceData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2a2a2a" : "#E5E7EB"} horizontal={false} />
              <XAxis type="number" tick={{ fill: theme.legendColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="source" width={100} tick={{ fill: theme.legendColor, fontSize: 10 }} axisLine={false} tickLine={false} />
              <RechartsTooltip content={<BarTip />} cursor={{ fill: "transparent" }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {sourceData.map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* PIE CHART */}
      <div className={`${theme.card} rounded-2xl p-5`} style={theme.cardGlass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${theme.text} font-bold text-sm flex items-center gap-2`}>
            <FaChartPie className="text-[#00AEEF] text-xs" />
            {pieMode === "interest" ? "Lead Interest Breakdown" :
              pieMode === "loan" ? "Loan Status Breakdown" :
                pieMode === "usetype" ? "Self-Use vs Investment" :
                  pieMode === "loanrequired" ? "Loan Required?" :
                    "Visit Scheduled vs Pending"}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCSV(pieData, `${pieMode}_chart_data.csv`)}
              className={`p-2 border rounded-lg transition-colors hover:opacity-80 ${isDark ? 'bg-[#222] border-[#333] text-white' : 'bg-white border-indigo-200 text-indigo-600'}`}
              title="Export Pie Chart Data"
            >
              <FaDownload size={12} />
            </button>
            <select value={pieMode} onChange={e => setPieMode(e.target.value as any)}
              className={`${theme.select} rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer appearance-none`}>
              <option value="interest">Lead Interest</option>
              <option value="loan">Loan Status</option>
              <option value="usetype">Self-Use vs Investment</option>
              <option value="loanrequired">Loan Required?</option>
              <option value="visits">Visit Scheduled vs Pending</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="55%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((entry: any, i: number) => <Cell key={i} fill={pieColors[entry.name] ?? "#6b7280"} />)}
              </Pie>
              <RechartsTooltip content={<PieTip />} contentStyle={{ boxShadow: theme.tooltipShadow }} cursor={{ fill: "transparent" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 flex-1">
            {pieData.map((entry: any) => {
              const color = pieColors[entry.name] ?? "#6b7280";
              const pct = totalLeads > 0 ? Math.round((entry.value / totalLeads) * 100) : 0;
              return (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className={`text-[11px] font-medium ${theme.textFaint}`}>{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-bold ${theme.text}`}>{entry.value}</span>
                    <span className={`text-[10px] ${theme.textMuted}`}>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD OVERVIEW
// ============================================================================
function DashboardOverview({ managers, siteHeads, allLeads, isLoading, user, theme, isDark, receptionists, followUps, onNavigateToSales }: any) {
  const [visibleCount, setVisibleCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadLessRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 20, allLeads.length));
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [allLeads.length]);

  useEffect(() => {
    setVisibleCount(20);
  }, [allLeads.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount > 20) {
          setVisibleCount(20);
        }
      },
      { threshold: 1.0 }
    );
    if (loadLessRef.current) observer.observe(loadLessRef.current);
    return () => observer.disconnect();
  }, [visibleCount, allLeads.length]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedManagerName, setSelectedManagerName] = useState("");

  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  useEffect(() => {
    if (!hasAutoSelected && managers?.length > 0 && !isLoading) {
      setSelectedManagerName(managers[0].name);
      setHasAutoSelected(true);
      setPerfMode("manager");
    }
  }, [managers, isLoading, hasAutoSelected]);
  const [perfMode, setPerfMode] = useState<"overall" | "manager" | "receptionist" | "site_head">("overall");
  const [selectedSiteHeadName, setSelectedSiteHeadName] = useState("");
  const [hasAutoSelectedSiteHead, setHasAutoSelectedSiteHead] = useState(false);

  useEffect(() => {
    if (!hasAutoSelectedSiteHead && siteHeads?.length > 0 && !isLoading) {
      setSelectedSiteHeadName(siteHeads[0].name);
      setHasAutoSelectedSiteHead(true);
    }
  }, [siteHeads, isLoading, hasAutoSelectedSiteHead]);

  const [selectedReceptionistName, setSelectedReceptionistName] = useState("");
  const [hasAutoSelectedRecep, setHasAutoSelectedRecep] = useState(false);

  // ── Search states — one per table, completely isolated ────────────────────
  const [overviewSearch, setOverviewSearch] = useState("");
  const [managerLeadSearch, setManagerLeadSearch] = useState("");
  const [siteHeadLeadSearch, setSiteHeadLeadSearch] = useState("");
  const [recepLeadSearch, setRecepLeadSearch] = useState("");

  // ── Reset search when switching perfMode ──────────────────────────────────
  useEffect(() => {
    setOverviewSearch("");
    setManagerLeadSearch("");
    setSiteHeadLeadSearch("");
    setRecepLeadSearch("");
  }, [perfMode]);

  // ── Manager stats ──────────────────────────────────────────────────────────
  const managerStats = managers.map((m: any) => {
    const mLeads = allLeads.filter((l: any) => l.assigned_to === m.name);
    return {
      name: m.name,
      activeLeads: mLeads.length,
      siteVisits: mLeads.filter((l: any) => l.status === "Visit Scheduled" || !!l.mongoVisitDate).length,
    };
  }).sort((a: any, b: any) => b.activeLeads - a.activeLeads);

  useEffect(() => {
    if (!hasAutoSelectedRecep && receptionists?.length > 0 && !isLoading) {
      setSelectedReceptionistName(receptionists[0].name);
      setHasAutoSelectedRecep(true);
    }
  }, [receptionists, isLoading, hasAutoSelectedRecep]);

  const activeManagerLeads = allLeads.filter((l: any) => l.assigned_to === selectedManagerName);
  const visitCount = activeManagerLeads.filter((l: any) => l.status === "Visit Scheduled" || !!l.mongoVisitDate).length;

  // ── Receptionist data ──────────────────────────────────────────────────────
  const recepAssignedLeads = allLeads.filter((l: any) => l.assigned_to === selectedReceptionistName);
  const recepSelfLeads = allLeads.filter((l: any) => l.assigned_receptionist === selectedReceptionistName);
  const recepAllLeads = [...new Map([...recepAssignedLeads, ...recepSelfLeads].map(l => [l.id, l])).values()];
  const recepClosed = recepAllLeads.filter((l: any) => l.status === "Closing" || l.status === "Closed").length;

  const recepStats = (receptionists || []).map((r: any) => {
    const rLeads = allLeads.filter((l: any) => l.assigned_to === r.name || l.assigned_receptionist === r.name);
    const unique = [...new Map(rLeads.map((l: any) => [l.id, l])).values()];
    return { name: r.name, activeLeads: unique.length, siteVisits: unique.filter((l: any) => !!l.mongoVisitDate).length };
  }).sort((a: any, b: any) => b.activeLeads - a.activeLeads);

  // ── Site Head data ─────────────────────────────────────────────────────────
  const activeSiteHeadLeads = allLeads.filter((l: any) => l.assigned_to === selectedSiteHeadName);
  const siteHeadVisitCount = activeSiteHeadLeads.filter((l: any) => l.status === "Visit Scheduled" || !!l.mongoVisitDate).length;

  const pieData = managerStats.filter((m: any) => m.siteVisits > 0);
  const VISIT_COLORS = theme.visitPieColors;



  // ── Filter helper ──────────────────────────────────────────────────────────
  const filterLeads = (leads: any[], q: string) => {
    if (!q.trim()) return leads;
    const lq = q.toLowerCase();
    return leads.filter((l: any) =>
      String(l.id).includes(q) ||
      (l.name || "").toLowerCase().includes(lq) ||
      (l.phone || "").includes(q) ||
      (l.source || "").toLowerCase().includes(lq)
    );
  };

  return (
    <div className={`h-full flex flex-col p-8 overflow-y-auto ${theme.scroll}`}>

      {/* ── Welcome banner ── */}
      <div className={`${theme.card} rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`} style={theme.cardGlass}>
        <h2 className={`text-xl font-bold ${theme.text}`}>Welcome back, {user?.name || "Admin"}!</h2>
        <p className={`text-sm ${theme.textMuted}`}>Here is what's happening with your team today.</p>
      </div>

      {/* ── Top performers + site visits ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className={`lg:col-span-2 ${theme.card} rounded-2xl p-6 flex flex-col`} style={theme.cardGlass}>
          <h2 className={`text-lg font-bold mb-1 flex items-center gap-2 ${theme.text}`}>
            <FaChartPie className="text-[#9E217B]" /> Top Performers
          </h2>
          <p className={`text-xs mb-6 ${theme.textFaint}`}>Sales managers ranked by active leads.</p>
          <div className="flex-1 min-h-[280px]">
            {isLoading
              ? <div className={`h-full flex items-center justify-center text-sm ${theme.textMuted}`}>Loading...</div>
              : managerStats.length === 0
                ? <div className={`h-full flex items-center justify-center text-sm ${theme.textMuted}`}>No data</div>
                : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={managerStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2a2a2a" : "#E5E7EB"} vertical={false} />
                      <XAxis dataKey="name" stroke={theme.legendColor} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={theme.legendColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{ backgroundColor: theme.tooltipBg, border: theme.tooltipBorder, borderRadius: "8px", color: theme.tooltipColor, boxShadow: theme.tooltipShadow }}
                        itemStyle={{ color: theme.tooltipColor }}
                      />
                      <Bar dataKey="activeLeads" radius={[4, 4, 0, 0]} barSize={45}>
                        {managerStats.map((_: any, i: number) => <Cell key={i} fill={theme.chartColors[i % theme.chartColors.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
          </div>
        </div>

        <div className={`lg:col-span-1 ${theme.card} rounded-2xl p-6 flex flex-col`} style={theme.cardGlass}>
          <h2 className={`text-lg font-bold mb-1 flex items-center gap-2 ${theme.text}`}>
            <FaCalendarAlt className="text-orange-500" /> Site Visits
          </h2>
          <p className={`text-xs mb-4 ${theme.textFaint}`}>Upcoming visits by manager.</p>
          <div className="flex-1 min-h-[240px]">
            {isLoading
              ? <div className={`h-full flex items-center justify-center text-sm ${theme.textMuted}`}>Loading...</div>
              : pieData.length === 0
                ? <div className={`h-full flex flex-col items-center justify-center text-sm ${theme.textMuted}`}><FaCalendarAlt className="text-3xl mb-3 opacity-20" />No visits scheduled</div>
                : (
                  <div className="flex flex-col h-full">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} dataKey="siteVisits" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                          {pieData.map((_: any, i: number) => <Cell key={i} fill={VISIT_COLORS[i % VISIT_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip cursor={{ fill: "transparent" }} contentStyle={{ backgroundColor: theme.tooltipBg, border: theme.tooltipBorder, borderRadius: "8px", color: theme.tooltipColor }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-1.5 mt-2 overflow-y-auto max-h-[100px]">
                      {pieData.map((entry: any, i: number) => (
                        <div key={entry.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: VISIT_COLORS[i % VISIT_COLORS.length] }} />
                            <span className={`truncate max-w-[100px] ${theme.textMuted}`}>{entry.name}</span>
                          </div>
                          <span className={`font-bold ${theme.text}`}>{entry.siteVisits}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
          </div>
        </div>
      </div>

      {/* ── Team Performance Card ── */}
      <div className={`${theme.card} rounded-2xl p-6 mb-8`} style={theme.cardGlass}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${theme.text}`}>
              <FaTable className="text-[#9E217B]" />
              {perfMode === "overall" ? "Team Performance" : "Individual Performance Table"}
            </h2>
            <p className={`text-sm mt-1 ${theme.textMuted}`}>
              {perfMode === "overall"
                ? "Viewing analytics and data for all logged in enquiries."
                : perfMode === "manager"
                  ? "Select a sales manager to view their real-time data."
                  : perfMode === "site_head"
                    ? "Select a site head to view their real-time data."
                    : "Select a receptionist to view their real-time data."}
            </p>
          </div>
          <div className="w-full sm:w-72 relative">
            <select
              value={perfMode}
              onChange={(e) => setPerfMode(e.target.value as any)}
              className={`w-full text-sm font-bold rounded-xl px-4 py-3 outline-none cursor-pointer appearance-none border-2 transition-colors ${isDark ? "bg-[#14141B] border-[#9E217B]/40 text-[#d946a8]" : "bg-white border-[#9E217B]/40 text-[#9E217B]"}`}
            >
              <option value="overall">Overall Team Performance</option>
              <option value="manager">Sales Managers</option>
              <option value="site_head">Site Heads</option>
              <option value="receptionist">Receptionists</option>
            </select>
          </div>
        </div>

        {/* Selector dropdowns */}
        {perfMode === "manager" && (
          <div className="w-full sm:w-72 relative mb-4">
            <FaChevronLeft className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs z-10 ${theme.textFaint}`} />
            <select value={selectedManagerName} onChange={e => { setSelectedManagerName(e.target.value); setManagerLeadSearch(""); }}
              className={`w-full text-sm font-bold rounded-xl pl-9 pr-4 py-3 outline-none cursor-pointer appearance-none ${theme.select}`}>
              <option value="" disabled>-- Select Sales Manager --</option>
              {managers.map((m: any) => <option key={m.id || m._id || m.name} value={m.name}>{m.name}</option>)}
            </select>
          </div>
        )}
        {perfMode === "receptionist" && (
          <div className="w-full sm:w-72 relative mb-4">
            <FaChevronLeft className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs z-10 ${theme.textFaint}`} />
            <select value={selectedReceptionistName} onChange={e => { setSelectedReceptionistName(e.target.value); setRecepLeadSearch(""); }}
              className={`w-full text-sm font-bold rounded-xl pl-9 pr-4 py-3 outline-none cursor-pointer appearance-none ${theme.select}`}>
              <option value="" disabled>-- Select Receptionist --</option>
              {(receptionists || []).map((r: any) => <option key={r.id || r._id || r.name} value={r.name}>{r.name}</option>)}
            </select>
          </div>
        )}
        {perfMode === "site_head" && (
          <div className="w-full sm:w-72 relative mb-4">
            <FaChevronLeft className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs z-10 ${theme.textFaint}`} />
            <select value={selectedSiteHeadName} onChange={e => { setSelectedSiteHeadName(e.target.value); setSiteHeadLeadSearch(""); }}
              className={`w-full text-sm font-bold rounded-xl pl-9 pr-4 py-3 outline-none cursor-pointer appearance-none ${theme.select}`}>
              <option value="" disabled>-- Select Site Head --</option>
              {(siteHeads || []).map((sh: any) => <option key={sh.id || sh._id || sh.name} value={sh.name}>{sh.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          OVERALL MODE
      ════════════════════════════════════════════════ */}
      {perfMode === "overall" ? (
        <div className="animate-fadeIn space-y-6">
          {allLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FaChartPie className="text-[#00AEEF]" />
                <h3 className={`font-bold text-sm uppercase tracking-wider ${theme.text}`}>Overall Lead Analytics</h3>
                <span className={`text-xs px-2 py-0.5 rounded border ${theme.settingsBg} ${theme.textMuted}`}>{allLeads.length} leads</span>
              </div>
              <DashboardAnalytics leads={allLeads} theme={theme} isDark={isDark} />
            </div>
          )}

          <div className={`${theme.tableWrap} rounded-2xl overflow-hidden`} style={theme.tableGlass}>
            {/* Table header with search */}
            <div className={`p-5 flex flex-wrap justify-between items-center gap-4 ${theme.tableHead}`}>
              <h3 className={`font-bold flex items-center gap-2 ${theme.text}`}>
                <FaTable className="text-[#00AEEF]" /> Enquiry Overview
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <TableSearchInput value={overviewSearch} onChange={setOverviewSearch} theme={theme} />
                <button
                  onClick={() => downloadCSV(allLeads.map(formatLeadForExport), "Overall_Enquiries.csv")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg transition-colors hover:opacity-80 ${isDark ? 'bg-[#222] border-[#333] text-white' : 'bg-white border-indigo-200 text-indigo-600'}`}
                >
                  <FaDownload size={12} /> Export CSV
                </button>
                <span className={`text-xs px-3 py-1 rounded-full ${theme.btnClosingBadge}`}>
                  Total: {filterLeads(allLeads, overviewSearch).length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div ref={loadLessRef} style={{ height: "1px", width: "100%" }} />
              <table className="w-full text-left text-sm">
                <thead className={`text-xs uppercase ${theme.tableHead} ${theme.textHeader}`}>
                  <tr>
                    {["LEAD NO.", "NAME", "PROP. TYPE", "BUDGET", "SOURCE", "CP NAME", "CP PHONE", "STATUS", "INTEREST", "SITE VISIT", "ASSIGNED TO", "DATE"].map(h => (
                      <th key={h} className="px-4 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.tableDivide}`}>
                  {isLoading ? (
                    <tr><td colSpan={12} className={`text-center py-8 ${theme.textMuted}`}>Syncing...</td></tr>
                  ) : filterLeads(allLeads, overviewSearch).length === 0 ? (
                    <tr><td colSpan={12} className={`text-center py-8 ${theme.textMuted}`}>No leads match your search.</td></tr>
                  ) : filterLeads(allLeads, overviewSearch).slice(0, visibleCount).map((lead: any) => {
                    let assignedRole = "Unassigned";
                    let assignedName = lead.assigned_receptionist || lead.assigned_to || "";
                    if (lead.assigned_receptionist) assignedRole = "Receptionist";
                    else if (siteHeads?.some((sh: any) => sh.name === lead.assigned_to)) assignedRole = "Site Head";
                    else if (lead.assigned_to) assignedRole = "Sales Manager";

                    return (
                      <tr key={lead.id} className={`transition-colors ${theme.tableRow}`}>
                        <td className={`px-6 py-4 font-bold ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>#{lead.id}</td>
                        <td className={`px-4 py-4 font-medium ${theme.text}`}>
                          {(lead.assigned_to || lead.assigned_receptionist) ? (
                            <span
                              className={`cursor-pointer hover:underline transition-colors ${isDark ? "hover:text-[#d946a8]" : "hover:text-[#9E217B]"}`}
                              title={`Open lead detail for ${lead.name}`}
                              onClick={() => onNavigateToSales && onNavigateToSales(lead)}
                            >
                              {lead.name}
                            </span>
                          ) : (
                            lead.name
                          )}
                        </td>
                        <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.propType || lead.configuration || "Pending"}</td>
                        <td className={`px-4 py-4 font-semibold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{lead.salesBudget || lead.budget || "N/A"}</td>
                        <td className={`px-4 py-4 text-xs ${theme.textMuted}`}>{lead.source || "—"}</td>
                        <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.cpName || lead.cp_name || "—"}</td>
                        <td className={`px-4 py-4 font-mono text-xs ${theme.textMuted}`}>{lead.cpPhone || lead.cp_phone || "—"}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border flex-shrink-0 whitespace-nowrap ${lead.status === "Closing" ? theme.statusClosing : lead.status === "Visit Scheduled" ? theme.statusVisit : theme.statusRouted
                            }`}>
                            {lead.status || "Routed"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {lead.leadInterestStatus && lead.leadInterestStatus !== "Pending"
                            ? <InterestBadge status={lead.leadInterestStatus} size="sm" isDark={isDark} />
                            : <span className={`text-xs italic ${theme.textFaint}`}>—</span>}
                        </td>
                        <td className="px-6 py-4">
                          {lead.mongoVisitDate
                            ? <span className="text-orange-500 font-medium">{formatDate(lead.mongoVisitDate).split(",")[0]}</span>
                            : <span className={`text-xs italic ${theme.textFaint}`}>Pending</span>}
                        </td>
                        <td className={`px-4 py-4 ${theme.textMuted}`}>
                          {assignedName ? (
                            <div className="flex flex-col gap-0.5">
                              <span className={`font-semibold ${theme.text}`}>{assignedName}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border inline-block w-fit ${isDark ? "bg-[#222] border-[#333]" : "bg-gray-50 border-gray-200"}`}>
                                {assignedRole}
                              </span>
                            </div>
                          ) : "—"}
                        </td>
                        <td className={`px-4 py-4 text-xs whitespace-nowrap ${theme.textFaint}`}>{formatDate(lead.created_at).split(",")[0]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {visibleCount < filterLeads(allLeads, overviewSearch).length && (
                <div ref={loadMoreRef} className={`flex items-center justify-center gap-3 py-6 ${theme.textMuted}`}>
                  <div className="w-4 h-4 rounded-full border-2 border-[#9E217B] border-t-transparent animate-spin" />
                  <span className="text-xs font-medium">Loading more… ({visibleCount} of {filterLeads(allLeads, overviewSearch).length})</span>
                </div>
              )}
              {visibleCount >= filterLeads(allLeads, overviewSearch).length && allLeads.length > 20 && (
                <div className={`text-center py-4 text-xs font-medium ${theme.textFaint}`}>
                  ✓ All {filterLeads(allLeads, overviewSearch).length} leads loaded
                </div>
              )}
            </div>
          </div>
        </div>

        /* ════════════════════════════════════════════════
            MANAGER MODE — no selection yet
        ════════════════════════════════════════════════ */
      ) : perfMode === "manager" && !selectedManagerName ? (
        <div className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl min-h-[300px] ${theme.textMuted} ${theme.tableBorder}`}>
          <FaTable className="text-4xl mb-4 opacity-20" />
          <p>Select a manager to view their table.</p>
        </div>

        /* ════════════════════════════════════════════════
            SITE HEAD MODE — no selection yet
        ════════════════════════════════════════════════ */
      ) : perfMode === "site_head" && !selectedSiteHeadName ? (
        <div className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl min-h-[300px] ${theme.textMuted} ${theme.tableBorder}`}>
          <FaTable className="text-4xl mb-4 opacity-20" />
          <p>Select a site head to view their table.</p>
        </div>

        /* ════════════════════════════════════════════════
            SITE HEAD MODE — selected
        ════════════════════════════════════════════════ */
      ) : perfMode === "site_head" ? (
        <div className="animate-fadeIn space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${theme.innerBlock} rounded-2xl p-5`} style={theme.settingsBgGl}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Total Assigned</p>
              <p className={`text-3xl font-black ${theme.text}`}>{activeSiteHeadLeads.length}</p>
            </div>
            <div className={`${theme.innerBlock} rounded-2xl p-5`} style={theme.settingsBgGl}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Site Visits</p>
              <p className="text-3xl font-black text-orange-500">{siteHeadVisitCount}</p>
            </div>
            <div className={`${theme.innerBlock} rounded-2xl p-5`} style={theme.settingsBgGl}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Loans Active</p>
              <p className={`text-3xl font-black ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>
                {activeSiteHeadLeads.filter((l: any) => l.loanPlanned === "Yes").length}
              </p>
            </div>
          </div>

          {/* Analytics */}
          {activeSiteHeadLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FaChartPie className="text-[#9E217B]" />
                <h3 className={`font-bold text-sm uppercase tracking-wider ${theme.text}`}>Lead Analytics — {selectedSiteHeadName}</h3>
                <span className={`text-xs px-2 py-0.5 rounded border ${theme.settingsBg} ${theme.textMuted}`}>{activeSiteHeadLeads.length} leads</span>
              </div>
              <DashboardAnalytics leads={activeSiteHeadLeads} theme={theme} isDark={isDark} />
            </div>
          )}

          {/* Table */}
          <div className={`${theme.tableWrap} rounded-2xl overflow-hidden`} style={theme.tableGlass}>
            <div className={`p-5 flex flex-wrap justify-between items-center gap-4 ${theme.tableHead}`}>
              <h3 className={`font-bold flex items-center gap-2 ${theme.text}`}>
                <FaUsers className="text-[#9E217B]" /> Leads Database ({selectedSiteHeadName})
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <TableSearchInput value={siteHeadLeadSearch} onChange={setSiteHeadLeadSearch} theme={theme} />
                <button
                  onClick={() => downloadCSV(activeSiteHeadLeads.map(formatLeadForExport), `${selectedSiteHeadName}_Leads.csv`)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg transition-colors hover:opacity-80 ${isDark ? 'bg-[#222] border-[#333] text-white' : 'bg-white border-indigo-200 text-indigo-600'}`}
                >
                  <FaDownload size={12} /> Export CSV
                </button>
                <span className={`text-xs px-3 py-1 rounded-full ${theme.btnClosingBadge}`}>
                  {filterLeads(activeSiteHeadLeads, siteHeadLeadSearch).length} leads
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div ref={loadLessRef} style={{ height: "1px", width: "100%" }} />
              <table className="w-full text-left text-sm">
                <thead className={`text-xs uppercase ${theme.tableHead} ${theme.textHeader}`}>
                  <tr>
                    {["LEAD NO.", "NAME", "PROP. TYPE", "BUDGET", "USE TYPE", "LOAN?", "LOAN STATUS", "AMT REQ / APP", "CP NAME", "CP PHONE", "SITE VISIT"].map(h => (
                      <th key={h} className="px-4 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.tableDivide}`}>
                  {isLoading ? (
                    <tr><td colSpan={11} className={`text-center py-8 ${theme.textMuted}`}>Syncing...</td></tr>
                  ) : filterLeads(activeSiteHeadLeads, siteHeadLeadSearch).length === 0 ? (
                    <tr><td colSpan={11} className={`text-center py-8 ${theme.textMuted}`}>
                      {siteHeadLeadSearch ? "No leads match your search." : `No leads for ${selectedSiteHeadName}.`}
                    </td></tr>
                  ) : filterLeads(activeSiteHeadLeads, siteHeadLeadSearch).map((lead: any) => (
                    <tr key={lead.id} className={`transition-colors ${theme.tableRow}`}>
                      <td className={`px-6 py-4 font-bold ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>#{lead.id}</td>
                      <td className={`px-4 py-4 font-medium ${theme.text}`}>{lead.name}</td>
                      <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.propType || "Pending"}</td>
                      <td className={`px-4 py-4 font-semibold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{lead.salesBudget}</td>
                      <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.useType || "Pending"}</td>
                      <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.loanPlanned || "Pending"}</td>
                      <td className="px-4 py-4">
                        {lead.loanStatus && lead.loanStatus !== "N/A"
                          ? <LoanStatusBadge status={lead.loanStatus} isDark={isDark} />
                          : <span className={`text-xs italic ${theme.textFaint}`}>N/A</span>}
                      </td>
                      <td className="px-4 py-4">
                        {lead.loanAmtReq && lead.loanAmtReq !== "N/A"
                          ? <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] text-orange-500 font-medium">Req: {lead.loanAmtReq}</span>
                            <span className={`text-[11px] font-medium ${isDark ? "text-green-400" : "text-emerald-600"}`}>App: {lead.loanAmtApp !== "N/A" ? lead.loanAmtApp : "—"}</span>
                          </div>
                          : <span className={`text-xs italic ${theme.textFaint}`}>N/A</span>}
                      </td>
                      <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.cpName || lead.cp_name || "—"}</td>
                      <td className={`px-4 py-4 font-mono text-xs ${theme.textMuted}`}>{lead.cpPhone || lead.cp_phone || "—"}</td>
                      <td className="px-6 py-4">
                        {lead.mongoVisitDate
                          ? <span className="text-orange-500 font-medium">{formatDate(lead.mongoVisitDate).split(",")[0]}</span>
                          : <span className={`text-xs italic ${theme.textFaint}`}>Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {visibleCount < filterLeads(activeSiteHeadLeads, siteHeadLeadSearch).length && (
                <div ref={loadMoreRef} className={`flex items-center justify-center gap-3 py-6 ${theme.textMuted}`}>
                  <div className="w-4 h-4 rounded-full border-2 border-[#9E217B] border-t-transparent animate-spin" />
                  <span className="text-xs font-medium">Loading more… ({visibleCount} of {filterLeads(activeSiteHeadLeads, siteHeadLeadSearch).length})</span>
                </div>
              )}
              {visibleCount >= filterLeads(activeSiteHeadLeads, siteHeadLeadSearch).length && activeSiteHeadLeads.length > 20 && (
                <div className={`text-center py-4 text-xs font-medium ${theme.textFaint}`}>
                  ✓ All {filterLeads(activeSiteHeadLeads, siteHeadLeadSearch).length} leads loaded
                </div>
              )}
            </div>
          </div>
        </div>

        /* ════════════════════════════════════════════════
            RECEPTIONIST MODE — no selection yet
        ════════════════════════════════════════════════ */
      ) : perfMode === "receptionist" && !selectedReceptionistName ? (
        <div className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl min-h-[300px] ${theme.textMuted} ${theme.tableBorder}`}>
          <FaTable className="text-4xl mb-4 opacity-20" />
          <p>Select a receptionist to view their table.</p>
        </div>

        /* ════════════════════════════════════════════════
            RECEPTIONIST MODE — selected
        ════════════════════════════════════════════════ */
      ) : perfMode === "receptionist" ? (
        <div className="animate-fadeIn space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`${theme.innerBlock} rounded-2xl p-5`} style={theme.settingsBgGl}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Total Leads</p>
              <p className={`text-3xl font-black ${theme.text}`}>{recepAllLeads.length}</p>
            </div>
            <div className={`${theme.innerBlock} rounded-2xl p-5`} style={theme.settingsBgGl}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Assigned To</p>
              <p className="text-3xl font-black text-[#00AEEF]">{recepAssignedLeads.length}</p>
            </div>
            <div className={`${theme.innerBlock} rounded-2xl p-5`} style={theme.settingsBgGl}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Self-Managed</p>
              <p className="text-3xl font-black text-orange-500">{recepSelfLeads.length}</p>
            </div>
            <div className={`${theme.innerBlock} rounded-2xl p-5`} style={theme.settingsBgGl}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Closed</p>
              <p className={`text-3xl font-black ${isDark ? "text-yellow-400" : "text-amber-500"}`}>{recepClosed}</p>
            </div>
          </div>

          {/* Analytics */}
          {recepAllLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FaChartPie className="text-[#00AEEF]" />
                <h3 className={`font-bold text-sm uppercase tracking-wider ${theme.text}`}>Lead Analytics — {selectedReceptionistName}</h3>
                <span className={`text-xs px-2 py-0.5 rounded border ${theme.settingsBg} ${theme.textMuted}`}>{recepAllLeads.length} leads</span>
              </div>
              <DashboardAnalytics leads={recepAllLeads} theme={theme} isDark={isDark} />
            </div>
          )}

          {/* Table */}
          <div className={`${theme.tableWrap} rounded-2xl overflow-hidden`} style={theme.tableGlass}>
            <div className={`p-5 flex flex-wrap justify-between items-center gap-4 ${theme.tableHead}`}>
              <h3 className={`font-bold flex items-center gap-2 ${theme.text}`}>
                <FaClipboardList className="text-[#00AEEF]" /> All Leads — {selectedReceptionistName}
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                {/* ← correct search state: recepLeadSearch */}
                <TableSearchInput value={recepLeadSearch} onChange={setRecepLeadSearch} theme={theme} />
                <button
                  onClick={() => downloadCSV(recepAllLeads.map(formatLeadForExport), `${selectedReceptionistName}_Leads.csv`)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg transition-colors hover:opacity-80 ${isDark ? 'bg-[#222] border-[#333] text-white' : 'bg-white border-indigo-200 text-indigo-600'}`}
                >
                  <FaDownload size={12} /> Export CSV
                </button>
                <span className={`text-xs px-2 py-0.5 rounded border ${theme.settingsBg} ${theme.textMuted}`}>
                  {recepAssignedLeads.length} assigned · {recepSelfLeads.length} self-managed
                </span>
                <span className={`text-xs px-3 py-1 rounded-full ${theme.btnClosingBadge}`}>Live Sync Active</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div ref={loadLessRef} style={{ height: "1px", width: "100%" }} />
              <table className="w-full text-left text-sm">
                <thead className={`text-xs uppercase ${theme.tableHead} ${theme.textHeader}`}>
                  <tr>
                    {["LEAD NO.", "NAME", "PROP. TYPE", "BUDGET", "USE TYPE", "LOAN?", "LOAN STATUS", "CP NAME", "CP PHONE", "SITE VISIT", "ASSIGNED TO"].map(h => (
                      <th key={h} className="px-4 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.tableDivide}`}>
                  {isLoading ? (
                    <tr><td colSpan={11} className={`text-center py-8 ${theme.textMuted}`}>Syncing...</td></tr>
                  ) : filterLeads(recepAllLeads, recepLeadSearch).length === 0 ? (
                    <tr><td colSpan={11} className={`text-center py-8 ${theme.textMuted}`}>
                      {recepLeadSearch ? "No leads match your search." : `No leads for ${selectedReceptionistName}.`}
                    </td></tr>
                  ) : filterLeads(recepAllLeads, recepLeadSearch).map((lead: any) => {
                    /* ← correct source array: recepAllLeads, not activeManagerLeads */
                    const isAssigned = lead.assigned_to === selectedReceptionistName;
                    return (
                      <tr key={lead.id} className={`transition-colors ${theme.tableRow}`}>
                        <td className={`px-6 py-4 font-bold ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>#{lead.id}</td>
                        <td className={`px-4 py-4 font-medium ${theme.text}`}>{lead.name}</td>
                        <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.propType || "Pending"}</td>
                        <td className={`px-4 py-4 font-semibold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{lead.salesBudget}</td>
                        <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.useType || "Pending"}</td>
                        <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.loanPlanned || "Pending"}</td>
                        <td className="px-4 py-4">
                          {lead.loanStatus && lead.loanStatus !== "N/A"
                            ? <LoanStatusBadge status={lead.loanStatus} isDark={isDark} />
                            : <span className={`text-xs italic ${theme.textFaint}`}>N/A</span>}
                        </td>
                        <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.cpName || "—"}</td>
                        <td className={`px-4 py-4 font-mono text-xs ${theme.textMuted}`}>{lead.cpPhone || "—"}</td>
                        <td className="px-6 py-4">
                          {lead.mongoVisitDate
                            ? <span className="text-orange-500 font-medium">{new Date(lead.mongoVisitDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                            : <span className={`text-xs italic ${theme.textFaint}`}>Pending</span>}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isAssigned
                            ? isDark ? "text-[#00AEEF] border-[#00AEEF]/30 bg-[#00AEEF]/10" : "text-[#00AEEF] border-[#00AEEF]/30 bg-blue-50"
                            : isDark ? "text-purple-400 border-purple-500/30 bg-purple-500/10" : "text-purple-700 border-purple-200 bg-purple-50"
                            }`}>
                            {isAssigned ? "Receptionist" : "Self-Managed"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {visibleCount < filterLeads(recepAllLeads, recepLeadSearch).length && (
                <div ref={loadMoreRef} className={`flex items-center justify-center gap-3 py-6 ${theme.textMuted}`}>
                  <div className="w-4 h-4 rounded-full border-2 border-[#9E217B] border-t-transparent animate-spin" />
                  <span className="text-xs font-medium">Loading more… ({visibleCount} of {filterLeads(recepAllLeads, recepLeadSearch).length})</span>
                </div>
              )}
              {visibleCount >= filterLeads(recepAllLeads, recepLeadSearch).length && recepAllLeads.length > 20 && (
                <div className={`text-center py-4 text-xs font-medium ${theme.textFaint}`}>
                  ✓ All {filterLeads(recepAllLeads, recepLeadSearch).length} leads loaded
                </div>
              )}
            </div>
          </div>
        </div>

        /* ════════════════════════════════════════════════
            MANAGER MODE — selected
        ════════════════════════════════════════════════ */
      ) : (
        <div className="animate-fadeIn space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${theme.innerBlock} rounded-2xl p-5`} style={theme.settingsBgGl}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Total Assigned</p>
              <p className={`text-3xl font-black ${theme.text}`}>{activeManagerLeads.length}</p>
            </div>
            <div className={`${theme.innerBlock} rounded-2xl p-5`} style={theme.settingsBgGl}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Site Visits</p>
              <p className="text-3xl font-black text-orange-500">{visitCount}</p>
            </div>
            <div className={`${theme.innerBlock} rounded-2xl p-5`} style={theme.settingsBgGl}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Loans Active</p>
              <p className={`text-3xl font-black ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>
                {activeManagerLeads.filter((l: any) => l.loanPlanned === "Yes").length}
              </p>
            </div>
          </div>

          {/* Analytics */}
          {activeManagerLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FaChartPie className="text-[#9E217B]" />
                <h3 className={`font-bold text-sm uppercase tracking-wider ${theme.text}`}>Lead Analytics — {selectedManagerName}</h3>
                <span className={`text-xs px-2 py-0.5 rounded border ${theme.settingsBg} ${theme.textMuted}`}>{activeManagerLeads.length} leads</span>
              </div>
              <DashboardAnalytics leads={activeManagerLeads} theme={theme} isDark={isDark} />
            </div>
          )}

          {/* Table */}
          <div className={`${theme.tableWrap} rounded-2xl overflow-hidden`} style={theme.tableGlass}>
            <div className={`p-5 flex flex-wrap justify-between items-center gap-4 ${theme.tableHead}`}>
              <h3 className={`font-bold flex items-center gap-2 ${theme.text}`}>
                <FaUsers className="text-[#9E217B]" /> Leads Database ({selectedManagerName})
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                {/* ← correct search state: managerLeadSearch */}
                <TableSearchInput value={managerLeadSearch} onChange={setManagerLeadSearch} theme={theme} />
                <button
                  onClick={() => downloadCSV(activeManagerLeads.map(formatLeadForExport), `${selectedManagerName}_Leads.csv`)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg transition-colors hover:opacity-80 ${isDark ? 'bg-[#222] border-[#333] text-white' : 'bg-white border-indigo-200 text-indigo-600'}`}
                >
                  <FaDownload size={12} /> Export CSV
                </button>
                <span className={`text-xs px-3 py-1 rounded-full ${theme.btnClosingBadge}`}>
                  {filterLeads(activeManagerLeads, managerLeadSearch).length} leads
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div ref={loadLessRef} style={{ height: "1px", width: "100%" }} />
              <table className="w-full text-left text-sm">
                <thead className={`text-xs uppercase ${theme.tableHead} ${theme.textHeader}`}>
                  <tr>
                    {["LEAD NO.", "NAME", "PROP. TYPE", "BUDGET", "USE TYPE", "LOAN?", "LOAN STATUS", "AMT REQ / APP", "CP NAME", "CP PHONE", "SITE VISIT"].map(h => (
                      <th key={h} className="px-4 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.tableDivide}`}>
                  {isLoading ? (
                    <tr><td colSpan={11} className={`text-center py-8 ${theme.textMuted}`}>Syncing...</td></tr>
                  ) : filterLeads(activeManagerLeads, managerLeadSearch).length === 0 ? (
                    <tr><td colSpan={11} className={`text-center py-8 ${theme.textMuted}`}>
                      {managerLeadSearch ? "No leads match your search." : `No leads for ${selectedManagerName}.`}
                    </td></tr>
                  ) : filterLeads(activeManagerLeads, managerLeadSearch).map((lead: any) => (
                    <tr key={lead.id} className={`transition-colors ${theme.tableRow}`}>
                      <td className={`px-6 py-4 font-bold ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>#{lead.id}</td>
                      <td className={`px-4 py-4 font-medium ${theme.text}`}>{lead.name}</td>
                      <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.propType || "Pending"}</td>
                      <td className={`px-4 py-4 font-semibold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{lead.salesBudget}</td>
                      <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.useType || "Pending"}</td>
                      <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.loanPlanned || "Pending"}</td>
                      <td className="px-4 py-4">
                        {lead.loanStatus && lead.loanStatus !== "N/A"
                          ? <LoanStatusBadge status={lead.loanStatus} isDark={isDark} />
                          : <span className={`text-xs italic ${theme.textFaint}`}>N/A</span>}
                      </td>
                      <td className="px-4 py-4">
                        {lead.loanAmtReq && lead.loanAmtReq !== "N/A"
                          ? <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] text-orange-500 font-medium">Req: {lead.loanAmtReq}</span>
                            <span className={`text-[11px] font-medium ${isDark ? "text-green-400" : "text-emerald-600"}`}>App: {lead.loanAmtApp !== "N/A" ? lead.loanAmtApp : "—"}</span>
                          </div>
                          : <span className={`text-xs italic ${theme.textFaint}`}>N/A</span>}
                      </td>
                      <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.cpName || lead.cp_name || "—"}</td>
                      <td className={`px-4 py-4 font-mono text-xs ${theme.textMuted}`}>{lead.cpPhone || lead.cp_phone || "—"}</td>
                      <td className="px-6 py-4">
                        {lead.mongoVisitDate
                          ? <span className="text-orange-500 font-medium">{formatDate(lead.mongoVisitDate).split(",")[0]}</span>
                          : <span className={`text-xs italic ${theme.textFaint}`}>Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {visibleCount < filterLeads(activeManagerLeads, managerLeadSearch).length && (
                <div ref={loadMoreRef} className={`flex items-center justify-center gap-3 py-6 ${theme.textMuted}`}>
                  <div className="w-4 h-4 rounded-full border-2 border-[#9E217B] border-t-transparent animate-spin" />
                  <span className="text-xs font-medium">Loading more… ({visibleCount} of {filterLeads(activeManagerLeads, managerLeadSearch).length})</span>
                </div>
              )}
              {visibleCount >= filterLeads(activeManagerLeads, managerLeadSearch).length && activeManagerLeads.length > 20 && (
                <div className={`text-center py-4 text-xs font-medium ${theme.textFaint}`}>
                  ✓ All {filterLeads(activeManagerLeads, managerLeadSearch).length} leads loaded
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TableSearchInput({
  value,
  onChange,
  theme,
}: {
  value: string;
  onChange: (v: string) => void;
  theme: any;
}) {
  return (
    <div className="relative">
      <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${theme.textFaint}`} />
      <input
        type="text"
        placeholder="Search by name, ID or phone..."
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`pl-9 pr-4 py-1.5 text-sm rounded-lg outline-none border w-56 ${theme.inputInner} ${theme.text} ${theme.inputFocus}`}
      />
    </div>
  );
}

// ============================================================================
// ADMIN SALES VIEW
// ============================================================================
function AdminSalesView({ managers, allLeads, followUps, isLoading, adminUser, refetch, theme, isDark }: any) {
  const [selectedManager, setSelectedManager] = useState<any>(null);

  const [searchManager, setSearchManager] = useState("");
  const [subView, setSubView] = useState<"cards" | "detail">("cards");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  // ── Auto-drill into a lead when navigated from Enquiry Overview ──
  useEffect(() => {
    const raw = localStorage.getItem("crm_drill_lead");
    if (!raw) return;
    try {
      const drillLead = JSON.parse(raw);
      localStorage.removeItem("crm_drill_lead");

      // Find and select the manager
      const manager = managers.find((m: any) => m.name === drillLead.assigned_to);
      if (manager) {
        setSelectedManager(manager);
        setSelectedLead(drillLead);
        setSubView("detail");
      }
    } catch { }
  }, [managers]);
  const [detailTab, setDetailTab] = useState<"personal" | "loan">("personal");
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [salesForm, setSalesForm] = useState({ propertyType: "", location: "", budget: "", useType: "", purchaseDate: "", loanPlanned: "", siteVisit: "", leadStatus: "" });
  const [loanForm, setLoanForm] = useState({ loanRequired: "", status: "", bank: "", amountReq: "", amountApp: "", cibil: "", agent: "", agentContact: "", empType: "", income: "", emi: "", docPan: "Pending", docAadhaar: "Pending", docSalary: "Pending", docBank: "Pending", docProperty: "Pending", notes: "" });
  const [customNote, setCustomNote] = useState("");
  const followUpEndRef = useRef<HTMLDivElement>(null);
  const [toastMsg, setToastMsg] = useState<{ title: string; icon: any; color: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedLead) {
      const u = allLeads.find((l: any) => String(l.id) === String(selectedLead.id));
      if (u) setSelectedLead(u);
    }
  }, [allLeads]);

  useEffect(() => {
    if (subView === "detail") followUpEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [followUps, subView, selectedLead, detailTab]);

  const filteredManagers = managers.filter((m: any) => m.name?.toLowerCase().includes(searchManager.toLowerCase()));
  const activeManagerLeads = selectedManager ? allLeads.filter((l: any) => l.assigned_to === selectedManager.name) : [];
  const currentLeadFollowUps = followUps.filter((f: any) => String(f.leadId) === String(selectedLead?.id));

  const getLatestLoanDetails = () => {
    if (!selectedLead) return null;
    let ex: Record<string, any> = {
      loanRequired: selectedLead.loanPlanned || "N/A",
      status: "Pending", bankName: "N/A", amountReq: "N/A", amountApp: "N/A",
      cibil: "N/A", agent: "N/A", agentContact: "N/A", empType: "N/A",
      income: "N/A", emi: "N/A", docPan: "Pending", docAadhaar: "Pending",
      docSalary: "Pending", docBank: "Pending", docProperty: "Pending", notes: "N/A"
    };
    const lu = currentLeadFollowUps.filter((f: any) => f.message?.includes("🏦 Loan Update:"));
    if (lu.length > 0) {
      const msg = lu[lu.length - 1].message;
      const g = (l: string) => { const m = msg.match(new RegExp(`• ${l}: (.*)`)); return m ? m[1].trim() : "N/A"; };
      ex = {
        loanRequired: g("Loan Required"), status: g("Status"),
        bankName: g("Bank Name"), amountReq: g("Amount Requested"),
        amountApp: g("Amount Approved"), cibil: g("CIBIL Score"),
        agent: g("Agent Name"), agentContact: g("Agent Contact"),
        empType: g("Employment Type"), income: g("Monthly Income"),
        emi: g("Existing EMIs"), docPan: g("PAN Card"),
        docAadhaar: g("Aadhaar Card"), docSalary: g("Salary Slips"),
        docBank: g("Bank Statements"), docProperty: g("Property Docs"),
        notes: g("Notes"),
      };
    }
    return ex;
  };

  const getLoanStatusColor = (s: string) => {
    const sl = (s || "").toLowerCase();
    if (sl === "approved") return isDark ? "bg-green-900/20 text-green-400 border-green-500/30" : "bg-green-50 text-green-700 border-green-300";
    if (sl === "rejected") return isDark ? "bg-red-900/20 text-red-400 border-red-500/30" : "bg-red-50 text-red-700 border-red-300";
    if (sl === "in progress") return isDark ? "bg-yellow-900/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-50 text-yellow-700 border-yellow-300";
    return isDark ? "bg-gray-900/20 text-gray-400 border-gray-500/30" : "bg-gray-50 text-gray-700 border-gray-300";
  };

  const prefillSalesForm = () => {
    if (!selectedLead) return;
    const sf = currentLeadFollowUps.filter((f: any) => f.message?.includes("Detailed Salesform Submitted"));
    if (sf.length === 0) return;
    const msg = sf[sf.length - 1].message;
    const g = (label: string) => { const m = msg.match(new RegExp(`• ${label}: (.*)`)); return m && m[1].trim() !== "N/A" ? m[1].trim() : ""; };
    setSalesForm({ propertyType: g("Property Type"), location: g("Location"), budget: g("Budget"), useType: g("Use Type"), purchaseDate: g("Planning to Purchase"), loanPlanned: g("Loan Planned"), leadStatus: g("Lead Status"), siteVisit: "" });
  };

  const prefillLoanForm = () => {
    const cur = getLatestLoanDetails();
    if (!cur) return;
    setLoanForm({
      loanRequired: cur.loanRequired !== "N/A" ? cur.loanRequired : "",
      status: cur.status !== "Pending" ? cur.status : "",
      bank: cur.bankName !== "N/A" ? cur.bankName : "",
      amountReq: cur.amountReq !== "N/A" ? cur.amountReq : "",
      amountApp: cur.amountApp !== "N/A" ? cur.amountApp : "",
      cibil: cur.cibil !== "N/A" ? cur.cibil : "",
      agent: cur.agent !== "N/A" ? cur.agent : "",
      agentContact: cur.agentContact !== "N/A" ? cur.agentContact : "",
      empType: cur.empType !== "N/A" ? cur.empType : "",
      income: cur.income !== "N/A" ? cur.income : "",
      emi: cur.emi !== "N/A" ? cur.emi : "",
      docPan: cur.docPan !== "N/A" ? cur.docPan : "Pending",
      docAadhaar: cur.docAadhaar !== "N/A" ? cur.docAadhaar : "Pending",
      docSalary: cur.docSalary !== "N/A" ? cur.docSalary : "Pending",
      docBank: cur.docBank !== "N/A" ? cur.docBank : "Pending",
      docProperty: cur.docProperty !== "N/A" ? cur.docProperty : "Pending",
      notes: cur.notes !== "N/A" ? cur.notes : "",
    });
  };

  const handleSendCustomNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customNote.trim() || !selectedLead) return;
    const nm = { leadId: String(selectedLead.id), salesManagerName: adminUser.name, createdBy: "admin", message: customNote, siteVisitDate: null, createdAt: new Date().toISOString() };
    setCustomNote("");
    try { await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nm) }); refetch(); } catch { }
  };

  const handleSalesFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const msg = `📝 Detailed Salesform Submitted:\n• Property Type: ${salesForm.propertyType || "N/A"}\n• Location: ${salesForm.location || "N/A"}\n• Budget: ${salesForm.budget || "N/A"}\n• Use Type: ${salesForm.useType || "N/A"}\n• Planning to Purchase: ${salesForm.purchaseDate || "N/A"}\n• Loan Planned: ${salesForm.loanPlanned || "N/A"}\n• Lead Status: ${salesForm.leadStatus || "N/A"}\n• Site Visit Requested: ${salesForm.siteVisit ? formatDate(salesForm.siteVisit) : "No"}`;
    const nm = { leadId: String(selectedLead.id), salesManagerName: adminUser.name, createdBy: "admin", message: msg, siteVisitDate: salesForm.siteVisit || null, createdAt: new Date().toISOString() };
    const ns = salesForm.siteVisit ? "Visit Scheduled" : selectedLead.status;
    setShowSalesForm(false);
    setSalesForm({ propertyType: "", location: "", budget: "", useType: "", purchaseDate: "", loanPlanned: "", siteVisit: "", leadStatus: "" });
    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nm) });
      await fetch(`/api/walkin_enquiries/${selectedLead.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: selectedLead.name, status: ns }) });
      refetch();
    } catch { }
  };

  const handleLoanFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const msg = `🏦 Loan Update:\n• Loan Required: ${loanForm.loanRequired || "N/A"}\n• Status: ${loanForm.status || "N/A"}\n• Bank Name: ${loanForm.bank || "N/A"}\n• Amount Requested: ${loanForm.amountReq || "N/A"}\n• Amount Approved: ${loanForm.amountApp || "N/A"}\n• CIBIL Score: ${loanForm.cibil || "N/A"}\n• Agent Name: ${loanForm.agent || "N/A"}\n• Agent Contact: ${loanForm.agentContact || "N/A"}\n• Employment Type: ${loanForm.empType || "N/A"}\n• Monthly Income: ${loanForm.income || "N/A"}\n• Existing EMIs: ${loanForm.emi || "N/A"}\n• PAN Card: ${loanForm.docPan || "Pending"}\n• Aadhaar Card: ${loanForm.docAadhaar || "Pending"}\n• Salary Slips: ${loanForm.docSalary || "Pending"}\n• Bank Statements: ${loanForm.docBank || "Pending"}\n• Property Docs: ${loanForm.docProperty || "Pending"}\n• Notes: ${loanForm.notes || "N/A"}`;
    const nm = { leadId: String(selectedLead.id), salesManagerName: adminUser.name, createdBy: "admin", message: msg, siteVisitDate: null, createdAt: new Date().toISOString() };
    const dbp = { leadId: String(selectedLead.id), salesManagerName: adminUser.name, ...loanForm };
    setShowLoanForm(false);
    setToastMsg({ title: `Loan Data Synced for ${selectedLead.name}`, icon: <FaCheckCircle />, color: "blue" });
    setTimeout(() => setToastMsg(null), 3000);
    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nm) });
      await fetch("/api/loan/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dbp) }).catch(() => { });
      refetch();
    } catch { }
  };

  return (
    <div className="flex h-full">
      {toastMsg && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 animate-fadeIn ${toastMsg.color === "green" ? "bg-green-600 border-green-400 text-white" : "bg-[#9E217B] border-[#b8268f] text-white"}`}>
          <div className="text-lg">{toastMsg.icon}</div>
          <span className="text-sm font-bold">{toastMsg.title}</span>
        </div>
      )}

      {/* Manager Sidebar */}
      <div className={`w-72 border-r flex flex-col h-full flex-shrink-0 z-20 shadow-xl ${theme.innerBlock}`}>
        <div className={`p-5 border-b ${theme.tableBorder}`}>
          <div className="relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${theme.textFaint}`} />
            <input type="text" placeholder="Search Managers..." value={searchManager} onChange={e => setSearchManager(e.target.value)}
              className={`w-full rounded-lg pl-9 pr-4 py-2 text-sm outline-none transition-colors ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} />
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto ${theme.scroll}`} dir="rtl">
          <div dir="ltr" className="min-h-full">
            {isLoading ? <div className={`p-8 text-center text-sm ${theme.textMuted}`}>Loading managers...</div>
              : filteredManagers.length === 0 ? <div className={`p-8 text-center text-sm ${theme.textMuted}`}>No managers found.</div>
                : filteredManagers.map((manager: any) => {
                  const isSelected = selectedManager?.id === manager.id || selectedManager?.name === manager.name;
                  const count = allLeads.filter((l: any) => l.assigned_to === manager.name).length;
                  return (
                    <div key={manager.id || manager._id || manager.name}
                      onClick={() => { setSelectedManager(manager); setSubView("cards"); setSelectedLead(null); }}
                      className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-b ${theme.tableBorder}
                    ${isSelected
                          ? isDark ? "border-r-4 border-r-[#9E217B] bg-[#9E217B]/10" : "border-r-4 border-r-[#9E217B] bg-pink-50"
                          : "hover:opacity-80 border-r-4 border-r-transparent"}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${isSelected ? "bg-[#9E217B]" : isDark ? "bg-[#333] text-gray-400" : "bg-gray-400"}`}>
                        {manager.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className={`font-bold truncate text-sm ${theme.text}`}>{manager.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isDark ? "text-[#d946a8] bg-[#9E217B]/10" : "text-[#9E217B] bg-pink-100"}`}>{count} leads</span>
                        </div>
                        <p className={`text-xs truncate capitalize ${theme.textFaint}`}>{manager.role?.replace("_", " ")}</p>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {!selectedManager ? (
          <div className={`h-full flex flex-col items-center justify-center ${theme.textMuted}`}>
            <FaIdCard className="text-4xl mb-4 opacity-20" />
            <p>Select a sales manager from the left sidebar.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Sub-header */}
            <div className={`p-5 border-b flex justify-between items-center shadow-sm z-10 flex-shrink-0 gap-4 ${theme.header}`} style={theme.headerGlass}>
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${theme.text}`}>
                  <FaUsers className={isDark ? "text-[#d946a8]" : "text-[#9E217B]"} /> {selectedManager.name}'s Leads
                </h2>
                <p className={`text-xs mt-1 ${theme.textFaint}`}>{activeManagerLeads.length} total leads · Live sync active</p>
              </div>
              {subView === "cards" && (
                <div className={`flex gap-2 text-xs ${theme.textFaint}`}>
                  <span className={`px-3 py-1 rounded-full border ${isDark ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-green-50 border-green-200 text-green-600"}`}>
                    {activeManagerLeads.filter((l: any) => l.leadInterestStatus === "Interested").length} Interested
                  </span>
                  <span className={`px-3 py-1 rounded-full border ${isDark ? "bg-[#9E217B]/10 border-[#9E217B]/30 text-[#d946a8]" : "bg-pink-50 border-pink-200 text-[#9E217B]"}`}>
                    {activeManagerLeads.filter((l: any) => l.loanPlanned === "Yes").length} Loans
                  </span>
                  <span className={`px-3 py-1 rounded-full border ${isDark ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-600"}`}>
                    {activeManagerLeads.filter((l: any) => l.mongoVisitDate).length} Visits
                  </span>
                </div>
              )}
            </div>

            {/* Cards view */}
            {subView === "cards" && (
              <div className={`flex-1 overflow-y-auto p-6 ${theme.scroll}`}>
                {activeManagerLeads.length === 0 ? (
                  <p className={`text-sm ${theme.textMuted}`}>No leads assigned yet.</p>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {activeManagerLeads.map((lead: any) => {
                      const interest = lead.leadInterestStatus && lead.leadInterestStatus !== "Pending" ? lead.leadInterestStatus : null;
                      const loanSt = lead.loanStatus && lead.loanStatus !== "N/A" ? lead.loanStatus : null;
                      return (
                        <div key={lead.id}
                          className={`rounded-2xl p-6 transition-all group flex flex-col justify-between cursor-pointer ${theme.card}`}
                          style={theme.cardGlass}
                          onClick={() => { setSelectedLead(lead); setSubView("detail"); }}
                        >
                          <div>
                            <div className={`flex justify-between items-center mb-5 pb-4 border-b border-[#9E217B]`}>
                              <h3 className={`text-xl font-bold transition-colors line-clamp-1 pr-2 group-hover:text-[#9E217B] ${theme.text}`}>
                                <span className={`mr-2 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>#{lead.id}</span>{lead.name}
                              </h3>
                              {interest
                                ? <InterestBadge status={interest} isDark={isDark} />

                                : <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex items-center justify-center leading-none flex-shrink-0 whitespace-nowrap ${theme.statusRouted}`}>{lead.status || "ROUTED"}</span>}
                            </div>
                            <div className="space-y-3 mb-5">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className={`text-xs font-medium ${theme.textMuted}`}>Budget</p>
                                  <p className={`text-sm font-semibold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{lead.salesBudget}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {loanSt ? <LoanStatusBadge status={loanSt} isDark={isDark} />
                                    : lead.loanPlanned === "Yes" && (

                                      <div className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase inline-flex items-center justify-center leading-none gap-1.5 border ${isDark ? "bg-[#9E217B]/10 border-[#9E217B]/30 text-[#d946a8]" : "bg-pink-50 border-pink-200 text-[#9E217B]"}`}>
                                        <FaUniversity className="mb-[1px]" /> Loan Active
                                      </div>
                                    )}
                                </div>
                              </div>
                              {lead.propType && lead.propType !== "Pending" && (
                                <div><p className={`text-xs font-medium ${theme.textMuted}`}>Property</p><p className={`text-sm font-medium ${theme.text}`}>{lead.propType}</p></div>
                              )}
                              <div className={`p-3 rounded-lg border flex flex-col gap-1.5 ${theme.innerBlock}`}>
                                <p className={`text-xs flex items-center gap-2 ${theme.textMuted}`}><FaPhoneAlt className="w-3 h-3" /> <span className={`font-mono ${theme.text}`}>{maskPhone(lead.phone, adminUser?.role, lead.assigned_to === adminUser?.name)}</span></p>
                              </div>
                              {(lead.mongoVisitDate || interest) && (
                                <div className="flex items-center justify-between gap-2">
                                  {lead.mongoVisitDate && <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-500"><FaCalendarAlt className="text-[10px]" />{formatDate(lead.mongoVisitDate).split(",")[0]}</div>}
                                  {interest && !lead.mongoVisitDate && <InterestBadge status={interest} size="sm" isDark={isDark} />}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`pt-4 border-t mt-auto border-[#9E217B]`}>
                            <div className="flex justify-between items-center gap-2">
                              <p className={`text-[10px] ${theme.textFaint}`}>{formatDate(lead.created_at).split(",")[0]}</p>
                              <span className={`text-[10px] font-bold group-hover:text-[#9E217B] transition-colors uppercase tracking-widest ${theme.textMuted}`}>Details →</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Detail view */}
            {subView === "detail" && selectedLead && (
              <div className={`flex-1 overflow-y-auto p-6 ${theme.scroll}`}>
                <div className="animate-fadeIn max-w-[1200px] mx-auto flex flex-col h-full">
                  {/* Detail header */}
                  <div className={`flex items-center justify-between mb-4 rounded-2xl border p-4 sm:p-5 shadow-xl flex-shrink-0 ${theme.card}`} style={theme.cardGlass}>
                    <div className="flex items-center gap-4">
                      <button onClick={() => { setSubView("cards"); setShowSalesForm(false); setShowLoanForm(false); }}
                        className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors cursor-pointer ${theme.innerBlock} ${theme.textMuted}`}>
                        <FaChevronLeft className="text-sm" />
                      </button>
                      <h1 className={`text-xl md:text-2xl font-bold flex items-center gap-3 ${theme.text}`}>
                        <span className={isDark ? "text-[#d946a8]" : "text-[#9E217B]"}>#{selectedLead.id}</span>
                        <span>{selectedLead.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${theme.settingsBg} ${theme.textFaint}`}>{selectedLead.assigned_to}</span>
                      </h1>
                    </div>
                    <div className="flex gap-3">
                      {!showSalesForm && !showLoanForm && (
                        <>
                          <button onClick={() => { prefillSalesForm(); setShowSalesForm(true); setShowLoanForm(false); }}
                            className={`${theme.btnPrimary} px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer`}>
                            <FaFileInvoice /> Fill Salesform
                          </button>
                          <button onClick={() => { prefillLoanForm(); setShowLoanForm(true); setShowSalesForm(false); }}
                            className={`${theme.btnSecondary} px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer`}>
                            <FaUniversity /> Track Loan
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-2" style={{ minHeight: "500px" }}>
                    {/* Left panel */}
                    <div className="w-full lg:w-[45%] flex flex-col gap-4 h-full pb-2">
                      {showSalesForm ? (
                        <div className={`rounded-xl border p-5 shadow-xl flex-1 overflow-y-auto flex flex-col ${theme.modalCard} ${theme.scroll}`} style={theme.modalGlass}>
                          <div className={`flex justify-between items-center mb-4 border-b pb-3 ${theme.tableBorder}`}>
                            <div>
                              <h3 className={`text-lg font-bold ${theme.text}`}>Sales Data Form</h3>
                              <p className={`text-xs mt-0.5 ${theme.accentText}`}>Admin override — Lead #{selectedLead.id}</p>
                            </div>
                            <button type="button" onClick={() => setShowSalesForm(false)} className={`p-1 ${theme.textMuted}`}><FaTimes /></button>
                          </div>
                          <form onSubmit={handleSalesFormSubmit} className="flex flex-col gap-4 flex-1">
                            {[
                              { label: "Property Type?", key: "propertyType", ph: "e.g. 1BHK, 2BHK" },
                              { label: "Preferred Location?", key: "location", ph: "e.g. Dombivali, Kalyan" },
                              { label: "Approximate Budget?", key: "budget", ph: "e.g. 5 cr" },
                            ].map(f => (
                              <div key={f.key}><label className={`text-xs mb-1 block ${theme.textMuted}`}>{f.label}</label>
                                <input type="text" placeholder={f.ph} value={(salesForm as any)[f.key]} onChange={e => setSalesForm({ ...salesForm, [f.key]: e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} />
                              </div>
                            ))}
                            <div className="grid grid-cols-2 gap-3">
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Self-use or Investment?</label>
                                <select value={salesForm.useType} onChange={e => setSalesForm({ ...salesForm, useType: e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none ${theme.select}`}>
                                  <option value="">Select</option><option>Self Use</option><option>Investment</option>
                                </select>
                              </div>
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Planning to Purchase?</label>
                                <select value={salesForm.purchaseDate} onChange={e => setSalesForm({ ...salesForm, purchaseDate: e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none ${theme.select}`}>
                                  <option value="">Select</option><option>Immediate</option><option>Next 3 Months</option>
                                </select>
                              </div>
                            </div>
                            <div className={`border-t pt-3 mt-1 ${theme.tableBorder}`}>
                              <label className={`block text-xs font-bold mb-1.5 ${theme.accentText}`}>Lead Interest Status *</label>
                              <select required value={salesForm.leadStatus} onChange={e => setSalesForm({ ...salesForm, leadStatus: e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none cursor-pointer ${theme.select}`}>
                                <option value="" disabled>Select Status</option>
                                <option>Interested</option><option>Not Interested</option><option>Maybe</option>
                              </select>
                            </div>
                            <div className={`border-t pt-3 mt-1 ${theme.tableBorder}`}>
                              <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>Loan Planned?</label>
                              <select required value={salesForm.loanPlanned} onChange={e => setSalesForm({ ...salesForm, loanPlanned: e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none cursor-pointer ${theme.select}`}>
                                <option value="" disabled>Select Option</option><option>Yes</option><option>No</option><option>Not Sure</option>
                              </select>
                            </div>
                            <div className={`mt-2 border-t pt-3 ${theme.tableBorder}`}>
                              <label className="text-xs text-orange-500 font-bold mb-1.5 block">Schedule a Site Visit?</label>
                              <input ref={inputRef} type="datetime-local" value={salesForm.siteVisit} onChange={e => setSalesForm({ ...salesForm, siteVisit: e.target.value })} onClick={() => inputRef.current?.showPicker()} className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none ${theme.inputInner} ${theme.text} focus:border-orange-500`} />
                            </div>
                            <button type="submit" className={`mt-auto w-full font-bold py-3.5 rounded-xl transition-colors flex-shrink-0 ${theme.btnPrimary}`}>Submit Salesform</button>
                          </form>
                        </div>

                      ) : showLoanForm ? (
                        <div className={`rounded-xl border p-5 shadow-xl flex-1 overflow-y-auto flex flex-col animate-fadeIn ${theme.modalCard} ${theme.scroll}`} style={theme.modalGlass}>
                          <div className={`flex justify-between items-center mb-4 border-b pb-3 flex-shrink-0 ${theme.tableBorder}`}>
                            <div>
                              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}><FaUniversity /> Loan Tracking Workflow</h3>
                              <p className={`text-xs mt-0.5 ${theme.textFaint}`}>For Lead #{selectedLead.id}</p>
                            </div>
                            <button type="button" onClick={() => setShowLoanForm(false)} className={`p-1 ${theme.textMuted}`}><FaTimes /></button>
                          </div>
                          <form onSubmit={handleLoanFormSubmit} className="flex flex-col gap-5 flex-1">
                            <div>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>1. Loan Decision</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Loan Required? *</label>
                                  <select required value={loanForm.loanRequired} onChange={e => setLoanForm({ ...loanForm, loanRequired: e.target.value })} className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer ${theme.select}`}>
                                    <option value="">Select</option><option>Yes</option><option>No</option><option>Not Sure</option>
                                  </select>
                                </div>
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Loan Status *</label>
                                  <select required value={loanForm.status} onChange={e => setLoanForm({ ...loanForm, status: e.target.value })} className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer ${theme.select}`}>
                                    <option value="">Select Status</option><option>Approved</option><option>In Progress</option><option>Rejected</option>
                                  </select>
                                  {loanForm.status && (
                                    <p className={`text-[10px] mt-1.5 font-semibold ${loanForm.status === "Approved" ? "text-green-500" : loanForm.status === "Rejected" ? "text-red-500" : isDark ? "text-yellow-400" : "text-yellow-600"}`}>
                                      {loanForm.status === "Approved" && "✅ Loan cleared — schedule closing meeting"}
                                      {loanForm.status === "In Progress" && "📄 Follow up on pending documents"}
                                      {loanForm.status === "Rejected" && "❌ Loan rejected — suggest co-applicant or other bank"}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={`border-t pt-4 ${theme.tableBorder}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>2. Bank & Loan Details</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[{ label: "Bank Name", k: "bank", ph: "e.g. HDFC" }, { label: "Amount Required", k: "amountReq", ph: "e.g. 60L" }, { label: "Amount Approved", k: "amountApp", ph: "e.g. 55L" }, { label: "CIBIL Score", k: "cibil", ph: "e.g. 750" }, { label: "Agent Name", k: "agent", ph: "Agent Name" }, { label: "Agent Contact", k: "agentContact", ph: "Agent Phone", tel: true }].map(f => (
                                  <div key={f.k}><label className={`text-xs mb-1 block ${theme.textMuted}`}>{f.label}</label>
                                    <input type={f.tel ? "tel" : "text"} value={(loanForm as any)[f.k]} onChange={e => setLoanForm({ ...loanForm, [f.k]: e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} placeholder={f.ph} />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className={`border-t pt-4 ${theme.tableBorder}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>3. Financial Qualification</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Employment</label>
                                  <select value={loanForm.empType} onChange={e => setLoanForm({ ...loanForm, empType: e.target.value })} className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer ${theme.select}`}>
                                    <option value="">Select</option><option>Salaried</option><option>Self-employed</option>
                                  </select>
                                </div>
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Monthly Income</label><input type="text" value={loanForm.income} onChange={e => setLoanForm({ ...loanForm, income: e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} placeholder="e.g. 1L" /></div>
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Existing EMIs</label><input type="text" value={loanForm.emi} onChange={e => setLoanForm({ ...loanForm, emi: e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} placeholder="e.g. 15k" /></div>
                              </div>
                            </div>
                            <div className={`border-t pt-4 ${theme.tableBorder}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}><FaFileAlt /> 4. Document Checklist</h4>
                              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border ${theme.modalInner}`}>
                                {["docPan", "docAadhaar", "docSalary", "docBank", "docProperty"].map(docKey => {
                                  const label = docKey === "docPan" ? "PAN Card" : docKey === "docAadhaar" ? "Aadhaar Card" : docKey === "docSalary" ? "Salary Slips / ITR" : docKey === "docBank" ? "Bank Statements" : "Property Documents";
                                  return (
                                    <div key={docKey} className={`flex items-center justify-between border p-2 rounded-lg ${theme.innerBlock}`}>
                                      <span className={`text-xs font-medium ${theme.textMuted}`}>{label}</span>
                                      <select value={(loanForm as any)[docKey]} onChange={e => setLoanForm({ ...loanForm, [docKey]: e.target.value })} className={`text-xs font-bold bg-transparent outline-none cursor-pointer ${(loanForm as any)[docKey] === "Uploaded" ? "text-green-500" : theme.textMuted}`}>
                                        <option value="Pending">Pending</option><option value="Uploaded">Uploaded</option>
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div className={`border-t pt-4 ${theme.tableBorder}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>5. Notes / Remarks</h4>
                              <textarea value={loanForm.notes} onChange={e => setLoanForm({ ...loanForm, notes: e.target.value })} className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none h-20 ${theme.inputInner} ${theme.text} ${theme.scroll} ${theme.inputFocus}`} placeholder="Bank feedback, CIBIL issues, Internal notes..." />
                            </div>
                            <button type="submit" className={`mt-4 flex-shrink-0 w-full font-bold py-3.5 rounded-xl shadow-md transition-colors cursor-pointer ${theme.btnSecondary}`}>Save Loan Tracker Update</button>
                          </form>
                        </div>

                      ) : (
                        <div className="flex flex-col h-full animate-fadeIn">
                          <div className={`flex items-center gap-2 mb-4 border p-1.5 rounded-xl flex-shrink-0 ${theme.card}`}>
                            <button onClick={() => setDetailTab("personal")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab === "personal" ? theme.btnPrimary : `${theme.textMuted} hover:opacity-80`}`}>Personal Information</button>
                            <button onClick={() => setDetailTab("loan")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab === "loan" ? theme.btnSecondary : `${theme.textMuted} hover:opacity-80`}`}>Loan Tracking</button>
                          </div>
                          <div className={`flex-1 overflow-y-auto border rounded-xl p-5 shadow-lg ${theme.modalCard} ${theme.scroll}`}>
                            {detailTab === "personal" ? (
                              <div>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Email</p><p className={`font-semibold ${theme.text}`}>{selectedLead.email !== "N/A" ? selectedLead.email : "Not Provided"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 flex items-center gap-1 ${theme.textMuted}`}><FaPhoneAlt className="text-[10px]" /> Phone</p><p className={`font-mono font-semibold ${theme.text}`}>
                                    {maskPhone(selectedLead.phone, adminUser?.role, selectedLead.assigned_to === adminUser?.name)}
                                  </p>
                                  </div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Alt Phone</p><p className={`font-mono font-semibold ${theme.text}`}>{selectedLead.altPhone && selectedLead.altPhone !== "N/A" ? selectedLead.altPhone : "Not Provided"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Lead Interest</p>
                                    {selectedLead.leadInterestStatus && selectedLead.leadInterestStatus !== "Pending" ? <InterestBadge status={selectedLead.leadInterestStatus} isDark={isDark} /> : <p className={`font-semibold ${theme.text}`}>Pending</p>}
                                  </div>
                                  <div className="col-span-2"><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Loan Status</p>
                                    {selectedLead.loanStatus && selectedLead.loanStatus !== "N/A" ? <div className="w-fit"><LoanStatusBadge status={selectedLead.loanStatus} isDark={isDark} /></div> : <p className={`font-semibold ${theme.text}`}>N/A</p>}
                                  </div>
                                  <div className="col-span-2"><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Residential Address</p><p className={`font-semibold ${theme.text}`}>{selectedLead.address && selectedLead.address !== "N/A" ? selectedLead.address : "Not Provided"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Budget</p><p className="text-green-500 font-bold">{selectedLead.salesBudget !== "Pending" ? selectedLead.salesBudget : selectedLead.budget}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Property Type</p><p className={`font-semibold ${theme.text}`}>{selectedLead.propType || "Pending"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Type of Use</p><p className={`font-semibold ${theme.text}`}>{selectedLead.useType !== "Pending" ? selectedLead.useType : (selectedLead.purpose || "N/A")}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Planning to Buy?</p><p className={`font-semibold ${theme.text}`}>{selectedLead.planningPurchase || "Pending"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Loan Required?</p><p className={`font-semibold ${theme.text}`}>{getLatestLoanDetails()?.loanRequired}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Status</p><p className={`font-semibold ${theme.accentText}`}>{selectedLead.status || "Routed"}</p></div>
                                  <div className={`col-span-2 p-4 rounded-xl border ${isDark ? "border-[#9E217B]/20" : "border-[#9E217B]/20"} ${theme.settingsBg}`}>
                                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>📍 Site Visit Date</p>
                                    <p className={`text-lg font-black ${theme.text}`}>{selectedLead.mongoVisitDate ? formatDate(selectedLead.mongoVisitDate) : "Not Scheduled"}</p>
                                  </div>
                                </div>
                                <div className={`mt-6 border rounded-xl p-4 ${theme.settingsBg}`}>
                                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 border-b border-[#9E217B] pb-2 ${theme.accentText}}`}>Channel Partner Data</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Primary Source</p><p className={`font-medium text-sm ${theme.text}`}>{selectedLead.source || "N/A"}</p></div>
                                    {selectedLead.source === "Others" && (<div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Specified Name</p><p className={`font-medium text-sm ${theme.text}`}>{selectedLead.sourceOther}</p></div>)}
                                  </div>
                                  {selectedLead.source === "Channel Partner" && (
                                    <div className={`mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#9E217B]`}>
                                      {[{ label: "CP Company", val: selectedLead.cp_company || selectedLead.cpCompany }, { label: "CP Phone", val: selectedLead.cp_phone || selectedLead.cpPhone }].map(({ label, val }) => (
                                        <div key={label}><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>{label}</p><p className={`font-medium text-sm ${theme.text}`}>{val || "N/A"}</p></div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                {(() => {
                                  const curLoan: any = getLatestLoanDetails() || {};
                                  const sColor = getLoanStatusColor(curLoan?.status || "");
                                  const isHighProb = curLoan?.status?.toLowerCase() === "approved" && selectedLead.mongoVisitDate;
                                  return (
                                    <>
                                      <h3 className={`text-sm font-bold border-b pb-2 mb-6 uppercase flex items-center gap-2 ${isDark ? "text-[#00AEEF]" : "text-[#00AEEF]"}`}><FaUniversity /> Deal Loan Overview</h3>
                                      {isHighProb && <div className="mb-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 p-3 rounded-lg flex items-center justify-center gap-2 text-orange-500 font-bold tracking-wide shadow-md">🚀 HIGH PROBABILITY DEAL (Visit Done + Loan Approved)</div>}
                                      <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Loan Required?</p><p className={`font-semibold ${theme.text}`}>{curLoan?.loanRequired}</p></div>
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Current Status</p><p className={`font-bold px-2 py-0.5 rounded inline-block border ${sColor}`}>{curLoan?.status}</p></div>
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Amount Requested</p><p className="text-orange-500 font-semibold">{curLoan?.amountReq}</p></div>
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Amount Approved</p><p className="text-green-500 font-semibold">{curLoan?.amountApp}</p></div>
                                        {[{ label: "Bank Name", val: curLoan?.bankName }, { label: "CIBIL Score", val: curLoan?.cibil }, { label: "Agent Name", val: curLoan?.agent }, { label: "Agent Contact", val: curLoan?.agentContact }, { label: "Emp Type", val: curLoan?.empType }, { label: "Monthly Income", val: curLoan?.income }, { label: "Existing EMIs", val: curLoan?.emi }].map(f => (
                                          <div key={f.label}><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>{f.label}</p><p className={`font-semibold ${theme.text}`}>{f.val}</p></div>
                                        ))}
                                        <div className="col-span-2 mb-2"><p className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>Document Status</p></div>
                                        {[{ label: "PAN Card", val: curLoan?.docPan }, { label: "Aadhaar", val: curLoan?.docAadhaar }, { label: "Salary/ITR", val: curLoan?.docSalary }, { label: "Bank Stmt", val: curLoan?.docBank }, { label: "Property Docs", val: curLoan?.docProperty }].map((doc, i) => (
                                          <div key={i} className={`flex items-center justify-between border p-2 rounded-lg col-span-1 ${theme.innerBlock}`}>
                                            <span className={`text-xs ${theme.textMuted}`}>{doc.label}</span>
                                            {doc.val === "Uploaded" ? <FaCheck className="text-green-500 text-xs" /> : <FaClock className={`${theme.textFaint} text-xs`} />}
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-4 flex-shrink-0">
                            <button className={`border flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1 ${isDark ? "bg-[#9E217B]/10 border-[#9E217B]/30 hover:bg-[#9E217B] text-[#d946a8] hover:text-white" : "bg-[#9E217B]/10 border-[#9E217B]/30 hover:bg-[#9E217B] text-[#9E217B] hover:text-white"}`}>
                              <FaMicrophone className="text-lg" /><span className="font-bold text-[10px]">Browser Call</span>
                            </button>
                            <button className="bg-green-50 dark:bg-green-600/10 border border-green-200 dark:border-green-500/30 hover:bg-green-100 dark:hover:bg-green-600 text-green-600 dark:text-green-400 flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1">
                              <FaWhatsapp className="text-xl" /><span className="font-bold text-[10px]">WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right panel: follow-ups */}
                    <div className={`w-full lg:w-[55%] flex flex-col border rounded-2xl overflow-hidden shadow-2xl h-full min-h-0 ${theme.chatPanel}`} style={theme.chatPanelGl}>
                      <div className={`flex-1 p-6 overflow-y-auto flex flex-col gap-6 ${theme.chatArea} ${theme.scroll}`}>
                        <div className="flex justify-start">
                          <div className={`border rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-md ${theme.fupDefault}`}>
                            <div className="flex justify-between items-center mb-2 gap-6">
                              <span className={`font-bold text-sm ${theme.accentText}`}>System (Front Desk)</span>
                              <span className={`text-[10px] ${theme.textFaint}`}>{formatDate(selectedLead.created_at)}</span>
                            </div>
                            <p className={`text-sm leading-relaxed ${theme.text}`}>Lead assigned to {selectedLead.assigned_to}. Action required.</p>
                          </div>
                        </div>
                        {currentLeadFollowUps.map((msg: any, idx: number) => {
                          const isLoan = msg.message.includes("🏦 Loan Update");
                          const isSF = msg.message.includes("📝 Detailed Salesform Submitted");
                          const isAdmin = msg.createdBy === "admin";
                          let bg = theme.fupDefault;
                          if (isLoan) bg = theme.fupLoan;
                          else if (isSF) bg = theme.fupSalesform;
                          else if (isAdmin) bg = theme.fupClosing;
                          return (
                            <div key={idx} className="flex justify-start">
                              <div className={`rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-lg ${bg}`}>
                                <div className="flex justify-between items-center mb-3 gap-6">
                                  <span className={`font-bold text-sm ${theme.text}`}>{msg.createdBy === "admin" ? `${msg.salesManagerName || "Admin"} (Admin)` : msg.salesManagerName}</span>
                                  <span className={`text-[10px] ${theme.textFaint}`}>{formatDate(msg.createdAt)}</span>
                                </div>
                                <p className={`text-sm whitespace-pre-wrap leading-relaxed ${theme.text}`}>{msg.message}</p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={followUpEndRef} />
                      </div>
                      <form onSubmit={handleSendCustomNote} className={`p-4 border-t flex gap-3 items-center flex-shrink-0 ${theme.chatInputInner}`}>
                        <input type="text" value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder="Add admin note..."
                          className={`flex-1 border rounded-xl px-4 py-3 text-sm outline-none transition-colors shadow-inner ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} />
                        <button type="submit" className={`w-12 h-12 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-lg ${isDark ? "bg-[#9E217B] hover:bg-[#b8268f]" : "bg-[#9E217B] hover:bg-[#8a1d6b]"}`}>
                          <FaPaperPlane className="text-sm ml-[-2px]" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
// ============================================================================
// ADMIN SITE HEAD VIEW
// ============================================================================
// ============================================================================
// ADMIN SITE HEAD VIEW
// ============================================================================
function AdminSiteHeadView({ siteHeads, allLeads, followUps, isLoading, adminUser, refetch, theme, isDark }: any) {
  const [selectedSiteHead, setSelectedSiteHead] = useState<any>(null);
  const [searchSiteHead, setSearchSiteHead] = useState("");
  const [activeSection, setActiveSection] = useState<"assignedTable" | "closed">("assignedTable");
  const [subView, setSubView] = useState<"list" | "detail">("list");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<"personal" | "loan">("personal");
  const followUpEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [salesForm, setSalesForm] = useState({ propertyType: "", location: "", budget: "", useType: "", purchaseDate: "", loanPlanned: "", siteVisit: "", leadStatus: "" });
  const [loanForm, setLoanForm] = useState({ loanRequired: "", status: "", bank: "", amountReq: "", amountApp: "", cibil: "", agent: "", agentContact: "", empType: "", income: "", emi: "", docPan: "Pending", docAadhaar: "Pending", docSalary: "Pending", docBank: "Pending", docProperty: "Pending", notes: "" });
  const [customNote, setCustomNote] = useState("");
  const [toastMsg, setToastMsg] = useState<{ title: string; icon: any; color: string } | null>(null);

  // Transfer States
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferNote, setTransferNote] = useState("");
  const [transferTarget, setTransferTarget] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [salesManagers, setSalesManagers] = useState<any[]>([]);
  const [isFetchingManagers, setIsFetchingManagers] = useState(true);
  // ── Auto-drill into a lead when navigated from Enquiry Overview ──
  useEffect(() => {
    const raw = localStorage.getItem("crm_drill_lead");
    if (!raw) return;
    try {
      const drillLead = JSON.parse(raw);
      if (drillLead._drillTab !== "site_head") return;
      localStorage.removeItem("crm_drill_lead");
      const sh = siteHeads.find((s: any) => s.name === drillLead.assigned_to);
      if (sh) {
        setSelectedSiteHead(sh);
        setSelectedLead(drillLead);
        setSubView("detail");
      }
    } catch { }
  }, [siteHeads]);
  // ── Lazy load state ───────────────────────────────────────────────────────────
  const [visibleCount, setVisibleCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadLessRef = useRef<HTMLDivElement>(null);

  const showToast = (title: string, color = "green") => {
    setToastMsg({ title, icon: <FaCheckCircle />, color });
    setTimeout(() => setToastMsg(null), 3000);
  };





  // Fetch managers for the transfer dropdown
  useEffect(() => {
    setIsFetchingManagers(true);
    Promise.all([
      fetch("/api/users/sales-manager"),
      fetch("/api/users/site-head")
    ]).then(async ([resSM, resSH]) => {
      let combined = [];
      if (resSM.ok) { const j = await resSM.json(); combined.push(...(j.data || j || [])); }
      if (resSH.ok) { const j = await resSH.json(); combined.push(...(j.data || j || [])); }
      setSalesManagers(combined);
    }).catch(() => { }).finally(() => setIsFetchingManagers(false));
  }, []);

  const currentLeadFollowUps = useMemo(() =>
    (followUps || []).filter((f: any) => String(f.leadId) === String(selectedLead?.id)),
    [followUps, selectedLead]);

  useEffect(() => {
    if (subView === "detail") followUpEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentLeadFollowUps, subView, detailTab]);

  // Enrich Leads with Follow-up Data (Copied exact logic from ReceptionistView)
  const mergedLeads = useMemo(() => {
    return allLeads.map((lead: any) => {
      const lf = (followUps || []).filter((f: any) => String(f.leadId) === String(lead.id));
      const salesForms = lf.filter((f: any) => f.message?.includes("Detailed Salesform Submitted"));
      const latestMsg = salesForms.length > 0 ? salesForms[salesForms.length - 1].message : "";
      const g = (field: string) => {
        if (!latestMsg) return "Pending";
        const m = latestMsg.match(new RegExp(`• ${field}: (.*)`));
        return m ? m[1].trim() : "Pending";
      };
      const loanUpdates = lf.filter((f: any) => f.message?.includes("🏦 Loan Update:"));
      let loanStatus = "N/A";
      if (loanUpdates.length > 0) {
        const msg = loanUpdates[loanUpdates.length - 1].message;
        const mS = msg.match(/• Status: (.*)/); if (mS) loanStatus = mS[1].trim();
      }
      const visitsWithDate = lf.filter((f: any) => f.siteVisitDate?.trim());
      const mongoVisitDate = visitsWithDate.length > 0 ? visitsWithDate[visitsWithDate.length - 1].siteVisitDate : null;
      const closingFups = lf.filter((f: any) => f.message?.includes("✅ Lead Marked as Closing"));
      const closingDate = closingFups.length > 0 ? closingFups[closingFups.length - 1].createdAt : null;
      const sfBudget = g("Budget");
      const activeBudget = sfBudget !== "Pending" && sfBudget !== "N/A" ? sfBudget : (lead.budget || "Pending");

      return {
        ...lead,
        propType: (g("Property Type") !== "Pending" && g("Property Type") !== "N/A") ? g("Property Type") : (lead.configuration || "Pending"),
        salesBudget: activeBudget,
        useType: g("Use Type") !== "Pending" ? g("Use Type") : (lead.purpose || "Pending"),
        leadInterestStatus: g("Lead Status"),
        loanStatus, mongoVisitDate, closingDate,
        allFollowUps: lf,
        status: lead.status === "Closing" ? "Closing" : mongoVisitDate ? "Visit Scheduled" : lead.status,
      };
    });
  }, [allLeads, followUps]);

  // Derived Datasets for Tabs
  const siteHeadName = selectedSiteHead?.name ?? "";
  const assignedLeads = useMemo(() => mergedLeads.filter((l: any) => l.assigned_to === siteHeadName && l.status !== "Closing" && !l.closingDate), [mergedLeads, siteHeadName]);
  const closedLeads = useMemo(() => mergedLeads.filter((l: any) => l.assigned_to === siteHeadName && (l.status === "Closing" || l.status === "Closed" || !!l.closingDate)), [mergedLeads, siteHeadName]);
  const filteredSiteHeads = (siteHeads || []).filter((s: any) => s.name?.toLowerCase().includes(searchSiteHead.toLowerCase()));
  // ── Bottom sentinel: load 20 more on scroll down ──────────────────────────────
  useEffect(() => {
    const currentTotal = activeSection === "assignedTable" ? assignedLeads.length : closedLeads.length;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 20, currentTotal));
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [activeSection, assignedLeads.length, closedLeads.length]);

  // ── Top sentinel: unload back to 20 when scrolled fully back up ───────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount > 20) {
          setVisibleCount(20);
        }
      },
      { threshold: 1.0 }
    );
    if (loadLessRef.current) observer.observe(loadLessRef.current);
    return () => observer.disconnect();
  }, [visibleCount]);

  // ── Reset count when section or site head changes ─────────────────────────────
  useEffect(() => {
    setVisibleCount(20);
  }, [activeSection, selectedSiteHead?.name]);
  // Helpers for Forms
  const getLatestLoanDetails = () => {
    if (!selectedLead) return null;
    let ex: Record<string, any> = { loanRequired: selectedLead.loanPlanned || "N/A", status: "Pending", bankName: "N/A", amountReq: "N/A", amountApp: "N/A", cibil: "N/A", agent: "N/A", agentContact: "N/A", empType: "N/A", income: "N/A", emi: "N/A", docPan: "Pending", docAadhaar: "Pending", docSalary: "Pending", docBank: "Pending", docProperty: "Pending", notes: "N/A" };
    const lu = currentLeadFollowUps.filter((f: any) => f.message?.includes("🏦 Loan Update:"));
    if (lu.length > 0) {
      const msg = lu[lu.length - 1].message;
      const g = (l: string) => { const m = msg.match(new RegExp(`• ${l}: (.*)`)); return m ? m[1].trim() : "N/A"; };
      ex = { loanRequired: g("Loan Required"), status: g("Status"), bankName: g("Bank Name"), amountReq: g("Amount Requested"), amountApp: g("Amount Approved"), cibil: g("CIBIL Score"), agent: g("Agent Name"), agentContact: g("Agent Contact"), empType: g("Employment Type"), income: g("Monthly Income"), emi: g("Existing EMIs"), docPan: g("PAN Card"), docAadhaar: g("Aadhaar Card"), docSalary: g("Salary Slips"), docBank: g("Bank Statements"), docProperty: g("Property Docs"), notes: g("Notes") };
    }
    return ex;
  };

  const getLoanStatusColor = (s: string) => {
    const sl = (s || "").toLowerCase();
    if (sl === "approved") return isDark ? "bg-green-900/20 text-green-400 border-green-500/30" : "bg-green-50 text-green-700 border-green-300";
    if (sl === "rejected") return isDark ? "bg-red-900/20 text-red-400 border-red-500/30" : "bg-red-50 text-red-700 border-red-300";
    if (sl === "in progress") return isDark ? "bg-yellow-900/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-50 text-yellow-700 border-yellow-300";
    return isDark ? "bg-gray-900/20 text-gray-400 border-gray-500/30" : "bg-gray-50 text-gray-600 border-gray-300";
  };

  const prefillSalesForm = () => {
    if (!selectedLead) return;
    const sf = currentLeadFollowUps.filter((f: any) => f.message?.includes("Detailed Salesform Submitted"));
    if (sf.length === 0) return;
    const msg = sf[sf.length - 1].message;
    const g = (label: string) => { const m = msg.match(new RegExp(`• ${label}: (.*)`)); return m && m[1].trim() !== "N/A" ? m[1].trim() : ""; };
    setSalesForm({ propertyType: g("Property Type"), location: g("Location"), budget: g("Budget"), useType: g("Use Type"), purchaseDate: g("Planning to Purchase"), loanPlanned: g("Loan Planned"), leadStatus: g("Lead Status"), siteVisit: "" });
  };

  const prefillLoanForm = () => {
    const cur = getLatestLoanDetails();
    if (!cur) return;
    const n = (v: string) => v !== "N/A" ? v : "";
    setLoanForm({ loanRequired: n(cur.loanRequired), status: cur.status !== "Pending" ? cur.status : "", bank: n(cur.bankName), amountReq: n(cur.amountReq), amountApp: n(cur.amountApp), cibil: n(cur.cibil), agent: n(cur.agent), agentContact: n(cur.agentContact), empType: n(cur.empType), income: n(cur.income), emi: n(cur.emi), docPan: cur.docPan !== "N/A" ? cur.docPan : "Pending", docAadhaar: cur.docAadhaar !== "N/A" ? cur.docAadhaar : "Pending", docSalary: cur.docSalary !== "N/A" ? cur.docSalary : "Pending", docBank: cur.docBank !== "N/A" ? cur.docBank : "Pending", docProperty: cur.docProperty !== "N/A" ? cur.docProperty : "Pending", notes: n(cur.notes) });
  };

  const handleSendCustomNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customNote.trim() || !selectedLead) return;
    const nm = { leadId: String(selectedLead.id), salesManagerName: adminUser.name, createdBy: "admin", message: customNote, siteVisitDate: null, createdAt: new Date().toISOString() };
    setCustomNote("");
    try { await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nm) }); refetch(); } catch { }
  };

  const handleSalesFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const msg = `📝 Detailed Salesform Submitted:\n• Property Type: ${salesForm.propertyType || "N/A"}\n• Location: ${salesForm.location || "N/A"}\n• Budget: ${salesForm.budget || "N/A"}\n• Use Type: ${salesForm.useType || "N/A"}\n• Planning to Purchase: ${salesForm.purchaseDate || "N/A"}\n• Loan Planned: ${salesForm.loanPlanned || "N/A"}\n• Lead Status: ${salesForm.leadStatus || "N/A"}\n• Site Visit Requested: ${salesForm.siteVisit ? formatDate(salesForm.siteVisit) : "No"}`;
    const nm = { leadId: String(selectedLead.id), salesManagerName: adminUser.name, createdBy: "admin", message: msg, siteVisitDate: salesForm.siteVisit || null, createdAt: new Date().toISOString() };
    const ns = salesForm.siteVisit ? "Visit Scheduled" : selectedLead.status;
    setShowSalesForm(false);
    setSalesForm({ propertyType: "", location: "", budget: "", useType: "", purchaseDate: "", loanPlanned: "", siteVisit: "", leadStatus: "" });
    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nm) });
      await fetch(`/api/walkin_enquiries/${selectedLead.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: selectedLead.name, status: ns }) });
      refetch();
    } catch { }
  };

  const handleLoanFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const msg = `🏦 Loan Update:\n• Loan Required: ${loanForm.loanRequired || "N/A"}\n• Status: ${loanForm.status || "N/A"}\n• Bank Name: ${loanForm.bank || "N/A"}\n• Amount Requested: ${loanForm.amountReq || "N/A"}\n• Amount Approved: ${loanForm.amountApp || "N/A"}\n• CIBIL Score: ${loanForm.cibil || "N/A"}\n• Agent Name: ${loanForm.agent || "N/A"}\n• Agent Contact: ${loanForm.agentContact || "N/A"}\n• Employment Type: ${loanForm.empType || "N/A"}\n• Monthly Income: ${loanForm.income || "N/A"}\n• Existing EMIs: ${loanForm.emi || "N/A"}\n• PAN Card: ${loanForm.docPan || "Pending"}\n• Aadhaar Card: ${loanForm.docAadhaar || "Pending"}\n• Salary Slips: ${loanForm.docSalary || "Pending"}\n• Bank Statements: ${loanForm.docBank || "Pending"}\n• Property Docs: ${loanForm.docProperty || "Pending"}\n• Notes: ${loanForm.notes || "N/A"}`;
    const nm = { leadId: String(selectedLead.id), salesManagerName: adminUser.name, createdBy: "admin", message: msg, siteVisitDate: null, createdAt: new Date().toISOString() };
    const dbp = { leadId: String(selectedLead.id), salesManagerName: adminUser.name, ...loanForm };
    setShowLoanForm(false);
    setToastMsg({ title: `Loan Data Synced for ${selectedLead.name}`, icon: <FaCheckCircle />, color: "blue" });
    setTimeout(() => setToastMsg(null), 3000);
    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nm) });
      await fetch("/api/loan/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dbp) }).catch(() => { });
      refetch();
    } catch { }
  };

  const handleMarkAsClosing = async () => {
    if (!selectedLead || selectedLead.status === "Closing") return;
    const nm = { leadId: String(selectedLead.id), salesManagerName: adminUser.name, createdBy: "admin", message: `✅ Lead Marked as Closing by ${adminUser.name} (Admin)`, siteVisitDate: null, createdAt: new Date().toISOString() };
    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nm) });
      await fetch(`/api/walkin_enquiries/${selectedLead.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: selectedLead.name, status: "Closing" }) });
      setToastMsg({ title: `🎉 ${selectedLead.name} marked as Closing!`, icon: <FaCheckCircle />, color: "green" });
      setTimeout(() => setToastMsg(null), 3000);
      refetch();
    } catch { }
  };

  const handleTransferLead = async () => {
    if (!selectedLead || !transferTarget || transferNote.trim().length < 50) return;
    setIsTransferring(true);
    try {
      const res = await fetch("/api/leads/transfer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: selectedLead.id, transfer_to: transferTarget, transfer_note: transferNote, transferred_by: adminUser.name }) });
      if (!res.ok) throw new Error("Transfer failed");
      setIsTransferModalOpen(false); setTransferNote(""); setTransferTarget("");
      showToast(`Lead #${selectedLead.id} transferred to ${transferTarget}!`);
      setSubView("list"); setSelectedLead(null);
      refetch();
    } catch (e: any) { alert(e.message ?? "Transfer failed."); }
    finally { setIsTransferring(false); }
  };

  // Status Classes & Sections
  const statusCls = (status: string) => {
    const s = status || "Routed";
    if (s === "Closing" || s === "Closed") return isDark ? "whitespace-nowrap text-yellow-400 border-yellow-500/40 bg-yellow-500/10" : "whitespace-nowrap text-amber-600 border-amber-400/50 bg-amber-50";
    if (s === "Visit Scheduled") return isDark ? "whitespace-nowrap text-orange-400 border-orange-500/30 bg-orange-500/10" : "whitespace-nowrap text-orange-500 border-orange-400/40 bg-orange-50";
    return isDark ? "whitespace-nowrap text-[#d946a8] border-[#9E217B]/30 bg-[#9E217B]/10" : "whitespace-nowrap text-[#9E217B] border-[#9E217B]/30 bg-[#9E217B]/10";
  };

  const sections = [
    { key: "assignedTable", label: "Assigned Lead Table", icon: "🗃️", count: assignedLeads.length, desc: `Active pipeline managed by ${siteHeadName}` },
    { key: "closed", label: "Closed Leads", icon: "✅", count: closedLeads.length, desc: `Deals successfully closed by ${siteHeadName}` }
  ] as const;

  // Reusable Table Component
  const renderTable = (leads: any[]) => (
    <div className={`rounded-2xl overflow-hidden border ${theme.tableWrap}`} style={theme.tableGlass}>
      <div className="overflow-x-auto custom-scrollbar">
        <div ref={loadLessRef} style={{ height: "1px", width: "100%" }} />

        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className={`text-xs uppercase ${theme.tableHead} ${theme.textHeader}`}>
            <tr>
              <th className="px-4 py-4">Lead ID</th>
              <th className="px-4 py-4">Client</th>
              <th className="px-4 py-4">Budget</th>
              <th className="px-4 py-4">Phone</th>
              <th className="px-4 py-4">Source</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Interest</th>
              <th className="px-4 py-4">Site Visit</th>
              <th className="px-4 py-4">Date</th>
              <th className="px-4 py-4">Action</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.tableDivide}`}>
            {isLoading ? (
              <tr><td colSpan={10} className={`text-center py-8 ${theme.textMuted}`}>Syncing…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={10} className={`text-center py-12 ${theme.textMuted}`}>No leads found.</td></tr>
            ) : leads.map((lead: any) => (
              <tr key={lead.id} className={`transition-colors cursor-pointer ${theme.tableRow}`} onClick={() => { setSelectedLead(lead); setSubView("detail"); }}>
                <td className={`px-4 py-4 font-black text-sm ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>#{lead.id}</td>
                <td className={`px-4 py-4 font-semibold ${theme.text}`}>{lead.name}</td>
                <td className={`px-4 py-4 font-semibold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{lead.salesBudget || lead.budget || "N/A"}</td>
                <td className={`px-4 py-4 font-mono text-xs ${theme.textMuted}`}>{maskPhone(lead.phone, adminUser?.role, lead.assigned_to === adminUser?.name)}</td>
                <td className={`px-4 py-4 text-xs ${theme.textMuted}`}>{lead.source || "—"}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border flex-shrink-0 ${statusCls(lead.status)}`}>
                    {lead.status || "Routed"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {lead.leadInterestStatus && lead.leadInterestStatus !== "Pending" ? (
                    <InterestBadge status={lead.leadInterestStatus} size="sm" isDark={isDark} />
                  ) : <span className={`text-xs italic ${theme.textFaint}`}>—</span>}
                </td>
                <td className={`px-4 py-4 text-xs ${lead.mongoVisitDate ? "text-orange-500 font-semibold" : theme.textFaint}`}>
                  {lead.mongoVisitDate ? formatDate(lead.mongoVisitDate).split(",")[0] : "—"}
                </td>
                <td className={`px-4 py-4 text-xs ${theme.textFaint}`}>
                  {formatDate(lead.created_at).split(",")[0]}
                </td>
                <td className="px-4 py-4">
                  <button className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${theme.btnPrimary}`}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* ── BOTTOM SENTINEL — triggers load more ── */}
        {visibleCount < leads.length && (
          <div ref={loadMoreRef} className={`flex items-center justify-center gap-3 py-6 ${theme.textMuted}`}>
            <div className="w-4 h-4 rounded-full border-2 border-[#9E217B] border-t-transparent animate-spin" />
            <span className="text-xs font-medium">Loading more… ({visibleCount} of {leads.length})</span>
          </div>
        )}
        {visibleCount >= leads.length && leads.length > 20 && (
          <div className={`text-center py-4 text-xs font-medium ${theme.textFaint}`}>
            ✓ All {leads.length} leads loaded
          </div>
        )}
      </div>
    </div>
  );

  const formInput = `w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors border ${theme.inputInner} ${theme.text} ${theme.inputFocus}`;
  const formSelect = `w-full rounded-lg px-4 py-2.5 text-sm outline-none cursor-pointer border ${theme.inputInner} ${theme.text} ${theme.inputFocus}`;

  return (
    <div className="flex h-full relative">
      {toastMsg && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 animate-fadeIn ${toastMsg.color === "green" ? "bg-green-600 border-green-400 text-white" : "bg-[#9E217B] border-[#b8268f] text-white"}`}>
          <div className="text-lg">{toastMsg.icon}</div>
          <span className="text-sm font-bold">{toastMsg.title}</span>
        </div>
      )}

      {/* Sidebar for Site Heads */}
      <div className={`w-72 border-r flex flex-col h-full flex-shrink-0 z-20 shadow-xl ${theme.innerBlock}`}>
        <div className={`p-5 border-b ${theme.tableBorder}`}>
          <div className="relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${theme.textFaint}`} />
            <input type="text" placeholder="Search Site Heads..." value={searchSiteHead} onChange={e => setSearchSiteHead(e.target.value)}
              className={`w-full rounded-lg pl-9 pr-4 py-2 text-sm outline-none transition-colors ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} />
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${theme.scroll}`} dir="rtl">
          <div dir="ltr" className="min-h-full">
            {isLoading ? <div className={`p-8 text-center text-sm ${theme.textMuted}`}>Loading...</div>
              : filteredSiteHeads.length === 0 ? <div className={`p-8 text-center text-sm ${theme.textMuted}`}>No Site Heads found.</div>
                : filteredSiteHeads.map((sh: any) => {
                  const isSelected = selectedSiteHead?.id === sh.id || selectedSiteHead?.name === sh.name;
                  const count = allLeads.filter((l: any) => l.assigned_to === sh.name).length;
                  return (
                    <div key={sh.id || sh.name} onClick={() => { setSelectedSiteHead(sh); setSubView("list"); setActiveSection("assignedTable"); setSelectedLead(null); }}
                      className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-b ${theme.tableBorder} ${isSelected ? (isDark ? "border-r-4 border-r-[#9E217B] bg-[#9E217B]/10" : "border-r-4 border-r-[#9E217B] bg-pink-50") : "hover:opacity-80 border-r-4 border-r-transparent"}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${isSelected ? "bg-[#9E217B]" : isDark ? "bg-[#333] text-gray-400" : "bg-gray-400"}`}>
                        {sh.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className={`font-bold truncate text-sm ${theme.text}`}>{sh.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isDark ? "text-[#d946a8] bg-[#9E217B]/10" : "text-[#9E217B] bg-pink-100"}`}>{count} leads</span>
                        </div>
                        <p className={`text-xs truncate capitalize ${theme.textFaint}`}>Site Head</p>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>

      {/* Main Content Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {!selectedSiteHead ? (
          <div className={`h-full flex flex-col items-center justify-center ${theme.textMuted}`}>
            <FaUniversity className="text-4xl mb-4 opacity-20" />
            <p>Select a Site Head from the left sidebar.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Sub-header */}
            <div className={`p-5 border-b flex justify-between items-center shadow-sm z-10 flex-shrink-0 gap-4 ${theme.header}`} style={theme.headerGlass}>
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${theme.text}`}>
                  <FaUniversity className={isDark ? "text-[#d946a8]" : "text-[#9E217B]"} /> {selectedSiteHead.name}'s Division
                </h2>
                <p className={`text-xs mt-1 ${theme.textFaint}`}>Admin view — monitor Site Head activity</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full border font-bold flex items-center gap-1.5 ${isDark ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-green-700 border-green-200 bg-green-50"}`}>
                🟢 Live Sync Active
              </span>
            </div>

            {/* ── LIST VIEW (Stats + Tables) ── */}
            {subView === "list" && (
              <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 ${theme.scroll}`}>
                <div className="animate-fadeIn space-y-6 max-w-7xl mx-auto">

                  {/* Tabs / Stats Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {sections.map(sec => (
                      <div key={sec.key} onClick={() => setActiveSection(sec.key as any)}
                        className={`rounded-2xl p-5 border cursor-pointer transition-all ${activeSection === sec.key ? (isDark ? "bg-[#9E217B]/20 border-[#9E217B]/50" : "bg-[#9E217B]/10 border-[#9E217B]") : `${theme.card} hover:opacity-90`}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl">{sec.icon}</span>
                          <span className={`text-3xl font-black ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>{sec.count}</span>
                        </div>
                        <p className={`text-sm font-bold ${theme.text}`}>{sec.label}</p>
                        <p className={`text-xs mt-1 ${theme.textFaint}`}>{sec.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Table Rendering */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${theme.text}`}>
                      {activeSection === "assignedTable" ? "Currently Assigned Leads" : "Successfully Closed Leads"}
                    </h3>
                    <button
                      onClick={() => downloadCSV((activeSection === "assignedTable" ? assignedLeads : closedLeads).map(formatLeadForExport), `SiteHead_${activeSection}.csv`)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border rounded-lg transition-colors hover:opacity-80 ${isDark ? 'bg-[#222] border-[#333] text-white' : 'bg-white border-indigo-200 text-indigo-600'}`}
                    >
                      <FaDownload size={14} /> Export to CSV
                    </button>
                  </div>
                  {renderTable(activeSection === "assignedTable" ? assignedLeads : closedLeads)}

                </div>
              </div>
            )}

            {/* ── DETAIL VIEW (Full Panel) ── */}
            {subView === "detail" && selectedLead && (
              <div className={`flex-1 overflow-y-auto p-6 ${theme.scroll}`}>
                <div className="animate-fadeIn max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-130px)]">
                  {/* Detail header */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 rounded-2xl border p-4 sm:p-5 shadow-sm flex-shrink-0 ${theme.card}`} style={theme.cardGlass}>
                    <div className="flex items-center gap-4">
                      <button onClick={() => { setSubView("list"); setShowSalesForm(false); setShowLoanForm(false); }} className={`w-10 h-10 flex items-center justify-center border rounded-xl transition-colors cursor-pointer shadow-sm ${theme.textMuted} ${theme.tableBorder} ${isDark ? "bg-[#222] hover:bg-[#333]" : "bg-white hover:bg-[#F8FAFC]"}`}><FaChevronLeft className="text-sm" /></button>
                      <h1 className={`text-xl md:text-2xl font-bold flex items-center gap-3 ${theme.text}`}>
                        <span className={isDark ? "text-[#d946a8]" : "text-[#9E217B]"}>#{selectedLead.id}</span>
                        <span>{selectedLead.name}</span>
                        {selectedLead.status === "Closing" && (
                          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${theme.statusClosing}`}><FaHandshake className="text-xs" /> Closing</span>
                        )}
                      </h1>
                    </div>
                    <div className="flex gap-3 flex-wrap justify-end">
                      {!showSalesForm && !showLoanForm && (
                        <>
                          <button onClick={() => { prefillSalesForm(); setShowSalesForm(true); setShowLoanForm(false); }} className={`font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer ${theme.btnPrimary}`}>
                            <FaFileInvoice /> Fill Salesform
                          </button>
                          <button onClick={() => { prefillLoanForm(); setShowLoanForm(true); setShowSalesForm(false); }} className={`font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer ${theme.btnSecondary}`}>
                            <FaUniversity /> Track Loan
                          </button>
                          {selectedLead.mongoVisitDate && selectedLead.status !== "Closing" && (
                            <button onClick={handleMarkAsClosing} className={`font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer ${theme.btnWarning}`}>
                              <FaHandshake /> Mark Closing
                            </button>
                          )}
                          <button onClick={() => { setTransferTarget(""); setTransferNote(""); setIsTransferModalOpen(true); }} className={`font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer ${isDark ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}`}>
                            <FaExchangeAlt /> Transfer
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 pb-2">
                    {/* LEFT PANEL */}
                    <div className="w-full lg:w-[50%] flex flex-col gap-3 h-full pb-2">
                      {showSalesForm ? (
                        <div className={`rounded-xl border p-5 shadow-xl flex-1 overflow-y-auto custom-scrollbar flex flex-col ${theme.modalCard}`} style={theme.modalGlass}>
                          <div className={`flex justify-between items-center mb-4 border-b pb-3 ${theme.tableBorder}`}>
                            <div>
                              <h3 className={`text-base font-bold ${theme.text}`}>Sales Data Form</h3>
                              <p className={`text-xs mt-0.5 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>Admin override — Lead #{selectedLead.id}</p>
                            </div>
                            <button type="button" onClick={() => setShowSalesForm(false)} className={`p-1 ${theme.textMuted} hover:text-red-500`}><FaTimes /></button>
                          </div>
                          <form onSubmit={handleSalesFormSubmit} className="flex flex-col gap-4 flex-1">
                            <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Property Type?</label><input type="text" placeholder="e.g. 1BHK, 2BHK" value={salesForm.propertyType} onChange={e => setSalesForm({ ...salesForm, propertyType: e.target.value })} className={formInput} /></div>
                            <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Preferred Location?</label><input type="text" placeholder="e.g. Dombivali, Kalyan" value={salesForm.location} onChange={e => setSalesForm({ ...salesForm, location: e.target.value })} className={formInput} /></div>
                            <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Approximate Budget?</label><input type="text" placeholder="e.g. 5 cr" value={salesForm.budget} onChange={e => setSalesForm({ ...salesForm, budget: e.target.value })} className={formInput} /></div>
                            <div className="grid grid-cols-2 gap-3">
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Self-use or Investment?</label>
                                <select value={salesForm.useType} onChange={e => setSalesForm({ ...salesForm, useType: e.target.value })} className={formSelect}><option value="">Select</option><option>Self Use</option><option>Investment</option></select>
                              </div>
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Planning to Purchase?</label>
                                <select value={salesForm.purchaseDate} onChange={e => setSalesForm({ ...salesForm, purchaseDate: e.target.value })} className={formSelect}><option value="">Select</option><option>Immediate</option><option>Next 3 Months</option></select>
                              </div>
                            </div>
                            <div className={`border-t pt-3 ${theme.tableBorder}`}>
                              <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>Lead Interest Status *</label>
                              <select required value={salesForm.leadStatus} onChange={e => setSalesForm({ ...salesForm, leadStatus: e.target.value })} className={formSelect}><option value="" disabled>Select Status</option><option>Interested</option><option>Not Interested</option><option>Maybe</option></select>
                            </div>
                            <div className={`border-t pt-3 ${theme.tableBorder}`}>
                              <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>Loan Planned?</label>
                              <select required value={salesForm.loanPlanned} onChange={e => setSalesForm({ ...salesForm, loanPlanned: e.target.value })} className={formSelect}><option value="" disabled>Select Option</option><option>Yes</option><option>No</option><option>Not Sure</option></select>
                            </div>
                            <div className={`border-t pt-3 ${theme.tableBorder}`}>
                              <label className="text-xs text-orange-400 font-bold mb-1.5 block">Schedule a Site Visit?</label>
                              <input ref={inputRef} type="datetime-local" value={salesForm.siteVisit} onChange={e => setSalesForm({ ...salesForm, siteVisit: e.target.value })} onClick={() => inputRef.current?.showPicker()} className={`${formInput} focus:border-orange-500`} />
                            </div>
                            <button type="submit" className={`mt-auto w-full font-bold py-3 rounded-xl transition-colors ${theme.btnPrimary}`}>Submit Salesform</button>
                          </form>
                        </div>

                      ) : showLoanForm ? (
                        <div className={`rounded-xl border p-5 shadow-xl flex-1 overflow-y-auto custom-scrollbar flex flex-col animate-fadeIn ${theme.modalCard}`} style={theme.modalGlass}>
                          <div className={`flex justify-between items-center mb-4 border-b pb-3 flex-shrink-0 ${theme.tableBorder}`}>
                            <div>
                              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}><FaUniversity /> Loan Tracking Workflow</h3>
                              <p className={`text-xs mt-0.5 ${theme.textFaint}`}>For Lead #{selectedLead.id}</p>
                            </div>
                            <button type="button" onClick={() => setShowLoanForm(false)} className={`p-1 ${theme.textMuted} hover:text-red-500`}><FaTimes /></button>
                          </div>
                          <form onSubmit={handleLoanFormSubmit} className="flex flex-col gap-5 flex-1">
                            <div>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>1. Loan Decision</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Loan Required? *</label>
                                  <select required value={loanForm.loanRequired} onChange={e => setLoanForm({ ...loanForm, loanRequired: e.target.value })} className={formSelect}><option value="">Select</option><option>Yes</option><option>No</option><option>Not Sure</option></select>
                                </div>
                                <div>
                                  <label className={`text-xs mb-1 block ${theme.textMuted}`}>Loan Status *</label>
                                  <select required value={loanForm.status} onChange={e => setLoanForm({ ...loanForm, status: e.target.value })} className={formSelect}><option value="">Select Status</option><option>Approved</option><option>In Progress</option><option>Rejected</option></select>
                                  {loanForm.status && (<p className={`text-[10px] mt-1.5 font-semibold ${loanForm.status === "Approved" ? "text-green-500" : loanForm.status === "Rejected" ? "text-red-500" : isDark ? "text-yellow-400" : "text-yellow-600"}`}>{loanForm.status === "Approved" && "✅ Loan cleared — schedule closing meeting"}{loanForm.status === "In Progress" && "📄 Follow up on pending documents"}{loanForm.status === "Rejected" && "❌ Loan rejected — suggest co-applicant or other bank"}</p>)}
                                </div>
                              </div>
                            </div>
                            <div className={`border-t pt-4 ${theme.tableBorder}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>2. Bank & Loan Details</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[{ label: "Bank Name", k: "bank", ph: "e.g. HDFC" }, { label: "Amount Required", k: "amountReq", ph: "e.g. 60L" }, { label: "Amount Approved", k: "amountApp", ph: "e.g. 55L" }, { label: "CIBIL Score", k: "cibil", ph: "e.g. 750" }, { label: "Agent Name", k: "agent", ph: "Agent Name" }, { label: "Agent Contact", k: "agentContact", ph: "Agent Phone", tel: true }].map(f => (
                                  <div key={f.k}><label className={`text-xs mb-1 block ${theme.textMuted}`}>{f.label}</label><input type={f.tel ? "tel" : "text"} value={(loanForm as any)[f.k]} onChange={e => setLoanForm({ ...loanForm, [f.k]: e.target.value })} className={formInput} placeholder={f.ph} /></div>
                                ))}
                              </div>
                            </div>
                            <div className={`border-t pt-4 ${theme.tableBorder}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>3. Financial Qualification</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Employment</label><select value={loanForm.empType} onChange={e => setLoanForm({ ...loanForm, empType: e.target.value })} className={formSelect}><option value="">Select</option><option>Salaried</option><option>Self-employed</option></select></div>
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Monthly Income</label><input type="text" value={loanForm.income} onChange={e => setLoanForm({ ...loanForm, income: e.target.value })} className={formInput} placeholder="e.g. 1L" /></div>
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Existing EMIs</label><input type="text" value={loanForm.emi} onChange={e => setLoanForm({ ...loanForm, emi: e.target.value })} className={formInput} placeholder="e.g. 15k" /></div>
                              </div>
                            </div>
                            <div className={`border-t pt-4 ${theme.tableBorder}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}><FaFileAlt /> 4. Document Checklist</h4>
                              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border ${theme.settingsBg}`} style={theme.settingsBgGl}>
                                {["docPan", "docAadhaar", "docSalary", "docBank", "docProperty"].map(docKey => {
                                  const label = docKey === "docPan" ? "PAN Card" : docKey === "docAadhaar" ? "Aadhaar Card" : docKey === "docSalary" ? "Salary Slips / ITR" : docKey === "docBank" ? "Bank Statements" : "Property Documents";
                                  return (
                                    <div key={docKey} className={`flex items-center justify-between border p-2 rounded-lg ${theme.innerBlock}`}>
                                      <span className={`text-xs font-medium ${theme.text}`}>{label}</span>
                                      <select value={(loanForm as any)[docKey]} onChange={e => setLoanForm({ ...loanForm, [docKey]: e.target.value })} className={`text-xs font-bold bg-transparent outline-none cursor-pointer ${(loanForm as any)[docKey] === "Uploaded" ? "text-green-500" : "text-gray-500"}`}><option>Pending</option><option>Uploaded</option></select>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div className={`border-t pt-4 ${theme.tableBorder}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>5. Notes / Remarks</h4>
                              <textarea value={loanForm.notes} onChange={e => setLoanForm({ ...loanForm, notes: e.target.value })} className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none h-20 custom-scrollbar border ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} placeholder="Bank feedback, CIBIL issues, Internal notes..." />
                            </div>
                            <button type="submit" className={`mt-4 flex-shrink-0 w-full font-bold py-3.5 rounded-xl shadow-md transition-colors cursor-pointer ${theme.btnSecondary}`}>Save Loan Tracker Update</button>
                          </form>
                        </div>

                      ) : (
                        <div className="flex flex-col h-full animate-fadeIn">
                          <div className={`flex items-center gap-2 mb-4 border p-1.5 rounded-xl flex-shrink-0 ${theme.tableWrap}`}>
                            <button onClick={() => setDetailTab("personal")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab === "personal" ? theme.btnPrimary : `${theme.textMuted} hover:opacity-80`}`}>Personal Information</button>
                            <button onClick={() => setDetailTab("loan")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab === "loan" ? theme.btnSecondary : `${theme.textMuted} hover:opacity-80`}`}>Loan Tracking</button>
                          </div>
                          <div className={`flex-1 overflow-y-auto custom-scrollbar rounded-xl p-6 pt-4 pb-4 shadow-lg border ${theme.chatPanel}`} style={theme.chatPanelGl}>
                            {detailTab === "personal" ? (
                              <div>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                  {[
                                    { label: "Email", val: selectedLead.email !== "N/A" ? selectedLead.email : "Not Provided" },
                                    { label: "Phone", val: maskPhone(selectedLead.phone, adminUser?.role, selectedLead.assigned_to === adminUser?.name), mono: true },
                                    { label: "Alt Phone", val: selectedLead.altPhone && selectedLead.altPhone !== "N/A" ? maskPhone(selectedLead.altPhone, adminUser?.role, selectedLead.assigned_to === adminUser?.name) : "Not Provided", mono: true },
                                  ].map(f => (
                                    <div key={f.label}><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>{f.label}</p><p className={`font-semibold ${f.mono ? "font-mono" : ""} ${theme.text}`}>{f.val}</p></div>
                                  ))}
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Lead Interest</p>{selectedLead.leadInterestStatus && selectedLead.leadInterestStatus !== "Pending" ? <InterestBadge status={selectedLead.leadInterestStatus} isDark={isDark} /> : <p className={`font-semibold ${theme.text}`}>Pending</p>}</div>
                                  <div className="col-span-2"><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Loan Status</p>{selectedLead.loanStatus && selectedLead.loanStatus !== "N/A" ? <div className="w-fit"><LoanStatusBadge status={selectedLead.loanStatus} isDark={isDark} /></div> : <p className={`font-semibold ${theme.text}`}>N/A</p>}</div>
                                  <div className="col-span-2"><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Residential Address</p><p className={`font-semibold ${theme.text}`}>{selectedLead.address && selectedLead.address !== "N/A" ? selectedLead.address : "Not Provided"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Budget</p><p className={`font-bold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{selectedLead.salesBudget !== "Pending" ? selectedLead.salesBudget : selectedLead.budget}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Property Type</p><p className={`font-semibold ${theme.text}`}>{selectedLead.propType || "Pending"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Type of Use</p><p className={`font-semibold ${theme.text}`}>{selectedLead.useType !== "Pending" ? selectedLead.useType : (selectedLead.purpose || "N/A")}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Planning to Buy?</p><p className={`font-semibold ${theme.text}`}>{selectedLead.planningPurchase || "Pending"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Loan Required?</p><p className={`font-semibold ${theme.text}`}>{getLatestLoanDetails()?.loanRequired}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Status</p><span className={`text-sm font-bold ${selectedLead.status === "Closing" ? "text-amber-500" : selectedLead.status === "Visit Scheduled" ? "text-orange-400" : theme.accentText}`}>{selectedLead.status || "Routed"}</span></div>
                                  <div className={`col-span-2 p-3 rounded-xl border ${theme.settingsBg}`} style={theme.settingsBgGl}>
                                    <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>📍 Site Visit Date</p>
                                    <p className={`text-base font-black ${theme.text}`}>{selectedLead.mongoVisitDate ? formatDate(selectedLead.mongoVisitDate) : "Not Scheduled"}</p>
                                  </div>
                                </div>
                                <div className={`mt-3 border rounded-xl p-3 ${theme.settingsBg}`} style={theme.settingsBgGl}>
                                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 border-b pb-2 ${theme.sectionTitle} ${theme.sectionBorder}`}>Channel Partner Data</h3>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Primary Source</p><p className={`font-medium text-sm ${theme.text}`}>{selectedLead.source || "N/A"}</p></div>
                                    {selectedLead.source === "Others" && (<div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Specified Name</p><p className={`font-medium text-sm ${theme.text}`}>{selectedLead.sourceOther}</p></div>)}
                                  </div>
                                  {selectedLead.source === "Channel Partner" && (
                                    <div className={`mt-2 pt-2 border-t grid grid-cols-1 sm:grid-cols-3 gap-3 ${theme.tableBorder}`}>
                                      {[{ label: "CP Company", val: selectedLead.cp_company || selectedLead.cpCompany }, { label: "CP Phone", val: selectedLead.cp_phone || selectedLead.cpPhone }].map(({ label, val }) => (
                                        <div key={label}><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>{label}</p><p className={`font-medium text-sm ${theme.text}`}>{val || "N/A"}</p></div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                {(() => {
                                  const curLoan: any = getLatestLoanDetails() || {};
                                  const sColor = getLoanStatusColor(curLoan?.status || "");
                                  const isHighProb = curLoan?.status?.toLowerCase() === "approved" && selectedLead.mongoVisitDate;
                                  return (
                                    <>
                                      <h3 className={`text-sm font-bold border-b pb-2 mb-6 uppercase flex items-center justify-between ${isDark ? "text-[#00AEEF]" : "text-[#00AEEF]"}`}><span className="flex items-center gap-2"><FaUniversity /> Deal Loan Overview</span></h3>
                                      {isHighProb && <div className="mb-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 p-3 rounded-lg flex items-center justify-center gap-2 text-orange-400 font-bold tracking-wide shadow-md">🚀 HIGH PROBABILITY DEAL</div>}
                                      <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Loan Required?</p><p className={`font-semibold ${theme.text}`}>{curLoan?.loanRequired}</p></div>
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Current Status</p><p className={`font-bold px-2 py-0.5 rounded inline-block border ${sColor}`}>{curLoan?.status}</p></div>
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Amount Requested</p><p className="text-orange-500 font-semibold">{curLoan?.amountReq}</p></div>
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Amount Approved</p><p className={`font-semibold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{curLoan?.amountApp}</p></div>
                                        {[{ label: "Bank Name", val: curLoan?.bankName }, { label: "CIBIL Score", val: curLoan?.cibil }, { label: "Agent Name", val: curLoan?.agent }, { label: "Agent Contact", val: curLoan?.agentContact }, { label: "Emp Type", val: curLoan?.empType }, { label: "Monthly Income", val: curLoan?.income }, { label: "Existing EMIs", val: curLoan?.emi }].map(f => (
                                          <div key={f.label}><p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>{f.label}</p><p className={`font-semibold ${theme.text}`}>{f.val}</p></div>
                                        ))}
                                        <div className="col-span-2 mb-2"><p className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>Document Status</p></div>
                                        {[{ label: "PAN Card", val: curLoan?.docPan }, { label: "Aadhaar", val: curLoan?.docAadhaar }, { label: "Salary/ITR", val: curLoan?.docSalary }, { label: "Bank Stmt", val: curLoan?.docBank }, { label: "Property Docs", val: curLoan?.docProperty }].map((doc, i) => (
                                          <div key={i} className={`flex items-center justify-between p-2 rounded-lg col-span-1 border ${theme.innerBlock}`}>
                                            <span className={`text-xs ${theme.textMuted}`}>{doc.label}</span>
                                            {doc.val === "Uploaded" ? <FaCheck className="text-green-500 text-xs" /> : <FaClock className={`text-xs ${theme.textFaint}`} />}
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-4 flex-shrink-0">
                            <button className={`border flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1 ${isDark ? "bg-[#9E217B]/10 border-[#9E217B]/30 hover:bg-[#9E217B] text-[#d946a8] hover:text-white" : "bg-[#9E217B]/10 border-[#9E217B]/30 hover:bg-[#9E217B] text-[#9E217B] hover:text-white"}`}><FaMicrophone className="text-lg" /><span className="font-bold text-[10px]">Browser Call</span></button>
                            <button className="bg-green-600/10 border border-green-500/30 hover:bg-green-600 text-green-400 hover:text-white flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1"><FaWhatsapp className="text-xl" /><span className="font-bold text-[10px]">WhatsApp</span></button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT PANEL: FOLLOW-UPS */}
                    <div className={`w-full lg:w-[50%] flex flex-col rounded-2xl overflow-hidden shadow-2xl h-full min-h-0 border ${theme.chatPanel}`} style={theme.chatPanelGl}>
                      <div className={`flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 ${theme.chatArea}`}>
                        {/* System message */}
                        <div className="flex justify-start">
                          <div className={`rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-md ${theme.fupSalesform}`}>
                            <div className={`flex justify-between items-center mb-2 gap-6`}>
                              <span className={`font-bold text-sm ${theme.accentText}`}>System (Front Desk)</span>
                              <span className={`text-[10px] ${theme.textFaint}`}>{formatDate(selectedLead.created_at)}</span>
                            </div>
                            <p className={`text-sm leading-relaxed ${theme.textMuted}`}>Lead assigned to {selectedLead.assigned_to}. Action required.</p>
                          </div>
                        </div>
                        {currentLeadFollowUps.map((msg: any, idx: number) => {
                          const isLoan = msg.message?.includes("🏦 Loan Update");
                          const isSF = msg.message?.includes("📝 Detailed Salesform Submitted");
                          const isClosing = msg.message?.includes("✅ Lead Marked as Closing");
                          const isTransfer = msg.message?.includes("🔄 Lead Transferred");
                          const bubble = isLoan ? theme.fupLoan : isSF ? theme.fupSalesform : isClosing ? theme.fupClosing : isTransfer ? theme.fupTransfer : theme.fupDefault;
                          return (
                            <div key={idx} className="flex justify-start">
                              <div className={`rounded-2xl rounded-tl-none p-4 max-w-[90%] shadow-md ${bubble}`}>
                                <div className="flex justify-between items-center mb-2 gap-6">
                                  <span className={`font-bold text-sm ${theme.text}`}>
                                    {msg.createdBy === "admin" ? `${msg.salesManagerName || "Admin"} (Admin)` : msg.salesManagerName}
                                  </span>
                                  <span className={`text-[10px] flex-shrink-0 ${theme.textFaint}`}>{formatDate(msg.createdAt)}</span>
                                </div>
                                <p className={`text-sm whitespace-pre-wrap leading-relaxed ${theme.textMuted}`}>{msg.message}</p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={followUpEndRef} />
                      </div>
                      <form onSubmit={handleSendCustomNote} className={`p-4 border-t flex gap-3 items-center flex-shrink-0 ${theme.header} ${theme.tableBorder}`} style={theme.headerGlass}>
                        <input type="text" value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder="Add admin note..."
                          className={`flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-colors border ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} />
                        <button type="submit" className={`w-12 h-12 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-lg ${isDark ? "bg-[#9E217B] hover:bg-[#b8268f]" : "bg-[#9E217B] hover:bg-[#8a1d6b]"}`}>
                          <FaPaperPlane className="text-sm ml-[-2px]" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TRANSFER MODAL ── */}
            {isTransferModalOpen && selectedLead && (
              <div className="fixed inset-0 bg-black/75 z-[200] flex justify-center items-center p-4 sm:p-6 animate-fadeIn" style={{ backdropFilter: "blur(8px)" }}>
                <div className={`rounded-2xl w-full max-w-lg shadow-2xl border overflow-hidden ${theme.modalCard}`} style={theme.modalGlass}>
                  <div className={`p-5 border-b flex justify-between items-center ${isDark ? "bg-purple-900/20 border-purple-500/20" : "bg-purple-50 border-purple-200"}`}>
                    <div>
                      <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-purple-400" : "text-purple-700"}`}><FaExchangeAlt /> Transfer Lead #{selectedLead.id}</h2>
                      <p className={`text-xs mt-1 ${theme.textMuted}`}>Transferring: <strong>{selectedLead.name}</strong></p>
                    </div>
                    <button onClick={() => { setIsTransferModalOpen(false); setTransferNote(""); setTransferTarget(""); }} className={`p-2 ${theme.textMuted} hover:text-red-500 transition-colors`}><FaTimes /></button>
                  </div>
                  <div className={`p-6 ${theme.modalInner}`}>
                    <div className="mb-5">
                      <label className={`block text-sm font-bold mb-2 ${isDark ? "text-purple-400" : "text-purple-700"}`}>Transfer to Manager *</label>
                      <select required value={transferTarget} onChange={e => setTransferTarget(e.target.value)}
                        className={`w-full rounded-xl p-3 text-sm outline-none transition-colors border-2 cursor-pointer ${isDark ? "bg-[#14141B] border-purple-500/40 text-white" : "bg-white border-purple-300 text-[#1A1A1A]"}`}>
                        <option value="" disabled>-- Select Manager --</option>
                        {isFetchingManagers ? <option disabled>Loading managers…</option> : salesManagers.filter((m: any) => m.name !== (selectedLead.assigned_to || selectedLead.assignedTo)).length > 0 ? salesManagers.filter((m: any) => m.name !== (selectedLead.assigned_to || selectedLead.assignedTo)).map((m: any, i: number) => <option key={i} value={m.name}>{m.name} ({String(m.role || "Manager").replace("_", " ")})</option>) : <option disabled>No other assignees available</option>}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDark ? "text-purple-400" : "text-purple-700"}`}>Handover Summary * (min 50 chars)</label>
                      <textarea required value={transferNote} onChange={e => setTransferNote(e.target.value)} rows={7}
                        placeholder="Summarize actions, discussions, interest level..."
                        className={`w-full rounded-xl px-4 py-3 text-sm outline-none resize-none leading-relaxed border-2 transition-colors custom-scrollbar ${isDark ? "bg-[#14141B] border-purple-500/30 text-white focus:border-purple-500" : "bg-white border-purple-200 text-[#1A1A1A] focus:border-purple-500"}`} />
                    </div>
                  </div>
                  <div className={`p-5 border-t flex justify-end gap-3 ${theme.modalHeader} ${theme.tableBorder}`}>
                    <button onClick={() => { setIsTransferModalOpen(false); setTransferNote(""); setTransferTarget(""); }}
                      className={`px-6 py-2.5 rounded-lg font-bold cursor-pointer transition-colors ${theme.textMuted} hover:text-red-500`}>Cancel</button>
                    <button onClick={handleTransferLead} disabled={isTransferring || !transferTarget || transferNote.trim().length < 50}
                      className={`px-8 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 ${isTransferring || !transferTarget || transferNote.trim().length < 50 ? "opacity-50 cursor-not-allowed bg-purple-400 text-white" : "cursor-pointer bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"}`}>
                      {isTransferring ? "Transferring…" : <><FaExchangeAlt /> Confirm Transfer</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// RECEPTIONIST VIEW
// ============================================================================
// ============================================================================
// RECEPTIONIST VIEW
// ============================================================================
function ReceptionistView({ receptionists, allLeads, followUps, isLoading, refetch, theme, isDark, adminUser }: any) {
  const [assignedTableFilter, setAssignedTableFilter] = useState<"working" | "all">("working");
  const [selectedReceptionist, setSelectedReceptionist] = useState<any>(null);
  const [searchRecep, setSearchRecep] = useState("");
  const [activeSection, setActiveSection] = useState<"enquiries" | "assignedTable" | "assignedForm" | "closed">("enquiries");
  const [subView, setSubView] = useState<"list" | "detail">("list");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const followUpEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Full detail panel state ──────────────────────────────────────────
  const [detailTab, setDetailTab] = useState<"personal" | "loan">("personal");
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [salesForm, setSalesForm] = useState({ propertyType: "", location: "", budget: "", useType: "", purchaseDate: "", loanPlanned: "", siteVisit: "", leadStatus: "" });
  const [loanForm, setLoanForm] = useState({ loanRequired: "", status: "", bank: "", amountReq: "", amountApp: "", cibil: "", agent: "", agentContact: "", empType: "", income: "", emi: "", docPan: "Pending", docAadhaar: "Pending", docSalary: "Pending", docBank: "Pending", docProperty: "Pending", notes: "" });
  const [customNote, setCustomNote] = useState("");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferNote, setTransferNote] = useState("");
  const [transferTarget, setTransferTarget] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  // ── Reassign state (fix wrong manager on any lead) ──
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignTarget, setReassignTarget] = useState("");
  const [reassignNote, setReassignNote] = useState("");
  const [isReassigning, setIsReassigning] = useState(false);
  const [salesManagers, setSalesManagers] = useState<any[]>([]);
  const [siteHeads, setSiteHeads] = useState<any[]>([]);
  const [isFetchingManagers, setIsFetchingManagers] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ── Auto-drill into a lead when navigated from Enquiry Overview ──
  useEffect(() => {
    const raw = localStorage.getItem("crm_drill_lead");
    if (!raw) return;
    try {
      const drillLead = JSON.parse(raw);
      if (drillLead._drillTab !== "receptionist") return;
      localStorage.removeItem("crm_drill_lead");
      const recep = receptionists.find((r: any) => r.name === drillLead.assigned_receptionist);
      if (recep) {
        setSelectedReceptionist(recep);
        setActiveSection("assignedForm");
        setSelectedLead(drillLead);
        setIsEnquiryView(false);
        setSubView("detail");
      }
    } catch { }
  }, [receptionists]);

  // ── Lazy load state ──────────────────────────────────────────────────────────
  const [visibleCount, setVisibleCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadLessRef = useRef<HTMLDivElement>(null);

  const combinedAssignees = useMemo(() => {
    return [...salesManagers, ...siteHeads];
  }, [salesManagers, siteHeads]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

  useEffect(() => {
    setIsFetchingManagers(true);
    Promise.all([
      fetch("/api/users/sales-manager"),
      fetch("/api/users/site-head")
    ]).then(async ([resSM, resSH]) => {
      if (resSM.ok) {
        const j = await resSM.json();
        setSalesManagers(j.data || j || []);
      }
      if (resSH.ok) {
        const j = await resSH.json();
        setSiteHeads(j.data || j || []);
      }
    }).catch(() => { })
      .finally(() => setIsFetchingManagers(false));
  }, []);

  const [isEnquiryView, setIsEnquiryView] = useState(false);

  const currentFollowUps = useMemo(
    () => (followUps || []).filter((f: any) => String(f.leadId) === String(selectedLead?.id)),
    [followUps, selectedLead]
  );

  const getLatestLoanDetails = () => {
    if (!selectedLead) return null;
    let ex: Record<string, any> = { loanRequired: selectedLead.loanPlanned || "N/A", status: "Pending", bankName: "N/A", amountReq: "N/A", amountApp: "N/A", cibil: "N/A", agent: "N/A", agentContact: "N/A", empType: "N/A", income: "N/A", emi: "N/A", docPan: "Pending", docAadhaar: "Pending", docSalary: "Pending", docBank: "Pending", docProperty: "Pending", notes: "N/A" };
    const lu = currentFollowUps.filter((f: any) => f.message?.includes("🏦 Loan Update:"));
    if (lu.length > 0) {
      const msg = lu[lu.length - 1].message;
      const g = (l: string) => { const m = msg.match(new RegExp(`• ${l}: (.*)`)); return m ? m[1].trim() : "N/A"; };
      ex = { loanRequired: g("Loan Required"), status: g("Status"), bankName: g("Bank Name"), amountReq: g("Amount Requested"), amountApp: g("Amount Approved"), cibil: g("CIBIL Score"), agent: g("Agent Name"), agentContact: g("Agent Contact"), empType: g("Employment Type"), income: g("Monthly Income"), emi: g("Existing EMIs"), docPan: g("PAN Card"), docAadhaar: g("Aadhaar Card"), docSalary: g("Salary Slips"), docBank: g("Bank Statements"), docProperty: g("Property Docs"), notes: g("Notes") };
    }
    return ex;
  };

  const getLoanStatusColor = (s: string) => {
    const sl = (s || "").toLowerCase();
    if (sl === "approved") return isDark ? "bg-green-900/20 text-green-400 border-green-500/30" : "bg-green-50 text-green-700 border-green-300";
    if (sl === "rejected") return isDark ? "bg-red-900/20 text-red-400 border-red-500/30" : "bg-red-50 text-red-700 border-red-300";
    if (sl === "in progress") return isDark ? "bg-yellow-900/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-50 text-yellow-700 border-yellow-300";
    return isDark ? "bg-gray-900/20 text-gray-400 border-gray-500/30" : "bg-gray-50 text-gray-600 border-gray-300";
  };

  const prefillSalesForm = () => {
    const sf = currentFollowUps.filter((f: any) => f.message?.includes("Detailed Salesform Submitted"));
    if (sf.length === 0) return;
    const msg = sf[sf.length - 1].message;
    const g = (label: string) => { const m = msg.match(new RegExp(`• ${label}: (.*)`)); return m && m[1].trim() !== "N/A" ? m[1].trim() : ""; };
    setSalesForm({ propertyType: g("Property Type"), location: g("Location"), budget: g("Budget"), useType: g("Use Type"), purchaseDate: g("Planning to Purchase"), loanPlanned: g("Loan Planned"), leadStatus: g("Lead Status"), siteVisit: "" });
  };

  const prefillLoanForm = () => {
    const cur = getLatestLoanDetails();
    if (!cur) return;
    const n = (v: string) => v !== "N/A" ? v : "";
    setLoanForm({ loanRequired: n(cur.loanRequired), status: cur.status !== "Pending" ? cur.status : "", bank: n(cur.bankName), amountReq: n(cur.amountReq), amountApp: n(cur.amountApp), cibil: n(cur.cibil), agent: n(cur.agent), agentContact: n(cur.agentContact), empType: n(cur.empType), income: n(cur.income), emi: n(cur.emi), docPan: cur.docPan !== "N/A" ? cur.docPan : "Pending", docAadhaar: cur.docAadhaar !== "N/A" ? cur.docAadhaar : "Pending", docSalary: cur.docSalary !== "N/A" ? cur.docSalary : "Pending", docBank: cur.docBank !== "N/A" ? cur.docBank : "Pending", docProperty: cur.docProperty !== "N/A" ? cur.docProperty : "Pending", notes: n(cur.notes) });
  };

  const actorName = adminUser?.name || "Admin";

  const handleSendCustomNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNote.trim() || !selectedLead) return;
    const nm = { leadId: String(selectedLead.id), salesManagerName: actorName, createdBy: "admin", message: customNote, siteVisitDate: null, createdAt: new Date().toISOString() };
    setCustomNote("");
    try { await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nm) }); refetch(); } catch { }
  };

  const handleSalesFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    const msg = `📝 Detailed Salesform Submitted:\n• Property Type: ${salesForm.propertyType || "N/A"}\n• Location: ${salesForm.location || "N/A"}\n• Budget: ${salesForm.budget || "N/A"}\n• Use Type: ${salesForm.useType || "N/A"}\n• Planning to Purchase: ${salesForm.purchaseDate || "N/A"}\n• Loan Planned: ${salesForm.loanPlanned || "N/A"}\n• Lead Status: ${salesForm.leadStatus || "N/A"}\n• Site Visit Requested: ${salesForm.siteVisit ? new Date(salesForm.siteVisit).toLocaleString("en-IN") : "No"}`;
    const nm = { leadId: String(selectedLead.id), salesManagerName: actorName, createdBy: "admin", message: msg, siteVisitDate: salesForm.siteVisit || null, createdAt: new Date().toISOString() };
    const ns = salesForm.siteVisit ? "Visit Scheduled" : selectedLead.status;
    setShowSalesForm(false);
    setSalesForm({ propertyType: "", location: "", budget: "", useType: "", purchaseDate: "", loanPlanned: "", siteVisit: "", leadStatus: "" });
    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nm) });
      await fetch(`/api/walkin_enquiries/${selectedLead.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: selectedLead.name, status: ns }) });
      refetch();
    } catch { }
  };

  const handleLoanFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    const msg = `🏦 Loan Update:\n• Loan Required: ${loanForm.loanRequired || "N/A"}\n• Status: ${loanForm.status || "N/A"}\n• Bank Name: ${loanForm.bank || "N/A"}\n• Amount Requested: ${loanForm.amountReq || "N/A"}\n• Amount Approved: ${loanForm.amountApp || "N/A"}\n• CIBIL Score: ${loanForm.cibil || "N/A"}\n• Agent Name: ${loanForm.agent || "N/A"}\n• Agent Contact: ${loanForm.agentContact || "N/A"}\n• Employment Type: ${loanForm.empType || "N/A"}\n• Monthly Income: ${loanForm.income || "N/A"}\n• Existing EMIs: ${loanForm.emi || "N/A"}\n• PAN Card: ${loanForm.docPan || "Pending"}\n• Aadhaar Card: ${loanForm.docAadhaar || "Pending"}\n• Salary Slips: ${loanForm.docSalary || "Pending"}\n• Bank Statements: ${loanForm.docBank || "Pending"}\n• Property Docs: ${loanForm.docProperty || "Pending"}\n• Notes: ${loanForm.notes || "N/A"}`;
    const nm = { leadId: String(selectedLead.id), salesManagerName: actorName, createdBy: "admin", message: msg, siteVisitDate: null, createdAt: new Date().toISOString() };
    setShowLoanForm(false);
    showToast(`Loan data logged for ${selectedLead.name}`);
    try { await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nm) }); refetch(); } catch { }
  };

  const handleMarkAsClosing = async () => {
    if (!selectedLead || selectedLead.status === "Closing") return;
    const nm = { leadId: String(selectedLead.id), salesManagerName: actorName, createdBy: "admin", message: `✅ Lead Marked as Closing by ${actorName} (Admin)`, siteVisitDate: null, createdAt: new Date().toISOString() };
    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nm) });
      await fetch(`/api/walkin_enquiries/${selectedLead.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: selectedLead.name, status: "Closing" }) });
      showToast(`🎉 ${selectedLead.name} marked as Closing!`);
      refetch();
    } catch { }
  };

  const handleTransferLead = async () => {
    if (!selectedLead || !transferTarget || transferNote.trim().length < 50) return;
    setIsTransferring(true);
    try {
      const res = await fetch("/api/leads/transfer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: selectedLead.id, transfer_to: transferTarget, transfer_note: transferNote, transferred_by: actorName }) });
      if (!res.ok) throw new Error("Transfer failed");
      setIsTransferModalOpen(false); setTransferNote(""); setTransferTarget("");
      showToast(`Lead #${selectedLead.id} transferred to ${transferTarget}!`);
      setSubView("list"); setSelectedLead(null);
      refetch();
    } catch (e: any) { alert(e.message ?? "Transfer failed."); }
    finally { setIsTransferring(false); }
  };

  const handleReassignLead = async () => {
    if (!selectedLead || !reassignTarget || reassignNote.trim().length < 10) return;
    if (reassignTarget === (selectedLead.assignedTo || selectedLead.assigned_to)) {
      alert("Please select a different manager.");
      return;
    }
    setIsReassigning(true);
    try {
      const res = await fetch("/api/leads/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          transfer_to: reassignTarget,
          transfer_note: `🔁 Reassigned by ${actorName} (Admin) — Reason: ${reassignNote}`,
          transferred_by: actorName,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Reassign failed");
      }
      setIsReassignModalOpen(false);
      setReassignNote("");
      setReassignTarget("");
      showToast(`✅ Lead #${selectedLead.id} reassigned to ${reassignTarget}!`);
      refetch();
    } catch (e: any) {
      alert(e.message ?? "Reassign failed. Try again.");
    } finally {
      setIsReassigning(false);
    }
  };

  const formInput = `w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors border ${theme.inputInner} ${theme.text} ${theme.inputFocus}`;
  const formSelect = `w-full rounded-lg px-4 py-2.5 text-sm outline-none cursor-pointer border ${theme.inputInner} ${theme.text} ${theme.inputFocus}`;


  const formatDate = (ds: string) => {
    if (!ds) return "—";
    try { return new Date(ds).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return ds; }
  };

  const maskPhone = (phone: any, userRole: string = "admin", isOwner: boolean = true) => {
    if (!phone || phone === "N/A") return "N/A";
    const c = String(phone).replace(/[^a-zA-Z0-9]/g, "");
    if (c.length <= 5) return c;
    if (userRole === "admin" || isOwner) return c;
    if (userRole === "site_head" && !isOwner) return `${c.slice(0, 2)}XXXXXX${c.slice(-2)}`;
    return `${c.slice(0, 2)}*****${c.slice(-3)}`;
  };

  // ── Sidebar filter ──────────────────────────────────────────────────────────
  const filteredRecep = receptionists.filter((r: any) =>
    r.name?.toLowerCase().includes(searchRecep.toLowerCase())
  );

  const recepName = selectedReceptionist?.name ?? "";

  // ── Enrich leads with follow-up data ────────────────────────────────────────
  const mergedLeads = useMemo(() => {
    return allLeads.map((lead: any) => {
      const lf = (followUps || []).filter((f: any) => String(f.leadId) === String(lead.id));
      const salesForms = lf.filter((f: any) => f.message?.includes("Detailed Salesform Submitted"));
      const latestMsg = salesForms.length > 0 ? salesForms[salesForms.length - 1].message : "";
      const g = (field: string) => {
        if (!latestMsg) return "Pending";
        const m = latestMsg.match(new RegExp(`• ${field}: (.*)`));
        return m ? m[1].trim() : "Pending";
      };
      const loanUpdates = lf.filter((f: any) => f.message?.includes("🏦 Loan Update:"));
      let loanStatus = "N/A";
      if (loanUpdates.length > 0) {
        const msg = loanUpdates[loanUpdates.length - 1].message;
        const mS = msg.match(/• Status: (.*)/); if (mS) loanStatus = mS[1].trim();
      }
      const visitsWithDate = lf.filter((f: any) => f.siteVisitDate?.trim());
      const mongoVisitDate = visitsWithDate.length > 0 ? visitsWithDate[visitsWithDate.length - 1].siteVisitDate : null;
      const closingFups = lf.filter((f: any) => f.message?.includes("✅ Lead Marked as Closing"));
      const closingDate = closingFups.length > 0 ? closingFups[closingFups.length - 1].createdAt : null;
      const sfBudget = g("Budget");
      const activeBudget = sfBudget !== "Pending" && sfBudget !== "N/A" ? sfBudget : (lead.budget || "Pending");

      return {
        ...lead,
        propType: (g("Property Type") !== "Pending" && g("Property Type") !== "N/A") ? g("Property Type") : (lead.configuration || "Pending"),
        salesBudget: activeBudget,
        useType: g("Use Type") !== "Pending" ? g("Use Type") : (lead.purpose || "Pending"),
        leadInterestStatus: g("Lead Status"),
        loanStatus, mongoVisitDate, closingDate,
        allFollowUps: lf,
        status: lead.status === "Closing" ? "Closing" : mongoVisitDate ? "Visit Scheduled" : lead.status,
      };
    });
  }, [allLeads, followUps]);

  // ── 4 section datasets ───────────────────────────────────────────────────────
  const allEnquiries = mergedLeads;

  const assignedLeads = useMemo(
    () => mergedLeads.filter((l: any) => l.assigned_to === recepName),
    [mergedLeads, recepName]
  );

  const assignedFormLeads = useMemo(
    () => mergedLeads.filter((l: any) => l.assigned_receptionist === recepName),
    [mergedLeads, recepName]
  );

  const closedLeads = useMemo(
    () => mergedLeads.filter((l: any) =>
      l.assigned_receptionist === recepName &&
      (l.status === "Closing" || l.status === "Closed" || !!l.closingDate)
    ),
    [mergedLeads, recepName]
  );

  // ── Total leads in the currently active section (drives lazy loader) ─────────
  const currentSectionTotal = useMemo(() => {
    if (activeSection === "enquiries") return allEnquiries.length;
    if (activeSection === "assignedForm") return assignedFormLeads.length;
    if (activeSection === "closed") return closedLeads.length;
    if (activeSection === "assignedTable") {
      return assignedTableFilter === "working"
        ? assignedLeads.filter((l: any) => l.status !== "Closing" && l.status !== "Closed" && !l.closingDate).length
        : assignedLeads.length;
    }
    return 0;
  }, [activeSection, allEnquiries.length, assignedFormLeads.length, closedLeads.length, assignedLeads, assignedTableFilter]);

  // ── Bottom sentinel: load 20 more on scroll down ──────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 20, currentSectionTotal));
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [currentSectionTotal]);

  // ── Top sentinel: unload back to 20 when scrolled fully back up ───────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount > 20) {
          setVisibleCount(20);
        }
      },
      { threshold: 1.0 }
    );
    if (loadLessRef.current) observer.observe(loadLessRef.current);
    return () => observer.disconnect();
  }, [visibleCount]);

  // ── Reset count when section or receptionist changes ─────────────────────────
  useEffect(() => {
    setVisibleCount(20);
  }, [activeSection, selectedReceptionist?.name, assignedTableFilter]);

  // ── Status badge ─────────────────────────────────────────────────────────────
  const statusCls = (status: string) => {
    const s = status || "Routed";
    if (s === "Closing" || s === "Closed") return isDark
      ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10"
      : "text-amber-600 border-amber-400/50 bg-amber-50";
    if (s === "Visit Scheduled") return isDark
      ? "text-orange-400 border-orange-500/30 bg-orange-500/10 text-sm font-bold"
      : "text-orange-500 border-orange-400/40 bg-orange-50 text-sm font-bold";
    return isDark
      ? "text-[#d946a8] border-[#9E217B]/30 bg-[#9E217B]/10"
      : "text-[#9E217B] border-[#9E217B]/30 bg-[#9E217B]/10";
  };

  // ── Section config ────────────────────────────────────────────────────────────
  const sections = [
    { key: "enquiries", label: "Walk-in Enquiries", icon: "🗒️", count: allEnquiries.length, desc: "All walk-in forms logged in the system" },
    { key: "assignedTable", label: "Assigned Lead Table", icon: "🗃️", count: assignedLeads.length, desc: "Leads where assigned_to = this receptionist" },
    { key: "assignedForm", label: "Assigned Lead Form", icon: "📋", count: assignedFormLeads.length, desc: "Leads self-assigned by receptionist (acting as sales manager)" },
    { key: "closed", label: "Closed Leads", icon: "✅", count: closedLeads.length, desc: "Leads closed by this receptionist" },
  ] as const;

  // ── Reusable table renderer ───────────────────────────────────────────────────
  const renderTable = (leads: any[], showAssignedInfo = false, isEnquiryTable = false) => (
    <div className={`rounded-2xl overflow-hidden border ${theme.tableWrap}`} style={theme.tableGlass}>
      <div className="overflow-x-auto">
        <div ref={loadLessRef} style={{ height: "1px", width: "100%" }} />
        <table className="w-full text-left text-sm">
          <thead className={`text-xs uppercase ${theme.tableHead} ${theme.textHeader}`}>
            <tr>
              <th className="px-4 py-3">Lead ID</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Interest</th>
              {showAssignedInfo && <th className="px-4 py-3">Assigned To</th>}
              <th className="px-4 py-3">Site Visit</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Action</th>
              {isEnquiryTable && <th className="px-4 py-3">Reassign</th>}
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.tableDivide}`}>
            {isLoading ? (
              <tr><td colSpan={10} className={`text-center py-8 ${theme.textMuted}`}>Syncing…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={10} className={`text-center py-12 ${theme.textMuted}`}>
                <FaClipboardList className="text-3xl mx-auto mb-3 opacity-20" />
                <p className="text-sm">No leads found.</p>
              </td></tr>
            ) : leads.map((lead: any) => (
              <tr
                key={lead.id}
                className={`transition-colors ${theme.tableRow} ${!isEnquiryTable ? "cursor-pointer" : ""}`}
                onClick={!isEnquiryTable ? () => { setIsEnquiryView(false); setSelectedLead(lead); setSubView("detail"); } : undefined}
              >
                <td className={`px-4 py-3 font-black text-sm ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>#{lead.id}</td>

                {/* CLIENT NAME */}
                <td className={`px-4 py-3 font-semibold whitespace-nowrap ${theme.text}`}>
                  {isEnquiryTable ? (
                    <span
                      className={`cursor-pointer hover:underline ${isDark ? "hover:text-[#d946a8]" : "hover:text-[#9E217B]"} transition-colors`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEnquiryView(true);
                        setSelectedLead(lead);
                        setSubView("detail");
                      }}
                    >
                      {lead.name}
                    </span>
                  ) : (
                    lead.name
                  )}
                </td>

                <td className={`px-4 py-3 font-semibold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{lead.salesBudget || lead.budget || "N/A"}</td>
                <td className={`px-4 py-3 font-mono text-xs ${theme.textMuted}`}>{maskPhone(lead.phone, adminUser?.role, lead.assigned_to === adminUser?.name)}</td>
                <td className={`px-4 py-3 text-xs ${theme.textMuted}`}>{lead.source || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border flex-shrink-0 whitespace-nowrap ${statusCls(lead.status)}`}>
                    {lead.status || "Routed"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {lead.leadInterestStatus && lead.leadInterestStatus !== "Pending" ? (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border whitespace-nowrap ${lead.leadInterestStatus === "Interested" ? (isDark ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-green-700 border-green-200 bg-green-50") :
                      lead.leadInterestStatus === "Not Interested" ? (isDark ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-red-700 border-red-200 bg-red-50") :
                        (isDark ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" : "text-yellow-700 border-yellow-200 bg-yellow-50")
                      }`}>{lead.leadInterestStatus}</span>
                  ) : <span className={`text-xs italic ${theme.textFaint}`}>—</span>}
                </td>
                {showAssignedInfo && (
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-bold whitespace-nowrap ${theme.text}`}>
                        {lead.assigned_to || lead.assignedTo || "Unassigned"}
                      </span>
                      {(lead.assigned_to || lead.assignedTo) && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border w-max font-bold uppercase tracking-wider ${siteHeads?.some((sh: any) => sh.name === (lead.assigned_to || lead.assignedTo)) ? (isDark ? "bg-indigo-900/30 text-indigo-300 border-indigo-700/50" : "bg-indigo-50 text-indigo-700 border-indigo-200") : (isDark ? "bg-teal-900/30 text-teal-300 border-teal-700/50" : "bg-teal-50 text-teal-700 border-teal-200")}`}>
                          {siteHeads?.some((sh: any) => sh.name === (lead.assigned_to || lead.assignedTo)) ? "Site Head" : "Sales Manager"}
                        </span>
                      )}
                    </div>
                  </td>
                )}
                <td className={`px-4 py-3 text-xs whitespace-nowrap ${lead.mongoVisitDate ? "text-orange-500 font-semibold" : theme.textFaint}`}>
                  {lead.mongoVisitDate ? formatDate(lead.mongoVisitDate).split(",")[0] : "—"}
                </td>
                <td className={`px-4 py-3 text-xs whitespace-nowrap ${theme.textFaint}`}>
                  {formatDate(lead.created_at).split(",")[0]}
                </td>
                <td className="px-4 py-3">
                  <button
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${isDark ? "bg-[#9E217B] text-white hover:bg-[#b8268f]" : "bg-[#9E217B]/10 text-[#9E217B] hover:bg-[#9E217B] hover:text-white"}`}
                    onClick={e => {
                      e.stopPropagation();
                      setIsEnquiryView(isEnquiryTable);
                      setSelectedLead(lead);
                      setSubView("detail");
                    }}
                  >
                    View
                  </button>
                </td>
                {isEnquiryTable && (
                  <td className="px-4 py-3">
                    {lead.status === "Closed" || lead.status === "Closing" || !!lead.closingDate ? (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border whitespace-nowrap ${isDark ? "text-gray-400 border-gray-600 bg-gray-800/50" : "text-gray-500 border-gray-300 bg-gray-100"}`}>
                        Marked closed
                      </span>
                    ) : (
                      <button
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors whitespace-nowrap ${isDark ? "bg-orange-600 hover:bg-orange-500 text-white" : "bg-orange-100 hover:bg-orange-200 text-orange-700"}`}
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedLead(lead);
                          setReassignTarget("");
                          setReassignNote("");
                          setIsReassignModalOpen(true);
                        }}
                      >
                        <FaExchangeAlt /> Reassign
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {/* ── BOTTOM SENTINEL — triggers load more ── */}
        {visibleCount < leads.length && (
          <div ref={loadMoreRef} className={`flex items-center justify-center gap-3 py-6 ${theme.textMuted}`}>
            <div className="w-4 h-4 rounded-full border-2 border-[#9E217B] border-t-transparent animate-spin" />
            <span className="text-xs font-medium">Loading more… ({visibleCount} of {leads.length})</span>
          </div>
        )}
        {visibleCount >= leads.length && leads.length > 20 && (
          <div className={`text-center py-4 text-xs font-medium ${theme.textFaint}`}>
            ✓ All {leads.length} leads loaded
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full relative">
      {toastMsg && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 animate-fadeIn ${toastMsg.includes("🎉") ? "bg-green-600 border-green-400 text-white" : "bg-[#9E217B] border-[#b8268f] text-white"}`}>
          <div className="text-lg"><FaCheckCircle /></div>
          <span className="text-sm font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Sidebar for Receptionists */}
      <div className={`w-72 border-r flex flex-col h-full flex-shrink-0 z-20 shadow-xl ${theme.innerBlock}`}>
        <div className={`p-5 border-b ${theme.tableBorder}`}>
          <div className="relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${theme.textFaint}`} />
            <input type="text" placeholder="Search Receptionists…" value={searchRecep}
              onChange={e => setSearchRecep(e.target.value)}
              className={`w-full rounded-lg pl-9 pr-4 py-2 text-sm outline-none transition-colors ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} />
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto ${theme.scroll}`} dir="rtl">
          <div dir="ltr" className="min-h-full">
            {isLoading ? (
              <div className={`p-8 text-center text-sm ${theme.textMuted}`}>Loading staff…</div>
            ) : filteredRecep.length === 0 ? (
              <div className={`p-8 text-center text-sm ${theme.textMuted}`}>No receptionists found.</div>
            ) : filteredRecep.map((recep: any) => {
              const isSelected = selectedReceptionist?.id === recep.id || selectedReceptionist?.name === recep.name;
              const recepAssigned = mergedLeads.filter((l: any) => l.assigned_to === recep.name).length;
              const recepCreated = mergedLeads.filter((l: any) => l.assigned_receptionist === recep.name).length;
              const recepClosed = mergedLeads.filter((l: any) => l.assigned_receptionist === recep.name && (l.status === "Closing" || !!l.closingDate)).length;
              return (
                <div key={recep.id || recep.name}
                  onClick={() => { setSelectedReceptionist(recep); setActiveSection("enquiries"); setSubView("list"); setSelectedLead(null); setIsEnquiryView(false); }}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-all border-b ${theme.tableBorder}
                    ${isSelected
                      ? isDark ? "border-r-4 border-r-[#9E217B] bg-[#9E217B]/10" : "border-r-4 border-r-[#9E217B] bg-pink-50"
                      : "hover:opacity-80 border-r-4 border-r-transparent"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0
                    ${isSelected ? "bg-[#9E217B]" : isDark ? "bg-[#333] text-gray-400" : "bg-gray-400"}`}>
                    {recep.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold truncate text-sm mb-0.5 ${theme.text}`}>{recep.name}</h3>
                    <p className={`text-xs capitalize mb-2 ${theme.textFaint}`}>{recep.role?.replace("_", " ")}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${isDark ? "text-[#d946a8] bg-[#9E217B]/10 border-[#9E217B]/20" : "text-[#9E217B] bg-pink-50 border-pink-200"}`}>
                        {recepAssigned} assigned
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${isDark ? "text-purple-400 bg-purple-500/10 border-purple-500/20" : "text-purple-700 bg-purple-50 border-purple-200"}`}>
                        {recepCreated} self-mgd
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${isDark ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
                        {recepClosed} closed
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RIGHT CONTENT PANEL ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {!selectedReceptionist ? (
          <div className={`h-full flex flex-col items-center justify-center ${theme.textMuted}`}>
            <FaClipboardList className="text-4xl mb-4 opacity-20" />
            <p>Select a receptionist from the left sidebar.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Sub-header */}
            <div className={`p-5 border-b flex justify-between items-center shadow-sm z-10 flex-shrink-0 gap-4 ${theme.header}`} style={theme.headerGlass}>
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${theme.text}`}>
                  <FaClipboardList className={isDark ? "text-[#d946a8]" : "text-[#9E217B]"} />
                  {selectedReceptionist.name}'s Dashboard
                </h2>
                <p className={`text-xs mt-1 ${theme.textFaint}`}>
                  {subView === "detail" ? `Viewing lead details · Admin acting on behalf of ${selectedReceptionist.name}` : "Admin view — monitor receptionist activity across all sections"}
                </p>
              </div>
              {subView === "list" && (
                <span className={`text-xs px-3 py-1 rounded-full border font-bold flex items-center gap-1.5 ${isDark ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-green-700 border-green-200 bg-green-50"}`}>
                  🟢 Live Sync Active
                </span>
              )}
            </div>

            {/* ── DETAIL VIEW (enquiry-style, read-only) ── */}
            {subView === "detail" && selectedLead && isEnquiryView && (
              <div className="flex-1 overflow-y-auto p-6 animate-fadeIn">
                <div className={`flex items-center gap-4 mb-6`}>
                  <button
                    onClick={() => { setSubView("list"); setSelectedLead(null); setIsEnquiryView(false); }}
                    className={`w-10 h-10 flex items-center justify-center border rounded-xl transition-colors cursor-pointer ${theme.textMuted} ${theme.tableBorder} ${isDark ? "bg-[#222] hover:bg-[#333]" : "bg-white hover:bg-[#F8FAFC]"}`}>
                    <FaChevronLeft className="text-sm" />
                  </button>
                  <h1 className={`text-xl font-bold flex items-center flex-wrap gap-3 ${theme.text}`}>
                    <span className={isDark ? "text-[#d946a8]" : "text-[#9E217B]"}>#{selectedLead.id}</span>
                    <span>{selectedLead.name}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusCls(selectedLead.status)}`}>
                      {selectedLead.status || "Routed"}
                    </span>
                  </h1>
                </div>
                <div className={`rounded-2xl border p-6 md:p-8 ${theme.card}`} style={theme.cardGlass}>
                  <div className={`rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 text-white ${isDark ? "bg-gradient-to-r from-[#9E217B] to-[#7a1a5e]" : "bg-gradient-to-r from-[#00AEEF] to-[#9E217B]"}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border border-white/30 bg-white/20 flex items-center justify-center font-bold text-xl">
                        {String(selectedLead.assigned_to || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs text-white/70 font-bold tracking-wider uppercase mb-1">Assigned Sales Manager</p>
                        <p className="font-bold text-lg">{selectedLead.assigned_to || "Unassigned"}</p>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs text-white/70 uppercase tracking-wider font-bold mb-1">Source</p>
                      <p className="font-semibold flex items-center sm:justify-end gap-2">
                        <FaBriefcase className="opacity-70" /> {selectedLead.source || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-sm font-bold border-b pb-2 mb-4 uppercase tracking-widest ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"} ${theme.tableBorder}`}>Contact Information</h3>
                        <div className="space-y-4">
                          {[
                            { label: "Phone Number", val: selectedLead.phone, mono: true },
                            { label: "Alt. Phone", val: selectedLead.altPhone || selectedLead.alt_phone || "N/A", mono: true },
                            { label: "Email Address", val: selectedLead.email },
                            { label: "Residential Address", val: selectedLead.address },
                          ].map(({ label, val, mono }) => (
                            <div key={label}>
                              <p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>{label}</p>
                              <p className={`${mono ? "text-lg tracking-widest font-semibold" : "font-medium"} ${theme.text}`}>{val || "N/A"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-sm font-bold border-b pb-2 mb-4 uppercase tracking-widest ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"} ${theme.tableBorder}`}>Property Requirements</h3>
                        <div className={`rounded-xl p-5 space-y-5 border ${theme.settingsBg}`} style={theme.settingsBgGl}>
                          <div>
                            <p className={`text-xs font-medium mb-1 pl-2 ${theme.textFaint}`}>Budget</p>
                            <p className={`font-bold text-xl ${isDark ? "text-green-500" : "text-emerald-600"}`}>{selectedLead.salesBudget || selectedLead.budget || "N/A"}</p>
                          </div>
                          <div className={`grid grid-cols-2 gap-4 border-t pt-5 ${theme.tableBorder}`}>
                            <div>
                              <p className={`text-xs font-medium mb-1 pl-2 ${theme.textFaint}`}>Configuration</p>
                              <p className={`font-medium ${theme.text}`}>{selectedLead.configuration || selectedLead.propType || "N/A"}</p>
                            </div>
                            <div>
                              <p className={`text-xs font-medium mb-1 pl-2 ${theme.textFaint}`}>Purpose</p>
                              <p className={`font-medium ${theme.text}`}>{selectedLead.purpose || selectedLead.useType || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>Loan Planned</p>
                        <p className={`font-semibold ${theme.text}`}>{selectedLead.loanPlanned || selectedLead.loan_planned || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                  {selectedLead.source === "Channel Partner" && (
                    <div className={`mt-8 rounded-xl p-5 border ${theme.settingsBg}`} style={theme.settingsBgGl}>
                      <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 border-b pb-2 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"} ${theme.tableBorder}`}>Channel Partner Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[{ label: "CP Company", val: selectedLead.cp_company || selectedLead.cpCompany }, { label: "CP Phone", val: selectedLead.cp_phone || selectedLead.cpPhone }].map(({ label, val }) => (
                          <div key={label}>
                            <p className={`text-xs font-medium mb-1 ${theme.textFaint}`}>{label}</p>
                            <p className={`font-medium ${theme.text}`}>{val || "N/A"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className={`mt-6 pt-4 border-t flex justify-end ${theme.tableBorder1}`}>
                    <p className={`text-xs ${theme.textFaint}`}>Created: {formatDate(selectedLead.created_at)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── DETAIL VIEW (full panel with follow-ups, mirrors Sales Manager) ── */}
            {subView === "detail" && selectedLead && !isEnquiryView && (
              <div className={`flex-1 overflow-y-auto p-6 ${theme.scroll}`}>
                <div className="animate-fadeIn max-w-[1200px] mx-auto flex flex-col" style={{ minHeight: "500px" }}>
                  <div className={`flex items-center justify-between mb-4 rounded-2xl border p-4 sm:p-5 shadow-xl flex-shrink-0 ${theme.card}`} style={theme.cardGlass}>
                    <div className="flex items-center gap-4">
                      <button onClick={() => { setSubView("list"); setSelectedLead(null); setIsEnquiryView(false); setShowSalesForm(false); setShowLoanForm(false); }}
                        className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors cursor-pointer ${theme.innerBlock} ${theme.textMuted}`}>
                        <FaChevronLeft className="text-sm" />
                      </button>
                      <h1 className={`text-xl md:text-2xl font-bold flex items-center gap-3 ${theme.text}`}>
                        <span className={isDark ? "text-[#d946a8]" : "text-[#9E217B]"}>#{selectedLead.id}</span>
                        <span>{selectedLead.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${theme.settingsBg} ${theme.textFaint}`}>
                          {selectedLead.assigned_receptionist || selectedReceptionist?.name}
                        </span>
                        {selectedLead.status === "Closing" && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDark ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" : "text-amber-600 border-amber-400/50 bg-amber-50"}`}>
                            <FaHandshake className="inline mr-1 text-[9px]" />Closing
                          </span>
                        )}
                      </h1>
                    </div>
                    <div className="flex gap-3 flex-wrap justify-end">
                      {!showSalesForm && !showLoanForm && (
                        <>
                          <button onClick={() => { prefillSalesForm(); setShowSalesForm(true); setShowLoanForm(false); }}
                            className={`${theme.btnPrimary} px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer`}>
                            <FaFileInvoice /> Fill Salesform
                          </button>
                          <button onClick={() => { prefillLoanForm(); setShowLoanForm(true); setShowSalesForm(false); }}
                            className={`${theme.btnSecondary} px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer`}>
                            <FaUniversity /> Track Loan
                          </button>
                          {selectedLead.mongoVisitDate && selectedLead.status !== "Closing" && (
                            <button onClick={handleMarkAsClosing}
                              className={`${theme.btnWarning} px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer`}>
                              <FaHandshake /> Mark Closing
                            </button>
                          )}
                          <button onClick={() => { setTransferTarget(""); setTransferNote(""); setIsTransferModalOpen(true); }}
                            className={`font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer ${isDark ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}`}>
                            <FaExchangeAlt /> Transfer
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-2">
                    <div className="w-full lg:w-[45%] flex flex-col gap-4 h-full pb-2 min-h-0">
                      {showSalesForm ? (
                        <div className={`rounded-xl border p-5 shadow-xl flex flex-col ${theme.modalCard} ${theme.scroll}`}
                          style={{ ...theme.modalGlass, overflowY: "scroll", height: "calc(100vh - 320px)", scrollbarWidth: "thin" }}>
                          <div className={`flex justify-between items-center mb-4 border-b pb-3 ${theme.tableBorder}`}>
                            <div>
                              <h3 className={`text-lg font-bold ${theme.text}`}>Sales Data Form</h3>
                              <p className={`text-xs mt-0.5 ${theme.accentText}`}>Admin override — Lead #{selectedLead.id}</p>
                            </div>
                            <button type="button" onClick={() => setShowSalesForm(false)} className={`p-1 ${theme.textMuted}`}><FaTimes /></button>
                          </div>
                          <form onSubmit={handleSalesFormSubmit} className="flex flex-col gap-4 flex-1">
                            {[{ label: "Property Type?", key: "propertyType", ph: "e.g. 1BHK, 2BHK" }, { label: "Preferred Location?", key: "location", ph: "e.g. Dombivali, Kalyan" }, { label: "Approximate Budget?", key: "budget", ph: "e.g. 5 cr" }].map(f => (
                              <div key={f.key}><label className={`text-xs mb-1 block ${theme.textMuted}`}>{f.label}</label>
                                <input type="text" placeholder={f.ph} value={(salesForm as any)[f.key]} onChange={e => setSalesForm({ ...salesForm, [f.key]: e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} />
                              </div>
                            ))}
                            <div className="grid grid-cols-2 gap-3">
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Self-use or Investment?</label>
                                <select value={salesForm.useType} onChange={e => setSalesForm({ ...salesForm, useType: e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none ${theme.select}`}>
                                  <option value="">Select</option><option>Self Use</option><option>Investment</option>
                                </select>
                              </div>
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Planning to Purchase?</label>
                                <select value={salesForm.purchaseDate} onChange={e => setSalesForm({ ...salesForm, purchaseDate: e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none ${theme.select}`}>
                                  <option value="">Select</option><option>Immediate</option><option>Next 3 Months</option>
                                </select>
                              </div>
                            </div>
                            <div className={`border-t pt-3 mt-1 ${theme.tableBorder}`}>
                              <label className={`block text-xs font-bold mb-1.5 ${theme.accentText}`}>Lead Interest Status *</label>
                              <select required value={salesForm.leadStatus} onChange={e => setSalesForm({ ...salesForm, leadStatus: e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none cursor-pointer ${theme.select}`}>
                                <option value="" disabled>Select Status</option><option>Interested</option><option>Not Interested</option><option>Maybe</option>
                              </select>
                            </div>
                            <div className={`border-t pt-3 mt-1 ${theme.tableBorder}`}>
                              <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>Loan Planned?</label>
                              <select required value={salesForm.loanPlanned} onChange={e => setSalesForm({ ...salesForm, loanPlanned: e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none cursor-pointer ${theme.select}`}>
                                <option value="" disabled>Select Option</option><option>Yes</option><option>No</option><option>Not Sure</option>
                              </select>
                            </div>
                            <div className={`mt-2 border-t pt-3 ${theme.tableBorder}`}>
                              <label className="text-xs text-orange-500 font-bold mb-1.5 block">Schedule a Site Visit?</label>
                              <input ref={inputRef} type="datetime-local" value={salesForm.siteVisit} onChange={e => setSalesForm({ ...salesForm, siteVisit: e.target.value })} onClick={() => inputRef.current?.showPicker()} className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none ${theme.inputInner} ${theme.text} focus:border-orange-500`} />
                            </div>
                            <button type="submit" className={`mt-auto w-full font-bold py-3.5 rounded-xl transition-colors flex-shrink-0 ${theme.btnPrimary}`}>Submit Salesform</button>
                          </form>
                        </div>
                      ) : showLoanForm ? (
                        <div className={`rounded-xl border p-5 shadow-xl flex flex-col animate-fadeIn ${theme.modalCard} ${theme.scroll}`}
                          style={{ ...theme.modalGlass, overflowY: "scroll", height: "calc(100vh - 320px)", scrollbarWidth: "thin" }}>
                          <div className={`flex justify-between items-center mb-4 border-b pb-3 flex-shrink-0 ${theme.tableBorder}`}>
                            <div>
                              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}><FaUniversity /> Loan Tracking</h3>
                              <p className={`text-xs mt-0.5 ${theme.textFaint}`}>For Lead #{selectedLead.id}</p>
                            </div>
                            <button type="button" onClick={() => setShowLoanForm(false)} className={`p-1 ${theme.textMuted}`}><FaTimes /></button>
                          </div>
                          <form onSubmit={handleLoanFormSubmit} className="flex flex-col gap-4 flex-1">
                            <div className="grid grid-cols-2 gap-3">
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Loan Required? *</label>
                                <select required value={loanForm.loanRequired} onChange={e => setLoanForm({ ...loanForm, loanRequired: e.target.value })} className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer ${theme.select}`}>
                                  <option value="">Select</option><option>Yes</option><option>No</option><option>Not Sure</option>
                                </select>
                              </div>
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Loan Status *</label>
                                <select required value={loanForm.status} onChange={e => setLoanForm({ ...loanForm, status: e.target.value })} className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer ${theme.select}`}>
                                  <option value="">Select Status</option><option>Approved</option><option>In Progress</option><option>Rejected</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {[{ label: "Bank Name", k: "bank", ph: "e.g. HDFC" }, { label: "Amount Required", k: "amountReq", ph: "e.g. 60L" }, { label: "Amount Approved", k: "amountApp", ph: "e.g. 55L" }, { label: "CIBIL Score", k: "cibil", ph: "e.g. 750" }, { label: "Agent Name", k: "agent", ph: "Agent Name" }, { label: "Agent Contact", k: "agentContact", ph: "Agent Phone" }].map(f => (
                                <div key={f.k}><label className={`text-xs mb-1 block ${theme.textMuted}`}>{f.label}</label><input type="text" value={(loanForm as any)[f.k]} onChange={e => setLoanForm({ ...loanForm, [f.k]: e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} placeholder={f.ph} /></div>
                              ))}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Employment</label>
                                <select value={loanForm.empType} onChange={e => setLoanForm({ ...loanForm, empType: e.target.value })} className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer ${theme.select}`}>
                                  <option value="">Select</option><option>Salaried</option><option>Self-employed</option>
                                </select>
                              </div>
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Monthly Income</label><input type="text" value={loanForm.income} onChange={e => setLoanForm({ ...loanForm, income: e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} placeholder="e.g. 1L" /></div>
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Existing EMIs</label><input type="text" value={loanForm.emi} onChange={e => setLoanForm({ ...loanForm, emi: e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} placeholder="e.g. 15k" /></div>
                            </div>
                            <div className={`border-t pt-3 ${theme.tableBorder}`}>
                              <p className={`text-xs font-bold mb-2 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>Document Checklist</p>
                              <div className="grid grid-cols-2 gap-2">
                                {["docPan", "docAadhaar", "docSalary", "docBank", "docProperty"].map(docKey => {
                                  const label = docKey === "docPan" ? "PAN Card" : docKey === "docAadhaar" ? "Aadhaar" : docKey === "docSalary" ? "Salary/ITR" : docKey === "docBank" ? "Bank Stmt" : "Property Docs";
                                  return (
                                    <div key={docKey} className={`flex items-center justify-between border p-2 rounded-lg ${theme.innerBlock}`}>
                                      <span className={`text-xs ${theme.textMuted}`}>{label}</span>
                                      <select value={(loanForm as any)[docKey]} onChange={e => setLoanForm({ ...loanForm, [docKey]: e.target.value })} className={`text-xs font-bold bg-transparent outline-none cursor-pointer ${(loanForm as any)[docKey] === "Uploaded" ? "text-green-500" : theme.textMuted}`}>
                                        <option value="Pending">Pending</option><option value="Uploaded">Uploaded</option>
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Notes</label><textarea value={loanForm.notes} onChange={e => setLoanForm({ ...loanForm, notes: e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none resize-none h-16 border ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} placeholder="Internal notes..." /></div>
                            <button type="submit" className={`mt-auto w-full font-bold py-3.5 rounded-xl shadow-md transition-colors cursor-pointer ${theme.btnSecondary}`}>Save Loan Tracker Update</button>
                          </form>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full animate-fadeIn">
                          <div className={`flex items-center gap-2 mb-4 p-1.5 rounded-xl flex-shrink-0 ${theme.tableWrap}`}>
                            <button onClick={() => setDetailTab("personal")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab === "personal" ? theme.btnPrimary : `${theme.textMuted} hover:opacity-80`}`}>Personal Information</button>
                            <button onClick={() => setDetailTab("loan")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab === "loan" ? theme.btnSecondary : `${theme.textMuted} hover:opacity-80`}`}>Loan Tracking</button>
                          </div>
                          <div className={`rounded-xl p-5 ${theme.chatPanel} ${theme.scroll}`}
                            style={{ ...theme.chatPanelGl, overflowY: "scroll", height: "calc(100vh - 380px)", scrollbarWidth: "thin" }}>
                            {detailTab === "personal" ? (
                              <div>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Email</p><p className={`font-semibold ${theme.text}`}>{selectedLead.email && selectedLead.email !== "N/A" ? selectedLead.email : "Not Provided"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 flex items-center gap-1 ${theme.textMuted}`}><FaPhoneAlt className="text-[10px]" /> Phone</p><p className={`font-mono font-semibold ${theme.text}`}>{maskPhone(selectedLead.phone, adminUser?.role, selectedLead.assigned_to === adminUser?.name)}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Alt Phone</p><p className={`font-mono font-semibold ${theme.text}`}>{selectedLead.altPhone && selectedLead.altPhone !== "N/A" ? maskPhone(selectedLead.altPhone, adminUser?.role, selectedLead.assigned_to === adminUser?.name) : "Not Provided"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Lead Interest</p>
                                    {selectedLead.leadInterestStatus && selectedLead.leadInterestStatus !== "Pending" ? <InterestBadge status={selectedLead.leadInterestStatus} isDark={isDark} /> : <p className={`font-semibold ${theme.text}`}>Pending</p>}
                                  </div>
                                  <div className="col-span-2"><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Loan Status</p>
                                    {selectedLead.loanStatus && selectedLead.loanStatus !== "N/A" ? <div className="w-fit"><LoanStatusBadge status={selectedLead.loanStatus} isDark={isDark} /></div> : <p className={`font-semibold ${theme.text}`}>N/A</p>}
                                  </div>
                                  <div className="col-span-2"><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Residential Address</p><p className={`font-semibold ${theme.text}`}>{selectedLead.address && selectedLead.address !== "N/A" ? selectedLead.address : "Not Provided"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Budget</p><p className="text-green-500 font-bold">{selectedLead.salesBudget && selectedLead.salesBudget !== "Pending" ? selectedLead.salesBudget : selectedLead.budget}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Property Type</p><p className={`font-semibold ${theme.text}`}>{selectedLead.propType || "Pending"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Type of Use</p><p className={`font-semibold ${theme.text}`}>{selectedLead.useType && selectedLead.useType !== "Pending" ? selectedLead.useType : (selectedLead.purpose || "N/A")}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Planning to Buy?</p><p className={`font-semibold ${theme.text}`}>{selectedLead.planningPurchase || "Pending"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Loan Required?</p><p className={`font-semibold ${theme.text}`}>{getLatestLoanDetails()?.loanRequired}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Status</p><p className={`font-semibold ${theme.accentText}`}>{selectedLead.status || "Routed"}</p></div>
                                  <div className={`col-span-2 p-4 rounded-xl border ${isDark ? "border-[#9E217B]/20" : "border-[#9E217B]/20"} ${theme.settingsBg}`}>
                                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>📍 Site Visit Date</p>
                                    <p className={`text-lg font-black ${theme.text}`}>{selectedLead.mongoVisitDate ? new Date(selectedLead.mongoVisitDate).toLocaleString("en-IN") : "Not Scheduled"}</p>
                                  </div>
                                  {selectedLead.closingDate && (
                                    <div className={`col-span-2 p-4 rounded-xl border ${isDark ? "bg-yellow-900/10 border-yellow-500/20" : "bg-amber-50 border-amber-200"}`}>
                                      <p className="text-xs font-bold text-amber-500 uppercase mb-1">Closing Date</p>
                                      <p className={`text-lg font-black ${theme.text}`}>{new Date(selectedLead.closingDate).toLocaleString("en-IN")}</p>
                                    </div>
                                  )}
                                </div>
                                <div className={`mt-6 border rounded-xl p-4 ${theme.settingsBg}`}>
                                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 border-b pb-2 ${theme.accentText}`}>Channel Partner Data</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Primary Source</p><p className={`font-medium text-sm ${theme.text}`}>{selectedLead.source || "N/A"}</p></div>
                                    {selectedLead.source === "Others" && (<div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Specified Name</p><p className={`font-medium text-sm ${theme.text}`}>{selectedLead.sourceOther}</p></div>)}
                                  </div>
                                  {selectedLead.source === "Channel Partner" && (
                                    <div className={`mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 ${theme.tableBorder}`}>
                                      {[{ label: "CP Company", val: selectedLead.cp_company || selectedLead.cpCompany }, { label: "CP Phone", val: selectedLead.cp_phone || selectedLead.cpPhone }].map(({ label, val }) => (
                                        <div key={label}><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>{label}</p><p className={`font-medium text-sm ${theme.text}`}>{val || "N/A"}</p></div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                {(() => {
                                  const curLoan: any = getLatestLoanDetails() || {};
                                  const sColor = getLoanStatusColor(curLoan?.status || "");
                                  const isHighProb = curLoan?.status?.toLowerCase() === "approved" && selectedLead.mongoVisitDate;
                                  return (
                                    <>
                                      <h3 className={`text-sm font-bold border-b pb-2 mb-6 uppercase flex items-center gap-2 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}><FaUniversity /> Deal Loan Overview</h3>
                                      {isHighProb && <div className="mb-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 p-3 rounded-lg flex items-center justify-center gap-2 text-orange-500 font-bold tracking-wide shadow-md">🚀 HIGH PROBABILITY DEAL (Visit Done + Loan Approved)</div>}
                                      <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Loan Required?</p><p className={`font-semibold ${theme.text}`}>{curLoan?.loanRequired}</p></div>
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Current Status</p><p className={`font-bold px-2 py-0.5 rounded inline-block border ${sColor}`}>{curLoan?.status}</p></div>
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Amount Requested</p><p className="text-orange-500 font-semibold">{curLoan?.amountReq}</p></div>
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Amount Approved</p><p className="text-green-500 font-semibold">{curLoan?.amountApp}</p></div>
                                        {[{ label: "Bank Name", val: curLoan?.bankName }, { label: "CIBIL Score", val: curLoan?.cibil }, { label: "Agent Name", val: curLoan?.agent }, { label: "Agent Contact", val: curLoan?.agentContact }, { label: "Emp Type", val: curLoan?.empType }, { label: "Monthly Income", val: curLoan?.income }, { label: "Existing EMIs", val: curLoan?.emi }].map(f => (
                                          <div key={f.label}><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>{f.label}</p><p className={`font-semibold ${theme.text}`}>{f.val}</p></div>
                                        ))}
                                        <div className="col-span-2 mb-2"><p className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>Document Status</p></div>
                                        {[{ label: "PAN Card", val: curLoan?.docPan }, { label: "Aadhaar", val: curLoan?.docAadhaar }, { label: "Salary/ITR", val: curLoan?.docSalary }, { label: "Bank Stmt", val: curLoan?.docBank }, { label: "Property Docs", val: curLoan?.docProperty }].map((doc, i) => (
                                          <div key={i} className={`flex items-center justify-between border p-2 rounded-lg col-span-1 ${theme.innerBlock}`}>
                                            <span className={`text-xs ${theme.textMuted}`}>{doc.label}</span>
                                            {doc.val === "Uploaded" ? <FaCheck className="text-green-500 text-xs" /> : <FaClock className={`${theme.textFaint} text-xs`} />}
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-4 flex-shrink-0">
                            <button className={`border flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1 ${isDark ? "bg-[#9E217B]/10 border-[#9E217B]/30 hover:bg-[#9E217B] text-[#d946a8] hover:text-white" : "bg-[#9E217B]/10 border-[#9E217B]/30 hover:bg-[#9E217B] text-[#9E217B] hover:text-white"}`}>
                              <FaMicrophone className="text-lg" /><span className="font-bold text-[10px]">Browser Call</span>
                            </button>
                            <button className="bg-green-50 dark:bg-green-600/10 border border-green-200 dark:border-green-500/30 hover:bg-green-100 dark:hover:bg-green-600 text-green-600 dark:text-green-400 flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1">
                              <FaWhatsapp className="text-xl" /><span className="font-bold text-[10px]">WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Follow-ups panel */}
                    <div className={`w-full lg:w-[55%] flex flex-col border rounded-2xl overflow-hidden shadow-2xl h-full min-h-0 ${theme.chatPanel}`} style={theme.chatPanelGl}>
                      <div className={`p-6 flex flex-col gap-6 h-auto ${theme.chatArea} ${theme.scroll}`}
                        style={{
                          overflowY: "scroll",
                          height: "calc(100vh - 320px)",
                          scrollbarWidth: "thin"
                        }}>
                        <div className="flex justify-start">
                          <div className={`border rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-md ${theme.fupDefault}`}>
                            <div className="flex justify-between items-center mb-2 gap-6">
                              <span className={`font-bold text-sm ${theme.accentText}`}>System (Front Desk)</span>
                              <span className={`text-[10px] ${theme.textFaint}`}>{formatDate(selectedLead.created_at)}</span>
                            </div>
                            <p className={`text-sm leading-relaxed ${theme.text}`}>Lead assigned to {selectedLead.assigned_to || "Unassigned"}. Status: {selectedLead.status}</p>
                          </div>
                        </div>
                        {currentFollowUps.length === 0
                          ? <p className={`text-center text-sm py-8 ${theme.textFaint}`}>No follow-up history yet.</p>
                          : currentFollowUps.map((msg: any, idx: number) => {
                            const isLoan = msg.message?.includes("🏦 Loan Update");
                            const isSF = msg.message?.includes("📝 Detailed Salesform Submitted");
                            const isClosing = msg.message?.includes("✅ Lead Marked as Closing");
                            const bubble = isLoan ? theme.fupLoan : isSF ? theme.fupSalesform : isClosing ? theme.fupClosing : theme.fupDefault;
                            return (
                              <div key={idx} className="flex justify-start">
                                <div className={`rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-lg ${bubble}`}>
                                  <div className="flex justify-between items-center mb-3 gap-6">
                                    <span className={`font-bold text-sm ${theme.text}`}>{msg.createdBy === "admin" ? `${msg.salesManagerName || "Admin"} (Admin)` : msg.createdBy === "receptionist" ? `${msg.salesManagerName} (Receptionist)` : msg.salesManagerName}</span>
                                    <span className={`text-[10px] ${theme.textFaint}`}>{formatDate(msg.createdAt)}</span>
                                  </div>
                                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${theme.text}`}>{msg.message}</p>
                                </div>
                              </div>
                            );
                          })}
                        <div ref={followUpEndRef} />
                      </div>
                      <form onSubmit={handleSendCustomNote} className={`p-4 border-t flex gap-3 items-center flex-shrink-0 ${theme.chatInputInner}`}>
                        <input type="text" value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder="Add admin note..."
                          className={`flex-1 border rounded-xl px-4 py-3 text-sm outline-none transition-colors shadow-inner ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} />
                        <button type="submit" className={`w-12 h-12 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-lg ${isDark ? "bg-[#9E217B] hover:bg-[#b8268f]" : "bg-[#9E217B] hover:bg-[#8a1d6b]"}`}>
                          <FaPaperPlane className="text-sm ml-[-2px]" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── LIST VIEW (sections, stats, tables) ── */}
            {subView === "list" && (
              <div className={`flex-1 overflow-y-auto p-6 ${theme.scroll}`}>
                <div className="animate-fadeIn space-y-6">
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-4">
                    {sections.map(sec => (
                      <div key={sec.key} onClick={() => setActiveSection(sec.key)}
                        className={`rounded-2xl p-4 border cursor-pointer transition-all ${activeSection === sec.key ? isDark ? "bg-[#9E217B]/20 border-[#9E217B]/50" : "bg-[#9E217B]/10 border-[#9E217B]" : `${theme.card} hover:opacity-90`}`}
                        style={activeSection !== sec.key ? theme.cardGlass : {}}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg">{sec.icon}</span>
                          <span className={`text-2xl font-black ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>{sec.count}</span>
                        </div>
                        <p className={`text-xs font-bold ${theme.text}`}>{sec.label}</p>
                        <p className={`text-[10px] mt-0.5 ${theme.textFaint}`}>{sec.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Section tabs */}
                  <div className={`flex gap-2 p-1.5 rounded-xl border ${theme.tableWrap}`}>
                    {sections.map(sec => (
                      <button key={sec.key} onClick={() => setActiveSection(sec.key)}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5
                          ${activeSection === sec.key ? "bg-[#9E217B] text-white shadow-md" : `${theme.textMuted} hover:opacity-80`}`}>
                        <span>{sec.icon}</span>
                        <span className="hidden sm:inline truncate">{sec.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeSection === sec.key ? "bg-white/20 text-white" : isDark ? "bg-[#333] text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                          {sec.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Section content */}
                  <div className="animate-fadeIn">
                    {activeSection === "enquiries" && (
                      <div>
                        <div className="flex justify-between items-start w-full mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🗒️</span>
                            <div>
                              <h3 className={`font-bold text-base ${theme.text}`}>Walk-in Enquiries</h3>
                              <p className={`text-xs ${theme.textFaint}`}>All walk-in forms in the system — {allEnquiries.length} total</p>
                            </div>
                          </div>
                          <button onClick={() => downloadCSV(allEnquiries.map(formatLeadForExport), "All_Enquiries.csv")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg hover:opacity-80 transition-colors ${isDark ? 'bg-[#222] border-[#333] text-white' : 'bg-white border-indigo-200 text-[#9E217B]'}`}><FaDownload /> Export</button>
                        </div>
                        {renderTable(allEnquiries, true, true)}
                      </div>
                    )}

                    {activeSection === "assignedTable" && (
                      <div>
                        <div className="flex items-center gap-3 mb-4 flex-wrap">

                          <div>
                            <h3 className={`font-bold text-base ${theme.text}`}>Assigned Lead Table</h3>
                            <p className={`text-xs ${theme.textFaint}`}>Leads assigned to {recepName}</p>
                          </div>
                          <button onClick={() => downloadCSV((assignedTableFilter === "working" ? assignedLeads.filter((l: any) => l.status !== "Closing" && l.status !== "Closed" && !l.closingDate) : assignedLeads).map(formatLeadForExport), "Assigned_Leads.csv")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg hover:opacity-80 transition-colors ${isDark ? 'bg-[#222] border-[#333] text-white' : 'bg-white border-indigo-200 text-[#9E217B]'}`}><FaDownload /> Export</button>
                          <div className={`ml-auto flex items-center gap-2 p-1 rounded-xl border ${theme.tableWrap}`}>
                            <button onClick={() => setAssignedTableFilter("working")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${assignedTableFilter === "working" ? "bg-[#9E217B] text-white shadow-md" : `${theme.textMuted} hover:opacity-80`}`}>
                              🔄 Working Leads <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-black ${assignedTableFilter === "working" ? "bg-white/20 text-white" : isDark ? "bg-[#333] text-gray-300" : "bg-gray-100 text-gray-600"}`}>{assignedLeads.filter((l: any) => l.status !== "Closing" && l.status !== "Closed" && !l.closingDate).length}</span>
                            </button>
                            <button onClick={() => setAssignedTableFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${assignedTableFilter === "all" ? "bg-[#9E217B] text-white shadow-md" : `${theme.textMuted} hover:opacity-80`}`}>
                              📋 All Leads <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-black ${assignedTableFilter === "all" ? "bg-white/20 text-white" : isDark ? "bg-[#333] text-gray-300" : "bg-gray-100 text-gray-600"}`}>{assignedLeads.length}</span>
                            </button>
                          </div>
                        </div>
                        {assignedTableFilter === "all" && (
                          <div className={`rounded-xl px-4 py-2.5 border mb-4 flex items-center gap-2 text-xs font-medium ${isDark ? "bg-yellow-900/10 border-yellow-500/20 text-yellow-400" : "bg-amber-50 border-amber-200 text-amber-600"}`}>
                            ⚠️ Showing all leads including closed ones.
                          </div>
                        )}
                        {renderTable(assignedTableFilter === "working" ? assignedLeads.filter((l: any) => l.status !== "Closing" && l.status !== "Closed" && !l.closingDate) : assignedLeads)}
                      </div>
                    )}

                    {activeSection === "assignedForm" && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-lg">📋</span>
                          <div>
                            <h3 className={`font-bold text-base ${theme.text}`}>Assigned Lead Form</h3>
                            <p className={`text-xs ${theme.textFaint}`}>Leads self-assigned by {recepName}</p>
                          </div>
                          <span className={`ml-auto text-xs px-3 py-1 rounded-full border font-bold ${isDark ? "text-purple-400 border-purple-500/30 bg-purple-500/10" : "text-purple-700 border-purple-200 bg-purple-50"}`}>{assignedFormLeads.length} leads</span>
                        </div>
                        {assignedFormLeads.length > 0 && (
                          <div className={`rounded-xl p-4 border mb-6 flex gap-6 ${isDark ? "bg-purple-900/10 border-purple-500/20" : "bg-purple-50 border-purple-200"}`}>
                            <div><p className={`text-[10px] font-bold uppercase ${isDark ? "text-purple-400" : "text-purple-600"}`}>Total Managed</p><p className={`text-2xl font-black ${isDark ? "text-purple-300" : "text-purple-700"}`}>{assignedFormLeads.length}</p></div>
                            <div><p className={`text-[10px] font-bold uppercase ${isDark ? "text-purple-400" : "text-purple-600"}`}>Visit Scheduled</p><p className={`text-2xl font-black ${isDark ? "text-purple-300" : "text-purple-700"}`}>{assignedFormLeads.filter((l: any) => l.mongoVisitDate).length}</p></div>
                            <div><p className={`text-[10px] font-bold uppercase ${isDark ? "text-purple-400" : "text-purple-600"}`}>Interested</p><p className={`text-2xl font-black ${isDark ? "text-purple-300" : "text-purple-700"}`}>{assignedFormLeads.filter((l: any) => l.leadInterestStatus === "Interested").length}</p></div>
                            <div><p className={`text-[10px] font-bold uppercase ${isDark ? "text-purple-400" : "text-purple-600"}`}>Follow-ups Total</p><p className={`text-2xl font-black ${isDark ? "text-purple-300" : "text-purple-700"}`}>{assignedFormLeads.reduce((sum: number, l: any) => sum + (l.allFollowUps?.length || 0), 0)}</p></div>
                          </div>
                        )}
                        {isLoading ? <div className={`text-center py-10 ${theme.textMuted}`}>Syncing…</div>
                          : assignedFormLeads.length === 0 ? (
                            <div className={`text-center py-20 ${theme.textMuted}`}><FaClipboardList className="text-4xl mx-auto mb-4 opacity-20" /><p className="text-sm font-semibold">No self-assigned leads yet.</p></div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {assignedFormLeads.map((lead: any) => {
                                const isClosing = lead.status === "Closing" || lead.status === "Closed" || !!lead.closingDate;
                                const isVisit = lead.status === "Visit Scheduled";
                                const cardStatusCls = isClosing ? isDark ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" : "text-amber-600 border-amber-400/50 bg-amber-50" : isVisit ? isDark ? "text-orange-400 border-orange-500/30 bg-orange-500/10" : "text-orange-500 border-orange-400/40 bg-orange-50" : isDark ? "text-[#d946a8] border-[#9E217B]/30 bg-[#9E217B]/10" : "text-[#9E217B] border-[#9E217B]/30 bg-[#9E217B]/10";
                                return (
                                  <div key={lead.id} onClick={() => { setSelectedLead(lead); setIsEnquiryView(false); setSubView("detail"); }}
                                    className={`rounded-2xl p-6 border cursor-pointer group flex flex-col justify-between transition-all duration-300 ${isClosing ? isDark ? "bg-yellow-900/10 border-yellow-500/30 hover:-translate-y-1.5 hover:scale-[1.02] hover:border-yellow-400/60 hover:shadow-xl" : "bg-amber-50 border-amber-200 hover:-translate-y-1.5 hover:scale-[1.02] hover:border-amber-400 hover:shadow-xl" : theme.card}`}
                                    style={theme.cardGlass}>
                                    <div>
                                      <div className={`flex justify-between items-start mb-4 pb-4 border-b ${theme.tableBorder}`}>
                                        <h3 className={`text-base font-bold line-clamp-1 pr-2 transition-colors ${theme.text} ${isDark ? "group-hover:text-[#d946a8]" : "group-hover:text-[#9E217B]"}`}>
                                          <span className={`mr-1.5 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>#{lead.id}</span>{lead.name}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border flex-shrink-0 ${cardStatusCls}`}>{lead.status || "Routed"}</span>
                                      </div>
                                      <div className="space-y-2.5 mb-4">
                                        <div><p className={`text-[10px] font-medium ${theme.textFaint}`}>Budget</p><p className={`text-sm font-semibold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{lead.salesBudget || lead.budget || "N/A"}</p></div>
                                        {lead.propType && lead.propType !== "Pending" && (<div><p className={`text-[10px] font-medium ${theme.textFaint}`}>Property</p><p className={`text-sm font-medium ${theme.text}`}>{lead.propType}</p></div>)}
                                        <div className={`p-3 rounded-lg border flex flex-col gap-1.5 ${theme.settingsBg}`} style={theme.settingsBgGl}>
                                          <p className={`text-xs flex items-center gap-2 ${theme.textMuted}`}><FaPhoneAlt className="w-3 h-3" /><span className={`font-mono ${theme.text}`}>{maskPhone(lead.phone, adminUser?.role, lead.assigned_to === adminUser?.name)}</span></p>
                                        </div>
                                        {(lead.mongoVisitDate || (lead.leadInterestStatus && lead.leadInterestStatus !== "Pending")) && (
                                          <div className="flex items-center justify-between gap-2 flex-wrap">
                                            {lead.mongoVisitDate && <div className="flex items-center gap-1 text-xs font-semibold text-orange-400"><FaCalendarAlt className="text-[9px]" />{formatDate(lead.mongoVisitDate).split(",")[0]}</div>}
                                            {lead.leadInterestStatus && lead.leadInterestStatus !== "Pending" && (
                                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border flex-shrink-0 ${lead.leadInterestStatus === "Interested" ? isDark ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-green-700 border-green-200 bg-green-50" : lead.leadInterestStatus === "Not Interested" ? isDark ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-red-700 border-red-200 bg-red-50" : isDark ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" : "text-yellow-700 border-yellow-200 bg-yellow-50"}`}>{lead.leadInterestStatus}</span>
                                            )}
                                          </div>
                                        )}
                                        {isClosing && (<div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-lg ${isDark ? "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20" : "text-amber-600 bg-amber-50 border border-amber-200"}`}><FaHandshake /> Deal in Closing Stage</div>)}
                                      </div>
                                    </div>
                                    <div className={`pt-3 border-t mt-auto flex justify-between items-center ${theme.tableBorder}`}>
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${isDark ? "text-[#d946a8] bg-[#9E217B]/10 border-[#9E217B]/20" : "text-[#9E217B] bg-pink-50 border-pink-200"}`}>{(lead.allFollowUps || []).length} follow-ups</span>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[10px] ${theme.textFaint}`}>{formatDate(lead.created_at).split(",")[0]}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isDark ? "text-gray-500 group-hover:text-[#d946a8]" : "text-[#9E217B]/50 group-hover:text-[#9E217B]"}`}>View →</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                      </div>
                    )}

                    {activeSection === "closed" && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-lg">✅</span>
                          <div><h3 className={`font-bold text-base ${theme.text}`}>Closed Leads by Receptionist</h3><p className={`text-xs ${theme.textFaint}`}>Leads closed by {recepName}</p></div>
                          <div className="ml-auto flex items-center gap-3">
                            <button onClick={() => downloadCSV(closedLeads.map(formatLeadForExport), "Closed_Leads.csv")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg hover:opacity-80 transition-colors ${isDark ? 'bg-[#222] border-[#333] text-white' : 'bg-white border-indigo-200 text-[#9E217B]'}`}><FaDownload /> Export</button>
                            <span className={`text-xs px-3 py-1 rounded-full border font-bold ${isDark ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" : "text-amber-700 border-amber-200 bg-amber-50"}`}>{closedLeads.length} closed</span>
                          </div>
                        </div>
                        {renderTable(closedLeads)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── TRANSFER MODAL (Moved to the absolute root level of the component) ── */}
      {isTransferModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/75 z-[200] flex justify-center items-center p-4 sm:p-6 animate-fadeIn" style={{ backdropFilter: "blur(8px)" }}>
          <div className={`rounded-2xl w-full max-w-lg shadow-2xl border overflow-hidden ${theme.modalCard}`} style={theme.modalGlass}>
            <div className={`p-5 border-b flex justify-between items-center ${isDark ? "bg-purple-900/20 border-purple-500/20" : "bg-purple-50 border-purple-200"}`}>
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-purple-400" : "text-purple-700"}`}><FaExchangeAlt /> Transfer Lead #{selectedLead.id}</h2>
                <p className={`text-xs mt-1 ${theme.textMuted}`}>Transferring: <strong>{selectedLead.name}</strong></p>
              </div>
              <button onClick={() => { setIsTransferModalOpen(false); setTransferNote(""); setTransferTarget(""); }} className={`p-2 ${theme.textMuted} hover:text-red-500 transition-colors`}><FaTimes /></button>
            </div>
            <div className={`p-6 ${theme.modalInner}`}>
              <div className="mb-5">
                <label className={`block text-sm font-bold mb-2 ${isDark ? "text-purple-400" : "text-purple-700"}`}>Transfer to Manager *</label>
                <select required value={transferTarget} onChange={e => setTransferTarget(e.target.value)}
                  className={`w-full rounded-xl p-3 text-sm outline-none transition-colors border-2 cursor-pointer ${isDark ? "bg-[#14141B] border-purple-500/40 text-white" : "bg-white border-purple-300 text-[#1A1A1A]"}`}>
                  <option value="" disabled>-- Select Manager --</option>
                  {isFetchingManagers ? <option disabled>Loading managers…</option> : combinedAssignees.filter((m: any) => m.name !== (selectedLead.assigned_to || selectedLead.assignedTo)).length > 0 ? combinedAssignees.filter((m: any) => m.name !== (selectedLead.assigned_to || selectedLead.assignedTo)).map((m: any, i: number) => <option key={i} value={m.name}>{m.name} ({String(m.role || "Manager").replace("_", " ")})</option>) : <option disabled>No other assignees available</option>}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? "text-purple-400" : "text-purple-700"}`}>Handover Summary * (min 50 chars)</label>
                <textarea required value={transferNote} onChange={e => setTransferNote(e.target.value)} rows={7}
                  placeholder="Summarize actions, discussions, interest level..."
                  className={`w-full rounded-xl px-4 py-3 text-sm outline-none resize-none leading-relaxed border-2 transition-colors custom-scrollbar ${isDark ? "bg-[#14141B] border-purple-500/30 text-white focus:border-purple-500" : "bg-white border-purple-200 text-[#1A1A1A] focus:border-purple-500"}`} />
                {transferNote.length > 0 && transferNote.length < 50 && <p className="text-xs text-amber-500 mt-1">⚠ Min 50 characters required.</p>}
              </div>
            </div>
            <div className={`p-5 border-t flex justify-end gap-3 ${theme.modalHeader} ${theme.tableBorder}`}>
              <button onClick={() => { setIsTransferModalOpen(false); setTransferNote(""); setTransferTarget(""); }}
                className={`px-6 py-2.5 rounded-lg font-bold cursor-pointer transition-colors ${theme.textMuted} hover:text-red-500`}>Cancel</button>
              <button onClick={handleTransferLead} disabled={isTransferring || !transferTarget || transferNote.trim().length < 50}
                className={`px-8 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 ${isTransferring || !transferTarget || transferNote.trim().length < 50 ? "opacity-50 cursor-not-allowed bg-purple-400 text-white" : "cursor-pointer bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"}`}>
                {isTransferring ? "Transferring…" : <><FaExchangeAlt /> Confirm Transfer</>}
              </button>
            </div>
          </div>
        </div>

      )}

      {/* ════════════════════════════════════════════════════
          REASSIGN LEAD MODAL (Admin)
      ════════════════════════════════════════════════════ */}
      {isReassignModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/75 z-[200] flex justify-center items-center p-4 sm:p-6 animate-fadeIn" style={{ backdropFilter: "blur(8px)" }}>
          <div className={`rounded-2xl w-full max-w-lg shadow-2xl border overflow-hidden ${theme.modalCard}`} style={theme.modalGlass}>
            <div className={`p-5 border-b flex justify-between items-center ${isDark ? "bg-orange-900/20 border-orange-500/20" : "bg-orange-50 border-orange-200"}`}>
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-orange-400" : "text-orange-700"}`}>
                  <FaExchangeAlt /> Re-assign Lead #{selectedLead.id}
                </h2>
                <p className={`text-xs mt-1 ${theme.textMuted}`}>Currently assigned to: <strong>{selectedLead.assigned_to || selectedLead.assignedTo || "Unassigned"}</strong></p>
              </div>
              <button onClick={() => { setIsReassignModalOpen(false); setReassignNote(""); setReassignTarget(""); }}
                className={`p-2 ${theme.textMuted} hover:text-red-500 transition-colors`}><FaTimes /></button>
            </div>
            <div className={`p-6 ${theme.modalInner}`}>
              <div className="mb-5">
                <label className={`block text-sm font-bold mb-2 ${isDark ? "text-orange-400" : "text-orange-700"}`}>Assign to *</label>
                <select required value={reassignTarget} onChange={e => setReassignTarget(e.target.value)}
                  className={`w-full rounded-xl p-3 text-sm outline-none transition-colors border-2 cursor-pointer ${isDark ? "bg-[#14141B] border-orange-500/40 text-white" : "bg-white border-orange-300 text-[#1A1A1A]"}`}>
                  <option value="" disabled>-- Select Manager --</option>
                  {isFetchingManagers ? <option disabled>Loading managers…</option> : combinedAssignees.filter((m: any) => m.name !== (selectedLead.assigned_to || selectedLead.assignedTo)).length > 0 ? combinedAssignees.filter((m: any) => m.name !== (selectedLead.assigned_to || selectedLead.assignedTo)).map((m: any, i: number) => (
                    <option key={i} value={m.name}>{m.name} ({String(m.role || "Sales Manager").replace("_", " ")})</option>
                  )) : <option disabled>No other assignees available</option>}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? "text-orange-400" : "text-orange-700"}`}>Reason for Re-assign *</label>
                <textarea
                  required value={reassignNote} onChange={e => setReassignNote(e.target.value)}
                  placeholder="e.g. Wrong manager was selected initially. Reassigning to correct person."
                  rows={4}
                  className={`w-full rounded-xl px-4 py-3 text-sm outline-none resize-none border-2 transition-colors ${isDark ? "bg-[#14141B] border-orange-500/30 text-white focus:border-orange-500" : "bg-white border-orange-200 text-[#1A1A1A] focus:border-orange-500"}`}
                />
                {reassignNote.length > 0 && reassignNote.length < 10 && (
                  <p className="text-xs text-amber-500 mt-1">⚠ Please provide a reason (min 10 characters).</p>
                )}
              </div>
            </div>
            <div className={`p-5 border-t flex justify-end gap-3 ${theme.modalHeader} ${theme.tableBorder}`}>
              <button onClick={() => { setIsReassignModalOpen(false); setReassignNote(""); setReassignTarget(""); }}
                className={`px-6 py-2.5 rounded-lg font-bold cursor-pointer transition-colors ${theme.textMuted} hover:text-red-500`}>Cancel</button>
              <button onClick={handleReassignLead}
                disabled={isReassigning || !reassignTarget || reassignNote.trim().length < 10}
                className={`px-8 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 ${isReassigning || !reassignTarget || reassignNote.trim().length < 10
                  ? "opacity-50 cursor-not-allowed bg-orange-400 text-white"
                  : "cursor-pointer bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20"
                  }`}>
                {isReassigning ? "Reassigning…" : <><FaExchangeAlt /> Confirm Re-assign</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── FaEye import needed for profile panel ──
function FaEye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 576 512" fill="currentColor" width="1em" height="1em">
      <path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z" />
    </svg>
  );
}