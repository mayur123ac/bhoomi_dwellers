"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bot, User, Send, BarChart2, AlertTriangle, Landmark, CalendarDays,
  Lightbulb, ClipboardList, Wifi, CheckCircle, XCircle, HelpCircle,
  Clock, MapPin, Zap, TrendingUp, Home, Building2, Globe, Star,
  Share2, Image, Banknote, Users, BadgeCheck, CalendarCheck,
  ArrowRight, Target, BrainCircuit, Flame
} from "lucide-react";
import {
  FaThLarge, FaCog, FaFileInvoice,
  FaChevronLeft, FaCheckCircle, FaPaperPlane, FaTimes, FaPhoneAlt, FaCalendarAlt, FaUserCircle, FaMicrophone, FaWhatsapp, FaRobot, FaEyeSlash, FaSearch, FaUniversity, FaUsers, FaFileAlt, FaCheck, FaClock,FaBell
} from "react-icons/fa";
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

// ============================================================================
// SHARED REAL-TIME DATA HOOK
// ============================================================================
function useAdminData() {
  const [managers, setManagers] = useState<any[]>([]);
  const [receptionists] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      let smData = [];
      const resUsers = await fetch("/api/users?role=sales_manager");
      if (resUsers.ok) { const json = await resUsers.json(); smData = json.data || json; }
      else {
        const resUsersAlt = await fetch("/api/users/sales-manager");
        if (resUsersAlt.ok) { const json = await resUsersAlt.json(); smData = json.data || []; }
      }
      let pgLeads: any[] = [];
      const resLeads = await fetch("/api/walkin_enquiries");
      if (resLeads.ok) { const json = await resLeads.json(); pgLeads = Array.isArray(json.data) ? json.data : []; }
      let mongoFollowUps: any[] = [];
      const resFups = await fetch("/api/followups");
      if (resFups.ok) { const json = await resFups.json(); mongoFollowUps = Array.isArray(json.data) ? json.data : []; }

      const mergedLeads = pgLeads.map((lead: any) => {
        const leadFups = mongoFollowUps.filter((f: any) => String(f.leadId) === String(lead.id));
        const salesForms = leadFups.filter((f: any) => f.message && f.message.includes("Detailed Salesform Submitted"));
        const latestFormMsg = salesForms.length > 0 ? salesForms[salesForms.length - 1].message : "";
        const extractField = (fieldName: string) => {
          if (!latestFormMsg) return "Pending";
          const match = latestFormMsg.match(new RegExp(`• ${fieldName}: (.*)`));
          return match ? match[1].trim() : "Pending";
        };
        const loanUpdates = leadFups.filter((f: any) => f.message?.includes("🏦 Loan Update:"));
        let loanStatus = "N/A";
        if (loanUpdates.length > 0) {
          const m = loanUpdates[loanUpdates.length - 1].message.match(/• Status: (.*)/);
          if (m) loanStatus = m[1].trim();
        }
        let loanAmtReq = "N/A";
        let loanAmtApp = "N/A";
        if (loanUpdates.length > 0) {
          const loanMsg = loanUpdates[loanUpdates.length - 1].message;
          const mReq = loanMsg.match(/• Amount Requested: (.*)/);
          const mApp = loanMsg.match(/• Amount Approved: (.*)/);
          if (mReq) loanAmtReq = mReq[1].trim();
          if (mApp) loanAmtApp = mApp[1].trim();
        }
        const fupsWithDate = leadFups.filter((f: any) => f.siteVisitDate && f.siteVisitDate.trim() !== "");
        const latestVisitDate = fupsWithDate.length > 0 ? fupsWithDate[fupsWithDate.length - 1].siteVisitDate : null;
        const activeBudget = extractField("Budget") !== "Pending" ? extractField("Budget") : lead.budget;
        return {
          ...lead,
          propType: extractField("Property Type"),
          salesBudget: activeBudget,
          useType: extractField("Use Type") !== "Pending" ? extractField("Use Type") : (lead.purpose || "Pending"),
          planningPurchase: extractField("Planning to Purchase"),
          loanPlanned: extractField("Loan Planned") !== "Pending" ? extractField("Loan Planned") : (lead.loan_planned || "Pending"),
          leadInterestStatus: extractField("Lead Status"),
          loanStatus,
          loanAmtReq,
          loanAmtApp,
          source: lead.source, sourceOther: lead.source_other,
          cpName: lead.cp_name, cpCompany: lead.cp_company, cpPhone: lead.cp_phone,
          altPhone: lead.alt_phone, address: lead.address,
          mongoVisitDate: latestVisitDate,
          status: latestVisitDate ? "Visit Scheduled" : lead.status
        };
      });
      setManagers(smData);
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

export default function SalesDashboard() {
  const router = useRouter();
  const [user, setUser] = useState({ name: "Loading...", role: "Sales Manager", email: "", password: "" });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [showPassword, setShowPassword] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedFollowUps, setDismissedFollowUps] = useState<Set<string>>(new Set());
  const [dismissedVisits, setDismissedVisits]         = useState<Set<string>>(new Set());
  const [showVisitNotifications, setShowVisitNotifications] = useState(false);

  const { managers, receptionists, allLeads, followUps, isLoading, refetch } = useAdminData(); // ✅ KEEP THIS ONE

  const followUpLeads = useMemo(() => {
      const now = new Date();
      const myLeads = user.role === "admin"
        ? allLeads
        : allLeads.filter((l: any) => l.assigned_to === user.name);

      return myLeads.filter((lead: any) => {
        if (lead.status === "Completed") return false;
        if (lead.leadInterestStatus === "Not Interested") return false;
        const leadFups = followUps.filter((f: any) => String(f.leadId) === String(lead.id));
        const lastActivityMs = leadFups.length > 0
          ? Math.max(...leadFups.map((f: any) => new Date(f.createdAt).getTime()))
          : new Date(lead.created_at).getTime();
        return (now.getTime() - lastActivityMs) / (1000 * 60 * 60 * 24) >= 2;
      }).map((lead: any) => {
        const leadFups = followUps.filter((f: any) => String(f.leadId) === String(lead.id));
        const lastActivityMs = leadFups.length > 0
          ? Math.max(...leadFups.map((f: any) => new Date(f.createdAt).getTime()))
          : new Date(lead.created_at).getTime();
        return { ...lead, daysSince: Math.floor((now.getTime() - lastActivityMs) / (1000 * 60 * 60 * 24)) };
      }).sort((a: any, b: any) => b.daysSince - a.daysSince);
    }, [allLeads, followUps, user]);
    const visitNotificationLeads = useMemo(() => {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return allLeads
      .filter((lead: any) => {
        if (!lead.mongoVisitDate) return false;
        if (dismissedVisits.has(String(lead.id))) return false;
        const visitDay = new Date(lead.mongoVisitDate);
        const visit    = new Date(visitDay.getFullYear(), visitDay.getMonth(), visitDay.getDate());
        const diffDays = Math.round((visit.getTime() - today.getTime()) / 86400000);
        return diffDays >= 0 && diffDays <= 1; // today or tomorrow
      })
      .map((lead: any) => {
        const visitDay = new Date(lead.mongoVisitDate);
        const visit    = new Date(visitDay.getFullYear(), visitDay.getMonth(), visitDay.getDate());
        const diffDays = Math.round((visit.getTime() - today.getTime()) / 86400000);
        return { ...lead, visitDiff: diffDays }; // 0 = today, 1 = tomorrow
      })
      .sort((a: any, b: any) => a.visitDiff - b.visitDiff);
  }, [allLeads, dismissedVisits]);
  // ❌ DELETE THIS LINE — it was the duplicate causing the error:
  // const { managers, receptionists, allLeads, followUps, isLoading, refetch } = useAdminData();

  useEffect(() => {
    const storedUser = localStorage.getItem("crm_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ ...parsedUser, name: parsedUser.name || "User", password: parsedUser.password || "********" });
        if (parsedUser.role?.toLowerCase() !== "sales manager" && parsedUser.role?.toLowerCase() !== "admin") router.push("/dashboard");
      } catch (e) { router.push("/"); }
    } else { router.push("/"); }
  }, [router]);

  const handleLogout = () => { localStorage.removeItem("crm_user"); router.push("/"); };
  return (
    <div className="flex h-screen bg-[#121212] font-sans text-white overflow-hidden relative">
      <aside className="w-20 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col items-center py-6 flex-shrink-0 z-40 shadow-sm">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-xl font-bold text-white mb-10 shadow-lg shadow-purple-600/20 cursor-pointer">B</div>
        <nav className="flex flex-col space-y-6 w-full items-center">
          {[
            { view: "overview", icon: <FaThLarge className="w-6 h-6" />, title: "Dashboard" },
            { view: "forms",    icon: <FaFileInvoice className="w-6 h-6" />, title: "Assigned Leads" },
            { view: "assistant",icon: <FaRobot className="w-6 h-6" />, title: "CRM AI Assistant" },
          ].map(({ view, icon, title }) => (
            <div key={view} onClick={() => setActiveView(view)} className="group relative flex justify-center cursor-pointer w-full" title={title}>
              {(activeView === view || (view === "forms" && activeView === "detail")) && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-[#3a3a3a] ${activeView === view || (view === "forms" && activeView === "detail") ? "bg-purple-900/20 border-purple-800 text-purple-400" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>{icon}</div>
            </div>
          ))}
          <div onClick={() => setActiveView("settings")} className="group relative flex justify-center cursor-pointer w-full mt-auto" title="Settings">
            {activeView === "settings" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-[#3a3a3a] ${activeView === "settings" ? "bg-purple-900/20 border-purple-800 text-purple-400" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}><FaCog className="w-6 h-6" /></div>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between px-8 flex-shrink-0 z-30 shadow-sm">
          <h1 className="text-white font-semibold flex items-center text-sm md:text-base tracking-wide">
            Bhoomi Dwellers<span className="text-gray-500 text-xs md:text-sm font-normal ml-2">- Sales Manager</span>
          </h1>
          <div className="flex items-center gap-3 relative">

            {/* ── SITE VISIT BELL ── */}
            <div className="relative">
              <button
                onClick={() => { setShowVisitNotifications(!showVisitNotifications); setShowNotifications(false); setIsProfileOpen(false); }}
                className="relative w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-white hover:border-orange-500/50 transition-colors cursor-pointer"
              >
                <FaCalendarAlt className="text-sm"/>
                {visitNotificationLeads.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow">
                    {visitNotificationLeads.length > 9 ? "9+" : visitNotificationLeads.length}
                  </span>
                )}
              </button>

              {showVisitNotifications && (
                <div className="absolute top-12 right-0 w-80 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 animate-fadeIn overflow-hidden">
                  <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-sm">Site Visit Reminders</h3>
                      <p className="text-gray-500 text-[10px] mt-0.5">Scheduled for today & tomorrow</p>
                    </div>
                    {visitNotificationLeads.length > 0 && (
                      <span className="text-[10px] font-bold bg-orange-500/10 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full">
                        {visitNotificationLeads.length} upcoming
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {visitNotificationLeads.length === 0 ? (
                      <div className="p-6 text-center text-gray-600 text-sm">
                        <FaCalendarAlt className="text-2xl mb-2 mx-auto opacity-20"/>
                        No visits in the next 24 hours!
                      </div>
                    ) : (
                      visitNotificationLeads.map((lead: any) => {
                        const isToday    = lead.visitDiff === 0;
                        const colorText  = isToday ? "text-red-400"    : "text-yellow-400";
                        const colorBg    = isToday ? "bg-red-500/10"   : "bg-yellow-500/10";
                        const colorBorder= isToday ? "border-red-500/30" : "border-yellow-500/30";
                        const label      = isToday ? "TODAY"           : "TOMORROW";

                        return (
                          <div key={lead.id} className="p-4 border-b border-[#222] hover:bg-[#222] transition-colors group relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDismissedVisits(prev => new Set([...prev, String(lead.id)]));
                              }}
                              className="absolute top-3 right-3 text-gray-600 hover:text-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <FaTimes className="text-xs"/>
                            </button>

                            <div className="flex items-start justify-between gap-3 pr-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-xs group-hover:text-orange-400 transition-colors truncate">
                                  #{lead.id} — {lead.name}
                                </p>
                                <p className="text-gray-500 text-[10px] mt-0.5 truncate">
                                  {lead.propType !== "Pending" ? lead.propType : "Property TBD"} · {lead.salesBudget}
                                </p>
                                <p className="text-gray-400 text-[10px] mt-1">
                                  📅 {new Date(lead.mongoVisitDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${colorText} ${colorBg} ${colorBorder}`}>
                                  {label}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {visitNotificationLeads.length > 0 && (
                    <div className="p-3 border-t border-[#222] bg-[#151515]">
                      <p className="text-[10px] text-gray-600 text-center">
                        🗓️ Showing visits scheduled within the next 24 hours
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── FOLLOW-UP BELL ── */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowVisitNotifications(false); setIsProfileOpen(false); }}
                className="relative w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-500/50 transition-colors cursor-pointer"
              >
                <FaBell className="text-sm"/>
                {followUpLeads.filter((l: any) => !dismissedFollowUps.has(String(l.id))).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow">
                    {followUpLeads.filter((l: any) => !dismissedFollowUps.has(String(l.id))).length > 9
                      ? "9+"
                      : followUpLeads.filter((l: any) => !dismissedFollowUps.has(String(l.id))).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-12 right-0 w-80 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 animate-fadeIn overflow-hidden">
                  <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-sm">Follow-up Reminders</h3>
                      <p className="text-gray-500 text-[10px] mt-0.5">Leads with no activity in 2+ days</p>
                    </div>
                    {followUpLeads.filter((l: any) => !dismissedFollowUps.has(String(l.id))).length > 0 && (
                      <span className="text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full">
                        {followUpLeads.filter((l: any) => !dismissedFollowUps.has(String(l.id))).length} pending
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {followUpLeads.filter((l: any) => !dismissedFollowUps.has(String(l.id))).length === 0 ? (
                      <div className="p-6 text-center text-gray-600 text-sm">
                        <FaBell className="text-2xl mb-2 mx-auto opacity-20"/>
                        All leads are up to date!
                      </div>
                    ) : (
                      followUpLeads
                        .filter((lead: any) => !dismissedFollowUps.has(String(lead.id)))
                        .map((lead: any) => (
                          <div
                            key={lead.id}
                            onClick={() => { setShowNotifications(false); setActiveView("detail"); }}
                            className="p-4 border-b border-[#222] hover:bg-[#222] transition-colors cursor-pointer group relative"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDismissedFollowUps(prev => new Set([...prev, String(lead.id)]));
                              }}
                              className="absolute top-3 right-3 text-gray-600 hover:text-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <FaTimes className="text-xs"/>
                            </button>

                            <div className="flex items-start justify-between gap-3 pr-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-xs group-hover:text-purple-400 transition-colors truncate">
                                  #{lead.id} — {lead.name}
                                </p>
                                <p className="text-gray-500 text-[10px] mt-0.5 truncate">
                                  {lead.propType !== "Pending" ? lead.propType : "No property set"} · {lead.salesBudget}
                                </p>
                                {lead.leadInterestStatus && lead.leadInterestStatus !== "Pending" && (
                                  <span className={`inline-block mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                    lead.leadInterestStatus === "Interested"
                                      ? "text-green-400 border-green-500/30 bg-green-500/10"
                                      : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                                  }`}>{lead.leadInterestStatus}</span>
                                )}
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <div className={`text-xs font-black ${lead.daysSince >= 7 ? "text-red-400" : lead.daysSince >= 4 ? "text-orange-400" : "text-yellow-400"}`}>
                                  {lead.daysSince}d
                                </div>
                                <p className="text-[9px] text-gray-600">no contact</p>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  {followUpLeads.filter((l: any) => !dismissedFollowUps.has(String(l.id))).length > 0 && (
                    <div className="p-3 border-t border-[#222] bg-[#151515]">
                      <p className="text-[10px] text-gray-600 text-center">
                        ⚠️ Not Interested leads are excluded from reminders
                      </p>
                    </div>
                  )}
                    
                </div>
              )}
            </div>

            {/* ── PROFILE MENU (This is what you were missing) ── */}
            <div className="relative">
              <button
                onClick={() => { 
                  setIsProfileOpen(!isProfileOpen); 
                  setShowNotifications(false); 
                  setShowVisitNotifications(false); 
                }}
                className="w-9 h-9 rounded-full bg-purple-900/30 text-purple-400 border border-purple-500/50 flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm hover:bg-purple-900/50 transition-colors"
              >
                <FaUserCircle className="text-lg" />
              </button>

              {isProfileOpen && (
                <div className="absolute top-12 right-0 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-5 z-50 animate-fadeIn">
                  <div className="mb-4">
                    <h3 className="text-white font-bold text-lg">{user.name}</h3>
                    <p className="text-gray-400 text-sm truncate">{user.email}</p>
                  </div>
                  <hr className="border-[#2a2a2a] mb-4" />
                  <div className="space-y-4 mb-6 text-sm">
                    <p className="text-gray-400 flex justify-between items-center">
                      Role: <span className="text-purple-400 font-bold capitalize bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">{user?.role}</span>
                    </p>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Password</p>
                      <div className="flex items-center justify-between bg-[#121212] border border-[#2a2a2a] p-2 rounded-md">
                        <span className="font-mono text-gray-300 tracking-widest text-xs">{showPassword ? user.password : "••••••••"}</span>
                        <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-purple-400 cursor-pointer"><FaEyeSlash /></button>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="w-full bg-[#3B1F1F] text-[#F28B82] hover:bg-red-900/40 border border-red-900/30 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer">
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>
        <main className={`flex-1 overflow-hidden bg-[#121212] custom-scrollbar ${activeView === "assistant" ? "p-0" : "p-8 overflow-y-auto"}`}>
          {activeView === "sales" || activeView === "overview" || activeView === "forms" || activeView === "detail" ? (
            <SalesManagerView managers={managers} allLeads={allLeads} followUps={followUps} isLoading={isLoading} adminUser={user} refetch={refetch} initialView={activeView} setMainView={setActiveView} />
          ) : activeView === "assistant" ? (
            <AssistantView allLeads={allLeads} />
          ) : (
            <div className="text-gray-400 text-center mt-20">Settings Module Loading...</div>
          )}
        </main>
      </div>
      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar{width:6px;height:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:#3a3a3a;border-radius:10px}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#555}@keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}.animate-fadeIn{animation:fadeIn 0.2s ease-out}`}} />
    </div>
  );
}

// ============================================================================
// HELPER BADGES
// ============================================================================
function InterestBadge({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  const colorMap: Record<string, string> = {
    "Interested":     "border-green-500/40 text-green-400 bg-green-500/10",
    "Not Interested": "border-red-500/40 text-red-400 bg-red-500/10",
    "Maybe":          "border-yellow-500/40 text-yellow-400 bg-yellow-500/10",
  };
  const cls = colorMap[status] ?? "border-blue-500/30 text-blue-400 bg-blue-500/10";
  const sz  = size === "sm" ? "text-[9px] px-2 py-0.5" : "text-[10px] px-3 py-1";
  return <span className={`rounded-full font-bold uppercase tracking-wider border flex-shrink-0 ${sz} ${cls}`}>{status}</span>;
}

function LoanStatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  if (!s || s === "n/a") return null;
  let cls = "border-gray-500/30 text-gray-400 bg-gray-500/10";
  if (s === "approved")    cls = "border-green-500/40 text-green-400 bg-green-500/10";
  if (s === "rejected")    cls = "border-red-500/40 text-red-400 bg-red-500/10";
  if (s === "in progress") cls = "border-yellow-500/40 text-yellow-400 bg-yellow-500/10";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 flex-shrink-0 ${cls}`}>
      <FaUniversity className="text-[7px]" />{status}
    </span>
  );
}

// ============================================================================
// DASHBOARD ANALYTICS
// ============================================================================
function DashboardAnalytics({ leads }: { leads: any[] }) {
  const [pieMode, setPieMode] = useState<"interest"|"loan"|"usetype"|"loanrequired"|"visits">("interest");
  const [barMode, setBarMode] = useState<"weekly"|"budget"|"source">("weekly");

  // ── data ──
  const interestData = useMemo(() => {
    const c: Record<string,number> = { Interested:0,"Not Interested":0,Maybe:0,Pending:0 };
    leads.forEach(l => { const s=l.leadInterestStatus; if(s&&s!=="Pending"&&c[s]!==undefined) c[s]++; else c["Pending"]++; });
    return Object.entries(c).filter(([,v])=>v>0).map(([name,value])=>({name,value}));
  },[leads]);

  const loanPieData = useMemo(() => {
    const c: Record<string,number> = { Approved:0,"In Progress":0,Rejected:0,"N/A":0 };
    leads.forEach(l => { const s=l.loanStatus; if(s&&c[s]!==undefined) c[s]++; else c["N/A"]++; });
    return Object.entries(c).filter(([,v])=>v>0).map(([name,value])=>({name,value}));
  },[leads]);

  const useTypeData = useMemo(() => {
    const c: Record<string,number> = {};
    leads.forEach(l => { const ut=(l.useType&&l.useType!=="Pending")?l.useType:(l.purpose||"Unknown"); c[ut]=(c[ut]||0)+1; });
    return Object.entries(c).filter(([k])=>k!=="Unknown").map(([name,value])=>({name,value}));
  },[leads]);

  const loanRequiredData = useMemo(() => {
    const c: Record<string,number> = { Yes:0,No:0,"Not Sure":0,Pending:0 };
    leads.forEach(l => { const lp=l.loanPlanned; if(lp&&c[lp]!==undefined) c[lp]++; else c["Pending"]++; });
    return Object.entries(c).filter(([,v])=>v>0).map(([name,value])=>({name,value}));
  },[leads]);

  const visitData = useMemo(() => {
    const scheduled = leads.filter(l=>l.mongoVisitDate).length;
    return [{ name:"Scheduled", value:scheduled },{ name:"Pending", value:leads.length-scheduled }];
  },[leads]);

  const weeklyData = useMemo(() => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const counts = [0,0,0,0,0,0,0];
    const now = new Date();
    leads.forEach(l => {
      if(!l.created_at) return;
      const d = new Date(l.created_at);
      if(Math.floor((now.getTime()-d.getTime())/86400000)<7) counts[d.getDay()]++;
    });
    return days.map((day,i)=>({day,leads:counts[i]}));
  },[leads]);

  const weeklyTotal = weeklyData.reduce((a,b)=>a+b.leads,0);

  const budgetData = useMemo(() => {
    const parse = (b: string) => {
      if(!b||b==="Pending"||b==="N/A") return 0;
      const n = parseFloat(b.replace(/[^0-9.]/g,""));
      if(isNaN(n)) return 0;
      const lo = b.toLowerCase();
      if(lo.includes("cr")) return n*100;
      if(lo.includes("l"))  return n;
      return n;
    };
    const groups: Record<string,number[]> = {};
    leads.forEach(l => {
      const pt = l.propType&&l.propType!=="Pending"?l.propType:"Unknown";
      const val = parse(l.salesBudget||l.budget);
      if(val>0){ if(!groups[pt]) groups[pt]=[]; groups[pt].push(val); }
    });
    return Object.entries(groups).map(([type,vals])=>({ type, avg:Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) })).sort((a,b)=>b.avg-a.avg).slice(0,6);
  },[leads]);

  const sourceData = useMemo(() => {
    const c: Record<string,number> = {};
    leads.forEach(l => { const src=l.source||"Unknown"; c[src]=(c[src]||0)+1; });
    return Object.entries(c).map(([source,count])=>({source,count})).sort((a,b)=>b.count-a.count).slice(0,6);
  },[leads]);

  // ── colour maps ──
  const interestColors:  Record<string,string> = { Interested:"#4ade80","Not Interested":"#f87171",Maybe:"#fbbf24",Pending:"#6b7280" };
  const loanColors:      Record<string,string> = { Approved:"#4ade80","In Progress":"#fbbf24",Rejected:"#f87171","N/A":"#6b7280" };
  const useTypeColors:   Record<string,string> = { "Self Use":"#818cf8",Investment:"#34d399","Personal use":"#f87171","N/A":"#6b7280" };
  const loanReqColors:   Record<string,string> = { Yes:"#60a5fa",No:"#6b7280","Not Sure":"#fbbf24",Pending:"#374151" };
  const visitColors:     Record<string,string> = { Scheduled:"#f97316",Pending:"#374151" };

  // ── resolve active pie dataset ──
  const pieData =
    pieMode==="interest"     ? interestData :
    pieMode==="loan"         ? loanPieData  :
    pieMode==="usetype"      ? useTypeData  :
    pieMode==="loanrequired" ? loanRequiredData : visitData;

  const pieColors =
    pieMode==="interest"     ? interestColors :
    pieMode==="loan"         ? loanColors     :
    pieMode==="usetype"      ? useTypeColors  :
    pieMode==="loanrequired" ? loanReqColors  : visitColors;

  const totalLeads = leads.length;

  // ── tooltips ──
  const BarTip = ({ active, payload, label }: any) => active&&payload?.length
    ? <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs shadow-xl"><p className="text-gray-400">{label||payload[0].name}</p><p className="text-white font-bold">{payload[0].value}{barMode==="budget"?" L":""}</p></div>
    : null;

  const PieTip = ({ active, payload }: any) => active&&payload?.length
    ? <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs shadow-xl"><p className="text-gray-300 font-bold">{payload[0].name}</p><p className="text-white">{payload[0].value} leads</p></div>
    : null;

  const BAR_COLORS  = ["#a855f7","#818cf8","#60a5fa","#34d399","#fbbf24","#f87171","#c084fc"];
  const BUDG_COLORS = ["#4ade80","#60a5fa","#fbbf24","#f87171","#c084fc","#34d399"];
  const SRC_COLORS  = ["#a855f7","#60a5fa","#4ade80","#fbbf24","#f87171","#34d399"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── BAR CHART PANEL ── */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-sm">
                {barMode==="weekly" ? "Leads This Week" : "Lead Source Distribution"}
              </h3>
              {barMode==="weekly" && <p className="text-purple-400 text-xs mt-0.5 font-semibold">{weeklyTotal} total this week</p>}
            </div>
            <select value={barMode} onChange={e=>setBarMode(e.target.value as any)} className="bg-[#222] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer focus:border-purple-500">
              <option value="weekly">Total Leads Assigned</option>
        
              <option value="source">Lead Source Distribution</option>
            </select>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            {barMode==="weekly" ? (
              <BarChart data={weeklyData} margin={{top:4,right:8,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a"/>
                <XAxis dataKey="day" tick={{fill:"#9ca3af",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#9ca3af",fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <RTooltip content={<BarTip/>}/>
                <Bar dataKey="leads" radius={[6,6,0,0]}>
                  {weeklyData.map((_:any,i:number)=><Cell key={i} fill={BAR_COLORS[i%7]}/>)}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={sourceData} layout="vertical" margin={{top:0,right:16,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false}/>
                <XAxis type="number" tick={{fill:"#9ca3af",fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <YAxis type="category" dataKey="source" width={100} tick={{fill:"#9ca3af",fontSize:10}} axisLine={false} tickLine={false}/>
                <RTooltip content={<BarTip/>}/>
                <Bar dataKey="count" radius={[0,6,6,0]}>
                  {sourceData.map((_:any,i:number)=><Cell key={i} fill={SRC_COLORS[i%6]}/>)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* ── PIE CHART PANEL ── */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm">
              {pieMode==="interest"     ? "Lead Interest Breakdown"    :
               pieMode==="loan"         ? "Loan Status Breakdown"       :
               pieMode==="usetype"      ? "Self-Use vs Investment"       :
               pieMode==="loanrequired" ? "Loan Required?"               :
                                          "Visit Scheduled vs Pending"}
            </h3>
            <select value={pieMode} onChange={e=>setPieMode(e.target.value as any)} className="bg-[#222] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer focus:border-purple-500">
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
                  {pieData.map((entry:any,i:number)=>(
                    <Cell key={i} fill={pieColors[entry.name]??"#6b7280"}/>
                  ))}
                </Pie>
                <RTooltip content={<PieTip/>}/>
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col gap-2 flex-1">
              {pieData.map((entry:any)=>{
                const color = pieColors[entry.name]??"#6b7280";
                const pct   = totalLeads>0 ? Math.round((entry.value/totalLeads)*100) : 0;
                return (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:color}}/>
                      <span className="text-[11px] text-gray-400 font-medium">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-white font-bold">{entry.value}</span>
                      <span className="text-[10px] text-gray-500">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// SALES MANAGER MODULE
// ============================================================================
function SalesManagerView({ managers, allLeads, followUps, isLoading, adminUser, refetch, initialView, setMainView }: any) {
  const [subView, setSubView] = useState<"overview"|"cards"|"detail">(
    initialView==="overview" ? "overview" : initialView==="detail" ? "detail" : "cards"
  );
  const [selectedLead, setSelectedLead]   = useState<any>(null);
  const [searchTerm, setSearchTerm]       = useState("");
  const [detailTab, setDetailTab]         = useState<"personal"|"loan">("personal");
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [salesForm, setSalesForm]         = useState({ propertyType:"",location:"",budget:"",useType:"",purchaseDate:"",loanPlanned:"",siteVisit:"",leadStatus:"" });
  const inputRef = useRef<HTMLInputElement>(null);
  const [showLoanForm, setShowLoanForm]   = useState(false);
  const [loanForm, setLoanForm]           = useState({ loanRequired:"",status:"",bank:"",amountReq:"",amountApp:"",cibil:"",agent:"",agentContact:"",empType:"",income:"",emi:"",docPan:"Pending",docAadhaar:"Pending",docSalary:"Pending",docBank:"Pending",docProperty:"Pending",notes:"" });
  const [customNote, setCustomNote]       = useState("");
  const followUpEndRef = useRef<HTMLDivElement>(null);
  const [toastMsg, setToastMsg]           = useState<{title:string;icon:any;color:string}|null>(null);

  useEffect(()=>{ setSubView(initialView==="overview"?"overview":initialView==="detail"&&selectedLead?"detail":"cards"); },[initialView]);
  useEffect(()=>{ if(selectedLead){ const u=allLeads.find((l:any)=>String(l.id)===String(selectedLead.id)); if(u) setSelectedLead(u); } },[allLeads]);

  const activeManagerLeads  = adminUser.role==="admin" ? allLeads : allLeads.filter((l:any)=>l.assigned_to===adminUser.name);
  const currentLeadFollowUps= followUps.filter((f:any)=>String(f.leadId)===String(selectedLead?.id));

  const getLatestLoanDetails=()=>{
    if(!selectedLead) return null;
    let ex:Record<string,any>={loanRequired:selectedLead.loanPlanned||"N/A",status:"Pending",bankName:"N/A",amountReq:"N/A",amountApp:"N/A",cibil:"N/A",agent:"N/A",agentContact:"N/A",empType:"N/A",income:"N/A",emi:"N/A",docPan:"Pending",docAadhaar:"Pending",docSalary:"Pending",docBank:"Pending",docProperty:"Pending",notes:"N/A"};
    const lu=currentLeadFollowUps.filter((f:any)=>f.message?.includes("🏦 Loan Update:"));
    if(lu.length>0){
      const msg=lu[lu.length-1].message;
      const g=(l:string)=>{const m=msg.match(new RegExp(`• ${l}: (.*)`));return m?m[1].trim():"N/A";};
      ex={loanRequired:g("Loan Required"),status:g("Status"),bankName:g("Bank Name"),amountReq:g("Amount Requested"),amountApp:g("Amount Approved"),cibil:g("CIBIL Score"),agent:g("Agent Name"),agentContact:g("Agent Contact"),empType:g("Employment Type"),income:g("Monthly Income"),emi:g("Existing EMIs"),docPan:g("PAN Card"),docAadhaar:g("Aadhaar Card"),docSalary:g("Salary Slips"),docBank:g("Bank Statements"),docProperty:g("Property Docs"),notes:g("Notes")};
    }
    return ex;
  };

  const getLoanStatusColor=(s:string)=>{
    const sl=(s||"").toLowerCase();
    if(sl==="approved") return "bg-green-900/20 text-green-400 border-green-500/30";
    if(sl==="rejected") return "bg-red-900/20 text-red-400 border-red-500/30";
    if(sl==="in progress") return "bg-yellow-900/20 text-yellow-400 border-yellow-500/30";
    return "bg-gray-900/20 text-gray-400 border-gray-500/30";
  };

  const formatDate=(ds:string)=>{
    if(!ds||ds==="Pending"||ds==="N/A") return "-";
    try{return new Date(ds).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}catch{return ds;}
  };

  const maskPhone=(phone:any)=>{
    if(!phone||phone==="N/A") return "N/A";
    const c=String(phone).replace(/[^a-zA-Z0-9]/g,"");
    if(c.length<=5) return c;
    return `${c.slice(0,2)}*****${c.slice(-3)}`;
  };

  const handleSendCustomNote=async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    if(!customNote.trim()||!selectedLead) return;
    const nm={leadId:String(selectedLead.id),salesManagerName:adminUser.name,createdBy:adminUser.role==="admin"?"admin":"sales",message:customNote,siteVisitDate:null,createdAt:new Date().toISOString()};
    setCustomNote("");
    try{await fetch("/api/followups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(nm)});refetch();}catch(e){console.log(e);}
  };

  const handleSalesFormSubmit=async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    if(!selectedLead) return;
    const msg="📝 Detailed Salesform Submitted:\n• Property Type: "+(salesForm.propertyType||"N/A")+"\n• Location: "+(salesForm.location||"N/A")+"\n• Budget: "+(salesForm.budget||"N/A")+"\n• Use Type: "+(salesForm.useType||"N/A")+"\n• Planning to Purchase: "+(salesForm.purchaseDate||"N/A")+"\n• Loan Planned: "+(salesForm.loanPlanned||"N/A")+"\n• Lead Status: "+(salesForm.leadStatus||"N/A")+"\n• Site Visit Requested: "+(salesForm.siteVisit?formatDate(salesForm.siteVisit):"No");
    const nm={leadId:String(selectedLead.id),salesManagerName:adminUser.name,createdBy:adminUser.role==="admin"?"admin":"sales",message:msg,siteVisitDate:salesForm.siteVisit||null,createdAt:new Date().toISOString()};
    const ns=salesForm.siteVisit?"Visit Scheduled":selectedLead.status;
    setShowSalesForm(false);
    setSalesForm({propertyType:"",location:"",budget:"",useType:"",purchaseDate:"",loanPlanned:"",siteVisit:"",leadStatus:""});
    try{
      await fetch("/api/followups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(nm)});
      await fetch(`/api/walkin_enquiries/${selectedLead.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:selectedLead.name,status:ns})});
      refetch();
    }catch(e){console.log(e);}
  };

  const handleLoanFormSubmit=async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    if(!selectedLead) return;
    const msg="🏦 Loan Update:\n• Loan Required: "+(loanForm.loanRequired||"N/A")+"\n• Status: "+(loanForm.status||"N/A")+"\n• Bank Name: "+(loanForm.bank||"N/A")+"\n• Amount Requested: "+(loanForm.amountReq||"N/A")+"\n• Amount Approved: "+(loanForm.amountApp||"N/A")+"\n• CIBIL Score: "+(loanForm.cibil||"N/A")+"\n• Agent Name: "+(loanForm.agent||"N/A")+"\n• Agent Contact: "+(loanForm.agentContact||"N/A")+"\n• Employment Type: "+(loanForm.empType||"N/A")+"\n• Monthly Income: "+(loanForm.income||"N/A")+"\n• Existing EMIs: "+(loanForm.emi||"N/A")+"\n• PAN Card: "+(loanForm.docPan||"Pending")+"\n• Aadhaar Card: "+(loanForm.docAadhaar||"Pending")+"\n• Salary Slips: "+(loanForm.docSalary||"Pending")+"\n• Bank Statements: "+(loanForm.docBank||"Pending")+"\n• Property Docs: "+(loanForm.docProperty||"Pending")+"\n• Notes: "+(loanForm.notes||"N/A");
    const nm={leadId:String(selectedLead.id),salesManagerName:adminUser.name,createdBy:adminUser.role==="admin"?"admin":"sales",message:msg,siteVisitDate:null,createdAt:new Date().toISOString()};
    const dbp={leadId:String(selectedLead.id),salesManagerName:adminUser.name,...loanForm};
    setShowLoanForm(false);
    setToastMsg({title:`Loan Data Logged & Synced for ${selectedLead.name}`,icon:<FaCheckCircle/>,color:"blue"});
    setTimeout(()=>setToastMsg(null),3000);
    try{
      await fetch("/api/followups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(nm)});
      await fetch("/api/loan/update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(dbp)}).catch(()=>{});
      refetch();
    }catch(e){console.log(e);}
  };

  const prefillSalesForm=()=>{
    if(!selectedLead) return;
    const sf=currentLeadFollowUps.filter((f:any)=>f.message?.includes("Detailed Salesform Submitted"));
    if(sf.length===0) return;
    const msg=sf[sf.length-1].message;
    const g=(label:string)=>{const m=msg.match(new RegExp(`• ${label}: (.*)`));return m&&m[1].trim()!=="N/A"?m[1].trim():"";};
    setSalesForm({propertyType:g("Property Type"),location:g("Location"),budget:g("Budget"),useType:g("Use Type"),purchaseDate:g("Planning to Purchase"),loanPlanned:g("Loan Planned"),leadStatus:g("Lead Status"),siteVisit:""});
  };

  const prefillLoanForm=()=>{
    const cur=getLatestLoanDetails();
    if(!cur) return;
    setLoanForm({loanRequired:cur.loanRequired!=="N/A"?cur.loanRequired:"",status:cur.status!=="Pending"?cur.status:"",bank:cur.bankName!=="N/A"?cur.bankName:"",amountReq:cur.amountReq!=="N/A"?cur.amountReq:"",amountApp:cur.amountApp!=="N/A"?cur.amountApp:"",cibil:cur.cibil!=="N/A"?cur.cibil:"",agent:cur.agent!=="N/A"?cur.agent:"",agentContact:cur.agentContact!=="N/A"?cur.agentContact:"",empType:cur.empType!=="N/A"?cur.empType:"",income:cur.income!=="N/A"?cur.income:"",emi:cur.emi!=="N/A"?cur.emi:"",docPan:cur.docPan!=="N/A"?cur.docPan:"Pending",docAadhaar:cur.docAadhaar!=="N/A"?cur.docAadhaar:"Pending",docSalary:cur.docSalary!=="N/A"?cur.docSalary:"Pending",docBank:cur.docBank!=="N/A"?cur.docBank:"Pending",docProperty:cur.docProperty!=="N/A"?cur.docProperty:"Pending",notes:cur.notes!=="N/A"?cur.notes:""});
  };

  useEffect(()=>{ if(subView==="detail") followUpEndRef.current?.scrollIntoView({behavior:"smooth"}); },[followUps,subView,selectedLead,detailTab]);

  const filteredLeads=activeManagerLeads.filter((lead:any)=>
    (lead.name||"").toLowerCase().includes(searchTerm.toLowerCase())||String(lead.id).includes(searchTerm)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#121212] relative">
      {toastMsg&&(
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] bg-${toastMsg.color}-600 border border-${toastMsg.color}-400 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 animate-fadeIn`}>
          <div className="text-lg">{toastMsg.icon}</div>
          <span className="text-sm font-bold">{toastMsg.title}</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ── OVERVIEW ── */}
        {subView==="overview"&&(
          <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center flex-wrap gap-3">
                Hi, {String(adminUser?.name||"User").split(" ")[0]}
                <span className="text-sm font-normal text-purple-400 border border-purple-900/50 px-3 py-1 rounded-full shadow-sm capitalize">{adminUser.role}</span>
              </h1>
              <button className="text-purple-500 text-sm font-semibold flex items-center gap-2 hover:text-purple-400 cursor-pointer bg-purple-900/10 px-4 py-2 rounded-lg" onClick={()=>refetch()}>↻ Refresh</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 shadow-sm"><p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Leads Dashboard</p><p className="text-3xl font-black text-white">{activeManagerLeads.length}</p></div>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 shadow-sm"><p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Site Visits</p><p className="text-3xl font-black text-orange-400">{activeManagerLeads.filter((l:any)=>l.mongoVisitDate).length}</p></div>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 shadow-sm"><p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Loans Active</p><p className="text-3xl font-black text-blue-400">{activeManagerLeads.filter((l:any)=>l.loanPlanned==="Yes").length}</p></div>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 shadow-sm"><p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Interested</p><p className="text-3xl font-black text-green-400">{activeManagerLeads.filter((l:any)=>l.leadInterestStatus==="Interested").length}</p></div>
            </div>

            {!isLoading&&<DashboardAnalytics leads={activeManagerLeads}/>}

            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#2a2a2a] flex justify-between items-center bg-[#151515]">
                <h3 className="font-bold text-white flex items-center gap-2"><FaUsers className="text-purple-500"/> Leads Database</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="text-xs text-gray-500 uppercase bg-[#222]">
                  <tr><th className="px-6 py-4">LEAD NO.</th><th className="px-4 py-4">NAME</th><th className="px-4 py-4">PROP. TYPE</th><th className="px-4 py-4">BUDGET</th><th className="px-4 py-4">LOAN PLANNED?</th><th className="px-4 py-4">LOAN STATUS</th> <th className="px-4 py-4">AMT REQ / APPROVED</th><th className="px-6 py-4">SITE VISIT</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {isLoading?<tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
                    :activeManagerLeads.length===0?<tr><td colSpan={6} className="text-center py-8">No leads found.</td></tr>
                    :activeManagerLeads.map((lead:any)=>(
                      <tr key={lead.id} className="hover:bg-[#252525] transition-colors cursor-pointer" onClick={()=>{setSelectedLead(lead);setMainView("detail");setSubView("detail");}}>
                        <td className="px-6 py-4 font-bold text-purple-400">#{lead.id}</td>
                        <td className="px-4 py-4 text-white font-medium">{lead.name}</td>
                        <td className="px-4 py-4 text-gray-200">{lead.propType||"Pending"}</td>
                        <td className="px-4 py-4 text-green-400 font-semibold">{lead.salesBudget}</td>
                        <td className="px-4 py-4">{lead.loanPlanned||"Pending"}</td>
                        <td className="px-4 py-4">
                          {lead.loanStatus && lead.loanStatus !== "N/A"
                            ? <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                lead.loanStatus === "Approved"    ? "text-green-400 border-green-500/40 bg-green-500/10" :
                                lead.loanStatus === "Rejected"    ? "text-red-400 border-red-500/40 bg-red-500/10" :
                                lead.loanStatus === "In Progress" ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" :
                                "text-gray-400 border-gray-500/30 bg-gray-500/10"
                              }`}>{lead.loanStatus}</span>
                            : <span className="text-xs italic text-gray-600">N/A</span>
                          }
                        </td>

                        {/* Amt Req / Approved */}
                        <td className="px-4 py-4">
                          {lead.loanAmtReq && lead.loanAmtReq !== "N/A"
                            ? <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] text-orange-400 font-medium">Req: {lead.loanAmtReq}</span>
                                <span className="text-[11px] text-green-400 font-medium">App: {lead.loanAmtApp !== "N/A" ? lead.loanAmtApp : "—"}</span>
                              </div>
                            : <span className="text-xs italic text-gray-600">N/A</span>
                          }
                        </td>
                        <td className="px-6 py-4">{lead.mongoVisitDate?<span className="text-orange-400 font-medium whitespace-nowrap">{formatDate(lead.mongoVisitDate).split(",")[0]}</span>:<span className="text-xs italic text-gray-600">Pending</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── CARDS ── */}
        {subView==="cards"&&(
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-8 border-b border-[#2a2a2a] pb-6">
              <h1 className="text-2xl font-bold text-white">Active Leads</h1>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"/>
                <input type="text" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-purple-500 outline-none w-64 transition-colors"/>
              </div>
            </div>
            {isLoading?<div className="text-center text-gray-500 py-10">Fetching leads...</div>
            :filteredLeads.length===0?<div className="text-center text-gray-500 py-10">No leads available.</div>
            :(
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLeads.map((lead:any)=>{
                  const interest=lead.leadInterestStatus&&lead.leadInterestStatus!=="Pending"?lead.leadInterestStatus:null;
                  const loanSt=lead.loanStatus&&lead.loanStatus!=="N/A"?lead.loanStatus:null;
                  return(
                    <div key={lead.id} className="rounded-2xl p-6 border shadow-sm transition-all group flex flex-col justify-between bg-[#1a1a1a] border-[#2a2a2a] hover:border-purple-500/50 hover:bg-[#1e1e1e] cursor-pointer" onClick={()=>{setSelectedLead(lead);setMainView("detail");setSubView("detail");}}>
                      <div>
                        <div className="flex justify-between items-start mb-5 pb-4 border-b border-[#2a2a2a]">
                          <h3 className="text-xl font-bold transition-colors line-clamp-1 pr-2 text-white group-hover:text-purple-400"><span className="mr-2 text-purple-500">#{lead.id}</span>{lead.name}</h3>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-500/30 text-blue-400 bg-blue-500/10 flex-shrink-0">{lead.status||"ROUTED"}</span>
                        </div>
                        <div className="space-y-3 mb-5">
                          <div className="flex justify-between items-center">
                            <div><p className="text-xs text-gray-400 font-medium">Budget</p><p className="text-sm font-semibold text-green-400">{lead.salesBudget}</p></div>
                            <div className="flex flex-col items-end gap-1">
                              {loanSt?<LoanStatusBadge status={loanSt}/>:lead.loanPlanned==="Yes"&&<div className="bg-blue-900/20 border border-blue-500/30 px-2 py-1 rounded text-blue-400 text-[10px] font-bold uppercase flex items-center gap-1"><FaUniversity/> Loan Active</div>}
                            </div>
                          </div>
                          {lead.propType&&lead.propType!=="Pending"&&<div><p className="text-xs text-gray-400 font-medium">Property</p><p className="text-sm font-medium text-white">{lead.propType}</p></div>}
                          <div className="p-3 rounded-lg border flex flex-col gap-1.5 bg-[#222] border-[#2a2a2a]">
                            <p className="text-xs text-gray-400 flex items-center gap-2"><FaPhoneAlt className="text-gray-500 w-3 h-3"/><span className="font-mono text-gray-200">{maskPhone(lead.phone)}</span></p>
                          </div>
                          {(lead.mongoVisitDate||interest)&&(
                            <div className="flex items-center justify-between gap-2">
                              {lead.mongoVisitDate&&<div className="flex items-center gap-1.5 text-xs font-semibold text-orange-400"><FaCalendarAlt className="text-[10px]"/>{formatDate(lead.mongoVisitDate).split(",")[0]}</div>}
                              {interest&&<InterestBadge status={interest} size="sm"/>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pt-4 border-t mt-auto border-[#2a2a2a]">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-gray-500 text-[10px] flex-shrink-0">{formatDate(lead.created_at).split(",")[0]}</p>
                          <span className="text-[10px] font-bold text-gray-500 group-hover:text-purple-400 transition-colors uppercase tracking-widest">Details →</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DETAIL ── */}
        {subView==="detail"&&selectedLead&&(
          <div className="animate-fadeIn max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-130px)]">
            <div className="flex items-center justify-between mb-4 rounded-2xl border p-4 sm:p-5 shadow-xl flex-shrink-0 bg-[#1a1a1a] border-[#2a2a2a]">
              <div className="flex items-center gap-4">
                <button onClick={()=>{setMainView("forms");setSubView("cards");}} className="w-10 h-10 flex items-center justify-center bg-[#222] hover:bg-[#333] border border-[#444] rounded-lg text-gray-400 transition-colors"><FaChevronLeft className="text-sm"/></button>
                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3"><span className="text-purple-500">#{selectedLead.id}</span><span>{selectedLead.name}</span></h1>
              </div>
              <div className="flex gap-3">
                {!showSalesForm&&!showLoanForm&&(
                  <>
                    <button onClick={()=>{prefillSalesForm();setShowSalesForm(true);setShowLoanForm(false);}} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-purple-600/20"><FaFileInvoice/> Fill Salesform</button>
                    <button onClick={()=>{prefillLoanForm();setShowLoanForm(true);setShowSalesForm(false);}} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-600/20"><FaUniversity/> Track Loan</button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 pb-2">
              <div className="w-full lg:w-[50%] flex flex-col gap-3 h-full pb-2">

                {showSalesForm?(
                  <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-xl flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3">
                      <div><h3 className="text-lg font-bold text-white">Sales Data Form</h3><p className="text-xs text-purple-400 mt-0.5">For Lead #{selectedLead.id}</p></div>
                      <button type="button" onClick={()=>setShowSalesForm(false)} className="text-gray-400 hover:text-white p-1"><FaTimes/></button>
                    </div>
                    <form onSubmit={handleSalesFormSubmit} className="flex flex-col gap-4 flex-1">
                      <div><label className="text-xs text-gray-400 mb-1 block">Property Type?</label><input type="text" placeholder="e.g. 1BHK, 2BHK" value={salesForm.propertyType} onChange={e=>setSalesForm({...salesForm,propertyType:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none"/></div>
                      <div><label className="text-xs text-gray-400 mb-1 block">Preferred Location?</label><input type="text" placeholder="e.g. Dombivali, Kalyan" value={salesForm.location} onChange={e=>setSalesForm({...salesForm,location:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none"/></div>
                      <div><label className="text-xs text-gray-400 mb-1 block">Approximate Budget?</label><input type="text" placeholder="e.g. 5 cr" value={salesForm.budget} onChange={e=>setSalesForm({...salesForm,budget:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none"/></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs text-gray-400 mb-1 block">Self-use or Investment?</label>
                          <select value={salesForm.useType} onChange={e=>setSalesForm({...salesForm,useType:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none">
                            <option value="">Select</option><option value="Self Use">Self Use</option><option value="Investment">Investment</option>
                          </select>
                        </div>
                        <div><label className="text-xs text-gray-400 mb-1 block">Planning to Purchase?</label>
                          <select value={salesForm.purchaseDate} onChange={e=>setSalesForm({...salesForm,purchaseDate:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none">
                            <option value="">Select</option><option value="Immediate">Immediate</option><option value="Next 3 Months">Next 3 Months</option>
                          </select>
                        </div>
                      </div>
                      <div className="border-t border-[#333] pt-3 mt-1">
                        <label className="block text-xs text-purple-400 font-bold mb-1.5">Lead Interest Status *</label>
                        <select required value={salesForm.leadStatus} onChange={e=>setSalesForm({...salesForm,leadStatus:e.target.value})} className="w-full bg-[#121212] border border-purple-500/30 rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none cursor-pointer">
                          <option value="" disabled>Select Status</option>
                          <option value="Interested">Interested</option><option value="Not Interested">Not Interested</option><option value="Maybe">Maybe</option>
                        </select>
                      </div>
                      <div className="border-t border-[#333] pt-3 mt-1">
                        <label className="block text-xs text-blue-400 font-bold mb-1.5">Loan Planned?</label>
                        <select required value={salesForm.loanPlanned} onChange={e=>setSalesForm({...salesForm,loanPlanned:e.target.value})} className="w-full bg-[#121212] border border-blue-500/30 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500 outline-none cursor-pointer">
                          <option value="" disabled>Select Option</option><option value="Yes">Yes</option><option value="No">No</option><option value="Not Sure">Not Sure</option>
                        </select>
                      </div>
                      <div className="mt-2 border-t border-[#333] pt-3">
                        <label className="text-xs text-orange-400 font-bold mb-1.5 block">Schedule a Site Visit?</label>
                        <input ref={inputRef} type="datetime-local" value={salesForm.siteVisit} onChange={e=>setSalesForm({...salesForm,siteVisit:e.target.value})} onClick={()=>inputRef.current?.showPicker()} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white focus:border-orange-500 outline-none"/>
                      </div>
                      <button type="submit" className="mt-auto w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors flex-shrink-0">Submit Salesform</button>
                    </form>
                  </div>

                ):showLoanForm?(
                  <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-xl flex-1 overflow-y-auto custom-scrollbar flex flex-col animate-fadeIn">
                    <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3 flex-shrink-0">
                      <div><h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><FaUniversity/> Loan Tracking Workflow</h3><p className="text-xs text-gray-400 mt-0.5">For Lead #{selectedLead.id}</p></div>
                      <button type="button" onClick={()=>setShowLoanForm(false)} className="text-gray-400 hover:text-white p-1"><FaTimes/></button>
                    </div>
                    <form onSubmit={handleLoanFormSubmit} className="flex flex-col gap-6 flex-1">
                      <div>
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">1. Loan Decision</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><label className="text-xs text-gray-400 mb-1 block">Loan Required? *</label>
                            <select required value={loanForm.loanRequired} onChange={e=>setLoanForm({...loanForm,loanRequired:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none cursor-pointer">
                              <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option><option value="Not Sure">Not Sure</option>
                            </select>
                          </div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Loan Status *</label>
                            <select required value={loanForm.status} onChange={e=>setLoanForm({...loanForm,status:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none cursor-pointer">
                              <option value="">Select Status</option>
                              <option value="Approved">Approved</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                            {loanForm.status&&(
                              <p className={`text-[10px] mt-1.5 font-semibold ${loanForm.status==="Approved"?"text-green-400":loanForm.status==="Rejected"?"text-red-400":"text-yellow-400"}`}>
                                {loanForm.status==="Approved"&&"✅ Loan cleared — schedule closing meeting"}
                                {loanForm.status==="In Progress"&&"📄 Follow up on pending documents"}
                                {loanForm.status==="Rejected"&&"❌ Loan rejected — suggest co-applicant or other bank"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-[#333] pt-4">
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">2. Bank & Loan Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><label className="text-xs text-gray-400 mb-1 block">Bank Name</label><input type="text" value={loanForm.bank} onChange={e=>setLoanForm({...loanForm,bank:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. HDFC"/></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Amount Required</label><input type="text" value={loanForm.amountReq} onChange={e=>setLoanForm({...loanForm,amountReq:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. 60L"/></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Amount Approved</label><input type="text" value={loanForm.amountApp} onChange={e=>setLoanForm({...loanForm,amountApp:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. 55L"/></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">CIBIL Score</label><input type="text" value={loanForm.cibil} onChange={e=>setLoanForm({...loanForm,cibil:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. 750"/></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Agent Name</label><input type="text" value={loanForm.agent} onChange={e=>setLoanForm({...loanForm,agent:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="Agent Name"/></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Agent Contact</label><input type="tel" value={loanForm.agentContact} onChange={e=>setLoanForm({...loanForm,agentContact:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="Agent Phone"/></div>
                        </div>
                      </div>
                      <div className="border-t border-[#333] pt-4">
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">3. Financial Qualification</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div><label className="text-xs text-gray-400 mb-1 block">Employment</label>
                            <select value={loanForm.empType} onChange={e=>setLoanForm({...loanForm,empType:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none cursor-pointer">
                              <option value="">Select</option><option value="Salaried">Salaried</option><option value="Self-employed">Self-employed</option>
                            </select>
                          </div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Monthly Income</label><input type="text" value={loanForm.income} onChange={e=>setLoanForm({...loanForm,income:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. 1L"/></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Existing EMIs</label><input type="text" value={loanForm.emi} onChange={e=>setLoanForm({...loanForm,emi:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. 15k"/></div>
                        </div>
                      </div>
                      <div className="border-t border-[#333] pt-4">
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3 flex items-center gap-1"><FaFileAlt/> 4. Document Checklist</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#181818] p-3 rounded-lg border border-[#2a2a2a]">
                          {["docPan","docAadhaar","docSalary","docBank","docProperty"].map(docKey=>{
                            const label=docKey==="docPan"?"PAN Card":docKey==="docAadhaar"?"Aadhaar Card":docKey==="docSalary"?"Salary Slips / ITR":docKey==="docBank"?"Bank Statements":"Property Documents";
                            return(
                              <div key={docKey} className="flex items-center justify-between bg-[#121212] border border-[#333] p-2 rounded-lg">
                                <span className="text-xs text-gray-300 font-medium">{label}</span>
                                <select value={(loanForm as any)[docKey]} onChange={e=>setLoanForm({...loanForm,[docKey]:e.target.value})} className={`text-xs font-bold bg-transparent outline-none cursor-pointer ${(loanForm as any)[docKey]==="Uploaded"?"text-green-400":"text-gray-500"}`}>
                                  <option value="Pending">Pending</option><option value="Uploaded">Uploaded</option>
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="border-t border-[#333] pt-4">
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">5. Notes / Remarks</h4>
                        <textarea value={loanForm.notes} onChange={e=>setLoanForm({...loanForm,notes:e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none resize-none h-20 custom-scrollbar" placeholder="Bank feedback, CIBIL issues, Internal notes..."/>
                      </div>
                      <button type="submit" className="mt-4 flex-shrink-0 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors cursor-pointer">Save Loan Tracker Update</button>
                    </form>
                  </div>

                ):(
                  <div className="flex flex-col h-full animate-fadeIn">
                    <div className="flex items-center gap-2 mb-4 bg-[#1a1a1a] border border-[#2a2a2a] p-1.5 rounded-xl flex-shrink-0">
                      <button onClick={()=>setDetailTab("personal")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab==="personal"?"bg-purple-600 text-white shadow-md":"text-gray-400 hover:text-white hover:bg-[#222]"}`}>Personal Information</button>
                      <button onClick={()=>setDetailTab("loan")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab==="loan"?"bg-blue-600 text-white shadow-md":"text-gray-400 hover:text-white hover:bg-[#222]"}`}>Loan Tracking</button>
                    </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1a1a1a] border border-[#333] rounded-xl p-6 pt-4 pb-4 shadow-lg">
                      {detailTab==="personal"?(
                        <div>
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Email</p><p className="text-white font-semibold">{selectedLead.email!=="N/A"?selectedLead.email:"Not Provided"}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><FaPhoneAlt className="text-[10px]"/> Phone</p><p className="font-mono text-white font-semibold">{selectedLead.phone}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><FaPhoneAlt className="text-[10px] text-gray-600"/> Alt Phone</p><p className="font-mono text-white font-semibold">{selectedLead.altPhone&&selectedLead.altPhone!=="N/A"?selectedLead.altPhone:"Not Provided"}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Lead Interest</p>
                              {selectedLead.leadInterestStatus&&selectedLead.leadInterestStatus!=="Pending"?<InterestBadge status={selectedLead.leadInterestStatus}/>:<p className="text-white font-semibold">Pending</p>}
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs text-gray-500 font-medium mb-1">Loan Status</p>
                              {selectedLead.loanStatus&&selectedLead.loanStatus!=="N/A"?<div className="w-fit"><LoanStatusBadge status={selectedLead.loanStatus}/></div>:<p className="text-white font-semibold">N/A</p>}
                            </div>
                            <div className="col-span-2"><p className="text-xs text-gray-500 font-medium mb-1">Residential Address</p><p className="text-white font-semibold">{selectedLead.address&&selectedLead.address!=="N/A"?selectedLead.address:"Not Provided"}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Budget</p><p className="text-green-400 font-bold">{selectedLead.salesBudget!=="Pending"?selectedLead.salesBudget:selectedLead.budget}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Property Type</p><p className="text-white font-semibold">{selectedLead.propType||"Pending"}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Type of Use</p><p className="text-white font-semibold">{selectedLead.useType!=="Pending"?selectedLead.useType:(selectedLead.purpose||"N/A")}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Planning to Buy?</p><p className="text-white font-semibold">{selectedLead.planningPurchase||"Pending"}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Loan Required?</p><p className="text-white font-semibold">{getLatestLoanDetails()?.loanRequired}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Status</p><p className="text-purple-400 font-semibold">{selectedLead.status||"Routed"}</p></div>
                            <div className="col-span-2 bg-[#222] p-3 rounded-xl border border-blue-900/20"><p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-0.5">📍 Site Visit Date</p><p className="text-base font-black text-white">{selectedLead.mongoVisitDate?formatDate(selectedLead.mongoVisitDate):"Not Scheduled"}</p></div>
                          </div>
                          <div className="mt-3 bg-[#222] border border-[#333] rounded-xl p-3">
                            <h3 className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-2 border-b border-[#333] pb-2">Channel Partner Data</h3>
                            <div className="grid grid-cols-2 gap-2">
                              <div><p className="text-xs text-gray-500 font-medium mb-1">Primary Source</p><p className="text-white font-medium text-sm">{selectedLead.source||"N/A"}</p></div>
                              {selectedLead.source==="Others"&&(<div><p className="text-xs text-gray-500 font-medium mb-1">Specified Name</p><p className="text-white font-medium text-sm">{selectedLead.sourceOther}</p></div>)}
                            </div>
                            {selectedLead.source==="Channel Partner"&&(
                              <div className="mt-2 pt-2 border-t border-[#333] grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div><p className="text-xs text-gray-500 font-medium mb-1">CP Name</p><p className="text-white font-medium text-sm">{selectedLead.cpName||"N/A"}</p></div>
                                <div><p className="text-xs text-gray-500 font-medium mb-1">CP Company</p><p className="text-white font-medium text-sm">{selectedLead.cpCompany||"N/A"}</p></div>
                                <div><p className="text-xs text-gray-500 font-medium mb-1">CP Phone</p><p className="text-white font-medium text-sm">{selectedLead.cpPhone||"N/A"}</p></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ):(
                        <div>
                          {(()=>{
                            const curLoan:any=getLatestLoanDetails()||{};
                            const sColor=getLoanStatusColor(curLoan?.status||"");
                            const isHighProb=curLoan?.status?.toLowerCase()==="approved"&&selectedLead.mongoVisitDate;
                            return(
                              <>
                                <h3 className="text-sm font-bold text-blue-400 border-b border-[#333] pb-2 mb-6 uppercase flex items-center justify-between"><span className="flex items-center gap-2"><FaUniversity/> Deal Loan Overview</span></h3>
                                {isHighProb&&<div className="mb-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 p-3 rounded-lg flex items-center justify-center gap-2 text-orange-400 font-bold tracking-wide shadow-md">🚀 HIGH PROBABILITY DEAL (Visit Done + Loan Approved)</div>}
                                <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Loan Required?</p><p className="text-white font-semibold">{curLoan?.loanRequired}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Current Status</p><p className={`font-bold px-2 py-0.5 rounded inline-block border ${sColor}`}>{curLoan?.status}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Amount Requested</p><p className="text-orange-400 font-semibold">{curLoan?.amountReq}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Amount Approved</p><p className="text-green-400 font-semibold">{curLoan?.amountApp}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Bank Name</p><p className="text-white font-semibold">{curLoan?.bankName}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">CIBIL Score</p><p className="text-white font-semibold">{curLoan?.cibil}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Agent Name</p><p className="text-white font-semibold">{curLoan?.agent}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Agent Contact</p><p className="text-white font-semibold">{curLoan?.agentContact}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Emp Type</p><p className="text-white font-semibold">{curLoan?.empType}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Monthly Income</p><p className="text-white font-semibold">{curLoan?.income}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Existing EMIs</p><p className="text-white font-semibold">{curLoan?.emi}</p></div>
                                  <div className="col-span-2 mb-2"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Document Status</p></div>
                                  {[{label:"PAN Card",val:curLoan?.docPan},{label:"Aadhaar",val:curLoan?.docAadhaar},{label:"Salary/ITR",val:curLoan?.docSalary},{label:"Bank Stmt",val:curLoan?.docBank},{label:"Property Docs",val:curLoan?.docProperty}].map((doc,i)=>(
                                    <div key={i} className="flex items-center justify-between bg-[#121212] border border-[#333] p-2 rounded-lg col-span-1">
                                      <span className="text-xs text-gray-400">{doc.label}</span>
                                      {doc.val==="Uploaded"?<FaCheck className="text-green-500 text-xs"/>:<FaClock className="text-gray-500 text-xs"/>}
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
                      <button className="bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600 text-blue-400 hover:text-white flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1"><FaMicrophone className="text-lg"/><span className="font-bold text-[10px]">Browser Call</span></button>
                      <button className="bg-green-600/10 border border-green-500/30 hover:bg-green-600 text-green-400 hover:text-white flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1"><FaWhatsapp className="text-xl"/><span className="font-bold text-[10px]">WhatsApp</span></button>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT PANEL: FOLLOW-UPS */}
              <div className="w-full lg:w-[50%] flex flex-col bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden shadow-2xl h-full min-h-0">
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-[#181818]">
                  <div className="flex justify-start">
                    <div className="bg-[#222] border border-[#333] rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-md">
                      <div className="flex justify-between items-center mb-2 gap-6"><span className="font-bold text-sm text-purple-400">System (Front Desk)</span><span className="text-[10px] text-gray-500">{formatDate(selectedLead.created_at)}</span></div>
                      <p className="text-sm text-gray-300 leading-relaxed">Lead assigned to {selectedLead.assigned_to}. Action required.</p>
                    </div>
                  </div>
                  {currentLeadFollowUps.map((msg:any,idx:number)=>{
                    const isLoan=msg.message.includes("🏦 Loan Update");
                    const isSF=msg.message.includes("📝 Detailed Salesform Submitted");
                    let bg="bg-[#2a2135] border border-[#4c1d95]";
                    if(isLoan) bg="bg-blue-900/20 border border-blue-600/40";
                    else if(isSF) bg="bg-[#222] border border-[#444]";
                    return(
                      <div key={idx} className="flex justify-start">
                        <div className={`rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-lg ${bg}`}>
                          <div className="flex justify-between items-center mb-3 gap-6"><span className="font-bold text-sm text-white">{msg.createdBy==="admin"?`${msg.salesManagerName||"Admin"} (Admin)`:msg.salesManagerName}</span><span className="text-[10px] text-gray-400">{formatDate(msg.createdAt)}</span></div>
                          <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={followUpEndRef}/>
                </div>
                <form onSubmit={handleSendCustomNote} className="p-4 bg-[#1a1a1a] border-t border-[#333] flex gap-3 items-center flex-shrink-0">
                  <input type="text" value={customNote} onChange={e=>setCustomNote(e.target.value)} placeholder="Add follow-up note..." className="flex-1 bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors shadow-inner"/>
                  <button type="submit" className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-lg"><FaPaperPlane className="text-sm ml-[-2px]"/></button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// ASSISTANT MODULE
// ============================================================================
// ─────────────────────────────────────────────
// ADD THESE TO YOUR IMPORTS AT THE TOP OF THE FILE
// ─────────────────────────────────────────────
// import {
//   Bot, User, Send, BarChart2, AlertTriangle, Landmark, CalendarDays,
//   Lightbulb, ClipboardList, Wifi, CheckCircle, XCircle, HelpCircle,
//   Clock, MapPin, Zap, TrendingUp, Home, Building2, Globe, Star,
//   Share2, Banknote, Users, BadgeCheck, CalendarCheck,
//   ArrowRight, Target, BrainCircuit
// } from "lucide-react";

// ─────────────────────────────────────────────
// ICON RESOLVER
// ─────────────────────────────────────────────
function LucideIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    "check-circle":   <CheckCircle className={className} />,
    "x-circle":       <XCircle className={className} />,
    "help-circle":    <HelpCircle className={className} />,
    "landmark":       <Landmark className={className} />,
    "clock":          <Clock className={className} />,
    "alert-triangle": <AlertTriangle className={className} />,
    "banknote":       <Banknote className={className} />,
    "calendar-check": <CalendarCheck className={className} />,
    "map-pin":        <MapPin className={className} />,
    "calendar":       <CalendarDays className={className} />,
    "zap":            <Zap className={className} />,
    "trending-up":    <TrendingUp className={className} />,
    "home":           <Home className={className} />,
    "building-2":     <Building2 className={className} />,
    "globe":          <Globe className={className} />,
    "star":           <Star className={className} />,
    "share-2":        <Share2 className={className} />,
    "users":          <Users className={className} />,
    "bar-chart-2":    <BarChart2 className={className} />,
    "badge-check":    <BadgeCheck className={className} />,
    "lightbulb":      <Lightbulb className={className} />,
    "target":         <Target className={className} />,
    "brain-circuit":  <BrainCircuit className={className} />,
  };
  return <>{icons[name] ?? <ArrowRight className={className} />}</>;
}

// ─────────────────────────────────────────────
// COLOR MAPS
// ─────────────────────────────────────────────
const colorBg: Record<string, string> = {
  green:  "text-green-400 bg-green-500/10 border-green-500/20",
  red:    "text-red-400 bg-red-500/10 border-red-500/20",
  yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  blue:   "text-blue-400 bg-blue-500/10 border-blue-500/20",
  purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  gray:   "text-gray-400 bg-gray-500/10 border-gray-500/20",
  pink:   "text-pink-400 bg-pink-500/10 border-pink-500/20",
};

const colorText: Record<string, string> = {
  green: "text-green-400", red: "text-red-400",    yellow: "text-yellow-400",
  blue:  "text-blue-400",  purple: "text-purple-400", orange: "text-orange-400",
  gray:  "text-gray-400",  pink: "text-pink-400",
};

// ─────────────────────────────────────────────
// STRUCTURED MESSAGE RENDERER
// ─────────────────────────────────────────────
function StructuredMessage({ data }: { data: any }) {

  // ── PLAIN TEXT ──
  if (!data || data.type === "text") {
    return (
      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
        {data?.response || "No response."}
      </p>
    );
  }

  // ── SINGLE STAT ──
  if (data.type === "stat") {
    return (
      <div className="flex items-center gap-4 py-1">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorBg[data.color] || colorBg.gray}`}>
          <LucideIcon name={data.icon} className="w-5 h-5" />
        </div>
        <div>
          <p className="text-3xl font-black text-white">{data.value}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">{data.title}</p>
        </div>
      </div>
    );
  }

  // ── PIPELINE OVERVIEW ──
  if (data.type === "overview") {
    return (
      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-purple-400" /> {data.title}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(data.stats || []).map((s: any) => (
            <div key={s.label} className={`flex items-center gap-3 p-3 rounded-xl border ${colorBg[s.color] || colorBg.gray}`}>
              <LucideIcon name={s.icon} className={`w-4 h-4 flex-shrink-0 ${colorText[s.color]}`} />
              <div>
                <p className="text-lg font-black text-white leading-none">{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        {data.hotLeads?.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Hot Leads
            </p>
            {data.hotLeads.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-purple-400 font-mono font-bold">#{l.id}</span>
                  <span className="text-sm text-white font-semibold">{l.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">{l.interest}</span>
                  <span className="text-[11px] font-black text-orange-400">{l.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── PRIORITY LIST ──
  if (data.type === "priority_list") {
    return (
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> {data.title}
        </p>
        {(data.leads || []).map((l: any, i: number) => (
          <div key={l.id} className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
            <span className="text-lg font-black text-gray-600 w-5 text-center flex-shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-purple-400 font-mono">#{l.id}</span>
                <span className="text-sm text-white font-bold truncate">{l.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorBg[l.priorityColor] || colorBg.gray}`}>
                  {l.priority}
                </span>
                <span className="text-[10px] text-gray-500">{l.budget}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-black text-white">{l.score}</p>
              <p className="text-[9px] text-gray-600">/ 100</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── LOAN LIST ──
  if (data.type === "loan_list") {
    return (
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Landmark className="w-3.5 h-3.5 text-blue-400" /> {data.title}
        </p>
        {(data.leads || []).map((l: any) => {
          const sc = (l.status || "").toLowerCase();
          const sc2 = sc === "approved" ? colorBg.green : sc === "rejected" ? colorBg.red : sc === "in progress" ? colorBg.yellow : colorBg.gray;
          return (
            <div key={l.id} className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-purple-400 font-mono">#{l.id}</span>
                  <span className="text-sm text-white font-bold">{l.name}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc2}`}>{l.status}</span>
              </div>
              <div className="flex gap-4 text-[11px]">
                <span className="text-gray-500">Requested: <span className="text-orange-400 font-semibold">{l.amtReq}</span></span>
                <span className="text-gray-500">Approved: <span className="text-green-400 font-semibold">{l.amtApp}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── VISIT LIST ──
  if (data.type === "visit_list") {
    return (
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-orange-400" /> {data.title}
        </p>
        {(data.leads || []).map((l: any) => (
          <div key={l.id} className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-purple-400 font-mono">#{l.id}</span>
                <span className="text-sm text-white font-bold truncate">{l.name}</span>
              </div>
              <p className="text-[11px] text-orange-400 font-semibold mt-0.5">{l.date}</p>
            </div>
            <span className="text-[11px] text-green-400 font-semibold flex-shrink-0">{l.budget}</span>
          </div>
        ))}
      </div>
    );
  }

  // ── RECOMMENDATION ──
  if (data.type === "recommendation") {
    return (
      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> AI Recommendation
        </p>
        <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
          <p className="text-[10px] text-gray-500 mb-1">Best lead to act on right now</p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-purple-400 font-mono mr-2">#{data.lead?.id}</span>
              <span className="text-white font-bold">{data.lead?.name}</span>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorBg[data.lead?.priorityColor] || colorBg.gray}`}>
                {data.lead?.priority}
              </span>
              <p className="text-[10px] text-gray-500 mt-1">{data.lead?.score}/100</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {(data.suggestions || []).slice(0, 4).map((s: any, i: number) => (
            <div key={i} className="flex items-start gap-3 p-2.5 bg-[#1a1a1a] rounded-xl border border-[#222]">
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${colorBg[s.color] || colorBg.gray}`}>
                <LucideIcon name={s.icon} className={`w-3.5 h-3.5 ${colorText[s.color]}`} />
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── LEAD DETAIL ──
  if (data.type === "lead_detail") {
    const l = data.lead || {};
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <div>
            <p className="text-[10px] text-purple-400 font-mono mb-0.5">#{l.id}</p>
            <p className="text-lg font-bold text-white">{l.name}</p>
          </div>
          <div className="text-right">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${colorBg[data.priorityColor] || colorBg.gray}`}>
              {data.priority}
            </span>
            <p className="text-[10px] text-gray-500 mt-1">Score: {data.score}/100</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Budget",   value: l.budget,      icon: "banknote",  color: "green"  },
            { label: "Interest", value: l.interest,    icon: "target",    color: "purple" },
            { label: "Loan",     value: l.loanPlanned, icon: "landmark",  color: "blue"   },
            { label: "Timeline", value: l.planning,    icon: "calendar",  color: "orange" },
            { label: "Use Type", value: l.useType,     icon: "home",      color: "purple" },
            { label: "Source",   value: l.source,      icon: "share-2",   color: "blue"   },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 p-2 bg-[#1a1a1a] rounded-lg border border-[#222]">
              <LucideIcon name={item.icon} className={`w-3.5 h-3.5 flex-shrink-0 ${colorText[item.color]}`} />
              <div className="min-w-0">
                <p className="text-[9px] text-gray-600">{item.label}</p>
                <p className="text-white font-semibold text-xs truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
        {(data.suggestions || []).length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3 text-yellow-400" /> Suggested Actions
            </p>
            <div className="space-y-1.5">
              {(data.suggestions || []).map((s: any, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-[#1a1a1a] rounded-lg border border-[#222]">
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorBg[s.color] || colorBg.gray}`}>
                    <LucideIcon name={s.icon} className={`w-3 h-3 ${colorText[s.color]}`} />
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── HELP ──
  if (data.type === "help") {
    return (
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2">
          <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> What I can help with
        </p>
        {(data.items || []).map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-3 p-2.5 bg-[#1a1a1a] border border-[#222] rounded-xl">
            <LucideIcon name={item.icon} className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <p className="text-xs text-gray-300">{item.text}</p>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-sm text-gray-400">Unknown response type.</p>;
}

// ─────────────────────────────────────────────
// MAIN ASSISTANT VIEW
// ─────────────────────────────────────────────
function AssistantView({ allLeads }: { allLeads: any[] }) {
  const CACHE_KEY = "crm_ai_chat";
  const CACHE_TTL = 2 * 24 * 60 * 60 * 1000;

  const [chatInput, setChatInput]       = useState("");
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; ts?: string; typing?: boolean }[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isLoading]);

  // ── LOAD CACHE ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const { messages, savedAt } = JSON.parse(raw);
      if (Date.now() - savedAt > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return; }
      if (Array.isArray(messages)) setChatMessages(messages);
    } catch { localStorage.removeItem(CACHE_KEY); }
  }, []);

  // ── SAVE CACHE ──
  useEffect(() => {
    if (chatMessages.length === 0) return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ messages: chatMessages, savedAt: Date.now() }));
    } catch {}
  }, [chatMessages]);

  const getTime = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // ── SEND MESSAGE ──
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setChatInput("");

    // Add user message
    setChatMessages(prev => [...prev, { sender: "user", text, ts: getTime() }]);
    setIsLoading(true);

    // 🔥 Show typing indicator for 0.5s before actual response
    const typingId = Date.now().toString();
    setChatMessages(prev => [...prev, { sender: "ai", text: "", ts: getTime(), typing: true }]);

    try {
      const res = await fetch("/api/ai-assistant/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, leads: allLeads }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // 🔥 Wait 0.5s minimum so typing indicator always shows
      await new Promise(r => setTimeout(r, 500));

      // Replace typing bubble with real response
      setChatMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.typing
            ? { sender: "ai", text: data.response, ts: getTime(), typing: false }
            : m
        )
      );
    } catch (err) {
      await new Promise(r => setTimeout(r, 500));
      setChatMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.typing
            ? { sender: "ai", text: `Something went wrong: ${err instanceof Error ? err.message : String(err)}`, ts: getTime(), typing: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit  = (e: React.FormEvent) => { e.preventDefault(); sendMessage(chatInput); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); }
  };

  const suggestions = [
    { icon: <BarChart2    className="w-4 h-4 text-purple-400" />, label: "Leads overview",      prompt: "Leads overview" },
    { icon: <Flame        className="w-4 h-4 text-red-400" />,    label: "High priority leads",    prompt: "high priority leads" }, // 🔥 Flame instead of AlertTriangle
    { icon: <Landmark     className="w-4 h-4 text-blue-400" />,   label: "Loan summary",           prompt: "loan summary" },
    { icon: <CalendarDays className="w-4 h-4 text-orange-400" />, label: "Site visits",            prompt: "site visits" },
    { icon: <Lightbulb    className="w-4 h-4 text-yellow-400" />, label: "What should I do next?", prompt: "suggest what should I do next" },
    { icon: <ClipboardList className="w-4 h-4 text-green-400"/>,  label: "Total lead count",       prompt: "how many total leads" },
  ];

  const isEmpty = chatMessages.length === 0;

  return (
    <div className="flex flex-col bg-[#0a0a0a]" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── TOPBAR ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
            <Bot className="text-white w-4 h-4" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm leading-tight">CRM AI Assistant</h2>
            <p className="text-gray-600 text-[11px]">
              {allLeads.length > 0 ? `${allLeads.length} leads in context` : "No leads loaded"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {chatMessages.length > 0 && (
            <button
              onClick={() => { setChatMessages([]); localStorage.removeItem(CACHE_KEY); }}
              className="text-[11px] text-gray-600 hover:text-red-400 transition-colors cursor-pointer border border-[#222] hover:border-red-500/30 px-3 py-1 rounded-full"
            >
              Clear chat
            </button>
          )}
          <div className="flex items-center gap-2">
            <Wifi className="w-3 h-3 text-green-500" />
            <span className="text-[11px] text-green-500 font-semibold">Online</span>
          </div>
        </div>
      </div>

      {/* ── MESSAGES AREA ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-8 py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 flex items-center justify-center mb-6">
              <Bot className="text-purple-400 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 text-center">How can I help you today?</h1>
            <p className="text-gray-500 text-sm text-center mb-10 max-w-md">
              Ask me about your leads, Leads stats, loan tracking, or type a client name for a full AI analysis.
            </p>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
              {suggestions.map((s) => (
                <button
                  key={s.prompt}
                  onClick={() => sendMessage(s.prompt)}
                  className="group flex items-center gap-3 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-purple-500/40 rounded-xl p-4 text-left transition-all cursor-pointer"
                >
                  <div className="relative w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                    {s.icon}
                    {/* 🔥 Red pulsing dot only on High Priority card */}
                    {s.prompt === "high priority leads" && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 group-hover:text-white text-xs font-medium leading-tight transition-colors">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 animate-fadeIn ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>

                {/* Avatar */}
                <div className="flex-shrink-0 mt-1">
                  {msg.sender === "ai" ? (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
                      <Bot className="text-white w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#2a2a2a] border border-[#333] flex items-center justify-center">
                      <User className="text-gray-400 w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-1 ${msg.sender === "user" ? "items-end max-w-[55%]" : "items-start max-w-[80%]"}`}>
                  <div className={`
                    px-4 py-3 rounded-2xl text-sm leading-7
                    ${msg.sender === "user"
                      ? "bg-purple-600 text-white rounded-tr-sm"
                      : "bg-[#141414] border border-[#1f1f1f] text-gray-200 rounded-tl-sm"
                    }
                  `}>
                    {/* 🔥 Typing indicator */}
                    {/* Replace the typing indicator inside the bubble */}
                    {msg.typing ? (
                      <div className="flex items-center gap-3 py-0.5">
                        {/* 🔥 Animated typing bars — like iMessage */}
                        <div className="flex items-end gap-[3px] h-4">
                          {[0, 100, 200, 100, 0].map((delay, i) => (
                            <div
                              key={i}
                              className="w-[3px] bg-purple-400 rounded-full animate-pulse"
                              style={{
                                height: `${[8, 12, 16, 12, 8][i]}px`,
                                animationDelay: `${delay}ms`,
                                animationDuration: "0.8s",
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-500 italic">AI is thinking...</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                  {msg.ts && !msg.typing && (
                    <span className="text-[10px] text-gray-700 px-1">{msg.ts}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* ── INPUT BAR ── */}
      <div className="flex-shrink-0 border-t border-[#111] bg-[#0a0a0a] px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 bg-[#111] border border-[#222] hover:border-[#333] focus-within:border-purple-500/50 rounded-2xl px-4 py-3 transition-all">
              <textarea
                ref={inputRef}
                value={chatInput}
                onChange={e => {
                  setChatInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about leads, leads, loans, or type a client name..."
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-transparent text-white text-sm outline-none resize-none placeholder-gray-600 disabled:opacity-50 leading-relaxed self-center"
                style={{ maxHeight: "160px", minHeight: "24px" }}
              />
              <button
                type="submit"
                disabled={isLoading || !chatInput.trim()}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0
                  ${chatInput.trim() && !isLoading
                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"
                    : "bg-[#1a1a1a] text-gray-600 cursor-not-allowed"
                  }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {!isEmpty && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {suggestions.slice(0, 4).map(s => (
                <button
                  key={s.prompt}
                  onClick={() => sendMessage(s.prompt)}
                  disabled={isLoading}
                  className="relative flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-white bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] px-3 py-1.5 rounded-full transition-all cursor-pointer disabled:opacity-40"
                >
                  {/* 🔥 Red dot on high priority chip */}
                  {s.prompt === "high priority leads" && (
                    <span className="flex h-1.5 w-1.5 mr-0.5">
                      <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                    </span>
                  )}
                  <span className="w-3 h-auto flex-shrink-0">{s.icon}</span>
                  <span className="whitespace-nowrap">{s.label}</span>
                </button>
              ))}
            </div>
          )}

          <p className="text-center text-[10px] text-gray-700 mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

function ReceptionistView() { return null; }