"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaThLarge, FaClipboardList, FaUsers, FaIdCard,
  FaSearch, FaBell, FaChevronLeft, FaPhoneAlt, FaComments,
  FaCheckCircle, FaCalendarAlt, FaTimes,
  FaFileInvoice, FaPaperPlane, FaMicrophone, FaWhatsapp, FaTable, FaChartPie, FaEyeSlash, FaUniversity, FaFileAlt, FaCheck, FaClock, FaHandshake
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  CartesianGrid, PieChart, Pie,
} from "recharts";

// ─── SUN/MOON ICONS ───────────────────────────────────────────────────────────
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

// ─── THEME TOKEN BUILDER — MAGENTA ACCENT ────────────────────────
function buildTheme(isDark: boolean) {
  return {
    pageWrap:      isDark ? "bg-[#0A0A0F] text-white"                   : "text-[#1A1A1A]",
    mainBg:        isDark ? "bg-[#121212]"                              : "bg-transparent",
    sidebar:       "bg-[#1a1a1a] border-[#2a2a2a]",
    header:        isDark ? "bg-[#1a1a1a] border-[#2a2a2a]"             : "bg-white border-[#9CA3AF]",
    headerGlass:   isDark ? {}                                          : { boxShadow: "0 1px 0 #9CA3AF, 0 4px 16px rgba(158,33,123,0.06)" },
    card: isDark
      ? "bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#9E217B]/50 hover:bg-[#1e1e1e]"
      : "bg-gradient-to-r from-[#f1f5ff] via-[#eef2ff] to-[#f5f3ff] border border-indigo-300 hover:border-[#9E217B]/40 hover:shadow-[0_-4px_16px_2px_rgba(158,33,123,0.2),0_0_24px_6px_rgba(158,33,123,0.12),0_4px_16px_rgba(0,0,0,0.08)]",
    cardGlass:     isDark ? {}                                          : { boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(158,33,123,0.07), 0 12px 28px rgba(0,0,0,0.08)" },
    cardClosing:   isDark ? "bg-yellow-900/10 border-yellow-500/30 hover:border-yellow-400/60" : "bg-amber-50 border-amber-200 hover:border-amber-400/60",
    tableWrap:     isDark ? "bg-[#1a1a1a] border-[#2a2a2a]"             : "bg-white border border-indigo-300",
    tableGlass:    isDark ? {}                                          : { boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(158,33,123,0.06), 0 16px 36px rgba(0,0,0,0.09)" },
    tableHead:     isDark ? "bg-[#222]"                                 : "bg-[#F1F5F9] border-b border-indigo-300",
    tableRow:      isDark ? "hover:bg-[#252525]"                        : "hover:bg-[#F8FAFC] border-b border-indigo-200",
    tableDivide:   isDark ? "divide-[#2a2a2a]"                          : "divide-[#E5E7EB]",
    tableBorder:   isDark ? "border-[#2a2a2a]"                          : "border-[#D1D5DB]",
    inputBg:       isDark ? "bg-[#1a1a1a] border-[#333]"                : "bg-white border border-indigo-300",
    inputInner:    isDark ? "bg-[#121212] border-[#333]"                : "bg-white border border-indigo-300",
    inputFocus:    isDark ? "focus:border-[#9E217B]"                    : "focus:border-[#9E217B]",
    settingsBg:    isDark ? "bg-[#222] border-[#2a2a2a]"                : "bg-[#F8FAFC] border border-indigo-300",
    settingsBgGl:  isDark ? {}                                          : { boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)" },
    innerBlock:    isDark ? "bg-[#121212] border-[#333]"                : "bg-white border border-indigo-200",
    modalCard:     isDark ? "bg-[#1a1a1a] border-[#2a2a2a]"             : "bg-white border border-indigo-300",
    modalGlass:    isDark ? {}                                          : { boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(158,33,123,0.08), 0 32px 72px rgba(0,0,0,0.16)" },
    modalInner:    isDark ? "bg-[#121212]"                              : "bg-[#F8FAFC] border border-indigo-300",
    modalHeader:   isDark ? "bg-[#151515]"                              : "bg-[#F1F5F9]",
    dropdown:      isDark ? "bg-[#1a1a1a] border-[#2a2a2a]"             : "bg-white border border-indigo-200",
    dropdownGlass: isDark ? {}                                          : { boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 20px rgba(158,33,123,0.08), 0 20px 40px rgba(0,0,0,0.10)" },
    dropdownItem:  isDark ? "hover:bg-[#222] border-[#222]"             : "hover:bg-[#F8FAFC] border-[#F0F0F0]",
    text:          isDark ? "text-white"                                : "text-[#1A1A1A]",
    textMuted:     isDark ? "text-gray-400"                             : "text-[#6B7280]",
    textFaint:     isDark ? "text-gray-500"                             : "text-[#9CA3AF]",
    textHeader:    isDark ? "text-xs text-gray-500 uppercase"           : "text-xs text-[#6B7280] uppercase",
    navActive:     isDark ? "bg-[#9E217B]/20 border-[#9E217B]/60 text-[#d946a8]" : "bg-[#2A2A2A] text-[#9E217B] border-transparent",
    navInactive:   isDark ? "text-gray-500 hover:text-gray-300 hover:bg-white/5 border-transparent" : "text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white border-transparent",
    navIndicator:  isDark ? "bg-[#9E217B] shadow-[0_0_10px_2px_rgba(158,33,123,0.5)]" : "bg-[#9E217B] shadow-[0_0_8px_rgba(158,33,123,0.4)]",
    toggleWrap:    isDark ? "bg-[#1C1C2A] border-[#2A2A38] text-yellow-300" : "bg-white border border-indigo-200 text-[#9E217B]",
    chatArea:      isDark ? "bg-[#0a0a0a]"                              : "bg-[#F8FAFC]",
    chatBubbleAi:  isDark ? "bg-[#141414] border border-[#1f1f1f] text-gray-200" : "bg-white border border-[#E5E7EB] text-[#1A1A1A] shadow-sm",
    chatBubbleUser:isDark ? "bg-[#9E217B] text-white"                   : "bg-[#9E217B] text-white",
    chatInput:     isDark ? "bg-[#111] border-[#222] hover:border-[#333] focus-within:border-[#9E217B]/50" : "bg-white border-[#E5E7EB] hover:border-[#9CA3AF] focus-within:border-[#9E217B]/50",
    chatInputInner:isDark ? "bg-[#111] border-[#222]"                   : "bg-white border-[#E5E7EB]",
    chatPanel:     isDark ? "bg-[#1a1a1a] border-[#333]"                : "bg-white border-[#D1D5DB]",
    chatPanelGl:   isDark ? {}                                          : { boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(158,33,123,0.06), 0 16px 36px rgba(0,0,0,0.09)" },
    statGlow1:     isDark ? "bg-[#9E217B]/10"                           : "bg-[#9E217B]/10",
    statGlow2:     isDark ? "bg-[#d946a8]/10"                           : "bg-[#d946a8]/10",
    statGlow3:     isDark ? "bg-blue-600/10"                            : "bg-indigo-400/10",
    statGlow4:     isDark ? "bg-yellow-500/10"                          : "bg-amber-400/10",
    statGlow5:     isDark ? "bg-green-600/10"                           : "bg-emerald-400/10",
    accentText:    isDark ? "text-[#d946a8]"                            : "text-[#9E217B]",
    accentBg:      isDark ? "bg-[#9E217B]/10 text-[#d946a8] border border-[#9E217B]/30" : "bg-[#9E217B]/10 text-[#9E217B] border border-[#9E217B]/30",
    sectionTitle:  isDark ? "text-[#d946a8]"                            : "text-[#9E217B]",
    sectionBorder: isDark ? "border-[#9E217B]/20"                       : "border-[#9E217B]/25",
    btnPrimary:    isDark ? "bg-[#9E217B] hover:bg-[#b8268f] text-white shadow-md" : "bg-[#9E217B] hover:bg-[#8a1d6b] text-white shadow-sm",
    btnSecondary:  isDark ? "bg-[#00AEEF] hover:bg-[#0099d4] text-white shadow-md" : "bg-[#00AEEF] hover:bg-[#0099d4] text-white shadow-sm",
    btnDanger:     isDark ? "bg-[#3B1F1F] text-[#F28B82] hover:bg-red-900/40 border border-red-900/30" : "bg-[#9E217B]/10 text-[#9E217B] hover:bg-[#9E217B] hover:text-white border border-[#9E217B]/30",
    btnWarning:    isDark ? "bg-yellow-600 hover:bg-yellow-500 text-white shadow-md" : "bg-amber-500 hover:bg-amber-400 text-white shadow-sm",
    btnClosingBadge: isDark ? "bg-yellow-900/20 border border-yellow-500/40 text-yellow-400" : "bg-amber-50 border border-amber-400/60 text-amber-600",
    logoBg:        isDark ? "bg-[#9E217B] shadow-lg shadow-[#9E217B]/30" : "bg-[#9E217B] shadow-lg shadow-[#9E217B]/30",
    chartColors:   isDark
      ? ["#d946a8","#e879b8","#00AEEF","#f97316","#4ade80","#fbbf24","#60a5fa"]
      : ["#9E217B","#00AEEF","#0077b6","#f97316","#4ade80","#fbbf24","#d946a8"],
    visitPieColors: ["#9E217B","#00AEEF","#f97316","#4ade80","#fbbf24","#e879b8","#60a5fa","#34d399"],
    tooltipBg:     isDark ? "#1a1a1a" : "rgba(255,255,255,0.98)",
    tooltipColor:  isDark ? "#fff" : "#1A1A1A",
    tooltipBorder: isDark ? "1px solid rgba(158,33,123,0.3)" : "1px solid #E5E7EB",
    legendColor:   isDark ? "#9ca3af" : "#6B7280",
    fupDefault:    isDark ? "bg-[#1f0a18] border border-[#9E217B]/30" : "bg-pink-50 border border-pink-200",
    fupLoan:       isDark ? "bg-blue-900/20 border border-blue-600/40" : "bg-blue-50 border border-blue-200",
    fupSalesform:  isDark ? "bg-[#222] border border-[#444]" : "bg-white border border-[#D1D5DB]",
    fupClosing:    isDark ? "bg-yellow-900/20 border border-yellow-600/40" : "bg-amber-50 border border-amber-300",
    statusRouted:  isDark ? "text-[#d946a8] border-[#9E217B]/30 bg-[#9E217B]/10" : "text-[#9E217B] border-[#9E217B]/30 bg-[#9E217B]/10",
    statusVisit:   isDark ? "text-orange-400 border-orange-500/30 bg-orange-500/10" : "text-orange-500 border-orange-400/40 bg-orange-50",
    statusClosing: isDark ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" : "text-amber-600 border-amber-400/50 bg-amber-50",
    select:        isDark ? "bg-[#121212] border-[#333] text-white focus:border-[#9E217B]" : "bg-white border border-indigo-300 text-[#1A1A1A] focus:border-[#9E217B]",
    selectSmall:   isDark ? "bg-[#222] border-[#333] text-white" : "bg-white border border-indigo-200 text-[#6B7280]",
    scroll:        isDark ? "scrollbar-dark" : "scrollbar-light",
  };
}

// ============================================================================
// SHARED REAL-TIME DATA HOOK
// ============================================================================
function useAdminData() {
  const [managers, setManagers]           = useState<any[]>([]);
  const [receptionists, setReceptionists] = useState<any[]>([]);
  const [allLeads, setAllLeads]           = useState<any[]>([]);
  const [followUps, setFollowUps]         = useState<any[]>([]);
  const [isLoading, setIsLoading]         = useState(true);

  const fetchAdminData = async () => {
    try {
      let smData: any[] = [];
      const resUsers = await fetch("/api/users/sales-manager");
      if (resUsers.ok) { const j = await resUsers.json(); smData = j.data || []; }

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
        const leadFups      = mongoFollowUps.filter((f: any) => String(f.leadId) === String(lead.id));
        const salesForms    = leadFups.filter((f: any) => f.message?.includes("Detailed Salesform Submitted"));
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
          const ms  = lm.match(/• Status: (.*)/);           if (ms)  loanStatus   = ms[1].trim();
          const mr  = lm.match(/• Amount Requested: (.*)/); if (mr)  loanAmtReq  = mr[1].trim();
          const ma  = lm.match(/• Amount Approved: (.*)/);  if (ma)  loanAmtApp  = ma[1].trim();
          const mlr = lm.match(/• Loan Required: (.*)/);    if (mlr) loanRequired = mlr[1].trim();
        }

        const fupsWithDate    = leadFups.filter((f: any) => f.siteVisitDate && f.siteVisitDate.trim() !== "");
        const latestVisitDate = fupsWithDate.length > 0 ? fupsWithDate[fupsWithDate.length - 1].siteVisitDate : null;
        const activeBudget    = extractField("Budget") !== "Pending" ? extractField("Budget") : lead.budget;

        const sfLoanPlanned = extractField("Loan Planned");
        const derivedLoanPlanned =
          sfLoanPlanned !== "Pending" ? sfLoanPlanned :
          loanRequired !== "Pending"  ? loanRequired  :
          (lead.loan_planned || "Pending");

        return {
          ...lead,
          propType:           extractField("Property Type"),
          salesBudget:        activeBudget,
          useType:            extractField("Use Type") !== "Pending" ? extractField("Use Type") : (lead.purpose || "Pending"),
          planningPurchase:   extractField("Planning to Purchase"),
          decisionMaker:      extractField("Decision Maker"),
          loanPlanned:        derivedLoanPlanned,
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

  return { managers, receptionists, allLeads, followUps, isLoading, refetch: fetchAdminData };
}

// ============================================================================
// HELPER BADGES
// ============================================================================
function InterestBadge({ status, size = "md", isDark }: { status: string; size?: "sm"|"md"; isDark?: boolean }) {
  const colorMap: Record<string, string> = {
    "Interested":      isDark ? "border-green-500/40 text-green-400 bg-green-500/10"   : "border-green-300 text-green-700 bg-green-50",
    "Not Interested":  isDark ? "border-red-500/40 text-red-400 bg-red-500/10"         : "border-red-300 text-red-700 bg-red-50",
    "Maybe":           isDark ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" : "border-yellow-300 text-yellow-700 bg-yellow-50",
  };
  const cls = colorMap[status] ?? (isDark ? "border-[#9E217B]/30 text-[#d946a8] bg-[#9E217B]/10" : "border-[#9E217B]/30 text-[#9E217B] bg-[#9E217B]/10");
  const sz  = size === "sm" ? "text-[9px] px-2 py-0.5" : "text-[10px] px-3 py-1";
  return <span className={`rounded-full font-bold uppercase tracking-wider border flex-shrink-0 ${sz} ${cls}`}>{status}</span>;
}

function LoanStatusBadge({ status, isDark }: { status: string; isDark?: boolean }) {
  const s = (status || "").toLowerCase();
  if (!s || s === "n/a") return null;
  let cls = isDark ? "border-gray-500/30 text-gray-400 bg-gray-500/10" : "border-gray-300 text-gray-700 bg-gray-50";
  if (s === "approved")    cls = isDark ? "border-green-500/40 text-green-400 bg-green-500/10"   : "border-green-300 text-green-700 bg-green-50";
  if (s === "rejected")    cls = isDark ? "border-red-500/40 text-red-400 bg-red-500/10"         : "border-red-300 text-red-700 bg-red-50";
  if (s === "in progress") cls = isDark ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" : "border-yellow-300 text-yellow-700 bg-yellow-50";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 flex-shrink-0 ${cls}`}>
      <FaUniversity className="text-[7px]"/>{status}
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
const maskPhone = (phone: any) => {
  if (!phone || phone === "N/A") return "N/A";
  const c = String(phone).replace(/[^a-zA-Z0-9]/g, "");
  if (c.length <= 5) return c;
  return `${c.slice(0, 2)}*****${c.slice(-3)}`;
};

// ============================================================================
// MAIN LAYOUT SHELL
// ============================================================================
export default function AdminAtlasDashboard() {
  const router = useRouter();
  const [activeView, setActiveView]             = useState("dashboard");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [user, setUser]                         = useState<any>({ name: "Admin", role: "Admin", email: "", password: "" });
  const [isProfileOpen, setIsProfileOpen]       = useState(false);
  const [showPassword, setShowPassword]         = useState(false);
  const [isDark, setIsDark]                     = useState(false);
  const theme = useMemo(() => buildTheme(isDark), [isDark]);

  const { managers, receptionists, allLeads, followUps, isLoading, refetch } = useAdminData();

  useEffect(() => {
    const storedUser = localStorage.getItem("crm_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const fetchLivePassword = async () => {
        try {
          const res = await fetch("/api/employees");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              const liveUser = data.find((u: any) => u.email === parsedUser.email);
              if (liveUser?.password) setUser((prev: any) => ({ ...prev, password: liveUser.password }));
            }
          }
        } catch {}
      };
      fetchLivePassword();
    }
    const returnTab = localStorage.getItem("return_tab");
    if (returnTab) { setActiveView(returnTab); localStorage.removeItem("return_tab"); }
  }, []);

  const handleLogout = () => { localStorage.removeItem("crm_user"); router.push("/"); };

  // ── Sidebar menu items ──
  // "employees" → /dashboard/employees (default tab)
  // "caller"    → /dashboard/employees?tab=callers (auto-opens Caller Panel)
  const menuItems = [
    { id: "dashboard",    icon: FaThLarge,       label: "Overview" },
    { id: "receptionist", icon: FaClipboardList, label: "Receptionist" },
    { id: "sales",        icon: FaUsers,         label: "Sales Managers" },
    { id: "employees",    icon: FaIdCard,        label: "Add Employee" },
    { id: "caller",       icon: FaPhoneAlt,      label: "Caller Panel" },
  ];

  const handleMenuClick = (itemId: string) => {
    if (itemId === "employees") {
      router.push("/dashboard/employees");
    } else if (itemId === "caller") {
      // ✅ FIX: redirect to employees page with ?tab=callers so it auto-opens Caller Panel
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

      {/* ── SIDEBAR ── */}
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
            // Active indicator only applies to internal views (not redirects)
            const isActive = activeView === item.id && item.id !== "employees" && item.id !== "caller";
            return (
              <div
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`flex items-center px-3 py-3.5 rounded-xl cursor-pointer transition-colors whitespace-nowrap relative group
                  ${isActive
                    ? "bg-[#9E217B]/20 text-[#d946a8]"
                    : "text-gray-400 hover:bg-[#252525] hover:text-gray-200"}`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#9E217B] rounded-r-full shadow-[0_0_8px_rgba(158,33,123,0.6)]" />
                )}
                <item.icon className="w-5 h-5 min-w-[20px] ml-1" />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isSidebarHovered ? 1 : 0 }}
                  className={`ml-5 font-semibold text-sm ${isActive ? "text-[#d946a8]" : ""}`}
                >
                  {item.label}
                </motion.span>
              </div>
            );
          })}
        </nav>
      </motion.aside>

      {/* ── MAIN ── */}
      <div className={`flex-1 flex flex-col pl-[80px] h-screen overflow-hidden ${theme.mainBg}`}>
        <header className={`h-16 flex items-center justify-between px-8 z-30 transition-colors duration-300 ${theme.header}`} style={theme.headerGlass}>
          <h1 className={`font-bold text-lg capitalize tracking-wide flex items-center gap-3 ${theme.text}`}>
            {activeView.replace("_", " ")}
            <span className={`${theme.settingsBg} ${theme.textMuted} px-2 py-0.5 rounded text-xs border`}>Admin</span>
          </h1>
          <div className="flex items-center gap-6">
            <button onClick={() => setIsDark(!isDark)} aria-label="Toggle theme"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm ${theme.toggleWrap}`}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <FaBell className={`${theme.textMuted} cursor-pointer transition-colors`} />
            <div className="relative">
              <div onClick={() => setIsProfileOpen(!isProfileOpen)}
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
          </div>
        </header>

        <main className={`flex-1 overflow-hidden transition-colors duration-300 ${theme.mainBg}`}>
          {activeView === "dashboard"    && <DashboardOverview managers={managers} allLeads={allLeads} isLoading={isLoading} user={user} theme={theme} isDark={isDark} />}
          {activeView === "sales"        && <AdminSalesView managers={managers} allLeads={allLeads} followUps={followUps} isLoading={isLoading} adminUser={user} refetch={refetch} theme={theme} isDark={isDark} />}
          {activeView === "receptionist" && <ReceptionistView receptionists={receptionists} allLeads={allLeads} managers={managers} isLoading={isLoading} refetch={refetch} theme={theme} isDark={isDark} />}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-dark::-webkit-scrollbar{width:6px;height:6px}
        .scrollbar-dark::-webkit-scrollbar-track{background:transparent}
        .scrollbar-dark::-webkit-scrollbar-thumb{background:#3a3a3a;border-radius:10px}
        .scrollbar-dark::-webkit-scrollbar-thumb:hover{background:#555}
        .scrollbar-light::-webkit-scrollbar{width:6px;height:6px}
        .scrollbar-light::-webkit-scrollbar-track{background:transparent}
        .scrollbar-light::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px}
        .scrollbar-light::-webkit-scrollbar-thumb:hover{background:#94a3b8}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .animate-fadeIn{animation:fadeIn 0.2s ease-out}
      `}} />
    </div>
  );
}

