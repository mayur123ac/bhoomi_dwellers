"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FaThLarge, FaCog, FaBell, FaTimes, FaClipboardList,
  FaChevronLeft, FaRobot, FaPaperPlane, FaCalendarAlt, FaEye, FaEyeSlash, FaPhoneAlt, FaUserCircle, FaBriefcase, FaSearch, FaDownload
} from "react-icons/fa";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from "recharts";

const PAGE_SIZE = 20;

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const NAV_ITEMS = [
  { id: "overview",  icon: <FaThLarge className="w-5 h-5" />,       title: "Dashboard" },
  { id: "forms",     icon: <FaClipboardList className="w-5 h-5" />, title: "Forms List" },
  { id: "assistant", icon: <FaRobot className="w-5 h-5" />,         title: "CRM AI Assistant" },
];

const LEAD_SOURCES = [
  "Advertisement", "Referral", "Exhibition", "Channel Partner", "Website", "Call Center", "Others"
];

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

export default function ReceptionistDashboard() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  const t = {
    pageWrap:      isDark ? "bg-[#0A0A0F] text-white"                  : "text-[#1A1A1A]",
    mainBg:        isDark ? "bg-[#0A0A0F]"                             : "bg-transparent",
    sidebar:       isDark ? "bg-[#121218] border-[#2A2A35]"            : "bg-[#1A1A1A] border-[#2A2A2A]",
    header:        isDark ? "bg-[#121218] border-[#2A2A35]"            : "bg-white border-[#9CA3AF]",
    headerGlass:   isDark ? {}                                         : { boxShadow: "0 1px 0 #9CA3AF, 0 4px 16px rgba(0,174,239,0.06)" },
    
    // ======== MAGENTA GLOWS INTEGRATED HERE ========
    card:          isDark 
      ? "bg-[#121218] border-[#2A2A35] hover:border-[#9E217B]/50 hover:shadow-[0_0_24px_4px_rgba(158,33,123,0.35)] transition-all duration-300" 
      : "bg-gradient-to-r from-[#f1f5ff] via-[#eef2ff] to-[#f5f3ff] border-[#9CA3AF] shadow-[0_4px_16px_rgba(0,174,239,0.06)] hover:border-[#9E217B] hover:shadow-[0_0_30px_8px_rgba(158,33,123,0.45)] transition-all duration-300",
    
    cardGlass:     {}, 
    
    tableWrap:     isDark ? "bg-[#121218] border-[#2A2A35]"            : "bg-white border-[#9CA3AF]",
    tableGlass:    isDark ? {}                                         : { boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(158,33,123,0.06), 0 16px 36px rgba(0,0,0,0.09)" },
    tableHead:     isDark ? "bg-[#1A1A28]"                             : "bg-[#F1F5F9]",
    tableRow:      isDark ? "hover:bg-[#1C1C2A]"                       : "hover:bg-[#F8FAFC]",
    tableDivide:   isDark ? "divide-[#1E1E2A]"                         : "divide-[#9CA3AF]",
    tableBorder:   isDark ? "border-[#2A2A35]"                         : "border-[#9CA3AF]",
    inputBg:       isDark ? "bg-[#14141B] border-[#2A2A35]"            : "bg-white border-[#9CA3AF]",
    modalCard:     isDark ? "bg-[#121218] border-[#2A2A35]"            : "bg-white border-[#9CA3AF]",
    modalGlass:    isDark ? {}                                         : { boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,174,239,0.08), 0 32px 72px rgba(0,0,0,0.16)" },
    modalInner:    isDark ? "bg-[#0A0A0F]"                             : "bg-[#F8FAFC]",
    modalHeader:   isDark ? "bg-[#1A1A28]"                             : "bg-[#F1F5F9]",
    modalBlock:    isDark ? "bg-[#14141B] border-[#1E1E2A]"            : "bg-white border-[#9CA3AF]",
    modalBlockGl:  isDark ? {}                                         : { boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 3px 8px rgba(0,174,239,0.05)" },
    modalInput:    isDark ? "bg-[#14141B] border-[#2A2A35]"            : "bg-white border-[#9CA3AF]",
    text:          isDark ? "text-white"                               : "text-[#9E217B]",
    textMuted:     isDark ? "text-[#888899]"                           : "text-[#6B7280]",
    textFaint:     isDark ? "text-[#55556A]"                           : "text-[#9CA3AF]",
    textHeader:    isDark ? "text-xs text-[#B0B0C4]"                   : "text-xs text-[#6B7280]",
    
    // ======== MAGENTA ACCENTS FOR EVERYTHING ========
    navActive:     isDark ? "bg-[#1A1A28] text-white"                  : "bg-[#2A2A2A] text-[#00AEEF]",
    navInactive:   isDark ? "text-[#888899] hover:bg-[#1A1A28] hover:text-white" : "text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white",
    navIndicator:  isDark ? "bg-[#9E217B] shadow-[0_0_10px_2px_rgba(158,33,123,0.5)]" : "bg-[#9E217B] shadow-[0_0_8px_rgba(158,33,123,0.4)]",
    navIndicatorMobile: isDark ? "bg-[#9E217B] shadow-[0_0_10px_2px_rgba(158,33,123,0.5)]" : "bg-[#9E217B] shadow-[0_0_8px_rgba(158,33,123,0.35)]",
    toggleWrap:    isDark ? "bg-[#1C1C2A] border-[#2A2A38] text-yellow-300" : "bg-[#F1F5F9] border-[#9CA3AF] text-[#1A1A1A]",
    dropdown:      isDark ? "bg-[#121218] border-[#2A2A35]"            : "bg-white border-[#9CA3AF]",
    dropdownGlass: isDark ? {}                                         : { boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 20px rgba(0,174,239,0.08), 0 20px 40px rgba(0,0,0,0.10)" },
    chatArea:      isDark ? "bg-[#0A0A0F]"                             : "bg-[#F8FAFC]",
    chatBubbleAi:  isDark ? "bg-[#1A1A28] text-white border border-[#2A2A35]" : "bg-white text-[#1A1A1A] border border-[#9CA3AF] shadow-sm",
    chatInput:     isDark ? "bg-[#14141B] border-[#2A2A35]"            : "bg-white border-[#9CA3AF]",
    chatPanel:     isDark ? "bg-[#121218] border-[#2A2A35]"            : "bg-white border-[#9CA3AF]",
    chatPanelGl:   isDark ? {}                                         : { boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(158,33,123,0.06), 0 16px 36px rgba(0,0,0,0.09)" },
    settingsBg:    isDark ? "bg-[#0A0A0F] border-[#2A2A35]"            : "bg-[#F8FAFC] border-[#9CA3AF]",
    settingsBgGl:  isDark ? {}                                         : { boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)" },
    
    accentText:    isDark ? "text-[#d4006e]"                           : "text-[#00AEEF]",
    accentBg:      isDark ? "bg-[#9E217B]/10 text-[#d4006e] border border-[#9E217B]/30" : "bg-[#00AEEF]/10 text-[#00AEEF] border border-[#00AEEF]/30",
    sectionTitle:  isDark ? "text-[#d4006e]"                           : "text-[#9E217B]",
    sectionBorder: isDark ? "border-[#9E217B]/20"                      : "border-[#9E217B]/25",
    btnPrimary:    isDark ? "bg-[#9E217B] hover:bg-[#7a1a5e] text-white shadow-md" : "bg-[#00AEEF] hover:bg-[#0099d4] text-white shadow-sm",
    btnDanger:     isDark ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30" : "bg-[#9E217B]/10 text-[#9E217B] hover:bg-[#9E217B] hover:text-white border border-[#9E217B]/30",
    logoBg:        isDark ? "bg-[#9E217B] shadow-lg shadow-[#9E217B]/30" : "bg-[#9E217B] shadow-lg shadow-[#9E217B]/30",
    
    selectSmall:   isDark ? "bg-[#1A1A28] border-[#2A2A35] text-white" : "bg-white border-[#D1D5DB] text-[#6B7280]",
    chartColors:   isDark
      ? ["#d946ef", "#8b5cf6", "#3b82f6", "#0ea5e9", "#6b7280", "#f59e0b", "#10b981"]
      : ["#00AEEF", "#9E217B", "#0077b6", "#d4006e", "#9CA3AF", "#f59e0b", "#10b981"],
    tooltipBg:     isDark ? "#1a1a1a" : "rgba(255,255,255,0.98)",
    tooltipColor:  isDark ? "#fff" : "#1A1A1A",
    tooltipBorder: isDark ? "1px solid rgba(158,33,123,0.3)" : "1px solid #E5E7EB",
    legendColor:   isDark ? "#9ca3af" : "#6B7280",
    
    exportBtn:     isDark ? "border-[#2A2A35] hover:border-[#9E217B] hover:text-[#d4006e] text-[#888899]" : "border-[#9CA3AF] hover:border-[#9E217B] hover:text-[#9E217B] text-[#6B7280]",
  };

  // ================= STATE =================
  const [user, setUser] = useState({ name: "Loading...", role: "Receptionist", email: "", password: "" });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { sender: "ai", text: "Hello! I am your CRM Assistant. Ask me about your total leads, or type a client's name to pull up their details!" }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [salesManagers, setSalesManagers] = useState<any[]>([]);
  const [isFetchingManagers, setIsFetchingManagers] = useState(true);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [isFetchingEnquiries, setIsFetchingEnquiries] = useState(true);
  const [searchRecep, setSearchRecep] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Dashboard chart/card state ──
  // Card 1: Room Configuration chart mode
  const [chartMode1, setChartMode1] = useState<"today"|"monthly"|"3months"|"6months"|"yearly"|"inception">("today");
  const [configChartMonth, setConfigChartMonth] = useState(new Date().getMonth());

  // Card 2: Enquiry Details
  const [card2Mode, setCard2Mode] = useState<"today"|"monthly"|"3months"|"6months"|"yearly"|"alltime">("monthly");
  const [selectedMonthCard, setSelectedMonthCard] = useState(new Date().getMonth());

  // Card 3: Sales Manager
  const [card3Mode, setCard3Mode] = useState<"today"|"monthly"|"3months"|"6months"|"yearly"|"inception">("today");
  const [card3Month, setCard3Month] = useState(new Date().getMonth());

  // Card 4: Lead Sources
  const [card4Mode, setCard4Mode] = useState<"today"|"monthly"|"3months"|"6months"|"yearly"|"inception">("monthly");
  const [card4Month, setCard4Month] = useState(new Date().getMonth());

  const tableSentinelRef = useRef<HTMLDivElement>(null);
  const cardsSentinelRef = useRef<HTMLDivElement>(null);

  const [enquiryForm, setEnquiryForm] = useState({
    fullName: "", mobile: "", altMobile: "", email: "", address: "",
    occupation: "", organization: "", budget: "",
    configuration: "", purpose: "", source: "", assignedTo: "",
    siteVisitDate: "", appxPurchaseDate: "", loanPlanned: "", sourceOther: "",
    cpDetails: { name: "", company: "", phone: "" }
  });

  // ================= DATE CONSTANTS (must be before all useMemos) =================
  const now = new Date();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const sixMonthsAgo   = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const yearStart      = new Date(now.getFullYear(), 0, 1);

  // ================= EFFECTS =================
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeTab === "assistant") chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeTab]);

  useEffect(() => {
    const storedUser = localStorage.getItem("crm_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ ...parsedUser, name: parsedUser.name || "User", password: parsedUser.password || "********" });
        if (parsedUser.role?.toLowerCase() === "receptionist" || parsedUser.role?.toLowerCase() === "admin") {
          fetchSalesManagers();
          initialLoad();
        } else {
          router.push("/dashboard");
        }
      } catch { router.push("/"); }
    } else { router.push("/"); }
  }, [router]);

  useEffect(() => {
    const sentinel = tableSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isFetchingEnquiries) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isFetchingEnquiries, offset]);

  useEffect(() => {
    const sentinel = cardsSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isFetchingEnquiries) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isFetchingEnquiries, offset]);

  // ================= DATA FETCHING =================
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return "Invalid Date"; }
  };

  const fetchPage = async (currentOffset: number, append: boolean) => {
    try {
      const res = await fetch(`/api/walkin_enquiries?limit=${PAGE_SIZE}&offset=${currentOffset}`);
      if (!res.ok) return;
      const json = await res.json();
      const dataArray: any[] = Array.isArray(json) ? json : (json.data ?? []);
      const total: number = json.total ?? (append ? totalCount : dataArray.length);
      const formatted = dataArray.map((item: any) => ({
        ...item,
        assignedTo: item.assigned_to || "Unassigned",
        altPhone: item.alt_phone,
        date: formatDate(item.created_at),
        status: item.status || "Routed"
      }));
      setEnquiries((prev) => {
        const base = append ? prev : [];
        const merged = [...base, ...formatted];
        const seen = new Set<string>();
        const deduped = merged.filter(e => {
          const key = String(e.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return deduped;
      });
      setTotalCount(total);
      setHasMore(formatted.length === PAGE_SIZE && (currentOffset + PAGE_SIZE) < total);
    } catch (error) { console.error("Failed to load enquiries", error); }
  };

  const initialLoad = async () => {
    setIsFetchingEnquiries(true);
    setOffset(0); setHasMore(true); setEnquiries([]);
    await fetchPage(0, false);
    setIsFetchingEnquiries(false);
  };

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    await fetchPage(nextOffset, true);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, offset]);

  const fetchSalesManagers = async () => {
    setIsFetchingManagers(true);
    try {
      const res = await fetch("/api/users/sales-manager");
      if (res.ok) {
        const json = await res.json();
        const dataArray = json.data || json;
        if (Array.isArray(dataArray)) setSalesManagers(dataArray);
      }
    } catch (error) { console.error("Failed to load managers", error); }
    finally { setIsFetchingManagers(false); }
  };

  const handleLogout = () => { localStorage.removeItem("crm_user"); router.push("/"); };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const newEntry = {
      name: enquiryForm.fullName, phone: enquiryForm.mobile,
      alt_phone: enquiryForm.altMobile || null, email: enquiryForm.email || "N/A",
      address: enquiryForm.address || "N/A", occupation: enquiryForm.occupation || "N/A",
      organization: enquiryForm.organization || "N/A",
      budget: enquiryForm.budget || "Pending",
      configuration: enquiryForm.configuration || "N/A",
      purpose: enquiryForm.purpose || "N/A",
      source: enquiryForm.source, source_other: enquiryForm.source === "Others" ? enquiryForm.sourceOther : null,
      cp_name: enquiryForm.source === "Channel Partner" ? enquiryForm.cpDetails.name : null,
      cp_company: enquiryForm.source === "Channel Partner" ? enquiryForm.cpDetails.company : null,
      cp_phone: enquiryForm.source === "Channel Partner" ? enquiryForm.cpDetails.phone : null,
      loan_planned: enquiryForm.loanPlanned || "Pending",
      assignedTo: enquiryForm.assignedTo, status: "Routed",
    };

    try {
      const res = await fetch("/api/walkin_enquiries", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newEntry),
      });
      if (res.ok) {
        alert(`Success! Lead routed to ${enquiryForm.assignedTo}!`);
        setIsEnquiryModalOpen(false);
        setEnquiryForm({ fullName: "", mobile: "", altMobile: "", email: "", address: "", occupation: "", organization: "", budget: "", configuration: "", purpose: "", source: "", assignedTo: "", siteVisitDate: "", appxPurchaseDate: "", loanPlanned: "", sourceOther: "", cpDetails: { name: "", company: "", phone: "" } });
        initialLoad();
      } else {
        alert("Server Error. Ensure you updated the schema in PostgreSQL!");
      }
    } catch {
      alert("Network Error while submitting form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskPhoneNumber = (phone: any) => {
    if (!phone || phone === "N/A") return "N/A";
    const c = String(phone).replace(/[^a-zA-Z0-9]/g, "");
    if (c.length <= 5) return c;
    return `${c.slice(0, 2)}${"*".repeat(c.length - 5)}${c.slice(-3)}`;
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.toLowerCase();
    setChatMessages((prev) => [...prev, { sender: "user", text: chatInput }]);
    setChatInput("");
    setTimeout(() => {
      let aiResponse = "I can help you analyze your CRM data. Ask me about total leads or interested clients.";
      const matchedClient = enquiries.find((e) => userMsg.includes(e.name.toLowerCase().split(" ")[0]));
      if (matchedClient) {
        aiResponse = `Here is the data for ${matchedClient.name}:\n\n• Phone: ${maskPhoneNumber(matchedClient.phone)}\n• Email: ${matchedClient.email !== "N/A" ? matchedClient.email : "Not Provided"}\n• Budget: ${matchedClient.budget}\n• Config: ${matchedClient.configuration}\n• Created On: ${matchedClient.date}\n• Assigned To: ${matchedClient.assignedTo}`;
      } else if (userMsg.includes("total") || userMsg.includes("how many")) {
        aiResponse = `You currently have ${totalCount} total leads recorded in the system.`;
      } else if (userMsg.includes("interested")) {
        const interested = enquiries.filter((e) => e.status?.toLowerCase() === "interested").length;
        aiResponse = `There are currently ${interested} clients marked as 'Interested' (in loaded records).`;
      }
      setChatMessages((prev) => [...prev, { sender: "ai", text: aiResponse }]);
    }, 600);
  };

  const receptionistLeads = enquiries.filter(
    (e: any) =>
      e.name?.toLowerCase().includes(searchRecep.toLowerCase()) ||
      String(e.id).includes(searchRecep) ||
      e.phone?.includes(searchRecep)
  );

  // ================= CSV EXPORT UTILITY =================
  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("No data available to export for this selection.");
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

  // ================= CHART DATA COMPUTATIONS =================

  const CONFIG_KEYS = ["1 RK", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "4+ BHK", "Other"];

  // ── Card 1: Room Configuration BAR CHART — filtered by period ──

  // Today config bar data
  const configTodayBarData = useMemo(() => {
    const filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= todayStart);
    const cc: Record<string, number> = {};
    CONFIG_KEYS.forEach(k => cc[k] = 0);
    filtered.forEach(item => {
      const c = String(item.configuration || "").trim();
      if (cc[c] !== undefined) cc[c]++; else cc["Other"]++;
    });
    return CONFIG_KEYS.map((name, i) => ({ name: name === "Other" ? "Other" : name, count: cc[name], color: t.chartColors[i % t.chartColors.length] })).filter(d => d.count > 0);
  }, [enquiries, todayStart, t.chartColors]);

  // Monthly config bar data
  const configMonthlyBarData = useMemo(() => {
    const filtered = enquiries.filter(e => {
      if (!e.created_at) return false;
      const d = new Date(e.created_at);
      return d.getMonth() === configChartMonth && d.getFullYear() === now.getFullYear();
    });
    const cc: Record<string, number> = {};
    CONFIG_KEYS.forEach(k => cc[k] = 0);
    filtered.forEach(item => {
      const c = String(item.configuration || "").trim();
      if (cc[c] !== undefined) cc[c]++; else cc["Other"]++;
    });
    return CONFIG_KEYS.map((name, i) => ({ name: name === "Other" ? "Other" : name, count: cc[name], color: t.chartColors[i % t.chartColors.length] })).filter(d => d.count > 0);
  }, [enquiries, configChartMonth, isDark]);

  // 3-month config bar data (Stacked)
  const config3MonthBarData = useMemo(() => {
    const months = [2, 1, 0].map(offset => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return { month: MONTH_NAMES[d.getMonth()].slice(0, 3), monthIdx: d.getMonth(), year: d.getFullYear() };
    });
    return months.map(({ month, monthIdx, year }) => {
      const filtered = enquiries.filter(e => {
        if (!e.created_at) return false;
        const d = new Date(e.created_at);
        return d.getMonth() === monthIdx && d.getFullYear() === year;
      });
      const entry: Record<string, any> = { month };
      CONFIG_KEYS.forEach(k => {
        entry[k] = filtered.filter(e => {
          const c = String(e.configuration || "").trim();
          return k === "Other" ? !CONFIG_KEYS.slice(0, -1).includes(c) : c === k;
        }).length;
      });
      return entry;
    });
  }, [enquiries]);

  // 6-month config bar data (Stacked)
  const config6MonthBarData = useMemo(() => {
    const months = [5, 4, 3, 2, 1, 0].map(offset => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return { month: MONTH_NAMES[d.getMonth()].slice(0, 3), monthIdx: d.getMonth(), year: d.getFullYear() };
    });
    return months.map(({ month, monthIdx, year }) => {
      const filtered = enquiries.filter(e => {
        if (!e.created_at) return false;
        const d = new Date(e.created_at);
        return d.getMonth() === monthIdx && d.getFullYear() === year;
      });
      const entry: Record<string, any> = { month };
      CONFIG_KEYS.forEach(k => {
        entry[k] = filtered.filter(e => {
          const c = String(e.configuration || "").trim();
          return k === "Other" ? !CONFIG_KEYS.slice(0, -1).includes(c) : c === k;
        }).length;
      });
      return entry;
    });
  }, [enquiries]);

  // Yearly config bar data (Stacked)
  const configYearlyBarData = useMemo(() => {
    return MONTH_NAMES.map((month, idx) => {
      const filtered = enquiries.filter(e => {
        if (!e.created_at) return false;
        const d = new Date(e.created_at);
        return d.getMonth() === idx && d.getFullYear() === now.getFullYear();
      });
      const entry: Record<string, any> = { month: month.slice(0, 3) };
      CONFIG_KEYS.forEach(k => {
        entry[k] = filtered.filter(e => {
          const c = String(e.configuration || "").trim();
          return k === "Other" ? !CONFIG_KEYS.slice(0, -1).includes(c) : c === k;
        }).length;
      });
      return entry;
    });
  }, [enquiries]);

  // Inception config bar data (All Time)
  const configInceptionBarData = useMemo(() => {
    const cc: Record<string, number> = {};
    CONFIG_KEYS.forEach(k => cc[k] = 0);
    enquiries.forEach(item => {
      const c = String(item.configuration || "").trim();
      if (cc[c] !== undefined) cc[c]++; else cc["Other"]++;
    });
    return CONFIG_KEYS.map((name, i) => ({ name: name === "Other" ? "Other" : name, count: cc[name], color: t.chartColors[i % t.chartColors.length] })).filter(d => d.count > 0);
  }, [enquiries, t.chartColors]);

  // ── Card 1 Export Handler ──
  const handleExportCard1 = () => {
    let exportData: any[] = [];
    if (chartMode1 === "today") exportData = configTodayBarData;
    else if (chartMode1 === "monthly") exportData = configMonthlyBarData;
    else if (chartMode1 === "inception") exportData = configInceptionBarData;
    else if (chartMode1 === "3months") exportData = config3MonthBarData;
    else if (chartMode1 === "6months") exportData = config6MonthBarData;
    else if (chartMode1 === "yearly") exportData = configYearlyBarData;

    const formatted = exportData.map(item => {
      const { color, monthIdx, year, ...rest } = item;
      return rest;
    });
    downloadCSV(formatted, `Room_Configurations_${chartMode1}.csv`);
  };


  // ── Card 2: Enquiry counts & Export ──
  const enquiriesToday = useMemo(() => enquiries.filter(e => e.created_at && new Date(e.created_at) >= todayStart).length, [enquiries]);
  const monthlyEnquiriesSelected = useMemo(() => { return enquiries.filter(e => { if (!e.created_at) return false; const d = new Date(e.created_at); return d.getMonth() === selectedMonthCard && d.getFullYear() === now.getFullYear(); }).length; }, [enquiries, selectedMonthCard]);
  const enquiries3Months = useMemo(() => enquiries.filter(e => e.created_at && new Date(e.created_at) >= threeMonthsAgo).length, [enquiries]);
  const enquiries6Months = useMemo(() => enquiries.filter(e => e.created_at && new Date(e.created_at) >= sixMonthsAgo).length, [enquiries]);
  const enquiriesYear    = useMemo(() => enquiries.filter(e => e.created_at && new Date(e.created_at) >= yearStart).length, [enquiries]);

  // ── Card 2 Export Handler ──
  const handleExportCard2 = () => {
    let filtered = enquiries;
    if (card2Mode === "today") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= todayStart);
    else if (card2Mode === "monthly") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at).getMonth() === selectedMonthCard && new Date(e.created_at).getFullYear() === now.getFullYear());
    else if (card2Mode === "3months") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= threeMonthsAgo);
    else if (card2Mode === "6months") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= sixMonthsAgo);
    else if (card2Mode === "yearly") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= yearStart);
    // "alltime" uses all enquiries

    const formatted = filtered.map(e => ({
      "Lead No": e.id,
      "Client Name": e.name,
      "Budget": e.budget || "N/A",
      "Configuration": e.configuration || "N/A",
      "Purpose": e.purpose || "N/A",
      "Source": e.source || "N/A",
      "Date": e.date,
      "Assigned To": e.assignedTo || "Unassigned"
    }));
    downloadCSV(formatted, `Enquiries_Details_${card2Mode}.csv`);
  };


  // ── Card 3: Sales Manager filtered counts & Export ──
  const managerLeadCountsFiltered = useMemo(() => {
    const c: Record<string, number> = {};
    let filtered = enquiries;
    if (card3Mode === "today") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= todayStart);
    else if (card3Mode === "monthly") filtered = enquiries.filter(e => { if (!e.created_at) return false; const d = new Date(e.created_at); return d.getMonth() === card3Month && d.getFullYear() === now.getFullYear(); });
    else if (card3Mode === "3months") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= threeMonthsAgo);
    else if (card3Mode === "6months") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= sixMonthsAgo);
    else if (card3Mode === "yearly") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= yearStart);

    filtered.forEach(e => {
      const m = e.assignedTo || "Unassigned";
      c[m] = (c[m] || 0) + 1;
    });
    return Object.entries(c).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [enquiries, card3Mode, card3Month, todayStart, threeMonthsAgo, sixMonthsAgo, yearStart]);

  // ── Card 3 Export Handler ──
  const handleExportCard3 = () => {
    const formatted = managerLeadCountsFiltered.map(m => ({
      "Sales Manager": m.name,
      "Total Enquiries Assigned": m.count
    }));
    downloadCSV(formatted, `Sales_Manager_Activity_${card3Mode}.csv`);
  };

  // ── Card 4: Lead Sources Computations & Export ──
  const sourceDataFiltered = useMemo(() => {
    let filtered = enquiries;
    if (card4Mode === "today") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= todayStart);
    else if (card4Mode === "monthly") filtered = enquiries.filter(e => { if (!e.created_at) return false; const d = new Date(e.created_at); return d.getMonth() === card4Month && d.getFullYear() === now.getFullYear(); });
    else if (card4Mode === "3months") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= threeMonthsAgo);
    else if (card4Mode === "6months") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= sixMonthsAgo);
    else if (card4Mode === "yearly") filtered = enquiries.filter(e => e.created_at && new Date(e.created_at) >= yearStart);

    const counts: Record<string, number> = {};
    LEAD_SOURCES.forEach(s => counts[s] = 0);

    filtered.forEach(e => {
      const s = String(e.source || "Others").trim();
      if (counts[s] !== undefined) {
        counts[s]++;
      } else {
        counts["Others"] = (counts["Others"] || 0) + 1;
      }
    });

    return LEAD_SOURCES.map((name, i) => ({
      name,
      count: counts[name],
      color: t.chartColors[i % t.chartColors.length]
    })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
  }, [enquiries, card4Mode, card4Month, todayStart, threeMonthsAgo, sixMonthsAgo, yearStart, t.chartColors]);

  const isSourceChartEmpty = sourceDataFiltered.length === 0;

  const handleExportCard4 = () => {
    const formatted = sourceDataFiltered.map(s => ({
      "Lead Source": s.name,
      "Total Enquiries": s.count
    }));
    downloadCSV(formatted, `Lead_Sources_${card4Mode}.csv`);
  };

  // ── Main Table Export Handler ──
  const handleExportMainTable = () => {
    const formatted = receptionistLeads.map(e => ({
      "Lead No": e.id,
      "Client Name": e.name,
      "CP Company": e.cp_company || "N/A",
      "Budget": e.budget || "N/A",
      "Phone": e.phone || "N/A",
      "Alt Phone": e.altPhone || "N/A",
      "Date Created": e.date,
      "Sales Manager": e.assignedTo || "Unassigned"
    }));
    downloadCSV(formatted, `Front_Desk_Log_Export.csv`);
  };


  const axisColor = isDark ? "#9ca3af" : "#6B7280";
  const gridColor = isDark ? "#2a2a2a" : "#E5E7EB";

  const CustomTooltip = ({ active, payload, label }: any) => active && payload?.length
    ? <div style={{ background: t.tooltipBg, border: t.tooltipBorder, borderRadius: 8, padding: "8px 12px", color: t.tooltipColor, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <p style={{ color: t.legendColor, marginBottom: 4 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ fontWeight: 700, color: p.fill || p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    : null;

  const LoaderRow = () => (
    <tr>
      <td colSpan={8} className="p-6 text-center">
        <div className={`flex items-center justify-center gap-3 text-sm ${t.textMuted}`}>
          <div className="flex gap-1">
            {[0, 150, 300].map((d) => (
              <span key={d} className={`w-2 h-2 rounded-full animate-bounce ${isDark ? "bg-[#9E217B]" : "bg-[#00AEEF]"}`} style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
          Loading more entries…
        </div>
      </td>
    </tr>
  );

  const LoaderCards = () => (
    <div className={`col-span-full flex items-center justify-center gap-3 text-sm py-8 ${t.textMuted}`}>
      <div className="flex gap-1">
        {[0, 150, 300].map((d) => (
          <span key={d} className={`w-2 h-2 rounded-full animate-bounce ${isDark ? "bg-[#9E217B]" : "bg-[#00AEEF]"}`} style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
      Loading more entries…
    </div>
  );

  const isConfigChartEmpty = (() => {
    if (chartMode1 === "today") return configTodayBarData.length === 0;
    if (chartMode1 === "monthly") return configMonthlyBarData.length === 0;
    if (chartMode1 === "inception") return configInceptionBarData.length === 0;
    const data = chartMode1 === "3months" ? config3MonthBarData : chartMode1 === "6months" ? config6MonthBarData : configYearlyBarData;
    return !data.some((d: any) => CONFIG_KEYS.some((k) => d[k] > 0));
  })();

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`flex flex-col md:flex-row h-screen font-sans overflow-hidden ${t.pageWrap}`}
      style={isDark ? {} : {
        background: "linear-gradient(135deg, #e8f6fd 0%, #f8fafc 30%, #faf0fb 62%, #f8fafc 78%, #e6fafe 100%)",
      }}
    >
      {/* ===== SIDEBAR (DESKTOP) ===== */}
      <aside className={`hidden md:flex w-20 border-r flex-col items-center py-6 flex-shrink-0 z-40 shadow-sm ${t.sidebar}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold text-white mb-10 cursor-pointer ${t.logoBg}`}>B</div>
        <nav className="flex flex-col space-y-6 w-full items-center">
          {NAV_ITEMS.map(({ id, icon, title }) => {
            const active = activeTab === id || (id === "forms" && activeTab === "detail");
            return (
              <div key={id} onClick={() => setActiveTab(id)} className="group relative flex justify-center cursor-pointer w-full" title={title}>
                {active && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r ${t.navIndicator}`} />}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${active ? t.navActive : t.navInactive}`}>{icon}</div>
              </div>
            );
          })}
          <div onClick={() => setActiveTab("settings")} className="group relative flex justify-center cursor-pointer w-full mt-auto" title="Settings">
            {activeTab === "settings" && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r ${t.navIndicator}`} />}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeTab === "settings" ? t.navActive : t.navInactive}`}><FaCog className="w-5 h-5" /></div>
          </div>
        </nav>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* HEADER */}
        <header className={`h-16 border-b flex items-center justify-between px-6 flex-shrink-0 z-30 ${t.header}`} style={t.headerGlass}>
          <h1 className={`font-bold flex items-center text-sm md:text-base tracking-wide ${t.text}`}>BhoomiDwellersCRM</h1>
          <div className="flex items-center space-x-4 relative">
            <button onClick={() => setIsDark(!isDark)} aria-label="Toggle theme"
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm ${t.toggleWrap}`}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={`${t.textMuted} transition-colors relative`}
              style={{ color: isNotificationsOpen ? (isDark ? "#d4006e" : "#00AEEF") : undefined }}>
              <FaBell className="w-5 h-5" />
            </button>
            {isNotificationsOpen && (
              <div className={`absolute top-12 right-12 w-72 rounded-xl shadow-2xl p-4 z-50 animate-fadeIn border ${t.dropdown}`} style={t.dropdownGlass}>
                <h3 className={`font-bold text-sm mb-3 border-b pb-2 ${t.text} ${t.tableBorder}`}>Notifications</h3>
                <p className={`text-xs italic ${t.textFaint}`}>All caught up! No recent notifications.</p>
              </div>
            )}
            <div onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer shadow-md hover:scale-105 transition-transform ${isDark ? "border border-[#9E217B]/40 text-[#d4006e] bg-[#9E217B]/15" : "border border-[#00AEEF]/40 text-[#00AEEF] bg-[#00AEEF]/10"}`}>
              {String(user?.name || "U").charAt(0).toUpperCase()}
            </div>
            {isProfileOpen && (
              <div className={`absolute top-12 right-0 w-64 rounded-xl shadow-2xl p-5 z-50 animate-fadeIn border ${t.dropdown}`} style={t.dropdownGlass}>
                <div className="mb-4">
                  <h3 className={`font-bold text-lg ${t.text}`}>{user?.name || "User"}</h3>
                  <p className={`text-sm truncate ${t.textMuted}`}>{user?.email || "No email"}</p>
                </div>
                <hr className={`mb-4 border-0 border-t ${t.tableBorder}`} />
                <div className={`space-y-4 mb-6 text-sm ${t.text}`}>
                  <p className={`flex justify-between items-center ${t.textMuted}`}>
                    Role:
                    <span className={`font-bold capitalize px-2 py-0.5 rounded text-xs ${isDark ? "text-[#d4006e] bg-[#9E217B]/10" : "text-[#00AEEF] bg-[#00AEEF]/10"}`}>{user?.role || "Employee"}</span>
                  </p>
                  <div>
                    <p className={`text-xs mb-1 ${t.textFaint}`}>Password</p>
                    <div className={`flex items-center justify-between p-2 rounded-md border ${t.settingsBg}`} style={t.settingsBgGl}>
                      <span className={`font-mono tracking-widest text-xs ${t.text}`}>{showPassword ? user.password : "••••••••"}</span>
                      <button onClick={() => setShowPassword(!showPassword)} className={`${t.textFaint} cursor-pointer`}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
                    </div>
                  </div>
                </div>
                <button onClick={handleLogout} className={`w-full py-2.5 rounded-lg font-semibold transition-colors cursor-pointer ${t.btnDanger}`}>Logout</button>
              </div>
            )}
          </div>
        </header>

        {/* ── MAIN SCROLL AREA ── */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative ${t.mainBg}`}>

          {/* ================================================================= */}
          {/* SETTINGS TAB */}
          {/* ================================================================= */}
          {activeTab === "settings" && (
            <div className="animate-fadeIn max-w-4xl mx-auto">
              <h1 className={`text-3xl font-bold mb-8 ${t.text}`}>Settings & Profile</h1>
              <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`rounded-2xl p-8 border flex flex-col items-center justify-center ${t.card}`} style={t.cardGlass}>
                  <FaCalendarAlt className={`text-5xl mb-4 ${t.accentText}`} />
                  <h2 className={`text-3xl lg:text-4xl font-black tracking-tight mb-2 ${t.text}`}>{currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</h2>
                  <p className={`font-medium text-sm lg:text-lg ${t.textMuted}`}>{currentTime.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <div className={`rounded-2xl p-8 border ${t.card}`} style={t.cardGlass}>
                  <h3 className={`text-lg font-bold border-b pb-2 mb-6 uppercase tracking-wider ${t.sectionTitle} ${t.tableBorder}`}>Account Details</h3>
                  <div className="space-y-6">
                    <div><p className={`text-xs font-medium mb-1 ${t.textFaint}`}>Full Name</p><p className={`font-semibold text-lg ${t.text}`}>{user?.name || "User"}</p></div>
                    <div><p className={`text-xs font-medium mb-1 ${t.textFaint}`}>Registered Email</p><p className={`font-medium ${t.text}`}>{user?.email || "No Email"}</p></div>
                    <div>
                      <p className={`text-xs font-medium mb-1 ${t.textFaint}`}>System Password</p>
                      <div className={`flex items-center justify-between p-3 rounded-lg border ${t.settingsBg}`} style={t.settingsBgGl}>
                        <span className={`font-mono tracking-widest ${t.text}`}>{showPassword ? user.password : "••••••••••••"}</span>
                        <button onClick={() => setShowPassword(!showPassword)} className={`${t.textMuted} cursor-pointer`}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* AI ASSISTANT TAB */}
          {/* ================================================================= */}
          {activeTab === "assistant" && (
            <div className="animate-fadeIn max-w-4xl mx-auto h-[80vh] flex flex-col pb-4">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDark ? "bg-[#9E217B]/20 text-[#d4006e]" : "bg-[#00AEEF]/10 text-[#00AEEF]"}`}><FaRobot /></div>
                <div>
                  <h1 className={`text-2xl font-bold ${t.text}`}>CRM AI Assistant</h1>
                  <p className={`text-sm ${t.textMuted}`}>Ask questions about your data or retrieve specific client details.</p>
                </div>
              </div>
              <div className={`flex-1 rounded-2xl shadow-xl flex flex-col overflow-hidden border ${t.chatPanel}`} style={t.chatPanelGl}>
                <div className={`flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 ${t.chatArea}`}>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === "user" ? (isDark ? "bg-blue-600 text-white" : "bg-[#00AEEF] text-white") : (isDark ? "bg-[#9E217B] text-white" : "bg-[#9E217B] text-white")}`}>
                          {msg.sender === "user" ? <FaUserCircle className="text-lg" /> : <FaRobot className="text-lg" />}
                        </div>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === "user" ? (isDark ? "bg-blue-600 text-white rounded-tr-none" : "bg-[#00AEEF] text-white rounded-tr-none") : `${t.chatBubbleAi} rounded-tl-none`}`}>{msg.text}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className={`p-4 border-t flex gap-3 ${t.header}`} style={t.headerGlass}>
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a client's name or ask a question..."
                    className={`flex-1 rounded-xl p-4 text-sm outline-none transition-colors border ${t.chatInput} ${t.text}`} />
                  <button type="submit" className={`w-14 h-14 text-white rounded-xl flex items-center justify-center transition-colors shadow-lg cursor-pointer ${isDark ? "bg-[#9E217B] hover:bg-[#7a1a5e]" : "bg-[#00AEEF] hover:bg-[#0099d4]"}`}><FaPaperPlane className="text-sm ml-[-2px]" /></button>
                </form>
              </div>
            </div>
          )}

          {/* Shared page header for overview/forms */}
          {activeTab !== "settings" && activeTab !== "detail" && activeTab !== "assistant" && (
            <div className="flex justify-between items-center mb-8">
              <h1 className={`text-xl md:text-3xl font-bold flex items-center flex-wrap gap-2 md:gap-3 ${t.text}`}>
                Hi, {String(user?.name || "User").split(" ")[0]}
                <span className={`text-xs md:text-sm font-medium px-2 py-0.5 md:px-3 md:py-1 rounded-full capitalize ${isDark ? "text-[#9E217B] bg-white/80 border border-[#9E217B]/40 backdrop-blur-sm" : "text-[#9E217B] bg-[#9E217B]/10 border border-[#9E217B]/20"}`}>{user?.role || "Employee"}</span>
              </h1>
              <button onClick={initialLoad} className={`text-white text-xs md:text-sm font-semibold flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all shadow-sm ${t.btnPrimary}`}>
                <span className="md:hidden">↻ Sync</span>
                <span className="hidden md:inline">↻ Refresh Live Data</span>
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* OVERVIEW TAB */}
          {/* ================================================================= */}
          {activeTab === "overview" && (
            <div className="animate-fadeIn pb-10">

              {/* ── 4-COLUMN DASHBOARD GRID ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                {/* ══════════════════════════════════════════════════
                    CARD 1: Room Configuration — PIE CHART with period dropdown
                ══════════════════════════════════════════════════ */}
                <div className={`rounded-2xl p-6 border flex flex-col ${t.card}`} style={t.cardGlass}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className={`text-base font-bold ${t.text}`}>Room Configurations</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleExportCard1} className={`p-1.5 border rounded-md ${t.exportBtn}`} title="Export to Excel (CSV)">
                        <FaDownload size={12} />
                      </button>
                      {chartMode1 === "monthly" && (
                        <select
                          value={configChartMonth}
                          onChange={e => setConfigChartMonth(Number(e.target.value))}
                          className={`text-[10px] rounded px-1.5 py-1 outline-none cursor-pointer border ${t.selectSmall}`}
                        >
                          {MONTH_NAMES.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                        </select>
                      )}
                      <select
                        value={chartMode1}
                        onChange={e => setChartMode1(e.target.value as any)}
                        className={`text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer border ${t.selectSmall}`}
                      >
                        <option value="today">Today</option>
                        <option value="monthly">Monthly</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="yearly">Yearly</option>
                        <option value="inception">Inception</option>
                      </select>
                    </div>
                  </div>
                  
                  <p className={`text-[10px] font-semibold mb-3 ${t.accentText}`}>
                    {chartMode1 === "today" && `Today — ${now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                    {chartMode1 === "monthly" && `${MONTH_NAMES[configChartMonth]} ${now.getFullYear()}`}
                    {chartMode1 === "3months" && "Last 3 Months"}
                    {chartMode1 === "6months" && "Last 6 Months"}
                    {chartMode1 === "yearly" && `Year ${now.getFullYear()}`}
                    {chartMode1 === "inception" && "All Time (Since Inception)"}
                  </p>

                  {isFetchingEnquiries ? (
                    <div className={`flex-1 flex items-center justify-center text-sm ${t.textMuted} min-h-[230px]`}>Calculating chart data...</div>
                  ) : isConfigChartEmpty ? (
                    <div className={`w-full h-[230px] mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${isDark ? "border-[#2A2A35] bg-[#121218]/50" : "border-gray-200 bg-gray-50/50"}`}>
                      <span className={`text-sm font-medium ${t.textMuted}`}>No data available</span>
                    </div>
                  ) : (
                    <div className="w-full h-[230px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {(() => {
                          let pieData = [];
                          if (chartMode1 === "today") pieData = configTodayBarData;
                          else if (chartMode1 === "monthly") pieData = configMonthlyBarData;
                          else if (chartMode1 === "inception") pieData = configInceptionBarData;
                          else {
                            const sourceData = chartMode1 === "3months" ? config3MonthBarData : 
                                              chartMode1 === "6months" ? config6MonthBarData : 
                                              configYearlyBarData;
                            
                            pieData = CONFIG_KEYS.map((key, i) => {
                              const total = sourceData.reduce((sum, item) => sum + (item[key] || 0), 0);
                              return { name: key, count: total, color: t.chartColors[i % t.chartColors.length] };
                            }).filter(d => d.count > 0);
                          }

                          return (
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="count"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={2}
                                stroke="none"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend 
                                verticalAlign="bottom" 
                                align="center" 
                                wrapperStyle={{ fontSize: "10px", color: t.legendColor, paddingTop: "10px" }} 
                              />
                            </PieChart>
                          );
                        })()}
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* ══════════════════════════════════════════════════
                    CARD 4: Lead Sources — PIE CHART
                ══════════════════════════════════════════════════ */}
                <div className={`rounded-2xl p-6 border flex flex-col ${t.card}`} style={t.cardGlass}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className={`text-base font-bold ${t.text}`}>Lead Sources</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleExportCard4} className={`p-1.5 border rounded-md ${t.exportBtn}`} title="Export to Excel (CSV)">
                        <FaDownload size={12} />
                      </button>
                      {card4Mode === "monthly" && (
                        <select
                          value={card4Month}
                          onChange={e => setCard4Month(Number(e.target.value))}
                          className={`text-[10px] rounded px-1.5 py-1 outline-none cursor-pointer border ${t.selectSmall}`}
                        >
                          {MONTH_NAMES.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                        </select>
                      )}
                      <select
                        value={card4Mode}
                        onChange={e => setCard4Mode(e.target.value as any)}
                        className={`text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer border ${t.selectSmall}`}
                      >
                        <option value="today">Today</option>
                        <option value="monthly">Monthly</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="yearly">Yearly</option>
                        <option value="inception">Inception</option>
                      </select>
                    </div>
                  </div>
                  
                  <p className={`text-[10px] font-semibold mb-3 ${t.accentText}`}>
                    {card4Mode === "today" && `Today — ${now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                    {card4Mode === "monthly" && `${MONTH_NAMES[card4Month]} ${now.getFullYear()}`}
                    {card4Mode === "3months" && "Last 3 Months"}
                    {card4Mode === "6months" && "Last 6 Months"}
                    {card4Mode === "yearly" && `Year ${now.getFullYear()}`}
                    {card4Mode === "inception" && "All Time (Since Inception)"}
                  </p>

                  {isFetchingEnquiries ? (
                    <div className={`flex-1 flex items-center justify-center text-sm ${t.textMuted} min-h-[230px]`}>Calculating chart data...</div>
                  ) : isSourceChartEmpty ? (
                    <div className={`w-full h-[230px] mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${isDark ? "border-[#2A2A35] bg-[#121218]/50" : "border-gray-200 bg-gray-50/50"}`}>
                      <span className={`text-sm font-medium ${t.textMuted}`}>No data available</span>
                    </div>
                  ) : (
                    <div className="w-full h-[230px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sourceDataFiltered}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {sourceDataFiltered.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend 
                            verticalAlign="bottom" 
                            align="center" 
                            wrapperStyle={{ fontSize: "10px", color: t.legendColor, paddingTop: "10px" }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* ══════════════════════════════════════════════════
                    CARD 2: Enquiry Details — All Magenta Theme
                ══════════════════════════════════════════════════ */}
                <div className={`rounded-2xl p-6 border flex flex-col gap-4 ${t.card}`} style={t.cardGlass}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className={`text-base font-bold ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>Enquiry Details</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleExportCard2} className={`p-1.5 border rounded-md transition-colors ${isDark ? "border-[#9E217B]/30 text-[#d4006e] hover:bg-[#9E217B]/20" : "border-[#9E217B]/30 text-[#9E217B] hover:bg-[#9E217B]/10"}`} title="Export to Excel (CSV)">
                        <FaDownload size={12} />
                      </button>
                      <select
                        value={card2Mode}
                        onChange={e => setCard2Mode(e.target.value as any)}
                        className={`text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer border ${t.selectSmall}`}
                      >
                        <option value="today">Enquiries Today</option>
                        <option value="monthly">Monthly Enquiries</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="yearly">Yearly</option>
                        <option value="alltime">Total All Time</option>
                      </select>
                    </div>
                  </div>

                  {/* ── TODAY ── */}
                  {card2Mode === "today" && (
                    <div className={`rounded-xl p-5 border flex-1 flex flex-col ${isDark ? "bg-[#9E217B]/5 border-[#9E217B]/20" : "bg-[#9E217B]/5 border-[#9E217B]/20"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <p className={`text-xs font-bold uppercase tracking-wider ${t.textFaint}`}>Enquiries Today</p>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${isDark ? "bg-[#9E217B]/20 text-[#d4006e]" : "bg-[#9E217B]/10 text-[#9E217B]"}`}>
                          <FaCalendarAlt />
                        </div>
                      </div>
                      <p className={`text-7xl font-black leading-none ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>{isFetchingEnquiries ? "…" : enquiriesToday}</p>
                      <p className={`text-sm mt-4 font-medium ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>
                        Enquiries on {now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  )}

                  {/* ── MONTHLY ── */}
                  {card2Mode === "monthly" && (
                    <div className={`rounded-xl p-5 border flex-1 flex flex-col ${isDark ? "bg-[#9E217B]/5 border-[#9E217B]/20" : "bg-[#9E217B]/5 border-[#9E217B]/20"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <p className={`text-xs font-bold uppercase tracking-wider ${t.textFaint}`}>Monthly Enquiries</p>
                        <select
                          value={selectedMonthCard}
                          onChange={e => setSelectedMonthCard(Number(e.target.value))}
                          className={`text-[10px] rounded px-1.5 py-0.5 outline-none cursor-pointer border ${t.selectSmall}`}
                        >
                          {MONTH_NAMES.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                        </select>
                      </div>
                      <p className={`text-7xl font-black leading-none ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>{isFetchingEnquiries ? "…" : monthlyEnquiriesSelected}</p>
                      <p className={`text-sm mt-4 font-medium ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>Enquiries in {MONTH_NAMES[selectedMonthCard]} {now.getFullYear()}</p>
                    </div>
                  )}

                  {/* ── LAST 3 MONTHS ── */}
                  {card2Mode === "3months" && (
                    <div className={`rounded-xl p-5 border flex-1 flex flex-col ${isDark ? "bg-[#9E217B]/5 border-[#9E217B]/20" : "bg-[#9E217B]/5 border-[#9E217B]/20"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <p className={`text-xs font-bold uppercase tracking-wider ${t.textFaint}`}>Last 3 Months</p>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-[#9E217B]/20 text-[#d4006e]" : "bg-[#9E217B]/10 text-[#9E217B]"}`}>
                          <FaCalendarAlt className="text-xs" />
                        </div>
                      </div>
                      <p className={`text-7xl font-black leading-none ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>{isFetchingEnquiries ? "…" : enquiries3Months}</p>
                      <p className={`text-sm mt-4 font-medium ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>Enquiries over this period</p>
                    </div>
                  )}

                  {/* ── LAST 6 MONTHS ── */}
                  {card2Mode === "6months" && (
                    <div className={`rounded-xl p-5 border flex-1 flex flex-col ${isDark ? "bg-[#9E217B]/5 border-[#9E217B]/20" : "bg-[#9E217B]/5 border-[#9E217B]/20"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <p className={`text-xs font-bold uppercase tracking-wider ${t.textFaint}`}>Last 6 Months</p>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-[#9E217B]/20 text-[#d4006e]" : "bg-[#9E217B]/10 text-[#9E217B]"}`}>
                          <FaCalendarAlt className="text-xs" />
                        </div>
                      </div>
                      <p className={`text-7xl font-black leading-none ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>{isFetchingEnquiries ? "…" : enquiries6Months}</p>
                      <p className={`text-sm mt-4 font-medium ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>Enquiries tracked</p>
                    </div>
                  )}

                  {/* ── YEARLY ── */}
                  {card2Mode === "yearly" && (
                    <div className={`rounded-xl p-5 border flex-1 flex flex-col ${isDark ? "bg-[#9E217B]/5 border-[#9E217B]/20" : "bg-[#9E217B]/5 border-[#9E217B]/20"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <p className={`text-xs font-bold uppercase tracking-wider ${t.textFaint}`}>Yearly ({now.getFullYear()})</p>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-[#9E217B]/20 text-[#d4006e]" : "bg-[#9E217B]/10 text-[#9E217B]"}`}>
                          <FaCalendarAlt className="text-xs" />
                        </div>
                      </div>
                      <p className={`text-7xl font-black leading-none ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>{isFetchingEnquiries ? "…" : enquiriesYear}</p>
                      <p className={`text-sm mt-4 font-medium ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>Enquiries in {now.getFullYear()}</p>
                    </div>
                  )}

                  {/* ── ALL TIME ── */}
                  {card2Mode === "alltime" && (
                    <div className={`rounded-xl p-5 border flex-1 flex flex-col ${isDark ? "bg-[#9E217B]/10 border-[#9E217B]/30" : "bg-[#9E217B]/10 border-[#9E217B]/20"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <p className={`text-xs font-bold uppercase tracking-wider ${t.textFaint}`}>Total (All Time)</p>
                        <span className={`text-lg font-black ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>▲</span>
                      </div>
                      <p className={`text-7xl font-black leading-none ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>{isFetchingEnquiries ? "…" : totalCount}</p>
                      <p className={`text-sm mt-4 font-medium ${isDark ? "text-[#d4006e]" : "text-[#9E217B]"}`}>Total enquiries captured</p>
                    </div>
                  )}
                </div>

                {/* ══════════════════════════════════════════════════
                    CARD 3: Sales Manager Activity
                ══════════════════════════════════════════════════ */}
                <div className={`rounded-2xl p-6 border flex flex-col ${t.card}`} style={t.cardGlass}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className={`text-base font-bold ${t.text}`}>Sales Manager Activity</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleExportCard3} className={`p-1.5 border rounded-md ${t.exportBtn}`} title="Export to Excel (CSV)">
                        <FaDownload size={12} />
                      </button>
                      {card3Mode === "monthly" && (
                        <select
                          value={card3Month}
                          onChange={e => setCard3Month(Number(e.target.value))}
                          className={`text-[10px] rounded px-1.5 py-1 outline-none cursor-pointer border ${t.selectSmall}`}
                        >
                          {MONTH_NAMES.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                        </select>
                      )}
                      <select
                        value={card3Mode}
                        onChange={e => setCard3Mode(e.target.value as any)}
                        className={`text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer border ${t.selectSmall}`}
                      >
                        <option value="today">Today</option>
                        <option value="monthly">Monthly</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="yearly">Yearly</option>
                        <option value="inception">Inception</option>
                      </select>
                    </div>
                  </div>

                  {/* Period label */}
                  <p className={`text-[10px] font-semibold mb-3 flex items-center justify-between ${t.accentText}`}>
                    <span>
                      {card3Mode === "today" && `Today — ${now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                      {card3Mode === "monthly" && `${MONTH_NAMES[card3Month]} ${now.getFullYear()}`}
                      {card3Mode === "3months" && "Last 3 Months"}
                      {card3Mode === "6months" && "Last 6 Months"}
                      {card3Mode === "yearly" && `Year ${now.getFullYear()}`}
                      {card3Mode === "inception" && "All Time (Since Inception)"}
                    </span>
                    <span className={t.textFaint}>{managerLeadCountsFiltered.length} managers</span>
                  </p>

                  <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[250px] pr-2">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${t.tableBorder}`}>
                          <th className={`text-left py-2 px-1 text-xs font-bold uppercase tracking-wider ${t.textFaint}`}>Sales Manager</th>
                          <th className={`text-right py-2 px-1 text-xs font-bold uppercase tracking-wider ${t.textFaint}`}>Enquiries</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${t.tableDivide}`}>
                        {isFetchingEnquiries ? (
                          <tr><td colSpan={2} className={`text-center py-4 text-xs ${t.textMuted}`}>Loading...</td></tr>
                        ) : managerLeadCountsFiltered.length === 0 ? (
                          <tr><td colSpan={2} className={`text-center py-4 text-xs ${t.textMuted}`}>No data for this period</td></tr>
                        ) : managerLeadCountsFiltered.map((row, i) => (
                          <tr key={i} className={`transition-colors ${t.tableRow}`}>
                            <td className={`py-2.5 px-1 font-semibold text-xs ${t.text}`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isDark ? "bg-[#9E217B]" : "bg-[#9E217B]"}`}>
                                  {String(row.name).charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate max-w-[100px]">{row.name}</span>
                              </div>
                            </td>
                            <td className={`py-2.5 px-1 text-right font-black text-sm ${t.accentText}`}>{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── FRONT DESK LOG TABLE ── */}
              <div className={`rounded-2xl border overflow-hidden ${t.tableWrap}`} style={t.tableGlass}>
                <div className={`p-4 md:p-6 border-b flex justify-between items-center ${t.tableBorder}`}>
                  <div>
                    <h2 className={`text-base md:text-lg font-bold flex items-center gap-3 ${t.text}`}>
                      Front Desk Log 
                      <button onClick={handleExportMainTable} className={`p-1.5 border rounded-md ${t.exportBtn}`} title="Export Table to Excel (CSV)">
                        <FaDownload size={12} />
                      </button>
                    </h2>
                    <p className={`text-xs mt-0.5 ${t.textFaint}`}>{receptionistLeads.length} shown · {totalCount} total</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="relative hidden md:block">
                      <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${t.textFaint}`} />
                      <input type="text" placeholder="Search leads..." value={searchRecep}
                        onChange={(e) => setSearchRecep(e.target.value)}
                        className={`rounded-lg pl-9 pr-4 py-2 text-sm outline-none w-48 transition-colors border ${t.inputBg} ${t.text}`}
                        style={isDark ? {} : { outlineColor: "#00AEEF" }} />
                    </div>
                    <button onClick={() => setIsEnquiryModalOpen(true)}
                      className={`font-bold py-1.5 px-3 md:py-2 md:px-4 rounded-lg transition-colors text-xs flex items-center gap-2 cursor-pointer ${t.btnPrimary}`}>
                      + New Entry
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className={t.tableHead}>
                        {["Lead No.", "Client Name", "CP Company", "Budget", "Phone", "Alt. Phone", "Date Created", "Sales Manager"].map((h) => (
                          <th key={h} className={`px-3 py-3 md:p-4 font-bold uppercase tracking-wider border-b ${t.textHeader} ${t.tableBorder}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`${t.tableDivide} divide-y`}>
                      {isFetchingEnquiries ? (
                        <tr><td colSpan={8} className={`p-8 text-center text-sm ${t.textMuted}`}>Fetching live table data...</td></tr>
                      ) : receptionistLeads.length === 0 ? (
                        <tr><td colSpan={8} className={`p-8 text-center text-sm ${t.textMuted}`}>No matching leads found.</td></tr>
                      ) : (
                        receptionistLeads.map((enquiry: any) => (
                          <tr key={enquiry.id} className={`transition-colors cursor-pointer ${t.tableRow}`} onClick={() => { setSelectedEnquiry(enquiry); setActiveTab("detail"); }}>
                            <td className={`px-3 py-3 md:p-4 text-xs md:text-sm font-bold ${t.accentText}`}>#{enquiry.id}</td>
                            <td className={`px-3 py-3 md:p-4 text-xs md:text-sm font-semibold ${t.text}`}>{enquiry.name}</td>
                            <td className={`px-3 py-3 md:p-4 text-[10px] md:text-sm truncate max-w-[100px] md:max-w-[140px] ${t.textMuted}`}>
                              {enquiry.cp_company ? enquiry.cp_company : <span className="italic text-[10px]">—</span>}
                            </td>
                            <td className={`px-3 py-3 md:p-4 text-xs md:text-sm font-bold ${isDark ? "text-green-700" : "text-emerald-600"}`}>{enquiry.budget}</td>
                            <td className={`px-3 py-3 md:p-4 text-[10px] md:text-sm font-mono tracking-wide ${t.text}`}>{maskPhoneNumber(enquiry.phone)}</td>
                            <td className={`px-3 py-3 md:p-4 text-[10px] md:text-sm font-mono tracking-wide ${t.textMuted}`}>{maskPhoneNumber(enquiry.altPhone)}</td>
                            <td className={`px-3 py-3 md:p-4 text-[10px] md:text-xs ${t.textFaint}`}>{enquiry.date}</td>
                            <td className="px-3 py-3 md:p-4 text-xs md:text-sm">
                              <span className={`px-2 py-1 rounded-md text-[10px] md:text-xs font-semibold ${t.accentBg}`}>{enquiry.assignedTo || "Unassigned"}</span>
                            </td>
                          </tr>
                        ))
                      )}
                      {isLoadingMore && <LoaderRow />}
                      {!hasMore && !isFetchingEnquiries && enquiries.length > 0 && (
                        <tr><td colSpan={8} className={`p-4 text-center text-xs ${t.textFaint}`}>All {totalCount} records loaded</td></tr>
                      )}
                    </tbody>
                  </table>
                  <div ref={tableSentinelRef} className="h-1 w-full" aria-hidden="true" />
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* FORMS TAB */}
          {/* ================================================================= */}
          {activeTab === "forms" && (
            <div className="animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h2 className={`text-xl font-bold ${t.text}`}>Recent Enquiries</h2>
                  {hasMore && <p className={`text-xs mt-0.5 ${t.accentText}`}>· scroll for more</p>}
                </div>
                <div className="flex gap-4 items-center">
                  <div className="relative">
                    <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${t.textFaint}`} />
                    <input type="text" placeholder="Search leads..." value={searchRecep}
                      onChange={(e) => setSearchRecep(e.target.value)}
                      className={`rounded-lg pl-9 pr-4 py-2 text-sm outline-none w-48 transition-colors border ${t.inputBg} ${t.text}`} />
                  </div>
                  <button onClick={() => setIsEnquiryModalOpen(true)}
                    className={`font-bold py-2.5 px-6 rounded-xl transition-colors text-sm flex items-center gap-2 cursor-pointer ${t.btnPrimary}`}>
                    <FaClipboardList /> <span className="hidden sm:inline">+ Add New Form</span><span className="sm:hidden">+</span>
                  </button>
                </div>
              </div>

              {isFetchingEnquiries ? (
                <div className={`text-center py-10 ${t.textMuted}`}>Fetching live database forms...</div>
              ) : receptionistLeads.length === 0 ? (
                <div className={`text-center py-10 ${t.textMuted}`}>No matching forms found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {receptionistLeads.map((enquiry: any, index: number) => (
                    <div key={enquiry.id ?? index}
                      onClick={() => { setSelectedEnquiry(enquiry); setActiveTab("detail"); }}
                      className={`rounded-2xl p-6 border cursor-pointer group flex flex-col justify-between transition-all ${t.card}`}
                      style={t.cardGlass}>
                      <div>
                        <div className={`flex justify-between items-start mb-6 border-b pb-4 ${t.tableBorder}`}>
                          <h3 className={`text-xl font-bold transition-colors flex items-center gap-2 ${t.text} ${isDark ? "group-hover:text-[#d4006e]" : "group-hover:text-[#9E217B]"}`}>
                            <span className={`flex-shrink-0 ${t.accentText}`}>#{enquiry.id}</span>
                            <span className="line-clamp-1">{enquiry.name}</span>
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                            enquiry.status === "Routed"
                              ? isDark ? "border border-blue-500/30 text-blue-500 bg-blue-500/10" : "border border-[#00AEEF]/30 text-[#00AEEF] bg-[#00AEEF]/10"
                              : "border border-amber-500/30 text-amber-600 bg-amber-500/10"
                          }`}>{enquiry.status}</span>
                        </div>
                        <div className="space-y-4 mb-6">
                          <div>
                            <p className={`text-xs font-medium ${t.textFaint}`}>Budget</p>
                            <p className={`text-sm font-semibold ${isDark ? "text-green-400" : "text-emerald-600"}`}>{enquiry.budget}</p>
                          </div>
                          <div>
                            <p className={`text-xs font-medium ${t.textFaint}`}>Configuration</p>
                            <p className={`text-sm font-semibold ${t.text}`}>{enquiry.configuration || "N/A"}</p>
                          </div>
                          <div className={`p-3 rounded-lg border flex flex-col gap-2 ${t.settingsBg}`} style={t.settingsBgGl}>
                            <p className={`text-xs flex items-center gap-2 ${t.textMuted}`}><FaPhoneAlt className="w-3 h-3" /> Primary: <span className={`font-mono ${t.text}`}>{maskPhoneNumber(enquiry.phone)}</span></p>
                            {enquiry.altPhone && enquiry.altPhone !== "N/A" && (
                              <p className={`text-xs flex items-center gap-2 ${t.textFaint}`}><FaPhoneAlt className="w-3 h-3" /> Alt: <span className="font-mono">{maskPhoneNumber(enquiry.altPhone)}</span></p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`pt-4 border-t flex justify-between items-center text-sm mt-auto ${t.tableBorder}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold ${isDark ? "bg-gradient-to-tr from-[#9E217B] to-[#d4006e]" : "bg-gradient-to-tr from-[#00AEEF] to-[#9E217B]"}`}>
                            {String(enquiry.assignedTo || "U").charAt(0).toUpperCase()}
                          </div>
                          <p className={`text-xs ${t.textMuted}`}>Assigned: <span className={`font-semibold ${t.text}`}>{enquiry.assignedTo || "Unassigned"}</span></p>
                        </div>
                        <p className={`text-xs ${t.textFaint}`}>{enquiry.date}</p>
                      </div>
                    </div>
                  ))}
                  {isLoadingMore && <LoaderCards />}
                  {!hasMore && !isFetchingEnquiries && enquiries.length > 0 && (
                    <div className="col-span-full">
                      <p className={`text-center text-xs py-4 ${t.textFaint}`}>Showing all {totalCount} results</p>
                    </div>
                  )}
                </div>
              )}
              <div ref={cardsSentinelRef} className="h-1 w-full mt-4" aria-hidden="true" />
            </div>
          )}

          {/* ================================================================= */}
          {/* DETAIL VIEW */}
          {/* ================================================================= */}
          {activeTab === "detail" && selectedEnquiry && (
            <div className="animate-fadeIn max-w-5xl mx-auto">
              <div className={`flex flex-col sm:flex-row sm:items-center gap-4 mb-8 rounded-2xl border p-6 md:p-8 ${t.card}`} style={t.cardGlass}>
                <button onClick={() => setActiveTab("forms")}
                  className={`w-10 h-10 flex items-center justify-center border hover:border-current rounded-xl transition-colors cursor-pointer shadow-sm ${t.textMuted} ${t.tableBorder}`}>
                  <FaChevronLeft className="text-sm" />
                </button>
                <div>
                  <h1 className={`text-xl md:text-3xl font-bold flex flex-wrap items-center gap-3 ${t.text}`}>
                    <span className={t.accentText}>#{selectedEnquiry.id}</span>
                    <span>{selectedEnquiry.name}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedEnquiry.status === "Routed"
                        ? isDark ? "border border-blue-500/30 text-blue-500 bg-blue-500/10" : "border border-[#00AEEF]/30 text-[#00AEEF] bg-[#00AEEF]/10"
                        : "border border-amber-500/30 text-amber-600 bg-amber-500/10"
                    }`}>{selectedEnquiry.status}</span>
                  </h1>
                  <p className={`text-sm mt-1 ${t.textMuted}`}>Created on {selectedEnquiry.date}</p>
                </div>
              </div>
              <div className={`rounded-2xl border p-6 md:p-8 ${t.card}`} style={t.cardGlass}>
                <div className={`rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 text-white ${isDark ? "bg-gradient-to-r from-[#9E217B] to-[#7a1a5e]" : "bg-gradient-to-r from-[#00AEEF] to-[#9E217B]"}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-white/30 bg-white/20 flex items-center justify-center font-bold text-xl">
                      {String(selectedEnquiry.assignedTo || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-white/70 font-bold tracking-wider uppercase mb-1">Assigned Sales Manager</p>
                      <p className="font-bold text-lg">{selectedEnquiry.assignedTo}</p>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs text-white/70 uppercase tracking-wider font-bold mb-1">Source</p>
                    <p className="font-semibold flex items-center sm:justify-end gap-2"><FaBriefcase className="opacity-70" /> {selectedEnquiry.source || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-sm font-bold border-b pb-2 mb-4 uppercase tracking-widest ${t.sectionTitle} ${t.tableBorder}`}>Contact Information</h3>
                      <div className="space-y-4">
                        {[
                          { label: "Phone Number", val: maskPhoneNumber(selectedEnquiry.phone), mono: true },
                          { label: "Alt. Phone", val: selectedEnquiry.altPhone ? maskPhoneNumber(selectedEnquiry.altPhone) : "N/A", mono: true },
                          { label: "Email Address", val: selectedEnquiry.email },
                          { label: "Residential Address", val: selectedEnquiry.address },
                        ].map(({ label, val, mono }) => (
                          <div key={label}>
                            <p className={`text-xs font-medium mb-1 ${t.textFaint}`}>{label}</p>
                            <p className={`${mono ? "text-lg tracking-widest font-semibold" : "font-medium"} ${t.text}`}>{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold border-b pb-2 mb-4 uppercase tracking-widest ${t.sectionTitle} ${t.tableBorder}`}>Professional Info</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className={`text-xs font-medium mb-1 ${t.textFaint}`}>Occupation</p><p className={`font-medium ${t.text}`}>{selectedEnquiry.occupation}</p></div>
                        <div><p className={`text-xs font-medium mb-1 ${t.textFaint}`}>Organization</p><p className={`font-medium ${t.text}`}>{selectedEnquiry.organization}</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-sm font-bold border-b pb-2 mb-4 uppercase tracking-widest ${t.sectionTitle} ${t.tableBorder}`}>Property Requirements</h3>
                      <div className={`rounded-xl p-5 space-y-5 border ${t.settingsBg}`} style={t.settingsBgGl}>
                        <div><p className={`text-xs font-medium mb-1 pl-2 ${t.textFaint}`}>Budget</p><p className={`font-bold text-xl ${isDark ? "text-green-500" : "text-emerald-600"}`}>{selectedEnquiry.budget}</p></div>
                        <div className={`grid grid-cols-2 gap-4 border-t pt-5 ${t.tableBorder}`}>
                          <div><p className={`text-xs font-medium mb-1 pl-2 ${t.textFaint}`}>Configuration</p><p className={`font-medium ${t.text}`}>{selectedEnquiry.configuration}</p></div>
                          <div><p className={`text-xs font-medium mb-1 pl-2 ${t.textFaint}`}>Purpose</p><p className={`font-medium ${t.text}`}>{selectedEnquiry.purpose}</p></div>
                        </div>
                        <div className={`border-t pt-5 ${t.tableBorder}`}><p className={`text-xs font-medium mb-1 pl-2 ${t.textFaint}`}>Loan Planned?</p><p className={`font-medium ${t.text}`}>{selectedEnquiry.loan_planned || "Pending"}</p></div>
                      </div>
                    </div>
                    <div className={`rounded-xl p-5 border ${t.settingsBg}`} style={t.settingsBgGl}>
                      <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 border-b pb-2 ${t.sectionTitle} ${t.tableBorder}`}>Acquisition Data</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className={`text-xs font-medium mb-1 ${t.textFaint}`}>Primary Source</p><p className={`font-medium text-sm ${t.text}`}>{selectedEnquiry.source || "N/A"}</p></div>
                        {selectedEnquiry.source === "Others" && (
                          <div><p className={`text-xs font-medium mb-1 ${t.textFaint}`}>Specified Name</p><p className={`font-medium text-sm ${t.text}`}>{selectedEnquiry.source_other}</p></div>
                        )}
                      </div>
                      {selectedEnquiry.source === "Channel Partner" && (
                        <div className={`mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 ${t.tableBorder}`}>
                          {[
                            { label: "CP Name",    val: selectedEnquiry.cp_name },
                            { label: "CP Company", val: selectedEnquiry.cp_company },
                            { label: "CP Phone",   val: selectedEnquiry.cp_phone },
                          ].map(({ label, val }) => (
                            <div key={label}><p className={`text-xs font-medium mb-1 ${t.textFaint}`}>{label}</p><p className={`font-medium text-sm ${t.text}`}>{val || "N/A"}</p></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* ENQUIRY MODAL */}
          {/* ================================================================= */}
          {isEnquiryModalOpen && (
            <div className="fixed inset-0 bg-black/70 z-[100] flex justify-center items-center p-4 sm:p-6 animate-fadeIn" style={{ backdropFilter: "blur(6px)" }}>
              <div className={`rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border ${t.modalCard}`} style={t.modalGlass}>
                <div className={`p-4 md:p-6 border-b flex justify-between items-center ${t.modalHeader} ${t.tableBorder}`}>
                  <div>
                    <h2 className={`text-lg md:text-xl font-bold flex items-center gap-2 ${t.text}`}>
                      <FaUserCircle className={t.accentText} /> Client Enquiry Form
                    </h2>
                    <p className={`text-xs mt-1 ${t.textMuted}`}>Fill out all details accurately to route to the Sales Manager.</p>
                  </div>
                  <button onClick={() => setIsEnquiryModalOpen(false)} className={`hover:text-red-500 transition-colors cursor-pointer p-2 ${t.textMuted}`}><FaTimes className="text-xl" /></button>
                </div>

                <div className={`p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 ${t.modalInner}`}>
                  <form id="enquiryForm" onSubmit={handleEnquirySubmit} className="space-y-6 md:space-y-8">
                    <div className={`p-5 md:p-6 rounded-xl border ${t.modalBlock}`} style={t.modalBlockGl}>
                      <h3 className={`text-sm font-bold mb-4 md:mb-5 uppercase tracking-wider border-b pb-2 ${t.sectionTitle} ${t.sectionBorder}`}>Personal Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div className="sm:col-span-2">
                          <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Full Name *</label>
                          <input type="text" required value={enquiryForm.fullName} onChange={(e) => setEnquiryForm({ ...enquiryForm, fullName: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border ${t.modalInput} ${t.text}`}
                            style={isDark ? {} : { outlineColor: "#00AEEF" }} placeholder="e.g. Mayur Acharya" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Address</label>
                          <input type="text" value={enquiryForm.address} onChange={(e) => setEnquiryForm({ ...enquiryForm, address: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border ${t.modalInput} ${t.text}`}
                            placeholder="Full residential address" />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Mobile No *</label>
                          <input type="tel" required value={enquiryForm.mobile} onChange={(e) => setEnquiryForm({ ...enquiryForm, mobile: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border ${t.modalInput} ${t.text}`}
                            placeholder="+91 0000000000" />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Alt Mobile No</label>
                          <input type="tel" value={enquiryForm.altMobile} onChange={(e) => setEnquiryForm({ ...enquiryForm, altMobile: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border ${t.modalInput} ${t.text}`}
                            placeholder="+91 0000000000" />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Email ID</label>
                          <input type="email" value={enquiryForm.email} onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border ${t.modalInput} ${t.text}`}
                            placeholder="email@example.com" />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Occupation</label>
                          <select value={enquiryForm.occupation} onChange={(e) => setEnquiryForm({ ...enquiryForm, occupation: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border cursor-pointer ${t.modalInput} ${t.text}`}>
                            <option value="" disabled>Select Occupation</option>
                            {["Salaried", "Self Employed", "Business owner", "House maker"].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Organization / Office Add.</label>
                          <input type="text" value={enquiryForm.organization} onChange={(e) => setEnquiryForm({ ...enquiryForm, organization: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border ${t.modalInput} ${t.text}`}
                            placeholder="Company Name & Location" />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Loan Planned *</label>
                          <select required value={enquiryForm.loanPlanned} onChange={(e) => setEnquiryForm({ ...enquiryForm, loanPlanned: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border cursor-pointer ${t.modalInput} ${t.text}`}>
                            <option value="" disabled>Select Option</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className={`p-5 md:p-6 rounded-xl border ${t.modalBlock}`} style={t.modalBlockGl}>
                      <h3 className={`text-sm font-bold mb-4 md:mb-5 uppercase tracking-wider border-b pb-2 ${t.sectionTitle} ${t.sectionBorder}`}>Requirement & Timeline</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
                        <div>
                          <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Budget *</label>
                          <input type="text" required value={enquiryForm.budget}
                            onChange={(e) => setEnquiryForm({ ...enquiryForm, budget: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border ${t.modalInput} ${t.text}`}
                            style={isDark ? {} : { outlineColor: "#00AEEF" }} placeholder="e.g. 80 Lakhs, 1.5 Cr" />
                          <p className={`text-[10px] mt-1 pl-2 ${t.textFaint}`}>Enter exact amount e.g. 50 Lakhs, 2 Cr</p>
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Configuration (BHK)</label>
                          <select value={enquiryForm.configuration} onChange={(e) => setEnquiryForm({ ...enquiryForm, configuration: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border cursor-pointer ${t.modalInput} ${t.text}`}>
                            <option value="" disabled>Select…</option>
                            <option value="1 RK">1 RK</option>
                            <option value="1 BHK">1 BHK</option>
                            <option value="2 BHK">2 BHK</option>
                            <option value="3 BHK">3 BHK</option>
                            <option value="4 BHK">4 BHK</option>
                            <option value="4+ BHK">4+ BHK</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Purpose</label>
                          <select value={enquiryForm.purpose} onChange={(e) => setEnquiryForm({ ...enquiryForm, purpose: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border cursor-pointer ${t.modalInput} ${t.text}`}>
                            <option value="" disabled>Select…</option>
                            {["Personal use", "Investment", "Second home"].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className={`p-5 md:p-6 rounded-xl border ${isDark ? "border-[#9E217B]/20" : "border-[#00AEEF]/20"} ${t.modalBlock}`} style={t.modalBlockGl}>
                      <h3 className={`text-sm font-bold mb-4 md:mb-5 uppercase tracking-wider border-b pb-2 ${isDark ? "text-[#d4006e] border-[#9E217B]/20" : "text-[#00AEEF] border-[#00AEEF]/20"}`}>Routing & Source</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div>
                          <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Source *</label>
                          <select required value={enquiryForm.source} onChange={(e) => setEnquiryForm({ ...enquiryForm, source: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border cursor-pointer ${t.modalInput} ${t.text}`}>
                            <option value="" disabled>Select Source</option>
                            {["Advertisement", "Referral", "Exhibition", "Channel Partner", "Website", "Call Center", "Others"].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 font-medium pl-2 font-bold ${isDark ? "text-[#d4006e]" : "text-[#00AEEF]"}`}>Assign to Sales Manager *</label>
                          <select required value={enquiryForm.assignedTo} onChange={(e) => setEnquiryForm({ ...enquiryForm, assignedTo: e.target.value })}
                            className={`w-full rounded-lg p-3 text-sm outline-none transition-colors cursor-pointer border-2 ${isDark ? "bg-[#14141B] border-[#9E217B]/50 focus:border-[#d4006e]" : "bg-white border-[#00AEEF]/50 focus:border-[#00AEEF]"} ${t.text}`}>
                            <option value="" disabled>-- Select Manager --</option>
                            {isFetchingManagers ? <option disabled>Loading…</option> : salesManagers.length > 0 ? salesManagers.map((m, idx) => <option key={idx} value={m.name}>{m.name}</option>) : <option disabled>No Managers in DB</option>}
                          </select>
                        </div>
                        {enquiryForm.source === "Others" && (
                          <div className="sm:col-span-2 mt-2">
                            <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>Specify Source *</label>
                            <input required type="text" value={enquiryForm.sourceOther} onChange={(e) => setEnquiryForm({ ...enquiryForm, sourceOther: e.target.value })}
                              className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border ${isDark ? "border-[#9E217B]/50" : "border-[#00AEEF]/50"} ${t.modalInput} ${t.text}`}
                              placeholder="Please specify the lead source" />
                          </div>
                        )}
                        {enquiryForm.source === "Channel Partner" && (
                          <div className={`sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 mt-2 p-4 md:p-5 rounded-xl border ${t.settingsBg} ${t.tableBorder}`}>
                            <h4 className={`sm:col-span-3 text-xs font-bold mb-1 ${t.accentText}`}>Channel Partner Details</h4>
                            {[
                              { label: "CP Name *",    key: "name",    ph: "Name" },
                              { label: "CP Company *", key: "company", ph: "Company Name" },
                              { label: "CP Contact *", key: "phone",   ph: "Phone No." },
                            ].map(({ label, key, ph }) => (
                              <div key={key}>
                                <label className={`block text-xs mb-1.5 font-medium pl-2 ${t.textMuted}`}>{label}</label>
                                <input required type="text" value={(enquiryForm.cpDetails as any)[key]} onChange={(e) => setEnquiryForm({ ...enquiryForm, cpDetails: { ...enquiryForm.cpDetails, [key]: e.target.value } })}
                                  className={`w-full rounded-lg p-3 text-sm outline-none transition-colors border ${t.modalInput} ${t.text}`}
                                  placeholder={ph} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>

                <div className={`p-4 md:p-6 border-t flex flex-col md:flex-row justify-end gap-3 md:gap-4 ${t.modalHeader} ${t.tableBorder}`}>
                  <button onClick={() => setIsEnquiryModalOpen(false)} type="button"
                    className={`px-6 py-2.5 rounded-lg font-bold cursor-pointer transition-colors ${t.textMuted} ${isDark ? "hover:bg-red-500/10 hover:text-red-500" : "hover:bg-[#9E217B]/10 hover:text-[#9E217B]"}`}>
                    Cancel
                  </button>
                  <button
                    form="enquiryForm"
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-8 py-2.5 rounded-lg font-bold transition-colors ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${t.btnPrimary} ${isDark ? "shadow-[0_0_15px_rgba(158,33,123,0.3)]" : "shadow-[0_0_12px_rgba(0,174,239,0.25)]"}`}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===== BOTTOM NAVIGATION (MOBILE) ===== */}
      <nav className={`md:hidden flex w-full h-16 border-t items-center justify-around flex-shrink-0 z-40 ${t.sidebar}`}>
        {NAV_ITEMS.map(({ id, icon, title }) => {
          const active = activeTab === id || (id === "forms" && activeTab === "detail");
          return (
            <div key={id} onClick={() => setActiveTab(id)} className="relative flex justify-center items-center h-full flex-1 cursor-pointer" title={title}>
              {active && <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b ${t.navIndicatorMobile}`} />}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? t.navActive : t.navInactive}`}>{icon}</div>
            </div>
          );
        })}
        <div onClick={() => setActiveTab("settings")} className="relative flex justify-center items-center h-full flex-1 cursor-pointer" title="Settings">
          {activeTab === "settings" && <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b ${t.navIndicatorMobile}`} />}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeTab === "settings" ? t.navActive : t.navInactive}`}><FaCog className="w-5 h-5" /></div>
        </div>
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(158,33,123,0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(158,33,123,0.6); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        @keyframes bounce { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-6px) } }
        .animate-bounce { animation: bounce 0.8s infinite; }
        input:focus, select:focus, textarea:focus {
          box-shadow: 0 0 0 3px rgba(0,174,239,0.15);
        }
      `}} />
    </div>
  );
}