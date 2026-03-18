"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaThLarge, FaClipboardList, FaUsers, FaIdCard, FaCog,
  FaSearch, FaBell, FaChevronLeft, FaPhoneAlt, FaComments,
  FaCheckCircle, FaCalendarAlt, FaTimes, FaPlus, FaPen,
  FaFileInvoice, FaPaperPlane, FaMicrophone, FaWhatsapp, FaTable, FaChartPie, FaUserCircle,
  FaEye, FaEyeSlash, FaUniversity, FaFileAlt, FaCheck, FaClock, FaRobot
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  CartesianGrid, PieChart, Pie, Legend
} from "recharts";

// ============================================================================
// SHARED REAL-TIME DATA HOOK
// ============================================================================
function useAdminData() {
  const [managers, setManagers]       = useState<any[]>([]);
  const [receptionists, setReceptionists] = useState<any[]>([]);
  const [allLeads, setAllLeads]       = useState<any[]>([]);
  const [followUps, setFollowUps]     = useState<any[]>([]);
  const [isLoading, setIsLoading]     = useState(true);

  const fetchAdminData = async () => {
    try {
      let smData: any[] = [];
      const resUsers = await fetch("/api/users?role=sales_manager");
      if (resUsers.ok) { const j = await resUsers.json(); smData = j.data || j; }
      else {
        const alt = await fetch("/api/users/sales-manager");
        if (alt.ok) { const j = await alt.json(); smData = j.data || []; }
      }

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
        const leadFups   = mongoFollowUps.filter((f: any) => String(f.leadId) === String(lead.id));
        const salesForms = leadFups.filter((f: any) => f.message?.includes("Detailed Salesform Submitted"));
        const latestFormMsg = salesForms.length > 0 ? salesForms[salesForms.length - 1].message : "";

        const extractField = (fieldName: string) => {
          if (!latestFormMsg) return "Pending";
          const match = latestFormMsg.match(new RegExp(`• ${fieldName}: (.*)`));
          return match ? match[1].trim() : "Pending";
        };

        const loanUpdates = leadFups.filter((f: any) => f.message?.includes("🏦 Loan Update:"));
        let loanStatus = "N/A", loanAmtReq = "N/A", loanAmtApp = "N/A";
        if (loanUpdates.length > 0) {
          const lm = loanUpdates[loanUpdates.length - 1].message;
          const ms = lm.match(/• Status: (.*)/);           if (ms) loanStatus  = ms[1].trim();
          const mr = lm.match(/• Amount Requested: (.*)/); if (mr) loanAmtReq = mr[1].trim();
          const ma = lm.match(/• Amount Approved: (.*)/);  if (ma) loanAmtApp = ma[1].trim();
        }

        const fupsWithDate    = leadFups.filter((f: any) => f.siteVisitDate && f.siteVisitDate.trim() !== "");
        const latestVisitDate = fupsWithDate.length > 0 ? fupsWithDate[fupsWithDate.length - 1].siteVisitDate : null;
        const activeBudget    = extractField("Budget") !== "Pending" ? extractField("Budget") : lead.budget;

        return {
          ...lead,
          propType:           extractField("Property Type"),
          salesBudget:        activeBudget,
          useType:            extractField("Use Type") !== "Pending" ? extractField("Use Type") : (lead.purpose || "Pending"),
          planningPurchase:   extractField("Planning to Purchase"),
          decisionMaker:      extractField("Decision Maker"),
          loanPlanned:        extractField("Loan Planned") !== "Pending" ? extractField("Loan Planned") : (lead.loan_planned || "Pending"),
          leadInterestStatus: extractField("Lead Status"),
          loanStatus, loanAmtReq, loanAmtApp,
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
        } catch { }
      };
      fetchLivePassword();
    }
    const returnTab = localStorage.getItem("return_tab");
    if (returnTab) { setActiveView(returnTab); localStorage.removeItem("return_tab"); }
  }, []);

  const handleLogout = () => { localStorage.removeItem("crm_user"); router.push("/"); };

  const menuItems = [
    { id: "dashboard",    icon: FaThLarge,      label: "Overview" },
    { id: "receptionist", icon: FaClipboardList, label: "Receptionist" },
    { id: "sales",        icon: FaUsers,         label: "Sales Managers" },
    { id: "employees",    icon: FaIdCard,        label: "Add Employee" },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-200 font-sans overflow-hidden relative">
      <AnimatePresence>
        {isSidebarHovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 pointer-events-none backdrop-blur-[1px]" />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ width: "80px" }} animate={{ width: isSidebarHovered ? "240px" : "80px" }} transition={{ duration: 0.2, ease: "easeInOut" }}
        onMouseEnter={() => setIsSidebarHovered(true)} onMouseLeave={() => setIsSidebarHovered(false)}
        className="fixed left-0 top-0 h-screen bg-[#111111] border-r border-[#222] z-50 flex flex-col py-6 overflow-hidden shadow-2xl"
      >
        <div className="flex items-center px-5 mb-10 whitespace-nowrap">
          <div className="w-10 h-10 min-w-[40px] bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg">B</div>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: isSidebarHovered ? 1 : 0 }} className="ml-4 font-bold text-lg text-white tracking-wide">Bhoomi CRM</motion.span>
        </div>
        <nav className="flex flex-col gap-2 px-3 flex-1">
          {menuItems.map((item) => (
            <div key={item.id}
              onClick={() => {
                if (item.id === "employees") { router.push("/dashboard/employees"); }
                else { setActiveView(item.id); setIsSidebarHovered(false); }
              }}
              className={`flex items-center px-3 py-3.5 rounded-xl cursor-pointer transition-colors whitespace-nowrap relative group
                ${activeView === item.id && item.id !== "employees" ? "bg-purple-500/10 text-purple-400" : "text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-300"}`}
            >
              {activeView === item.id && item.id !== "employees" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full" />}
              <item.icon className="w-5 h-5 min-w-[20px] ml-1" />
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: isSidebarHovered ? 1 : 0 }}
                className={`ml-5 font-semibold text-sm ${activeView === item.id && item.id !== "employees" ? "text-purple-300" : ""}`}>
                {item.label}
              </motion.span>
            </div>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pl-[80px] h-screen overflow-hidden">
        <header className="h-16 bg-[#111111]/80 backdrop-blur-md border-b border-[#222] flex items-center justify-between px-8 z-30">
          <h1 className="text-white font-bold text-lg capitalize tracking-wide flex items-center gap-3">
            {activeView.replace("_", " ")}
            <span className="bg-[#222] text-gray-400 px-2 py-0.5 rounded text-xs border border-[#333]">Admin</span>
          </h1>
          <div className="flex items-center gap-6">
            <FaBell className="text-gray-500 hover:text-white cursor-pointer" />
            <div className="relative">
              <div onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-9 h-9 rounded-full bg-purple-900/30 text-purple-400 border border-purple-500/50 flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm hover:bg-purple-900/50 transition-colors">
                {String(user?.name || "A").charAt(0).toUpperCase()}
              </div>
              {isProfileOpen && (
                <div className="absolute top-12 right-0 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-5 z-50 animate-fadeIn">
                  <div className="mb-4"><h3 className="text-white font-bold text-lg">{user?.name || "Admin"}</h3><p className="text-gray-400 text-sm truncate">{user?.email || "admin@bhoomi.com"}</p></div>
                  <hr className="border-[#2a2a2a] mb-4" />
                  <div className="space-y-4 mb-6 text-sm">
                    <p className="text-gray-400 flex justify-between items-center">Role: <span className="text-purple-400 font-bold capitalize bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">{user?.role || "Admin"}</span></p>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Password</p>
                      <div className="flex items-center justify-between bg-[#121212] border border-[#2a2a2a] p-2 rounded-md">
                        <span className="font-mono text-white tracking-widest text-xs">{showPassword ? (user?.password || "N/A") : "••••••••"}</span>
                        <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-purple-400 cursor-pointer">
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="w-full bg-[#3B1F1F] text-[#F28B82] hover:bg-red-900/40 border border-red-900/30 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer">Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden bg-[#0a0a0a]">
          {activeView === "dashboard"    && <DashboardOverview managers={managers} allLeads={allLeads} isLoading={isLoading} user={user} />}
          {activeView === "sales"        && <AdminSalesView managers={managers} allLeads={allLeads} followUps={followUps} isLoading={isLoading} adminUser={user} refetch={refetch} />}
          {activeView === "receptionist" && <ReceptionistView receptionists={receptionists} allLeads={allLeads} managers={managers} isLoading={isLoading} refetch={refetch} />}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar{width:6px;height:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:#3a3a3a;border-radius:10px}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#555}@keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}.animate-fadeIn{animation:fadeIn 0.2s ease-out}`}} />
    </div>
  );
}

// ============================================================================
// DASHBOARD ANALYTICS — bar + pie charts for selected manager's leads
// ============================================================================
function DashboardAnalytics({ leads }: { leads: any[] }) {
  const [pieMode, setPieMode] = useState<"interest"|"loan"|"usetype"|"loanrequired"|"visits">("interest");
  const [barMode, setBarMode] = useState<"weekly"|"source">("weekly");

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
    const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const counts = [0,0,0,0,0,0,0];
    const now    = new Date();
    leads.forEach(l => {
      if(!l.created_at) return;
      const d = new Date(l.created_at);
      if(Math.floor((now.getTime()-d.getTime())/86400000)<7) counts[d.getDay()]++;
    });
    return days.map((day,i)=>({day,leads:counts[i]}));
  },[leads]);

  const weeklyTotal = weeklyData.reduce((a,b)=>a+b.leads,0);

  const sourceData = useMemo(() => {
    const c: Record<string,number> = {};
    leads.forEach(l => { const src=l.source||"Unknown"; c[src]=(c[src]||0)+1; });
    return Object.entries(c).map(([source,count])=>({source,count})).sort((a,b)=>b.count-a.count).slice(0,6);
  },[leads]);

  const interestColors: Record<string,string> = { Interested:"#4ade80","Not Interested":"#f87171",Maybe:"#fbbf24",Pending:"#6b7280" };
  const loanColors:     Record<string,string> = { Approved:"#4ade80","In Progress":"#fbbf24",Rejected:"#f87171","N/A":"#6b7280" };
  const useTypeColors:  Record<string,string> = { "Self Use":"#818cf8",Investment:"#34d399","Personal use":"#f87171","N/A":"#6b7280" };
  const loanReqColors:  Record<string,string> = { Yes:"#60a5fa",No:"#6b7280","Not Sure":"#fbbf24",Pending:"#374151" };
  const visitColors:    Record<string,string> = { Scheduled:"#f97316",Pending:"#374151" };

  const pieData   = pieMode==="interest" ? interestData : pieMode==="loan" ? loanPieData : pieMode==="usetype" ? useTypeData : pieMode==="loanrequired" ? loanRequiredData : visitData;
  const pieColors = pieMode==="interest" ? interestColors : pieMode==="loan" ? loanColors : pieMode==="usetype" ? useTypeColors : pieMode==="loanrequired" ? loanReqColors : visitColors;
  const totalLeads = leads.length;

  const BarTip = ({ active, payload, label }: any) => active&&payload?.length
    ? <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs shadow-xl"><p className="text-gray-400">{label||payload[0].name}</p><p className="text-white font-bold">{payload[0].value}</p></div>
    : null;

  const PieTip = ({ active, payload }: any) => active&&payload?.length
    ? <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs shadow-xl"><p className="text-gray-300 font-bold">{payload[0].name}</p><p className="text-white">{payload[0].value} leads</p></div>
    : null;

  const BAR_COLORS = ["#a855f7","#818cf8","#60a5fa","#34d399","#fbbf24","#f87171","#c084fc"];
  const SRC_COLORS = ["#a855f7","#60a5fa","#4ade80","#fbbf24","#f87171","#34d399"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* BAR CHART */}
      <div className="bg-[#111111] border border-[#222] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <FaChartPie className="text-purple-400 text-xs"/>
              {barMode==="weekly" ? "Leads Added This Week" : "Lead Source Distribution"}
            </h3>
            {barMode==="weekly" && <p className="text-purple-400 text-xs mt-0.5 font-semibold">{weeklyTotal} total this week</p>}
          </div>
          <select value={barMode} onChange={e=>setBarMode(e.target.value as any)}
            className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer focus:border-purple-500 appearance-none">
            <option value="weekly">Leads This Week</option>
            <option value="source">Lead Source Distribution</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          {barMode==="weekly" ? (
            <BarChart data={weeklyData} margin={{top:4,right:8,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a"/>
              <XAxis dataKey="day" tick={{fill:"#9ca3af",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#9ca3af",fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
              <RechartsTooltip content={<BarTip/>}/>
              <Bar dataKey="leads" radius={[6,6,0,0]}>
                {weeklyData.map((_:any,i:number)=><Cell key={i} fill={BAR_COLORS[i%7]}/>)}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={sourceData} layout="vertical" margin={{top:0,right:16,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false}/>
              <XAxis type="number" tick={{fill:"#9ca3af",fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
              <YAxis type="category" dataKey="source" width={100} tick={{fill:"#9ca3af",fontSize:10}} axisLine={false} tickLine={false}/>
              <RechartsTooltip content={<BarTip/>}/>
              <Bar dataKey="count" radius={[0,6,6,0]}>
                {sourceData.map((_:any,i:number)=><Cell key={i} fill={SRC_COLORS[i%6]}/>)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* PIE CHART */}
      <div className="bg-[#111111] border border-[#222] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <FaChartPie className="text-blue-400 text-xs"/>
            {pieMode==="interest"     ? "Lead Interest Breakdown"   :
             pieMode==="loan"         ? "Loan Status Breakdown"      :
             pieMode==="usetype"      ? "Self-Use vs Investment"      :
             pieMode==="loanrequired" ? "Loan Required?"              :
                                        "Visit Scheduled vs Pending"}
          </h3>
          <select value={pieMode} onChange={e=>setPieMode(e.target.value as any)}
            className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer focus:border-purple-500 appearance-none">
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
              <RechartsTooltip content={<PieTip/>}/>
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
  );
}

// ============================================================================
// DASHBOARD OVERVIEW
// ============================================================================
function DashboardOverview({ managers, allLeads, isLoading, user }: any) {
  const [selectedManagerName, setSelectedManagerName] = useState("");
  const [hasAutoSelected, setHasAutoSelected]         = useState(false);

  const managerStats = managers.map((m: any) => {
    const mLeads = allLeads.filter((l: any) => l.assigned_to === m.name);
    return {
      name:       m.name,
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
  const pieData            = managerStats.filter((m: any) => m.siteVisits > 0);
  const PIE_COLORS         = ["#d946ef","#8b5cf6","#3b82f6","#0ea5e9","#10b981","#f59e0b"];

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
      {/* Welcome banner */}
      <div className="bg-[#111111] border border-[#222] rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <h2 className="text-xl font-bold text-white">Welcome back, {user?.name || "Admin"}!</h2>
        <p className="text-sm text-gray-400">Here is what's happening with your team today.</p>
      </div>

      {/* Top performers + site visits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-[#111111] border border-[#222] rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><FaChartPie className="text-purple-500"/> Top Performers</h2>
          <p className="text-xs text-gray-500 mb-6">Sales managers ranked by active leads.</p>
          <div className="flex-1 min-h-[280px]">
            {isLoading ? <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading...</div>
            : managerStats.length === 0 ? <div className="h-full flex items-center justify-center text-sm text-gray-500">No data</div>
            : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={managerStats} margin={{ top:10,right:10,left:-20,bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false}/>
                  <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false}/>
                  <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false}/>
                  <RechartsTooltip cursor={{ fill:"#222" }} contentStyle={{ backgroundColor:"#1a1a1a",border:"1px solid #333",borderRadius:"8px",color:"#fff" }}/>
                  <Bar dataKey="activeLeads" radius={[4,4,0,0]} barSize={45}>
                    {managerStats.map((_: any, i: number) => <Cell key={i} fill={i===0?"#d946ef":"#8b5cf6"}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-[#111111] border border-[#222] rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><FaCalendarAlt className="text-orange-500"/> Site Visits</h2>
          <p className="text-xs text-gray-500 mb-6">Upcoming visits by manager.</p>
          <div className="flex-1 min-h-[280px]">
            {isLoading ? <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading...</div>
            : pieData.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-sm text-gray-500"><FaCalendarAlt className="text-3xl mb-3 opacity-20"/>No visits scheduled</div>
            : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="siteVisits" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                    label={({ name, value }) => `${name} (${value})`} labelLine={true} style={{ fontSize:"11px",fill:"#ccc" }}>
                    {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor:"#1a1a1a",border:"1px solid #333",borderRadius:"8px",color:"#fff" }}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Team Performance Table header + dropdown */}
      <div className="bg-[#111111] border border-[#222] rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaTable className="text-purple-500"/> Team Performance Table</h2>
          <p className="text-sm text-gray-500 mt-1">Select a manager to view their real-time data.</p>
        </div>
        <div className="w-full sm:w-72 relative">
          <FaChevronLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs z-10"/>
          <select value={selectedManagerName} onChange={e => setSelectedManagerName(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] text-white text-sm font-bold rounded-xl pl-9 pr-4 py-3 outline-none focus:border-purple-500 cursor-pointer shadow-sm appearance-none">
            <option value="" disabled>-- Select Sales Manager --</option>
            {managers.map((m: any) => <option key={m.id||m._id||m.name} value={m.name}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {!selectedManagerName ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-[#222] rounded-2xl min-h-[300px]">
          <FaTable className="text-4xl mb-4 opacity-20"/>
          <p>Select a manager to view their table.</p>
        </div>
      ) : (
        <div className="animate-fadeIn space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111] border border-[#222] rounded-2xl p-5 shadow-sm"><p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Assigned</p><p className="text-3xl font-black text-white">{activeManagerLeads.length}</p></div>
            <div className="bg-[#111] border border-[#222] rounded-2xl p-5 shadow-sm"><p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Site Visits</p><p className="text-3xl font-black text-orange-400">{visitCount}</p></div>
            <div className="bg-[#111] border border-[#222] rounded-2xl p-5 shadow-sm"><p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Loans Active</p><p className="text-3xl font-black text-blue-400">{activeManagerLeads.filter((l:any)=>l.loanPlanned==="Yes").length}</p></div>
          </div>

          {/* ── ANALYTICS CHARTS for selected manager ── */}
          {activeManagerLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FaChartPie className="text-purple-500"/>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Lead Analytics — {selectedManagerName}</h3>
                <span className="text-xs text-gray-500 bg-[#222] px-2 py-0.5 rounded border border-[#333]">{activeManagerLeads.length} leads</span>
              </div>
              <DashboardAnalytics leads={activeManagerLeads} />
            </div>
          )}

          {/* Leads table */}
          <div className="bg-[#111111] rounded-2xl border border-[#222] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#222] flex justify-between items-center bg-[#151515]">
              <h3 className="font-bold text-white flex items-center gap-2"><FaUsers className="text-purple-500"/> Leads Database ({selectedManagerName})</h3>
              <span className="text-xs text-gray-500 bg-[#222] px-3 py-1 rounded-full border border-[#333]">Live Sync Active</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="text-xs text-gray-500 uppercase bg-[#1a1a1a]">
                  <tr>
                    <th className="px-6 py-4">LEAD NO.</th><th className="px-4 py-4">NAME</th>
                    <th className="px-4 py-4">PROP. TYPE</th><th className="px-4 py-4">BUDGET</th>
                    <th className="px-4 py-4">USE TYPE</th><th className="px-4 py-4">LOAN?</th>
                    <th className="px-4 py-4">LOAN STATUS</th><th className="px-4 py-4">AMT REQ / APP</th>
                    <th className="px-6 py-4">SITE VISIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {isLoading ? <tr><td colSpan={9} className="text-center py-8">Syncing...</td></tr>
                  : activeManagerLeads.length === 0 ? <tr><td colSpan={9} className="text-center py-8">No leads for {selectedManagerName}.</td></tr>
                  : activeManagerLeads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-[#222] transition-colors">
                      <td className="px-6 py-4 font-bold text-purple-400">#{lead.id}</td>
                      <td className="px-4 py-4 text-white font-medium">{lead.name}</td>
                      <td className="px-4 py-4 text-gray-200">{lead.propType || "Pending"}</td>
                      <td className="px-4 py-4 text-green-400 font-semibold">{lead.salesBudget}</td>
                      <td className="px-4 py-4">{lead.useType || "Pending"}</td>
                      <td className="px-4 py-4">{lead.loanPlanned || "Pending"}</td>
                      <td className="px-4 py-4">
                        {lead.loanStatus && lead.loanStatus !== "N/A"
                          ? <LoanStatusBadge status={lead.loanStatus}/>
                          : <span className="text-xs italic text-gray-600">N/A</span>}
                      </td>
                      <td className="px-4 py-4">
                        {lead.loanAmtReq && lead.loanAmtReq !== "N/A"
                          ? <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] text-orange-400 font-medium">Req: {lead.loanAmtReq}</span>
                              <span className="text-[11px] text-green-400 font-medium">App: {lead.loanAmtApp !== "N/A" ? lead.loanAmtApp : "—"}</span>
                            </div>
                          : <span className="text-xs italic text-gray-600">N/A</span>}
                      </td>
                      <td className="px-6 py-4">
                        {lead.mongoVisitDate ? <span className="text-orange-400 font-medium">{formatDate(lead.mongoVisitDate).split(",")[0]}</span> : <span className="text-xs italic text-gray-600">Pending</span>}
                      </td>
                    </tr>
                  ))}
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
// ADMIN SALES VIEW — full rich view with manager sidebar + rich lead cards/detail
// ============================================================================
function AdminSalesView({ managers, allLeads, followUps, isLoading, adminUser, refetch }: any) {
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [searchManager, setSearchManager]     = useState("");

  const [subView, setSubView]     = useState<"cards"|"detail">("cards");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [detailTab, setDetailTab]   = useState<"personal"|"loan">("personal");
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showLoanForm, setShowLoanForm]   = useState(false);
  const [salesForm, setSalesForm]   = useState({ propertyType:"",location:"",budget:"",useType:"",purchaseDate:"",loanPlanned:"",siteVisit:"",leadStatus:"" });
  const [loanForm, setLoanForm]     = useState({ loanRequired:"",status:"",bank:"",amountReq:"",amountApp:"",cibil:"",agent:"",agentContact:"",empType:"",income:"",emi:"",docPan:"Pending",docAadhaar:"Pending",docSalary:"Pending",docBank:"Pending",docProperty:"Pending",notes:"" });
  const [customNote, setCustomNote] = useState("");
  const followUpEndRef = useRef<HTMLDivElement>(null);
  const [toastMsg, setToastMsg]     = useState<{title:string;icon:any;color:string}|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedLead) {
      const u = allLeads.find((l: any) => String(l.id) === String(selectedLead.id));
      if (u) setSelectedLead(u);
    }
  }, [allLeads]);

  useEffect(() => {
    if (subView === "detail") followUpEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [followUps, subView, selectedLead, detailTab]);

  const filteredManagers   = managers.filter((m: any) => m.name?.toLowerCase().includes(searchManager.toLowerCase()));
  const activeManagerLeads = selectedManager ? allLeads.filter((l: any) => l.assigned_to === selectedManager.name) : [];
  const currentLeadFollowUps = followUps.filter((f: any) => String(f.leadId) === String(selectedLead?.id));

  const getLatestLoanDetails = () => {
    if (!selectedLead) return null;
    let ex: Record<string,any> = { loanRequired:selectedLead.loanPlanned||"N/A",status:"Pending",bankName:"N/A",amountReq:"N/A",amountApp:"N/A",cibil:"N/A",agent:"N/A",agentContact:"N/A",empType:"N/A",income:"N/A",emi:"N/A",docPan:"Pending",docAadhaar:"Pending",docSalary:"Pending",docBank:"Pending",docProperty:"Pending",notes:"N/A" };
    const lu = currentLeadFollowUps.filter((f: any) => f.message?.includes("🏦 Loan Update:"));
    if (lu.length > 0) {
      const msg = lu[lu.length-1].message;
      const g = (l: string) => { const m = msg.match(new RegExp(`• ${l}: (.*)`)); return m ? m[1].trim() : "N/A"; };
      ex = { loanRequired:g("Loan Required"),status:g("Status"),bankName:g("Bank Name"),amountReq:g("Amount Requested"),amountApp:g("Amount Approved"),cibil:g("CIBIL Score"),agent:g("Agent Name"),agentContact:g("Agent Contact"),empType:g("Employment Type"),income:g("Monthly Income"),emi:g("Existing EMIs"),docPan:g("PAN Card"),docAadhaar:g("Aadhaar Card"),docSalary:g("Salary Slips"),docBank:g("Bank Statements"),docProperty:g("Property Docs"),notes:g("Notes") };
    }
    return ex;
  };

  const getLoanStatusColor = (s: string) => {
    const sl = (s||"").toLowerCase();
    if (sl==="approved") return "bg-green-900/20 text-green-400 border-green-500/30";
    if (sl==="rejected") return "bg-red-900/20 text-red-400 border-red-500/30";
    if (sl==="in progress") return "bg-yellow-900/20 text-yellow-400 border-yellow-500/30";
    return "bg-gray-900/20 text-gray-400 border-gray-500/30";
  };

  const prefillSalesForm = () => {
    if (!selectedLead) return;
    const sf = currentLeadFollowUps.filter((f: any) => f.message?.includes("Detailed Salesform Submitted"));
    if (sf.length === 0) return;
    const msg = sf[sf.length-1].message;
    const g = (label: string) => { const m = msg.match(new RegExp(`• ${label}: (.*)`)); return m&&m[1].trim()!=="N/A"?m[1].trim():""; };
    setSalesForm({ propertyType:g("Property Type"),location:g("Location"),budget:g("Budget"),useType:g("Use Type"),purchaseDate:g("Planning to Purchase"),loanPlanned:g("Loan Planned"),leadStatus:g("Lead Status"),siteVisit:"" });
  };

  const prefillLoanForm = () => {
    const cur = getLatestLoanDetails();
    if (!cur) return;
    setLoanForm({ loanRequired:cur.loanRequired!=="N/A"?cur.loanRequired:"",status:cur.status!=="Pending"?cur.status:"",bank:cur.bankName!=="N/A"?cur.bankName:"",amountReq:cur.amountReq!=="N/A"?cur.amountReq:"",amountApp:cur.amountApp!=="N/A"?cur.amountApp:"",cibil:cur.cibil!=="N/A"?cur.cibil:"",agent:cur.agent!=="N/A"?cur.agent:"",agentContact:cur.agentContact!=="N/A"?cur.agentContact:"",empType:cur.empType!=="N/A"?cur.empType:"",income:cur.income!=="N/A"?cur.income:"",emi:cur.emi!=="N/A"?cur.emi:"",docPan:cur.docPan!=="N/A"?cur.docPan:"Pending",docAadhaar:cur.docAadhaar!=="N/A"?cur.docAadhaar:"Pending",docSalary:cur.docSalary!=="N/A"?cur.docSalary:"Pending",docBank:cur.docBank!=="N/A"?cur.docBank:"Pending",docProperty:cur.docProperty!=="N/A"?cur.docProperty:"Pending",notes:cur.notes!=="N/A"?cur.notes:"" });
  };

  const handleSendCustomNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customNote.trim() || !selectedLead) return;
    const nm = { leadId:String(selectedLead.id),salesManagerName:adminUser.name,createdBy:"admin",message:customNote,siteVisitDate:null,createdAt:new Date().toISOString() };
    setCustomNote("");
    try { await fetch("/api/followups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(nm)}); refetch(); } catch {}
  };

  const handleSalesFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const msg = "📝 Detailed Salesform Submitted:\n• Property Type: "+(salesForm.propertyType||"N/A")+"\n• Location: "+(salesForm.location||"N/A")+"\n• Budget: "+(salesForm.budget||"N/A")+"\n• Use Type: "+(salesForm.useType||"N/A")+"\n• Planning to Purchase: "+(salesForm.purchaseDate||"N/A")+"\n• Loan Planned: "+(salesForm.loanPlanned||"N/A")+"\n• Lead Status: "+(salesForm.leadStatus||"N/A")+"\n• Site Visit Requested: "+(salesForm.siteVisit?formatDate(salesForm.siteVisit):"No");
    const nm = { leadId:String(selectedLead.id),salesManagerName:adminUser.name,createdBy:"admin",message:msg,siteVisitDate:salesForm.siteVisit||null,createdAt:new Date().toISOString() };
    const ns = salesForm.siteVisit?"Visit Scheduled":selectedLead.status;
    setShowSalesForm(false);
    setSalesForm({propertyType:"",location:"",budget:"",useType:"",purchaseDate:"",loanPlanned:"",siteVisit:"",leadStatus:""});
    try {
      await fetch("/api/followups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(nm)});
      await fetch(`/api/walkin_enquiries/${selectedLead.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:selectedLead.name,status:ns})});
      refetch();
    } catch {}
  };

  const handleLoanFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const msg = "🏦 Loan Update:\n• Loan Required: "+(loanForm.loanRequired||"N/A")+"\n• Status: "+(loanForm.status||"N/A")+"\n• Bank Name: "+(loanForm.bank||"N/A")+"\n• Amount Requested: "+(loanForm.amountReq||"N/A")+"\n• Amount Approved: "+(loanForm.amountApp||"N/A")+"\n• CIBIL Score: "+(loanForm.cibil||"N/A")+"\n• Agent Name: "+(loanForm.agent||"N/A")+"\n• Agent Contact: "+(loanForm.agentContact||"N/A")+"\n• Employment Type: "+(loanForm.empType||"N/A")+"\n• Monthly Income: "+(loanForm.income||"N/A")+"\n• Existing EMIs: "+(loanForm.emi||"N/A")+"\n• PAN Card: "+(loanForm.docPan||"Pending")+"\n• Aadhaar Card: "+(loanForm.docAadhaar||"Pending")+"\n• Salary Slips: "+(loanForm.docSalary||"Pending")+"\n• Bank Statements: "+(loanForm.docBank||"Pending")+"\n• Property Docs: "+(loanForm.docProperty||"Pending")+"\n• Notes: "+(loanForm.notes||"N/A");
    const nm = { leadId:String(selectedLead.id),salesManagerName:adminUser.name,createdBy:"admin",message:msg,siteVisitDate:null,createdAt:new Date().toISOString() };
    const dbp = { leadId:String(selectedLead.id),salesManagerName:adminUser.name,...loanForm };
    setShowLoanForm(false);
    setToastMsg({title:`Loan Data Synced for ${selectedLead.name}`,icon:<FaCheckCircle/>,color:"blue"});
    setTimeout(()=>setToastMsg(null),3000);
    try {
      await fetch("/api/followups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(nm)});
      await fetch("/api/loan/update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(dbp)}).catch(()=>{});
      refetch();
    } catch {}
  };

  return (
    <div className="flex h-full">
      {toastMsg && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] bg-${toastMsg.color}-600 border border-${toastMsg.color}-400 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 animate-fadeIn`}>
          <div className="text-lg">{toastMsg.icon}</div>
          <span className="text-sm font-bold">{toastMsg.title}</span>
        </div>
      )}

      {/* ── MANAGER SIDEBAR ── */}
      <div className="w-72 border-r border-[#222] bg-[#111111] flex flex-col h-full flex-shrink-0 z-20 shadow-xl">
        <div className="p-5 border-b border-[#222]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"/>
            <input type="text" placeholder="Search Managers..." value={searchManager} onChange={e=>setSearchManager(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-purple-500 outline-none transition-colors"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? <div className="p-8 text-center text-gray-500 text-sm">Loading managers...</div>
          : filteredManagers.length === 0 ? <div className="p-8 text-center text-gray-500 text-sm">No managers found.</div>
          : filteredManagers.map((manager: any) => {
            const isSelected = selectedManager?.id === manager.id || selectedManager?.name === manager.name;
            const count = allLeads.filter((l: any) => l.assigned_to === manager.name).length;
            return (
              <div key={manager.id||manager._id||manager.name}
                onClick={() => { setSelectedManager(manager); setSubView("cards"); setSelectedLead(null); }}
                className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-b border-[#1a1a1a]
                  ${isSelected ? "bg-[#1a1a1a] border-l-4 border-l-purple-500" : "hover:bg-[#151515] border-l-4 border-l-transparent"}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${isSelected ? "bg-purple-600" : "bg-[#333] text-gray-400"}`}>
                  {manager.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-gray-200 truncate text-sm">{manager.name}</h3>
                    <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-bold">{count} leads</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate capitalize">{manager.role?.replace("_"," ")}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] overflow-hidden">
        {!selectedManager ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <FaIdCard className="text-4xl mb-4 opacity-20"/>
            <p>Select a sales manager from the left sidebar.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">

            {/* Header */}
            <div className="p-5 border-b border-[#222] bg-[#111111] flex justify-between items-center shadow-sm z-10 flex-shrink-0 gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaUsers className="text-purple-500"/> {selectedManager.name}'s Leads
                </h2>
                <p className="text-xs text-gray-500 mt-1">{activeManagerLeads.length} total leads · Live sync active</p>
              </div>
              {subView === "cards" && (
                <div className="flex gap-2 text-xs text-gray-500">
                  <span className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-full">
                    {activeManagerLeads.filter((l: any)=>l.leadInterestStatus==="Interested").length} Interested
                  </span>
                  <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full">
                    {activeManagerLeads.filter((l: any)=>l.loanPlanned==="Yes").length} Loans
                  </span>
                  <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-full">
                    {activeManagerLeads.filter((l: any)=>l.mongoVisitDate).length} Visits
                  </span>
                </div>
              )}
            </div>

            {/* ── CARDS VIEW ── */}
            {subView === "cards" && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {activeManagerLeads.length === 0 ? (
                  <p className="text-gray-500 text-sm">No leads assigned yet.</p>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {activeManagerLeads.map((lead: any) => {
                      const interest = lead.leadInterestStatus && lead.leadInterestStatus !== "Pending" ? lead.leadInterestStatus : null;
                      const loanSt   = lead.loanStatus && lead.loanStatus !== "N/A" ? lead.loanStatus : null;
                      return (
                        <div key={lead.id}
                          className="rounded-2xl p-6 border shadow-sm transition-all group flex flex-col justify-between cursor-pointer bg-[#1a1a1a] border-[#2a2a2a] hover:border-purple-500/50 hover:bg-[#1e1e1e]"
                          onClick={() => { setSelectedLead(lead); setSubView("detail"); }}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-5 pb-4 border-b border-[#2a2a2a]">
                              <h3 className="text-xl font-bold transition-colors line-clamp-1 pr-2 text-white group-hover:text-purple-400">
                                <span className="mr-2 text-purple-500">#{lead.id}</span>{lead.name}
                              </h3>
                              {interest
                                ? <InterestBadge status={interest}/>
                                : <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-500/30 text-blue-400 bg-blue-500/10 flex-shrink-0">{lead.status||"ROUTED"}</span>
                              }
                            </div>

                            <div className="space-y-3 mb-5">
                              <div className="flex justify-between items-center">
                                <div><p className="text-xs text-gray-400 font-medium">Budget</p><p className="text-sm font-semibold text-green-400">{lead.salesBudget}</p></div>
                                <div className="flex flex-col items-end gap-1">
                                  {loanSt ? <LoanStatusBadge status={loanSt}/>
                                    : lead.loanPlanned==="Yes" && <div className="bg-blue-900/20 border border-blue-500/30 px-2 py-1 rounded text-blue-400 text-[10px] font-bold uppercase flex items-center gap-1"><FaUniversity/> Loan Active</div>}
                                </div>
                              </div>

                              {lead.propType && lead.propType!=="Pending" && <div><p className="text-xs text-gray-400 font-medium">Property</p><p className="text-sm font-medium text-white">{lead.propType}</p></div>}

                              <div className="p-3 rounded-lg border flex flex-col gap-1.5 bg-[#222] border-[#2a2a2a]">
                                <p className="text-xs text-gray-400 flex items-center gap-2"><FaPhoneAlt className="text-gray-500 w-3 h-3"/> <span className="font-mono text-gray-200">{maskPhone(lead.phone)}</span></p>
                              </div>

                              {(lead.mongoVisitDate || interest) && (
                                <div className="flex items-center justify-between gap-2">
                                  {lead.mongoVisitDate && <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-400"><FaCalendarAlt className="text-[10px]"/>{formatDate(lead.mongoVisitDate).split(",")[0]}</div>}
                                  {interest && !lead.mongoVisitDate && <InterestBadge status={interest} size="sm"/>}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 border-t mt-auto border-[#2a2a2a]">
                            <div className="flex justify-between items-center gap-2">
                              <p className="text-gray-500 text-[10px]">{formatDate(lead.created_at).split(",")[0]}</p>
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

            {/* ── DETAIL VIEW ── */}
            {subView === "detail" && selectedLead && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="animate-fadeIn max-w-[1200px] mx-auto flex flex-col h-full">

                  <div className="flex items-center justify-between mb-4 rounded-2xl border p-4 sm:p-5 shadow-xl flex-shrink-0 bg-[#1a1a1a] border-[#2a2a2a]">
                    <div className="flex items-center gap-4">
                      <button onClick={() => { setSubView("cards"); setShowSalesForm(false); setShowLoanForm(false); }}
                        className="w-10 h-10 flex items-center justify-center bg-[#222] hover:bg-[#333] border border-[#444] rounded-lg text-gray-400 transition-colors">
                        <FaChevronLeft className="text-sm"/>
                      </button>
                      <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                        <span className="text-purple-500">#{selectedLead.id}</span>
                        <span>{selectedLead.name}</span>
                        <span className="text-xs text-gray-500 border border-[#333] bg-[#222] px-2 py-0.5 rounded-full">{selectedLead.assigned_to}</span>
                      </h1>
                    </div>
                    <div className="flex gap-3">
                      {!showSalesForm && !showLoanForm && (
                        <>
                          <button onClick={() => { prefillSalesForm(); setShowSalesForm(true); setShowLoanForm(false); }}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-purple-600/20">
                            <FaFileInvoice/> Fill Salesform
                          </button>
                          <button onClick={() => { prefillLoanForm(); setShowLoanForm(true); setShowSalesForm(false); }}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-600/20">
                            <FaUniversity/> Track Loan
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-2" style={{minHeight:"500px"}}>
                    {/* LEFT PANEL */}
                    <div className="w-full lg:w-[45%] flex flex-col gap-4 h-full pb-2">

                      {showSalesForm ? (
                        <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-xl flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                          <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3">
                            <div><h3 className="text-lg font-bold text-white">Sales Data Form</h3><p className="text-xs text-purple-400 mt-0.5">Admin override — Lead #{selectedLead.id}</p></div>
                            <button type="button" onClick={() => setShowSalesForm(false)} className="text-gray-400 hover:text-white p-1"><FaTimes/></button>
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

                      ) : showLoanForm ? (
                        <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-xl flex-1 overflow-y-auto custom-scrollbar flex flex-col animate-fadeIn">
                          <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3 flex-shrink-0">
                            <div><h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><FaUniversity/> Loan Tracking Workflow</h3><p className="text-xs text-gray-400 mt-0.5">For Lead #{selectedLead.id}</p></div>
                            <button type="button" onClick={()=>setShowLoanForm(false)} className="text-gray-400 hover:text-white p-1"><FaTimes/></button>
                          </div>
                          <form onSubmit={handleLoanFormSubmit} className="flex flex-col gap-5 flex-1">
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
                                    <option value="Approved">Approved</option><option value="In Progress">In Progress</option><option value="Rejected">Rejected</option>
                                  </select>
                                  {loanForm.status && (
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

                      ) : (
                        <div className="flex flex-col h-full animate-fadeIn">
                          <div className="flex items-center gap-2 mb-4 bg-[#1a1a1a] border border-[#2a2a2a] p-1.5 rounded-xl flex-shrink-0">
                            <button onClick={()=>setDetailTab("personal")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab==="personal"?"bg-purple-600 text-white shadow-md":"text-gray-400 hover:text-white hover:bg-[#222]"}`}>Personal Information</button>
                            <button onClick={()=>setDetailTab("loan")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab==="loan"?"bg-blue-600 text-white shadow-md":"text-gray-400 hover:text-white hover:bg-[#222]"}`}>Loan Tracking</button>
                          </div>

                          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1a1a1a] border border-[#333] rounded-xl p-5 shadow-lg">
                            {detailTab==="personal" ? (
                              <div>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
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
                                  <div className="col-span-2 bg-[#222] p-4 rounded-xl border border-blue-900/20"><p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">📍 Site Visit Date</p><p className="text-lg font-black text-white">{selectedLead.mongoVisitDate?formatDate(selectedLead.mongoVisitDate):"Not Scheduled"}</p></div>
                                </div>
                                <div className="mt-6 bg-[#222] border border-[#333] rounded-xl p-4">
                                  <h3 className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-3 border-b border-[#333] pb-2">Channel Partner Data</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-xs text-gray-500 font-medium mb-1">Primary Source</p><p className="text-white font-medium text-sm">{selectedLead.source||"N/A"}</p></div>
                                    {selectedLead.source==="Others"&&(<div><p className="text-xs text-gray-500 font-medium mb-1">Specified Name</p><p className="text-white font-medium text-sm">{selectedLead.sourceOther}</p></div>)}
                                  </div>
                                  {selectedLead.source==="Channel Partner"&&(
                                    <div className="mt-4 pt-4 border-t border-[#333] grid grid-cols-1 sm:grid-cols-3 gap-4">
                                      <div><p className="text-xs text-gray-500 font-medium mb-1">CP Name</p><p className="text-white font-medium text-sm">{selectedLead.cpName||"N/A"}</p></div>
                                      <div><p className="text-xs text-gray-500 font-medium mb-1">CP Company</p><p className="text-white font-medium text-sm">{selectedLead.cpCompany||"N/A"}</p></div>
                                      <div><p className="text-xs text-gray-500 font-medium mb-1">CP Phone</p><p className="text-white font-medium text-sm">{selectedLead.cpPhone||"N/A"}</p></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                {(()=>{
                                  const curLoan: any = getLatestLoanDetails()||{};
                                  const sColor = getLoanStatusColor(curLoan?.status||"");
                                  const isHighProb = curLoan?.status?.toLowerCase()==="approved" && selectedLead.mongoVisitDate;
                                  return (
                                    <>
                                      <h3 className="text-sm font-bold text-blue-400 border-b border-[#333] pb-2 mb-6 uppercase flex items-center gap-2"><FaUniversity/> Deal Loan Overview</h3>
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
                    <div className="w-full lg:w-[55%] flex flex-col bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden shadow-2xl h-full min-h-0">
                      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-[#181818]">
                        <div className="flex justify-start">
                          <div className="bg-[#222] border border-[#333] rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-md">
                            <div className="flex justify-between items-center mb-2 gap-6"><span className="font-bold text-sm text-purple-400">System (Front Desk)</span><span className="text-[10px] text-gray-500">{formatDate(selectedLead.created_at)}</span></div>
                            <p className="text-sm text-gray-300 leading-relaxed">Lead assigned to {selectedLead.assigned_to}. Action required.</p>
                          </div>
                        </div>
                        {currentLeadFollowUps.map((msg: any, idx: number) => {
                          const isLoan = msg.message.includes("🏦 Loan Update");
                          const isSF   = msg.message.includes("📝 Detailed Salesform Submitted");
                          const isAdmin= msg.createdBy === "admin";
                          let bg = "bg-[#2a2135] border border-[#4c1d95]";
                          if (isLoan) bg = "bg-blue-900/20 border border-blue-600/40";
                          else if (isSF) bg = "bg-[#222] border border-[#444]";
                          else if (isAdmin) bg = "bg-purple-900/30 border border-purple-500/30";
                          return (
                            <div key={idx} className="flex justify-start">
                              <div className={`rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-lg ${bg}`}>
                                <div className="flex justify-between items-center mb-3 gap-6">
                                  <span className="font-bold text-sm text-white">{msg.createdBy==="admin"?`${msg.salesManagerName||"Admin"} (Admin)`:msg.salesManagerName}</span>
                                  <span className="text-[10px] text-gray-400">{formatDate(msg.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={followUpEndRef}/>
                      </div>
                      <form onSubmit={handleSendCustomNote} className="p-4 bg-[#1a1a1a] border-t border-[#333] flex gap-3 items-center flex-shrink-0">
                        <input type="text" value={customNote} onChange={e=>setCustomNote(e.target.value)} placeholder="Add admin note..." className="flex-1 bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors shadow-inner"/>
                        <button type="submit" className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-lg"><FaPaperPlane className="text-sm ml-[-2px]"/></button>
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
// RECEPTIONIST MODULE (unchanged)
// ============================================================================
function ReceptionistView({ receptionists, allLeads, isLoading, refetch }: any) {
  const [selectedReceptionist, setSelectedReceptionist] = useState<any>(null);
  const [searchRecep, setSearchRecep]   = useState("");
  const [subView, setSubView]           = useState<"cards"|"detail">("cards");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const filteredRecep  = receptionists.filter((r: any) => r.name?.toLowerCase().includes(searchRecep.toLowerCase()));
  const receptionistLeads = allLeads;

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-[#222] bg-[#111111] flex flex-col h-full flex-shrink-0 z-20 shadow-xl">
        <div className="p-5 border-b border-[#222]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"/>
            <input type="text" placeholder="Search Receptionists..." value={searchRecep} onChange={e=>setSearchRecep(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-pink-500 outline-none transition-colors"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? <div className="p-8 text-center text-gray-500 text-sm">Loading staff...</div>
          : filteredRecep.length === 0 ? <div className="p-8 text-center text-gray-500 text-sm">No receptionists found.</div>
          : filteredRecep.map((recep: any) => {
            const isSelected = selectedReceptionist?.id === recep.id;
            return (
              <div key={recep.id||recep.name||recep._id} onClick={() => { setSelectedReceptionist(recep); setSubView("cards"); }}
                className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-b border-[#1a1a1a] ${isSelected?"bg-[#1a1a1a] border-l-4 border-l-pink-500":"hover:bg-[#151515] border-l-4 border-l-transparent"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${isSelected?"bg-pink-600":"bg-[#333] text-gray-400"}`}>{recep.name?.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-gray-200 truncate text-sm">{recep.name}</h3>
                    <span className="text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full font-bold">{allLeads.length} logged</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate capitalize">{recep.role?.replace("_"," ")}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] relative">
        <div className="p-5 border-b border-[#222] bg-[#111111] flex justify-between items-center shadow-sm z-10 flex-shrink-0 gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><FaClipboardList className="text-pink-500"/>
              {selectedReceptionist ? `${selectedReceptionist.name}'s Logged Enquiries` : "Select a Receptionist"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Review walk-in forms registered by this desk.</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {!selectedReceptionist ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600"><FaClipboardList className="text-4xl mb-4 opacity-20"/><p>Select a receptionist from the left to view their logged data.</p></div>
          ) : subView === "cards" ? (
            <div className="animate-fadeIn grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
              {receptionistLeads.length === 0 ? <p className="text-gray-500 text-sm">No forms logged yet.</p>
              : receptionistLeads.map((lead: any) => {
                const statusColors: any = {
                  "Completed": { text:"text-green-500",border:"border-green-500/30",bg:"bg-green-500/10" },
                  "Visit Scheduled": { text:"text-yellow-500",border:"border-yellow-500/30",bg:"bg-yellow-500/10" },
                  "Routed": { text:"text-blue-400",border:"border-blue-500/30",bg:"bg-blue-500/10" }
                };
                const leadStatus = lead.status || "Routed";
                const colorSet = statusColors[leadStatus] || statusColors["Routed"];
                return (
                  <div key={lead.id} onClick={() => { setSelectedLead(lead); setSubView("detail"); }}
                    className="bg-[#111] border border-[#222] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-pink-500/50 transition-colors cursor-pointer">
                    <div>
                      <div className="flex justify-between items-start mb-5 pb-4 border-b border-[#222]">
                        <h3 className="text-lg font-bold text-white line-clamp-1 pr-2"><span className="mr-2 text-purple-500">#{lead.id}</span>{lead.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colorSet.border} ${colorSet.text} ${colorSet.bg}`}>{leadStatus}</span>
                      </div>
                      <div className="space-y-4 mb-6">
                        <div><p className="text-xs text-gray-500 font-medium">Estimated Budget</p><p className="text-sm font-semibold text-white">{lead.salesBudget||lead.budget||"N/A"}</p></div>
                        <div className="bg-[#151515] p-3 rounded-lg border border-[#222] flex flex-col gap-2">
                          <p className="text-xs text-gray-400 flex items-center gap-2"><FaPhoneAlt className="text-gray-500 w-3 h-3"/> Primary: <span className="font-mono text-gray-200">{maskPhone(lead.phone)}</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[#222] flex justify-between items-center text-sm mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 text-white flex items-center justify-center text-[10px] font-bold">{String(lead.assigned_to||"U").charAt(0).toUpperCase()}</div>
                        <p className="text-xs text-gray-400">Assigned: <span className="font-semibold text-white">{lead.assigned_to||"Unassigned"}</span></p>
                      </div>
                      <p className="text-[10px] text-gray-600">{formatDate(lead.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : subView === "detail" && selectedLead && (
            <div className="animate-fadeIn max-w-[1200px] mx-auto">
              <div className="flex items-center gap-4 mb-6 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-5 shadow-xl">
                <button onClick={() => setSubView("cards")} className="w-10 h-10 flex items-center justify-center bg-[#222] hover:bg-[#333] border border-[#444] rounded-lg text-gray-400 transition-colors cursor-pointer"><FaChevronLeft className="text-sm"/></button>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-3"><span className="text-pink-500">#{selectedLead.id}</span><span>{selectedLead.name}</span><span className="text-xs font-normal border border-[#333] bg-[#222] px-2 py-0.5 rounded-full">{selectedLead.status}</span></h1>
                  <p className="text-xs mt-1 text-gray-500">Logged by: {selectedReceptionist.name} on {formatDate(selectedLead.created_at)}</p>
                </div>
              </div>
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-8 shadow-xl">
                <h3 className="text-sm font-bold text-gray-400 border-b border-[#2a2a2a] pb-2 mb-6 uppercase tracking-widest">Lead Captured Data</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6">
                  <div><p className="text-xs text-gray-500 mb-1">Email</p><p className="text-white font-medium">{selectedLead.email!=="N/A"?selectedLead.email:"N/A"}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Phone</p><p className="font-mono text-white font-medium">{selectedLead.phone}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Alt Phone</p><p className="font-mono text-white font-medium">{selectedLead.alt_phone&&selectedLead.alt_phone!=="N/A"?selectedLead.alt_phone:"Not Provided"}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Occupation</p><p className="text-white font-medium">{selectedLead.occupation||"N/A"}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-500 mb-1">Organization / Address</p><p className="text-white font-medium">{selectedLead.organization} / {selectedLead.address}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Budget</p><p className="text-green-400 font-bold">{selectedLead.budget||"N/A"}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Configuration</p><p className="text-white font-medium">{selectedLead.configuration||"N/A"}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Purpose</p><p className="text-white font-medium">{selectedLead.purpose||"N/A"}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Source</p><p className="text-white font-medium">{selectedLead.source||"N/A"}</p></div>
                  <div className="col-span-2"><p className="text-xs text-pink-500 mb-1 font-bold">Assigned Sales Manager</p><p className="text-white font-bold">{selectedLead.assigned_to||"N/A"}</p></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}