// ============================================================================
// DASHBOARD ANALYTICS
// ============================================================================
function DashboardAnalytics({ leads, theme, isDark }: { leads: any[]; theme: any; isDark: boolean }) {
  const [pieMode, setPieMode] = useState<"interest"|"loan"|"usetype"|"loanrequired"|"visits">("interest");
  const [barMode, setBarMode] = useState<"weekly"|"source">("weekly");

  const interestData = useMemo(() => {
    const c: Record<string,number> = { Interested:0,"Not Interested":0,Maybe:0,Pending:0 };
    leads.forEach(l => { const s = l.leadInterestStatus; if (s && s !== "Pending" && c[s] !== undefined) c[s]++; else c["Pending"]++; });
    return Object.entries(c).filter(([,v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const loanPieData = useMemo(() => {
    const c: Record<string,number> = { Approved:0,"In Progress":0,Rejected:0,"N/A":0 };
    leads.forEach(l => { const s = l.loanStatus; if (s && c[s] !== undefined) c[s]++; else c["N/A"]++; });
    return Object.entries(c).filter(([,v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const useTypeData = useMemo(() => {
    const c: Record<string,number> = {};
    leads.forEach(l => { const ut = (l.useType && l.useType !== "Pending") ? l.useType : (l.purpose || "Unknown"); c[ut] = (c[ut] || 0) + 1; });
    return Object.entries(c).filter(([k]) => k !== "Unknown").map(([name, value]) => ({ name, value }));
  }, [leads]);

  const loanRequiredData = useMemo(() => {
    const c: Record<string,number> = { Yes:0, No:0, "Not Sure":0, Pending:0 };
    leads.forEach(l => {
      const lp = l.loanPlanned;
      if (lp && c[lp] !== undefined) c[lp]++;
      else c["Pending"]++;
    });
    return Object.entries(c).filter(([,v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const visitData = useMemo(() => {
    const scheduled = leads.filter(l => l.mongoVisitDate).length;
    return [{ name:"Scheduled", value:scheduled }, { name:"Pending", value:leads.length - scheduled }];
  }, [leads]);

  const weeklyData = useMemo(() => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const counts = [0,0,0,0,0,0,0];
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
    const c: Record<string,number> = {};
    leads.forEach(l => { const src = l.source || "Unknown"; c[src] = (c[src] || 0) + 1; });
    return Object.entries(c).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [leads]);

  const interestColors: Record<string,string> = { Interested:"#4ade80","Not Interested":"#f87171",Maybe:"#fbbf24",Pending:"#6b7280" };
  const loanColors:     Record<string,string> = { Approved:"#4ade80","In Progress":"#fbbf24",Rejected:"#f87171","N/A":"#6b7280" };
  const useTypeColors:  Record<string,string> = { "Self Use":"#9E217B",Investment:"#34d399","Personal use":"#f87171","N/A":"#6b7280" };
  const loanReqColors:  Record<string,string> = { Yes:"#9E217B",No:"#6b7280","Not Sure":"#fbbf24",Pending:"#374151" };
  const visitColors:    Record<string,string> = { Scheduled:"#f97316",Pending:"#374151" };

  const pieData   = pieMode==="interest" ? interestData : pieMode==="loan" ? loanPieData : pieMode==="usetype" ? useTypeData : pieMode==="loanrequired" ? loanRequiredData : visitData;
  const pieColors = pieMode==="interest" ? interestColors : pieMode==="loan" ? loanColors : pieMode==="usetype" ? useTypeColors : pieMode==="loanrequired" ? loanReqColors : visitColors;
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
              <FaChartPie className={`text-[#9E217B] text-xs`}/>
              {barMode === "weekly" ? "Leads Added This Week" : "Lead Source Distribution"}
            </h3>
            {barMode === "weekly" && <p className="text-[#9E217B] text-xs mt-0.5 font-semibold">{weeklyTotal} total this week</p>}
          </div>
          <select value={barMode} onChange={e => setBarMode(e.target.value as any)}
            className={`${theme.select} rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer appearance-none`}>
            <option value="weekly">Leads This Week</option>
            <option value="source">Lead Source Distribution</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          {barMode === "weekly" ? (
            <BarChart data={weeklyData} margin={{ top:4, right:8, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2a2a2a" : "#E5E7EB"}/>
              <XAxis dataKey="day" tick={{ fill:theme.legendColor, fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:theme.legendColor, fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
              <RechartsTooltip content={<BarTip/>}/>
              <Bar dataKey="leads" radius={[6,6,0,0]}>
                {weeklyData.map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]}/>)}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={sourceData} layout="vertical" margin={{ top:0, right:16, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2a2a2a" : "#E5E7EB"} horizontal={false}/>
              <XAxis type="number" tick={{ fill:theme.legendColor, fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
              <YAxis type="category" dataKey="source" width={100} tick={{ fill:theme.legendColor, fontSize:10 }} axisLine={false} tickLine={false}/>
              <RechartsTooltip content={<BarTip/>}/>
              <Bar dataKey="count" radius={[0,6,6,0]}>
                {sourceData.map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]}/>)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* PIE CHART */}
      <div className={`${theme.card} rounded-2xl p-5`} style={theme.cardGlass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${theme.text} font-bold text-sm flex items-center gap-2`}>
            <FaChartPie className="text-[#00AEEF] text-xs"/>
            {pieMode==="interest" ? "Lead Interest Breakdown" :
             pieMode==="loan" ? "Loan Status Breakdown" :
             pieMode==="usetype" ? "Self-Use vs Investment" :
             pieMode==="loanrequired" ? "Loan Required?" :
             "Visit Scheduled vs Pending"}
          </h3>
          <select value={pieMode} onChange={e => setPieMode(e.target.value as any)}
            className={`${theme.select} rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer appearance-none`}>
            <option value="interest">Lead Interest</option>
            <option value="loan">Loan Status</option>
            <option value="usetype">Self-Use vs Investment</option>
            <option value="loanrequired">Loan Required?</option>
            <option value="visits">Visit Scheduled vs Pending</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="55%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((entry: any, i: number) => <Cell key={i} fill={pieColors[entry.name] ?? "#6b7280"}/>)}
              </Pie>
              <RechartsTooltip content={<PieTip/>}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 flex-1">
            {pieData.map((entry: any) => {
              const color = pieColors[entry.name] ?? "#6b7280";
              const pct   = totalLeads > 0 ? Math.round((entry.value / totalLeads) * 100) : 0;
              return (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}/>
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
function DashboardOverview({ managers, allLeads, isLoading, user, theme, isDark }: any) {
  const [selectedManagerName, setSelectedManagerName] = useState("");
  const [hasAutoSelected, setHasAutoSelected]         = useState(false);

  const managerStats = managers.map((m: any) => {
    const mLeads = allLeads.filter((l: any) => l.assigned_to === m.name);
    return {
      name:        m.name,
      activeLeads: mLeads.length,
      siteVisits:  mLeads.filter((l: any) => l.status === "Visit Scheduled" || !!l.mongoVisitDate).length,
    };
  }).sort((a: any, b: any) => b.activeLeads - a.activeLeads);

  useEffect(() => {
    if (!hasAutoSelected && managerStats.length > 0 && !isLoading) {
      setSelectedManagerName(managerStats[0].name);
      setHasAutoSelected(true);
    }
  }, [managerStats, isLoading, hasAutoSelected]);

  const activeManagerLeads = allLeads.filter((l: any) => l.assigned_to === selectedManagerName);
  const visitCount         = activeManagerLeads.filter((l: any) => l.status === "Visit Scheduled" || !!l.mongoVisitDate).length;

  const pieData      = managerStats.filter((m: any) => m.siteVisits > 0);
  const VISIT_COLORS = theme.visitPieColors;

  return (
    <div className={`h-full flex flex-col p-8 overflow-y-auto ${theme.scroll}`}>
      {/* Welcome banner */}
      <div className={`${theme.card} rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`} style={theme.cardGlass}>
        <h2 className={`text-xl font-bold ${theme.text}`}>Welcome back, {user?.name || "Admin"}!</h2>
        <p className={`text-sm ${theme.textMuted}`}>Here is what's happening with your team today.</p>
      </div>

      {/* Top performers + site visits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className={`lg:col-span-2 ${theme.card} rounded-2xl p-6 flex flex-col`} style={theme.cardGlass}>
          <h2 className={`text-lg font-bold mb-1 flex items-center gap-2 ${theme.text}`}>
            <FaChartPie className="text-[#9E217B]"/> Top Performers
          </h2>
          <p className={`text-xs mb-6 ${theme.textFaint}`}>Sales managers ranked by active leads.</p>
          <div className="flex-1 min-h-[280px]">
            {isLoading ? <div className={`h-full flex items-center justify-center text-sm ${theme.textMuted}`}>Loading...</div>
            : managerStats.length === 0 ? <div className={`h-full flex items-center justify-center text-sm ${theme.textMuted}`}>No data</div>
            : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={managerStats} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2a2a2a" : "#E5E7EB"} vertical={false}/>
                  <XAxis dataKey="name" stroke={theme.legendColor} fontSize={11} tickLine={false} axisLine={false}/>
                  <YAxis stroke={theme.legendColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false}/>
                  <RechartsTooltip cursor={{ fill: isDark ? "#222" : "#F3F4F6" }} contentStyle={{ backgroundColor: theme.tooltipBg, border: theme.tooltipBorder, borderRadius: "8px", color: theme.tooltipColor }}/>
                  <Bar dataKey="activeLeads" radius={[4,4,0,0]} barSize={45}>
                    {managerStats.map((_: any, i: number) => <Cell key={i} fill={theme.chartColors[i % theme.chartColors.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Site Visits PIE */}
        <div className={`lg:col-span-1 ${theme.card} rounded-2xl p-6 flex flex-col`} style={theme.cardGlass}>
          <h2 className={`text-lg font-bold mb-1 flex items-center gap-2 ${theme.text}`}>
            <FaCalendarAlt className="text-orange-500"/> Site Visits
          </h2>
          <p className={`text-xs mb-4 ${theme.textFaint}`}>Upcoming visits by manager.</p>
          <div className="flex-1 min-h-[240px]">
            {isLoading ? <div className={`h-full flex items-center justify-center text-sm ${theme.textMuted}`}>Loading...</div>
            : pieData.length === 0 ? <div className={`h-full flex flex-col items-center justify-center text-sm ${theme.textMuted}`}><FaCalendarAlt className="text-3xl mb-3 opacity-20"/>No visits scheduled</div>
            : (
              <div className="flex flex-col h-full">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="siteVisits" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                      {pieData.map((_: any, i: number) => <Cell key={i} fill={VISIT_COLORS[i % VISIT_COLORS.length]}/>)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: theme.tooltipBg, border: theme.tooltipBorder, borderRadius: "8px", color: theme.tooltipColor }}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 mt-2 overflow-y-auto max-h-[100px]">
                  {pieData.map((entry: any, i: number) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: VISIT_COLORS[i % VISIT_COLORS.length] }}/>
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

      {/* Team Performance Table */}
      <div className={`${theme.card} rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`} style={theme.cardGlass}>
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${theme.text}`}><FaTable className="text-[#9E217B]"/> Team Performance Table</h2>
          <p className={`text-sm mt-1 ${theme.textMuted}`}>Select a manager to view their real-time data.</p>
        </div>
        <div className="w-full sm:w-72 relative">
          <FaChevronLeft className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs z-10 ${theme.textFaint}`}/>
          <select value={selectedManagerName} onChange={e => setSelectedManagerName(e.target.value)}
            className={`w-full text-sm font-bold rounded-xl pl-9 pr-4 py-3 outline-none cursor-pointer appearance-none ${theme.select}`}>
            <option value="" disabled>-- Select Sales Manager --</option>
            {managers.map((m: any) => <option key={m.id||m._id||m.name} value={m.name}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {!selectedManagerName ? (
        <div className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl min-h-[300px] ${theme.textMuted} ${theme.tableBorder}`}>
          <FaTable className="text-4xl mb-4 opacity-20"/>
          <p>Select a manager to view their table.</p>
        </div>
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

          {/* Analytics Charts */}
          {activeManagerLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FaChartPie className="text-[#9E217B]"/>
                <h3 className={`font-bold text-sm uppercase tracking-wider ${theme.text}`}>Lead Analytics — {selectedManagerName}</h3>
                <span className={`text-xs px-2 py-0.5 rounded border ${theme.settingsBg} ${theme.textMuted}`}>{activeManagerLeads.length} leads</span>
              </div>
              <DashboardAnalytics leads={activeManagerLeads} theme={theme} isDark={isDark} />
            </div>
          )}

          {/* Leads table */}
          <div className={`${theme.tableWrap} rounded-2xl overflow-hidden`} style={theme.tableGlass}>
            <div className={`p-5 flex justify-between items-center ${theme.tableHead}`}>
              <h3 className={`font-bold flex items-center gap-2 ${theme.text}`}><FaUsers className="text-[#9E217B]"/> Leads Database ({selectedManagerName})</h3>
              <span className={`text-xs px-3 py-1 rounded-full ${theme.btnClosingBadge}`}>Live Sync Active</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={`text-xs uppercase ${theme.tableHead} ${theme.textHeader}`}>
                  <tr>
                    {["LEAD NO.","NAME","PROP. TYPE","BUDGET","USE TYPE","LOAN?","LOAN STATUS","AMT REQ / APP","SITE VISIT"].map(h => (
                      <th key={h} className="px-4 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.tableDivide}`}>
                  {isLoading
                    ? <tr><td colSpan={9} className={`text-center py-8 ${theme.textMuted}`}>Syncing...</td></tr>
                    : activeManagerLeads.length === 0
                      ? <tr><td colSpan={9} className={`text-center py-8 ${theme.textMuted}`}>No leads for {selectedManagerName}.</td></tr>
                      : activeManagerLeads.map((lead: any) => (
                          <tr key={lead.id} className={`transition-colors ${theme.tableRow}`}>
                            <td className={`px-6 py-4 font-bold ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>#{lead.id}</td>
                            <td className={`px-4 py-4 font-medium ${theme.text}`}>{lead.name}</td>
                            <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.propType || "Pending"}</td>
                            <td className={`px-4 py-4 font-semibold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{lead.salesBudget}</td>
                            <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.useType || "Pending"}</td>
                            <td className={`px-4 py-4 ${theme.textMuted}`}>{lead.loanPlanned || "Pending"}</td>
                            <td className="px-4 py-4">
                              {lead.loanStatus && lead.loanStatus !== "N/A"
                                ? <LoanStatusBadge status={lead.loanStatus} isDark={isDark}/>
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
                            <td className="px-6 py-4">
                              {lead.mongoVisitDate
                                ? <span className="text-orange-500 font-medium">{formatDate(lead.mongoVisitDate).split(",")[0]}</span>
                                : <span className={`text-xs italic ${theme.textFaint}`}>Pending</span>}
                            </td>
                          </tr>
                        ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADMIN SALES VIEW
// ============================================================================
function AdminSalesView({ managers, allLeads, followUps, isLoading, adminUser, refetch, theme, isDark }: any) {
  const [selectedManager, setSelectedManager]     = useState<any>(null);
  const [searchManager, setSearchManager]         = useState("");
  const [subView, setSubView]                     = useState<"cards"|"detail">("cards");
  const [selectedLead, setSelectedLead]           = useState<any>(null);
  const [detailTab, setDetailTab]                 = useState<"personal"|"loan">("personal");
  const [showSalesForm, setShowSalesForm]         = useState(false);
  const [showLoanForm, setShowLoanForm]           = useState(false);
  const [salesForm, setSalesForm]                 = useState({ propertyType:"",location:"",budget:"",useType:"",purchaseDate:"",loanPlanned:"",siteVisit:"",leadStatus:"" });
  const [loanForm, setLoanForm]                   = useState({ loanRequired:"",status:"",bank:"",amountReq:"",amountApp:"",cibil:"",agent:"",agentContact:"",empType:"",income:"",emi:"",docPan:"Pending",docAadhaar:"Pending",docSalary:"Pending",docBank:"Pending",docProperty:"Pending",notes:"" });
  const [customNote, setCustomNote]               = useState("");
  const followUpEndRef                            = useRef<HTMLDivElement>(null);
  const [toastMsg, setToastMsg]                   = useState<{title:string;icon:any;color:string}|null>(null);
  const inputRef                                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedLead) {
      const u = allLeads.find((l: any) => String(l.id) === String(selectedLead.id));
      if (u) setSelectedLead(u);
    }
  }, [allLeads]);

  useEffect(() => {
    if (subView === "detail") followUpEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [followUps, subView, selectedLead, detailTab]);

  const filteredManagers     = managers.filter((m: any) => m.name?.toLowerCase().includes(searchManager.toLowerCase()));
  const activeManagerLeads   = selectedManager ? allLeads.filter((l: any) => l.assigned_to === selectedManager.name) : [];
  const currentLeadFollowUps = followUps.filter((f: any) => String(f.leadId) === String(selectedLead?.id));

  const getLatestLoanDetails = () => {
    if (!selectedLead) return null;
    let ex: Record<string,any> = {
      loanRequired: selectedLead.loanPlanned || "N/A",
      status:"Pending", bankName:"N/A", amountReq:"N/A", amountApp:"N/A",
      cibil:"N/A", agent:"N/A", agentContact:"N/A", empType:"N/A",
      income:"N/A", emi:"N/A", docPan:"Pending", docAadhaar:"Pending",
      docSalary:"Pending", docBank:"Pending", docProperty:"Pending", notes:"N/A"
    };
    const lu = currentLeadFollowUps.filter((f: any) => f.message?.includes("🏦 Loan Update:"));
    if (lu.length > 0) {
      const msg = lu[lu.length - 1].message;
      const g = (l: string) => { const m = msg.match(new RegExp(`• ${l}: (.*)`)); return m ? m[1].trim() : "N/A"; };
      ex = {
        loanRequired:  g("Loan Required"),  status:       g("Status"),
        bankName:      g("Bank Name"),       amountReq:    g("Amount Requested"),
        amountApp:     g("Amount Approved"), cibil:        g("CIBIL Score"),
        agent:         g("Agent Name"),      agentContact: g("Agent Contact"),
        empType:       g("Employment Type"), income:       g("Monthly Income"),
        emi:           g("Existing EMIs"),   docPan:       g("PAN Card"),
        docAadhaar:    g("Aadhaar Card"),    docSalary:    g("Salary Slips"),
        docBank:       g("Bank Statements"), docProperty:  g("Property Docs"),
        notes:         g("Notes"),
      };
    }
    return ex;
  };

  const getLoanStatusColor = (s: string) => {
    const sl = (s || "").toLowerCase();
    if (sl === "approved")    return isDark ? "bg-green-900/20 text-green-400 border-green-500/30"   : "bg-green-50 text-green-700 border-green-300";
    if (sl === "rejected")    return isDark ? "bg-red-900/20 text-red-400 border-red-500/30"         : "bg-red-50 text-red-700 border-red-300";
    if (sl === "in progress") return isDark ? "bg-yellow-900/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-50 text-yellow-700 border-yellow-300";
    return isDark ? "bg-gray-900/20 text-gray-400 border-gray-500/30" : "bg-gray-50 text-gray-700 border-gray-300";
  };

  const prefillSalesForm = () => {
    if (!selectedLead) return;
    const sf = currentLeadFollowUps.filter((f: any) => f.message?.includes("Detailed Salesform Submitted"));
    if (sf.length === 0) return;
    const msg = sf[sf.length - 1].message;
    const g = (label: string) => { const m = msg.match(new RegExp(`• ${label}: (.*)`)); return m && m[1].trim() !== "N/A" ? m[1].trim() : ""; };
    setSalesForm({ propertyType:g("Property Type"), location:g("Location"), budget:g("Budget"), useType:g("Use Type"), purchaseDate:g("Planning to Purchase"), loanPlanned:g("Loan Planned"), leadStatus:g("Lead Status"), siteVisit:"" });
  };

  const prefillLoanForm = () => {
    const cur = getLatestLoanDetails();
    if (!cur) return;
    setLoanForm({
      loanRequired: cur.loanRequired !== "N/A" ? cur.loanRequired : "",
      status:       cur.status !== "Pending"   ? cur.status : "",
      bank:         cur.bankName !== "N/A"     ? cur.bankName : "",
      amountReq:    cur.amountReq !== "N/A"    ? cur.amountReq : "",
      amountApp:    cur.amountApp !== "N/A"    ? cur.amountApp : "",
      cibil:        cur.cibil !== "N/A"        ? cur.cibil : "",
      agent:        cur.agent !== "N/A"        ? cur.agent : "",
      agentContact: cur.agentContact !== "N/A" ? cur.agentContact : "",
      empType:      cur.empType !== "N/A"      ? cur.empType : "",
      income:       cur.income !== "N/A"       ? cur.income : "",
      emi:          cur.emi !== "N/A"          ? cur.emi : "",
      docPan:       cur.docPan !== "N/A"       ? cur.docPan : "Pending",
      docAadhaar:   cur.docAadhaar !== "N/A"   ? cur.docAadhaar : "Pending",
      docSalary:    cur.docSalary !== "N/A"    ? cur.docSalary : "Pending",
      docBank:      cur.docBank !== "N/A"      ? cur.docBank : "Pending",
      docProperty:  cur.docProperty !== "N/A"  ? cur.docProperty : "Pending",
      notes:        cur.notes !== "N/A"        ? cur.notes : "",
    });
  };

  const handleSendCustomNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customNote.trim() || !selectedLead) return;
    const nm = { leadId:String(selectedLead.id), salesManagerName:adminUser.name, createdBy:"admin", message:customNote, siteVisitDate:null, createdAt:new Date().toISOString() };
    setCustomNote("");
    try { await fetch("/api/followups", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(nm) }); refetch(); } catch {}
  };

  const handleSalesFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const msg = `📝 Detailed Salesform Submitted:\n• Property Type: ${salesForm.propertyType||"N/A"}\n• Location: ${salesForm.location||"N/A"}\n• Budget: ${salesForm.budget||"N/A"}\n• Use Type: ${salesForm.useType||"N/A"}\n• Planning to Purchase: ${salesForm.purchaseDate||"N/A"}\n• Loan Planned: ${salesForm.loanPlanned||"N/A"}\n• Lead Status: ${salesForm.leadStatus||"N/A"}\n• Site Visit Requested: ${salesForm.siteVisit ? formatDate(salesForm.siteVisit) : "No"}`;
    const nm = { leadId:String(selectedLead.id), salesManagerName:adminUser.name, createdBy:"admin", message:msg, siteVisitDate:salesForm.siteVisit||null, createdAt:new Date().toISOString() };
    const ns = salesForm.siteVisit ? "Visit Scheduled" : selectedLead.status;
    setShowSalesForm(false);
    setSalesForm({ propertyType:"",location:"",budget:"",useType:"",purchaseDate:"",loanPlanned:"",siteVisit:"",leadStatus:"" });
    try {
      await fetch("/api/followups", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(nm) });
      await fetch(`/api/walkin_enquiries/${selectedLead.id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name:selectedLead.name, status:ns }) });
      refetch();
    } catch {}
  };

  const handleLoanFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const msg = `🏦 Loan Update:\n• Loan Required: ${loanForm.loanRequired||"N/A"}\n• Status: ${loanForm.status||"N/A"}\n• Bank Name: ${loanForm.bank||"N/A"}\n• Amount Requested: ${loanForm.amountReq||"N/A"}\n• Amount Approved: ${loanForm.amountApp||"N/A"}\n• CIBIL Score: ${loanForm.cibil||"N/A"}\n• Agent Name: ${loanForm.agent||"N/A"}\n• Agent Contact: ${loanForm.agentContact||"N/A"}\n• Employment Type: ${loanForm.empType||"N/A"}\n• Monthly Income: ${loanForm.income||"N/A"}\n• Existing EMIs: ${loanForm.emi||"N/A"}\n• PAN Card: ${loanForm.docPan||"Pending"}\n• Aadhaar Card: ${loanForm.docAadhaar||"Pending"}\n• Salary Slips: ${loanForm.docSalary||"Pending"}\n• Bank Statements: ${loanForm.docBank||"Pending"}\n• Property Docs: ${loanForm.docProperty||"Pending"}\n• Notes: ${loanForm.notes||"N/A"}`;
    const nm  = { leadId:String(selectedLead.id), salesManagerName:adminUser.name, createdBy:"admin", message:msg, siteVisitDate:null, createdAt:new Date().toISOString() };
    const dbp = { leadId:String(selectedLead.id), salesManagerName:adminUser.name, ...loanForm };
    setShowLoanForm(false);
    setToastMsg({ title:`Loan Data Synced for ${selectedLead.name}`, icon:<FaCheckCircle/>, color:"blue" });
    setTimeout(() => setToastMsg(null), 3000);
    try {
      await fetch("/api/followups", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(nm) });
      await fetch("/api/loan/update", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(dbp) }).catch(() => {});
      refetch();
    } catch {}
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
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${theme.textFaint}`}/>
            <input type="text" placeholder="Search Managers..." value={searchManager} onChange={e => setSearchManager(e.target.value)}
              className={`w-full rounded-lg pl-9 pr-4 py-2 text-sm outline-none transition-colors ${theme.inputInner} ${theme.text} ${theme.inputFocus}`}/>
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto ${theme.scroll}`}>
          {isLoading ? <div className={`p-8 text-center text-sm ${theme.textMuted}`}>Loading managers...</div>
          : filteredManagers.length === 0 ? <div className={`p-8 text-center text-sm ${theme.textMuted}`}>No managers found.</div>
          : filteredManagers.map((manager: any) => {
            const isSelected = selectedManager?.id === manager.id || selectedManager?.name === manager.name;
            const count = allLeads.filter((l: any) => l.assigned_to === manager.name).length;
            return (
              <div key={manager.id||manager._id||manager.name}
                onClick={() => { setSelectedManager(manager); setSubView("cards"); setSelectedLead(null); }}
                className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-b ${theme.tableBorder}
                  ${isSelected
                    ? isDark ? "border-l-4 border-l-[#9E217B] bg-[#9E217B]/10" : "border-l-4 border-l-[#9E217B] bg-pink-50"
                    : "hover:opacity-80 border-l-4 border-l-transparent"}`}
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

      {/* Right Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {!selectedManager ? (
          <div className={`h-full flex flex-col items-center justify-center ${theme.textMuted}`}>
            <FaIdCard className="text-4xl mb-4 opacity-20"/>
            <p>Select a sales manager from the left sidebar.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Sub-header */}
            <div className={`p-5 border-b flex justify-between items-center shadow-sm z-10 flex-shrink-0 gap-4 ${theme.header}`} style={theme.headerGlass}>
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${theme.text}`}>
                  <FaUsers className={isDark ? "text-[#d946a8]" : "text-[#9E217B]"}/> {selectedManager.name}'s Leads
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
                      const loanSt   = lead.loanStatus && lead.loanStatus !== "N/A" ? lead.loanStatus : null;
                      return (
                        <div key={lead.id}
                          className={`rounded-2xl p-6 transition-all group flex flex-col justify-between cursor-pointer ${theme.card}`}
                          style={theme.cardGlass}
                          onClick={() => { setSelectedLead(lead); setSubView("detail"); }}
                        >
                          <div>
                            <div className={`flex justify-between items-start mb-5 pb-4 border-b ${theme.tableBorder}`}>
                              <h3 className={`text-xl font-bold transition-colors line-clamp-1 pr-2 group-hover:text-[#9E217B] ${theme.text}`}>
                                <span className={`mr-2 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>#{lead.id}</span>{lead.name}
                              </h3>
                              {interest
                                ? <InterestBadge status={interest} isDark={isDark}/>
                                : <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 ${theme.statusRouted}`}>{lead.status || "ROUTED"}</span>}
                            </div>
                            <div className="space-y-3 mb-5">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className={`text-xs font-medium ${theme.textMuted}`}>Budget</p>
                                  <p className={`text-sm font-semibold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{lead.salesBudget}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {loanSt ? <LoanStatusBadge status={loanSt} isDark={isDark}/>
                                    : lead.loanPlanned === "Yes" && (
                                      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 border ${isDark ? "bg-[#9E217B]/10 border-[#9E217B]/30 text-[#d946a8]" : "bg-pink-50 border-pink-200 text-[#9E217B]"}`}>
                                        <FaUniversity/> Loan Active
                                      </div>
                                    )}
                                </div>
                              </div>
                              {lead.propType && lead.propType !== "Pending" && (
                                <div><p className={`text-xs font-medium ${theme.textMuted}`}>Property</p><p className={`text-sm font-medium ${theme.text}`}>{lead.propType}</p></div>
                              )}
                              <div className={`p-3 rounded-lg border flex flex-col gap-1.5 ${theme.innerBlock}`}>
                                <p className={`text-xs flex items-center gap-2 ${theme.textMuted}`}><FaPhoneAlt className="w-3 h-3"/> <span className={`font-mono ${theme.text}`}>{maskPhone(lead.phone)}</span></p>
                              </div>
                              {(lead.mongoVisitDate || interest) && (
                                <div className="flex items-center justify-between gap-2">
                                  {lead.mongoVisitDate && <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-500"><FaCalendarAlt className="text-[10px]"/>{formatDate(lead.mongoVisitDate).split(",")[0]}</div>}
                                  {interest && !lead.mongoVisitDate && <InterestBadge status={interest} size="sm" isDark={isDark}/>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`pt-4 border-t mt-auto ${theme.tableBorder}`}>
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
                        <FaChevronLeft className="text-sm"/>
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
                            <FaFileInvoice/> Fill Salesform
                          </button>
                          <button onClick={() => { prefillLoanForm(); setShowLoanForm(true); setShowSalesForm(false); }}
                            className={`${theme.btnSecondary} px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer`}>
                            <FaUniversity/> Track Loan
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-2" style={{ minHeight:"500px" }}>
                    {/* Left panel */}
                    <div className="w-full lg:w-[45%] flex flex-col gap-4 h-full pb-2">
                      {showSalesForm ? (
                        <div className={`rounded-xl border p-5 shadow-xl flex-1 overflow-y-auto flex flex-col ${theme.modalCard} ${theme.scroll}`} style={theme.modalGlass}>
                          <div className={`flex justify-between items-center mb-4 border-b pb-3 ${theme.tableBorder}`}>
                            <div>
                              <h3 className={`text-lg font-bold ${theme.text}`}>Sales Data Form</h3>
                              <p className={`text-xs mt-0.5 ${theme.accentText}`}>Admin override — Lead #{selectedLead.id}</p>
                            </div>
                            <button type="button" onClick={() => setShowSalesForm(false)} className={`p-1 ${theme.textMuted}`}><FaTimes/></button>
                          </div>
                          <form onSubmit={handleSalesFormSubmit} className="flex flex-col gap-4 flex-1">
                            {[
                              { label:"Property Type?", key:"propertyType", ph:"e.g. 1BHK, 2BHK" },
                              { label:"Preferred Location?", key:"location", ph:"e.g. Dombivali, Kalyan" },
                              { label:"Approximate Budget?", key:"budget", ph:"e.g. 5 cr" },
                            ].map(f => (
                              <div key={f.key}><label className={`text-xs mb-1 block ${theme.textMuted}`}>{f.label}</label>
                                <input type="text" placeholder={f.ph} value={(salesForm as any)[f.key]} onChange={e => setSalesForm({ ...salesForm, [f.key]: e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none ${theme.inputInner} ${theme.text} ${theme.inputFocus}`}/>
                              </div>
                            ))}
                            <div className="grid grid-cols-2 gap-3">
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Self-use or Investment?</label>
                                <select value={salesForm.useType} onChange={e => setSalesForm({ ...salesForm, useType:e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none ${theme.select}`}>
                                  <option value="">Select</option><option>Self Use</option><option>Investment</option>
                                </select>
                              </div>
                              <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Planning to Purchase?</label>
                                <select value={salesForm.purchaseDate} onChange={e => setSalesForm({ ...salesForm, purchaseDate:e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none ${theme.select}`}>
                                  <option value="">Select</option><option>Immediate</option><option>Next 3 Months</option>
                                </select>
                              </div>
                            </div>
                            <div className={`border-t pt-3 mt-1 ${theme.tableBorder}`}>
                              <label className={`block text-xs font-bold mb-1.5 ${theme.accentText}`}>Lead Interest Status *</label>
                              <select required value={salesForm.leadStatus} onChange={e => setSalesForm({ ...salesForm, leadStatus:e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none cursor-pointer ${theme.select}`}>
                                <option value="" disabled>Select Status</option>
                                <option>Interested</option><option>Not Interested</option><option>Maybe</option>
                              </select>
                            </div>
                            <div className={`border-t pt-3 mt-1 ${theme.tableBorder}`}>
                              <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>Loan Planned?</label>
                              <select required value={salesForm.loanPlanned} onChange={e => setSalesForm({ ...salesForm, loanPlanned:e.target.value })} className={`w-full rounded-lg px-4 py-2 text-sm outline-none cursor-pointer ${theme.select}`}>
                                <option value="" disabled>Select Option</option><option>Yes</option><option>No</option><option>Not Sure</option>
                              </select>
                            </div>
                            <div className={`mt-2 border-t pt-3 ${theme.tableBorder}`}>
                              <label className="text-xs text-orange-500 font-bold mb-1.5 block">Schedule a Site Visit?</label>
                              <input ref={inputRef} type="datetime-local" value={salesForm.siteVisit} onChange={e => setSalesForm({ ...salesForm, siteVisit:e.target.value })} onClick={() => inputRef.current?.showPicker()} className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none ${theme.inputInner} ${theme.text} focus:border-orange-500`}/>
                            </div>
                            <button type="submit" className={`mt-auto w-full font-bold py-3.5 rounded-xl transition-colors flex-shrink-0 ${theme.btnPrimary}`}>Submit Salesform</button>
                          </form>
                        </div>

                      ) : showLoanForm ? (
                        <div className={`rounded-xl border p-5 shadow-xl flex-1 overflow-y-auto flex flex-col animate-fadeIn ${theme.modalCard} ${theme.scroll}`} style={theme.modalGlass}>
                          <div className={`flex justify-between items-center mb-4 border-b pb-3 flex-shrink-0 ${theme.tableBorder}`}>
                            <div>
                              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}><FaUniversity/> Loan Tracking Workflow</h3>
                              <p className={`text-xs mt-0.5 ${theme.textFaint}`}>For Lead #{selectedLead.id}</p>
                            </div>
                            <button type="button" onClick={() => setShowLoanForm(false)} className={`p-1 ${theme.textMuted}`}><FaTimes/></button>
                          </div>
                          <form onSubmit={handleLoanFormSubmit} className="flex flex-col gap-5 flex-1">
                            <div>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>1. Loan Decision</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Loan Required? *</label>
                                  <select required value={loanForm.loanRequired} onChange={e => setLoanForm({ ...loanForm, loanRequired:e.target.value })} className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer ${theme.select}`}>
                                    <option value="">Select</option><option>Yes</option><option>No</option><option>Not Sure</option>
                                  </select>
                                </div>
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Loan Status *</label>
                                  <select required value={loanForm.status} onChange={e => setLoanForm({ ...loanForm, status:e.target.value })} className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer ${theme.select}`}>
                                    <option value="">Select Status</option><option>Approved</option><option>In Progress</option><option>Rejected</option>
                                  </select>
                                  {loanForm.status && (
                                    <p className={`text-[10px] mt-1.5 font-semibold ${loanForm.status==="Approved"?"text-green-500":loanForm.status==="Rejected"?"text-red-500":isDark?"text-yellow-400":"text-yellow-600"}`}>
                                      {loanForm.status==="Approved"&&"✅ Loan cleared — schedule closing meeting"}
                                      {loanForm.status==="In Progress"&&"📄 Follow up on pending documents"}
                                      {loanForm.status==="Rejected"&&"❌ Loan rejected — suggest co-applicant or other bank"}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={`border-t pt-4 ${theme.tableBorder}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>2. Bank & Loan Details</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[{label:"Bank Name",k:"bank",ph:"e.g. HDFC"},{label:"Amount Required",k:"amountReq",ph:"e.g. 60L"},{label:"Amount Approved",k:"amountApp",ph:"e.g. 55L"},{label:"CIBIL Score",k:"cibil",ph:"e.g. 750"},{label:"Agent Name",k:"agent",ph:"Agent Name"},{label:"Agent Contact",k:"agentContact",ph:"Agent Phone",tel:true}].map(f => (
                                  <div key={f.k}><label className={`text-xs mb-1 block ${theme.textMuted}`}>{f.label}</label>
                                    <input type={f.tel?"tel":"text"} value={(loanForm as any)[f.k]} onChange={e => setLoanForm({ ...loanForm, [f.k]:e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} placeholder={f.ph}/>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className={`border-t pt-4 ${theme.tableBorder}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>3. Financial Qualification</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Employment</label>
                                  <select value={loanForm.empType} onChange={e => setLoanForm({ ...loanForm, empType:e.target.value })} className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer ${theme.select}`}>
                                    <option value="">Select</option><option>Salaried</option><option>Self-employed</option>
                                  </select>
                                </div>
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Monthly Income</label><input type="text" value={loanForm.income} onChange={e => setLoanForm({ ...loanForm, income:e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} placeholder="e.g. 1L"/></div>
                                <div><label className={`text-xs mb-1 block ${theme.textMuted}`}>Existing EMIs</label><input type="text" value={loanForm.emi} onChange={e => setLoanForm({ ...loanForm, emi:e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${theme.inputInner} ${theme.text} ${theme.inputFocus}`} placeholder="e.g. 15k"/></div>
                              </div>
                            </div>
                            <div className={`border-t pt-4 ${theme.tableBorder}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}><FaFileAlt/> 4. Document Checklist</h4>
                              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border ${theme.modalInner}`}>
                                {["docPan","docAadhaar","docSalary","docBank","docProperty"].map(docKey => {
                                  const label = docKey==="docPan"?"PAN Card":docKey==="docAadhaar"?"Aadhaar Card":docKey==="docSalary"?"Salary Slips / ITR":docKey==="docBank"?"Bank Statements":"Property Documents";
                                  return (
                                    <div key={docKey} className={`flex items-center justify-between border p-2 rounded-lg ${theme.innerBlock}`}>
                                      <span className={`text-xs font-medium ${theme.textMuted}`}>{label}</span>
                                      <select value={(loanForm as any)[docKey]} onChange={e => setLoanForm({ ...loanForm, [docKey]:e.target.value })} className={`text-xs font-bold bg-transparent outline-none cursor-pointer ${(loanForm as any)[docKey]==="Uploaded"?"text-green-500":theme.textMuted}`}>
                                        <option value="Pending">Pending</option><option value="Uploaded">Uploaded</option>
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div className={`border-t pt-4 ${theme.tableBorder}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#d946a8]" : "text-[#9E217B]"}`}>5. Notes / Remarks</h4>
                              <textarea value={loanForm.notes} onChange={e => setLoanForm({ ...loanForm, notes:e.target.value })} className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none h-20 ${theme.inputInner} ${theme.text} ${theme.scroll} ${theme.inputFocus}`} placeholder="Bank feedback, CIBIL issues, Internal notes..."/>
                            </div>
                            <button type="submit" className={`mt-4 flex-shrink-0 w-full font-bold py-3.5 rounded-xl shadow-md transition-colors cursor-pointer ${theme.btnSecondary}`}>Save Loan Tracker Update</button>
                          </form>
                        </div>

                      ) : (
                        <div className="flex flex-col h-full animate-fadeIn">
                          <div className={`flex items-center gap-2 mb-4 border p-1.5 rounded-xl flex-shrink-0 ${theme.card}`}>
                            <button onClick={() => setDetailTab("personal")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab==="personal" ? theme.btnPrimary : `${theme.textMuted} hover:opacity-80`}`}>Personal Information</button>
                            <button onClick={() => setDetailTab("loan")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab==="loan" ? theme.btnSecondary : `${theme.textMuted} hover:opacity-80`}`}>Loan Tracking</button>
                          </div>
                          <div className={`flex-1 overflow-y-auto border rounded-xl p-5 shadow-lg ${theme.modalCard} ${theme.scroll}`}>
                            {detailTab === "personal" ? (
                              <div>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Email</p><p className={`font-semibold ${theme.text}`}>{selectedLead.email!=="N/A"?selectedLead.email:"Not Provided"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 flex items-center gap-1 ${theme.textMuted}`}><FaPhoneAlt className="text-[10px]"/> Phone</p><p className={`font-mono font-semibold ${theme.text}`}>{selectedLead.phone}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Alt Phone</p><p className={`font-mono font-semibold ${theme.text}`}>{selectedLead.altPhone&&selectedLead.altPhone!=="N/A"?selectedLead.altPhone:"Not Provided"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Lead Interest</p>
                                    {selectedLead.leadInterestStatus&&selectedLead.leadInterestStatus!=="Pending"?<InterestBadge status={selectedLead.leadInterestStatus} isDark={isDark}/>:<p className={`font-semibold ${theme.text}`}>Pending</p>}
                                  </div>
                                  <div className="col-span-2"><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Loan Status</p>
                                    {selectedLead.loanStatus&&selectedLead.loanStatus!=="N/A"?<div className="w-fit"><LoanStatusBadge status={selectedLead.loanStatus} isDark={isDark}/></div>:<p className={`font-semibold ${theme.text}`}>N/A</p>}
                                  </div>
                                  <div className="col-span-2"><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Residential Address</p><p className={`font-semibold ${theme.text}`}>{selectedLead.address&&selectedLead.address!=="N/A"?selectedLead.address:"Not Provided"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Budget</p><p className="text-green-500 font-bold">{selectedLead.salesBudget!=="Pending"?selectedLead.salesBudget:selectedLead.budget}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Property Type</p><p className={`font-semibold ${theme.text}`}>{selectedLead.propType||"Pending"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Type of Use</p><p className={`font-semibold ${theme.text}`}>{selectedLead.useType!=="Pending"?selectedLead.useType:(selectedLead.purpose||"N/A")}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Planning to Buy?</p><p className={`font-semibold ${theme.text}`}>{selectedLead.planningPurchase||"Pending"}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Loan Required?</p><p className={`font-semibold ${theme.text}`}>{getLatestLoanDetails()?.loanRequired}</p></div>
                                  <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Status</p><p className={`font-semibold ${theme.accentText}`}>{selectedLead.status||"Routed"}</p></div>
                                  <div className={`col-span-2 p-4 rounded-xl border ${isDark?"border-[#9E217B]/20":"border-[#9E217B]/20"} ${theme.settingsBg}`}>
                                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark?"text-[#d946a8]":"text-[#9E217B]"}`}>📍 Site Visit Date</p>
                                    <p className={`text-lg font-black ${theme.text}`}>{selectedLead.mongoVisitDate?formatDate(selectedLead.mongoVisitDate):"Not Scheduled"}</p>
                                  </div>
                                </div>
                                <div className={`mt-6 border rounded-xl p-4 ${theme.settingsBg}`}>
                                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 border-b pb-2 ${theme.accentText} ${theme.tableBorder}`}>Channel Partner Data</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Primary Source</p><p className={`font-medium text-sm ${theme.text}`}>{selectedLead.source||"N/A"}</p></div>
                                    {selectedLead.source==="Others"&&(<div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Specified Name</p><p className={`font-medium text-sm ${theme.text}`}>{selectedLead.sourceOther}</p></div>)}
                                  </div>
                                  {selectedLead.source==="Channel Partner"&&(
                                    <div className={`mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 ${theme.tableBorder}`}>
                                      {[{label:"CP Name",val:selectedLead.cpName},{label:"CP Company",val:selectedLead.cpCompany},{label:"CP Phone",val:selectedLead.cpPhone}].map(({label,val}) => (
                                        <div key={label}><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>{label}</p><p className={`font-medium text-sm ${theme.text}`}>{val||"N/A"}</p></div>
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
                                      <h3 className={`text-sm font-bold border-b pb-2 mb-6 uppercase flex items-center gap-2 ${isDark?"text-[#d946a8]":"text-[#9E217B]"} ${theme.tableBorder}`}><FaUniversity/> Deal Loan Overview</h3>
                                      {isHighProb && <div className="mb-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 p-3 rounded-lg flex items-center justify-center gap-2 text-orange-500 font-bold tracking-wide shadow-md">🚀 HIGH PROBABILITY DEAL (Visit Done + Loan Approved)</div>}
                                      <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Loan Required?</p><p className={`font-semibold ${theme.text}`}>{curLoan?.loanRequired}</p></div>
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Current Status</p><p className={`font-bold px-2 py-0.5 rounded inline-block border ${sColor}`}>{curLoan?.status}</p></div>
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Amount Requested</p><p className="text-orange-500 font-semibold">{curLoan?.amountReq}</p></div>
                                        <div><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>Amount Approved</p><p className="text-green-500 font-semibold">{curLoan?.amountApp}</p></div>
                                        {[{label:"Bank Name",val:curLoan?.bankName},{label:"CIBIL Score",val:curLoan?.cibil},{label:"Agent Name",val:curLoan?.agent},{label:"Agent Contact",val:curLoan?.agentContact},{label:"Emp Type",val:curLoan?.empType},{label:"Monthly Income",val:curLoan?.income},{label:"Existing EMIs",val:curLoan?.emi}].map(f => (
                                          <div key={f.label}><p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>{f.label}</p><p className={`font-semibold ${theme.text}`}>{f.val}</p></div>
                                        ))}
                                        <div className="col-span-2 mb-2"><p className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>Document Status</p></div>
                                        {[{label:"PAN Card",val:curLoan?.docPan},{label:"Aadhaar",val:curLoan?.docAadhaar},{label:"Salary/ITR",val:curLoan?.docSalary},{label:"Bank Stmt",val:curLoan?.docBank},{label:"Property Docs",val:curLoan?.docProperty}].map((doc, i) => (
                                          <div key={i} className={`flex items-center justify-between border p-2 rounded-lg col-span-1 ${theme.innerBlock}`}>
                                            <span className={`text-xs ${theme.textMuted}`}>{doc.label}</span>
                                            {doc.val==="Uploaded"?<FaCheck className="text-green-500 text-xs"/>:<FaClock className={`${theme.textFaint} text-xs`}/>}
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
                            <button className={`border flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1 ${isDark?"bg-[#9E217B]/10 border-[#9E217B]/30 hover:bg-[#9E217B] text-[#d946a8] hover:text-white":"bg-[#9E217B]/10 border-[#9E217B]/30 hover:bg-[#9E217B] text-[#9E217B] hover:text-white"}`}>
                              <FaMicrophone className="text-lg"/><span className="font-bold text-[10px]">Browser Call</span>
                            </button>
                            <button className="bg-green-50 dark:bg-green-600/10 border border-green-200 dark:border-green-500/30 hover:bg-green-100 dark:hover:bg-green-600 text-green-600 dark:text-green-400 flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1">
                              <FaWhatsapp className="text-xl"/><span className="font-bold text-[10px]">WhatsApp</span>
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
                          const isLoan  = msg.message.includes("🏦 Loan Update");
                          const isSF    = msg.message.includes("📝 Detailed Salesform Submitted");
                          const isAdmin = msg.createdBy === "admin";
                          let bg = theme.fupDefault;
                          if (isLoan) bg = theme.fupLoan;
                          else if (isSF) bg = theme.fupSalesform;
                          else if (isAdmin) bg = theme.fupClosing;
                          return (
                            <div key={idx} className="flex justify-start">
                              <div className={`rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-lg ${bg}`}>
                                <div className="flex justify-between items-center mb-3 gap-6">
                                  <span className={`font-bold text-sm ${theme.text}`}>{msg.createdBy==="admin"?`${msg.salesManagerName||"Admin"} (Admin)`:msg.salesManagerName}</span>
                                  <span className={`text-[10px] ${theme.textFaint}`}>{formatDate(msg.createdAt)}</span>
                                </div>
                                <p className={`text-sm whitespace-pre-wrap leading-relaxed ${theme.text}`}>{msg.message}</p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={followUpEndRef}/>
                      </div>
                      <form onSubmit={handleSendCustomNote} className={`p-4 border-t flex gap-3 items-center flex-shrink-0 ${theme.chatInputInner}`}>
                        <input type="text" value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder="Add admin note..."
                          className={`flex-1 border rounded-xl px-4 py-3 text-sm outline-none transition-colors shadow-inner ${theme.inputInner} ${theme.text} ${theme.inputFocus}`}/>
                        <button type="submit" className={`w-12 h-12 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-lg ${isDark?"bg-[#9E217B] hover:bg-[#b8268f]":"bg-[#9E217B] hover:bg-[#8a1d6b]"}`}>
                          <FaPaperPlane className="text-sm ml-[-2px]"/>
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
// RECEPTIONIST VIEW
// ============================================================================
function ReceptionistView({ receptionists, allLeads, isLoading, refetch, theme, isDark }: any) {
  const [selectedReceptionist, setSelectedReceptionist] = useState<any>(null);
  const [searchRecep, setSearchRecep] = useState("");
  const [subView, setSubView]         = useState<"cards"|"detail">("cards");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const filteredRecep     = receptionists.filter((r: any) => r.name?.toLowerCase().includes(searchRecep.toLowerCase()));
  const receptionistLeads = allLeads;

  return (
    <div className="flex h-full">
      <div className={`w-80 border-r flex flex-col h-full flex-shrink-0 z-20 shadow-xl ${theme.innerBlock}`}>
        <div className={`p-5 border-b ${theme.tableBorder}`}>
          <div className="relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${theme.textFaint}`}/>
            <input type="text" placeholder="Search Receptionists..." value={searchRecep} onChange={e => setSearchRecep(e.target.value)}
              className={`w-full rounded-lg pl-9 pr-4 py-2 text-sm outline-none transition-colors ${theme.inputInner} ${theme.text} ${theme.inputFocus}`}/>
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto ${theme.scroll}`}>
          {isLoading ? <div className={`p-8 text-center text-sm ${theme.textMuted}`}>Loading staff...</div>
          : filteredRecep.length === 0 ? <div className={`p-8 text-center text-sm ${theme.textMuted}`}>No receptionists found.</div>
          : filteredRecep.map((recep: any) => {
            const isSelected = selectedReceptionist?.id === recep.id;
            return (
              <div key={recep.id||recep.name||recep._id}
                onClick={() => { setSelectedReceptionist(recep); setSubView("cards"); }}
                className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-b ${theme.tableBorder}
                  ${isSelected
                    ? isDark ? "border-l-4 border-l-[#9E217B] bg-[#9E217B]/10" : "border-l-4 border-l-[#9E217B] bg-pink-50"
                    : "hover:opacity-80 border-l-4 border-l-transparent"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${isSelected ? "bg-[#9E217B]" : isDark ? "bg-[#333] text-gray-400" : "bg-gray-400"}`}>
                  {recep.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-bold truncate text-sm ${theme.text}`}>{recep.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isDark ? "text-[#d946a8] bg-[#9E217B]/10" : "text-[#9E217B] bg-pink-100"}`}>{allLeads.length} logged</span>
                  </div>
                  <p className={`text-xs truncate capitalize ${theme.textFaint}`}>{recep.role?.replace("_", " ")}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className={`p-5 border-b flex justify-between items-center shadow-sm z-10 flex-shrink-0 gap-4 ${theme.header}`} style={theme.headerGlass}>
          <div>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${theme.text}`}>
              <FaClipboardList className={isDark ? "text-[#d946a8]" : "text-[#9E217B]"}/>
              {selectedReceptionist ? `${selectedReceptionist.name}'s Logged Enquiries` : "Select a Receptionist"}
            </h2>
            <p className={`text-xs mt-1 ${theme.textFaint}`}>Review walk-in forms registered by this desk.</p>
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto p-6 ${theme.scroll}`}>
          {!selectedReceptionist ? (
            <div className={`h-full flex flex-col items-center justify-center ${theme.textMuted}`}>
              <FaClipboardList className="text-4xl mb-4 opacity-20"/>
              <p>Select a receptionist from the left to view their logged data.</p>
            </div>
          ) : subView === "cards" ? (
            <div className="animate-fadeIn grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
              {receptionistLeads.length === 0 ? <p className={`text-sm ${theme.textMuted}`}>No forms logged yet.</p>
              : receptionistLeads.map((lead: any) => {
                const statusColors: any = {
                  "Completed": { text:isDark?"text-green-500":"text-green-700",border:isDark?"border-green-500/30":"border-green-300",bg:isDark?"bg-green-500/10":"bg-green-50" },
                  "Visit Scheduled": { text:isDark?"text-yellow-500":"text-yellow-700",border:isDark?"border-yellow-500/30":"border-yellow-300",bg:isDark?"bg-yellow-500/10":"bg-yellow-50" },
                  "Routed": { text:isDark?"text-[#d946a8]":"text-[#9E217B]",border:isDark?"border-[#9E217B]/30":"border-pink-300",bg:isDark?"bg-[#9E217B]/10":"bg-pink-50" },
                };
                const leadStatus = lead.status || "Routed";
                const colorSet   = statusColors[leadStatus] || statusColors["Routed"];
                return (
                  <div key={lead.id}
                    onClick={() => { setSelectedLead(lead); setSubView("detail"); }}
                    className={`rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors cursor-pointer ${theme.card}`} style={theme.cardGlass}>
                    <div>
                      <div className={`flex justify-between items-start mb-5 pb-4 border-b ${theme.tableBorder}`}>
                        <h3 className={`text-lg font-bold line-clamp-1 pr-2 ${theme.text}`}><span className={`mr-2 ${theme.accentText}`}>#{lead.id}</span>{lead.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colorSet.border} ${colorSet.text} ${colorSet.bg}`}>{leadStatus}</span>
                      </div>
                      <div className="space-y-4 mb-6">
                        <div><p className={`text-xs font-medium ${theme.textMuted}`}>Estimated Budget</p><p className={`text-sm font-semibold ${theme.text}`}>{lead.salesBudget||lead.budget||"N/A"}</p></div>
                        <div className={`p-3 rounded-lg border flex flex-col gap-2 ${theme.innerBlock}`}>
                          <p className={`text-xs flex items-center gap-2 ${theme.textMuted}`}><FaPhoneAlt className="w-3 h-3"/> Primary: <span className={`font-mono ${theme.text}`}>{maskPhone(lead.phone)}</span></p>
                        </div>
                      </div>
                    </div>
                    <div className={`pt-4 border-t flex justify-between items-center text-sm mt-auto ${theme.tableBorder}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold bg-[#9E217B]`}>{String(lead.assigned_to||"U").charAt(0).toUpperCase()}</div>
                        <p className={`text-xs ${theme.textMuted}`}>Assigned: <span className={`font-semibold ${theme.text}`}>{lead.assigned_to||"Unassigned"}</span></p>
                      </div>
                      <p className={`text-[10px] ${theme.textFaint}`}>{formatDate(lead.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : subView === "detail" && selectedLead && (
            <div className="animate-fadeIn max-w-[1200px] mx-auto">
              <div className={`flex items-center gap-4 mb-6 rounded-2xl border p-5 shadow-xl ${theme.card}`} style={theme.cardGlass}>
                <button onClick={() => setSubView("cards")} className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors cursor-pointer ${theme.innerBlock} ${theme.textMuted}`}><FaChevronLeft className="text-sm"/></button>
                <div>
                  <h1 className={`text-2xl font-bold flex items-center gap-3 ${theme.text}`}>
                    <span className={isDark?"text-[#d946a8]":"text-[#9E217B]"}>#{selectedLead.id}</span>
                    <span>{selectedLead.name}</span>
                    <span className={`text-xs font-normal border px-2 py-0.5 rounded-full ${theme.settingsBg}`}>{selectedLead.status}</span>
                  </h1>
                  <p className={`text-xs mt-1 ${theme.textMuted}`}>Logged by: {selectedReceptionist.name} on {formatDate(selectedLead.created_at)}</p>
                </div>
              </div>
              <div className={`rounded-2xl border p-8 shadow-xl ${theme.card}`} style={theme.cardGlass}>
                <h3 className={`text-sm font-bold border-b pb-2 mb-6 uppercase tracking-widest ${theme.textMuted} ${theme.tableBorder}`}>Lead Captured Data</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6">
                  <div><p className={`text-xs mb-1 ${theme.textMuted}`}>Email</p><p className={`font-medium ${theme.text}`}>{selectedLead.email!=="N/A"?selectedLead.email:"N/A"}</p></div>
                  <div><p className={`text-xs mb-1 ${theme.textMuted}`}>Phone</p><p className={`font-mono font-medium ${theme.text}`}>{selectedLead.phone}</p></div>
                  <div><p className={`text-xs mb-1 ${theme.textMuted}`}>Alt Phone</p><p className={`font-mono font-medium ${theme.text}`}>{selectedLead.alt_phone&&selectedLead.alt_phone!=="N/A"?selectedLead.alt_phone:"Not Provided"}</p></div>
                  <div><p className={`text-xs mb-1 ${theme.textMuted}`}>Occupation</p><p className={`font-medium ${theme.text}`}>{selectedLead.occupation||"N/A"}</p></div>
                  <div className="col-span-2"><p className={`text-xs mb-1 ${theme.textMuted}`}>Organization / Address</p><p className={`font-medium ${theme.text}`}>{selectedLead.organization} / {selectedLead.address}</p></div>
                  <div><p className={`text-xs mb-1 ${theme.textMuted}`}>Budget</p><p className="text-green-500 font-bold">{selectedLead.budget||"N/A"}</p></div>
                  <div><p className={`text-xs mb-1 ${theme.textMuted}`}>Configuration</p><p className={`font-medium ${theme.text}`}>{selectedLead.configuration||"N/A"}</p></div>
                  <div><p className={`text-xs mb-1 ${theme.textMuted}`}>Purpose</p><p className={`font-medium ${theme.text}`}>{selectedLead.purpose||"N/A"}</p></div>
                  <div><p className={`text-xs mb-1 ${theme.textMuted}`}>Source</p><p className={`font-medium ${theme.text}`}>{selectedLead.source||"N/A"}</p></div>
                  <div className="col-span-2">
                    <p className={`text-xs mb-1 font-bold ${isDark?"text-[#d946a8]":"text-[#9E217B]"}`}>Assigned Sales Manager</p>
                    <p className={`font-bold ${theme.text}`}>{selectedLead.assigned_to||"N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FaEye import needed for profile panel ──
function FaEye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 576 512" fill="currentColor" width="1em" height="1em">
      <path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"/>
    </svg>
  );
}