"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaThLarge, FaClipboardList, FaUsers, FaIdCard, FaCog, 
  FaSearch, FaBell, FaChevronLeft, FaPhoneAlt, FaComments,
  FaCheckCircle, FaCalendarAlt, FaTimes, FaPlus, FaPen, 
  FaFileInvoice, FaPaperPlane, FaMicrophone, FaWhatsapp, FaTable, FaChartPie, FaUserCircle,
  FaEye, FaEyeSlash
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie, Legend } from "recharts";

// ============================================================================
// SHARED REAL-TIME DATA HOOK (Polls every 5 seconds)
// ============================================================================
function useAdminData() {
  const [managers, setManagers] = useState<any[]>([]);
  const [receptionists, setReceptionists] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      // 1. Fetch Sales Managers
      let smData = [];
      const resUsers = await fetch("/api/users?role=sales_manager");
      if (resUsers.ok) {
        const json = await resUsers.json();
        smData = json.data || json;
      } else {
        const resUsersAlt = await fetch("/api/users/sales-manager");
        if (resUsersAlt.ok) {
          const json = await resUsersAlt.json();
          smData = json.data || [];
        }
      }

      // 2. Fetch Receptionists
      let recData = [];
      const resRec = await fetch("/api/users/receptionist");
      if (resRec.ok) {
        const json = await resRec.json();
        recData = json.data || json;
      } else {
        const resRecAlt = await fetch("/api/users?role=receptionist");
        if (resRecAlt.ok) {
          const json = await resRecAlt.json();
          recData = json.data || [];
        }
      }

      // 3. Fetch Leads
      let pgLeads = [];
      const resLeads = await fetch("/api/walkin_enquiries");
      if (resLeads.ok) {
        const json = await resLeads.json();
        pgLeads = Array.isArray(json.data) ? json.data : [];
      }

      // 4. Fetch Followups
      let mongoFollowUps = [];
      const resFups = await fetch("/api/followups");
      if (resFups.ok) {
        const json = await resFups.json();
        mongoFollowUps = Array.isArray(json.data) ? json.data : [];
      }

      // 5. Merge Data logic
      const mergedLeads = pgLeads.map((lead: any) => {
        const leadFups = mongoFollowUps.filter((f: any) => String(f.leadId) === String(lead.id));
        const salesForms = leadFups.filter((f: any) => f.message && f.message.includes("Detailed Salesform Submitted"));
        const latestFormMsg = salesForms.length > 0 ? salesForms[salesForms.length - 1].message : "";
        
        const extractField = (fieldName: string) => {
          if (!latestFormMsg) return "Pending";
          const regex = new RegExp(`• ${fieldName}: (.*)`);
          const match = latestFormMsg.match(regex);
          return match ? match[1].trim() : "Pending";
        };

        const fupsWithDate = leadFups.filter((f: any) => f.siteVisitDate && f.siteVisitDate.trim() !== "");
        const latestVisitDate = fupsWithDate.length > 0 ? fupsWithDate[fupsWithDate.length - 1].siteVisitDate : null;
        const activeBudget = extractField("Budget") !== "Pending" ? extractField("Budget") : lead.budget;

        return {
          ...lead,
          propType: extractField("Property Type"),
          salesBudget: activeBudget,
          useType: extractField("Use Type") !== "Pending" ? extractField("Use Type") : (lead.purpose || "Pending"),
          planningPurchase: extractField("Planning to Purchase"),
          decisionMaker: extractField("Decision Maker"),
          loanPlanned: extractField("Loan Planned"),
          mongoVisitDate: latestVisitDate,
          status: lead.status === "Completed" ? "Completed" : (latestVisitDate ? "Visit Scheduled" : lead.status)
        };
      });

      setManagers(smData);
      setReceptionists(recData);
      setAllLeads(mergedLeads);
      setFollowUps(mongoFollowUps);
      setIsLoading(false);
    } catch (e) {
      console.error("Admin data sync failed", e);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 5000);
    return () => clearInterval(interval);
  }, []);

  return { managers, receptionists, allLeads, followUps, isLoading, refetch: fetchAdminData };
}

// ============================================================================
// MAIN LAYOUT SHELL
// ============================================================================
export default function AdminAtlasDashboard() {
  const router = useRouter();
  const [activeView, setActiveView] = useState("dashboard"); 
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [user, setUser] = useState<any>({ name: "Admin", role: "Admin", email: "", password: "" });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { managers, receptionists, allLeads, followUps, isLoading, refetch } = useAdminData();

  useEffect(() => {
    // 1. Load User
    const storedUser = localStorage.getItem("crm_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // 🔥 SAFELY FETCH PASSWORD FROM MONGODB
      const fetchLivePassword = async () => {
        try {
          const res = await fetch("/api/employees");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              const liveUser = data.find((u: any) => u.email === parsedUser.email);
              if (liveUser && liveUser.password) {
                setUser((prev: any) => ({ ...prev, password: liveUser.password }));
              }
            }
          }
        } catch (err) {
          console.error("Could not load live password", err);
        }
      };
      fetchLivePassword();
    }

    // 2. Tab Routing Check
    const returnTab = localStorage.getItem("return_tab");
    if (returnTab) {
      setActiveView(returnTab); 
      localStorage.removeItem("return_tab"); 
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("crm_user");
    router.push("/");
  };

  const menuItems = [
    { id: "dashboard", icon: FaThLarge, label: "Overview" },
    { id: "receptionist", icon: FaClipboardList, label: "Receptionist" },
    { id: "sales", icon: FaUsers, label: "Sales Managers" },
    { id: "employees", icon: FaIdCard, label: "Add Employee" },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-200 font-sans overflow-hidden relative">
      
      {/* Dim Overlay */}
      <AnimatePresence>
        {isSidebarHovered && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 pointer-events-none backdrop-blur-[1px]"
          />
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
            <div
              key={item.id}
              onClick={() => { 
                if (item.id === "employees") {
                  router.push("/dashboard/employees"); // Route to the actual employee page
                } else {
                  setActiveView(item.id); 
                  setIsSidebarHovered(false); 
                }
              }}
              className={`flex items-center px-3 py-3.5 rounded-xl cursor-pointer transition-colors whitespace-nowrap relative group
                ${activeView === item.id && item.id !== "employees" ? "bg-purple-500/10 text-purple-400" : "text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-300"}
              `}
            >
              {activeView === item.id && item.id !== "employees" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full" />}
              <item.icon className="w-5 h-5 min-w-[20px] ml-1" />
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: isSidebarHovered ? 1 : 0 }} className={`ml-5 font-semibold text-sm ${activeView === item.id && item.id !== "employees" ? "text-purple-300" : ""}`}>
                {item.label}
              </motion.span>
            </div>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col pl-[80px] h-screen overflow-hidden">
        <header className="h-16 bg-[#111111]/80 backdrop-blur-md border-b border-[#222] flex items-center justify-between px-8 z-30">
          <h1 className="text-white font-bold text-lg capitalize tracking-wide flex items-center gap-3">
            {activeView.replace("_", " ")} 
            <span className="bg-[#222] text-gray-400 px-2 py-0.5 rounded text-xs border border-[#333]">Admin Root</span>
          </h1>
          <div className="flex items-center gap-6">
            <FaBell className="text-gray-500 hover:text-white cursor-pointer" />
            
            {/* Interactive Profile Dropdown */}
            <div className="relative">
              <div 
                onClick={() => setIsProfileOpen(!isProfileOpen)} 
                className="w-9 h-9 rounded-full bg-purple-900/30 text-purple-400 border border-purple-500/50 flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm hover:bg-purple-900/50 transition-colors"
              >
                {String(user?.name || "A").charAt(0).toUpperCase()}
              </div>

              {isProfileOpen && (
                <div className="absolute top-12 right-0 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-5 z-50 animate-fadeIn">
                  <div className="mb-4">
                    <h3 className="text-white font-bold text-lg">{user?.name || "Admin"}</h3>
                    <p className="text-gray-400 text-sm truncate">{user?.email || "admin@bhoomi.com"}</p>
                  </div>
                  <hr className="border-[#2a2a2a] mb-4" />
                  <div className="space-y-4 mb-6 text-sm">
                    <p className="text-gray-400 flex justify-between items-center">
                      Role: <span className="text-purple-400 font-bold capitalize bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">{user?.role || "Admin"}</span>
                    </p>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Password</p>
                      <div className="flex items-center justify-between bg-[#121212] border border-[#2a2a2a] p-2 rounded-md">
                        {/* 🔥 Display the fetched password here */}
                        <span className="font-mono text-gray-300 tracking-widest text-xs">
                          {showPassword ? (user?.password || "N/A") : "••••••••"}
                        </span>
                        <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-purple-400 cursor-pointer">
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
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

        <main className="flex-1 overflow-hidden bg-[#0a0a0a]">
          {activeView === "dashboard" && <DashboardOverview managers={managers} allLeads={allLeads} isLoading={isLoading} user={user} />}
          {activeView === "sales" && <SalesManagerView managers={managers} allLeads={allLeads} followUps={followUps} isLoading={isLoading} adminUser={user} refetch={refetch} />}
          {activeView === "receptionist" && <ReceptionistView receptionists={receptionists} allLeads={allLeads} managers={managers} isLoading={isLoading} refetch={refetch} />}
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD OVERVIEW MODULE
// ============================================================================
function DashboardOverview({ managers, allLeads, isLoading, user }: { managers: any[], allLeads: any[], isLoading: boolean, user: any }) {
  const [selectedManagerName, setSelectedManagerName] = useState("");
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const managerStats = managers.map((m: any) => {
    const mLeads = allLeads.filter((l: any) => l.assigned_to === m.name);
    const activeLeads = mLeads.filter((l: any) => l.status !== "Completed").length;
    const siteVisits = mLeads.filter((l: any) => l.status === "Visit Scheduled" || !!l.mongoVisitDate).length;
    return { name: m.name, activeLeads, siteVisits };
  }).sort((a, b) => b.activeLeads - a.activeLeads);

  useEffect(() => {
    if (!hasAutoSelected && managerStats.length > 0 && !isLoading) {
      setSelectedManagerName(managerStats[0].name);
      setHasAutoSelected(true);
    }
  }, [managerStats, isLoading, hasAutoSelected]);

  const activeManagerLeads = allLeads.filter((l: any) => l.assigned_to === selectedManagerName);
  const completedCount = activeManagerLeads.filter((l: any) => l.status === "Completed").length;
  const visitCount = activeManagerLeads.filter((l: any) => l.status === "Visit Scheduled" || !!l.mongoVisitDate).length;

  const pieData = managerStats.filter(m => m.siteVisits > 0);
  const PIE_COLORS = ['#d946ef', '#8b5cf6', '#3b82f6', '#0ea5e9', '#10b981', '#f59e0b'];

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
    {/* Greetings Section */}
      <div className="bg-[#111111] border border-[#222] rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
         
          Welcome back, {user?.name || "Admin"}!
        </h2>
        <p className="text-sm text-gray-400">
          Here is what's happening with your team today.
        </p>
      </div>
      {/* TOP GRAPHS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        <div className="lg:col-span-2 bg-[#111111] border border-[#222] rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <FaChartPie className="text-purple-500" /> Top Performers (Active Leads)
          </h2>
          <p className="text-xs text-gray-500 mb-6">Sales managers ranked by their Performance.</p>
          <div className="flex-1 min-h-[280px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading metrics...</div>
            ) : managerStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No active data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={managerStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", color: "#fff" }} />
                  <Bar dataKey="activeLeads" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={45}>
                    {managerStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#d946ef" : "#8b5cf6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-[#111111] border border-[#222] rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-white mb-1 self-start flex items-center gap-2">
            <FaCalendarAlt className="text-orange-500" /> Site Visits Scheduled
          </h2>
          <p className="text-xs text-gray-500 mb-6 self-start">Total upcoming visits grouped by manager.</p>
          <div className="flex-1 w-full min-h-[280px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading metrics...</div>
            ) : pieData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-sm text-gray-500">
                <FaCalendarAlt className="text-3xl mb-3 opacity-20" />
                No site visits currently scheduled
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    dataKey="siteVisits" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={85} 
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={true}
                    style={{ fontSize: '11px', fill: '#ccc' }}
                  >
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", color: "#fff" }} itemStyle={{ color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* TEAM PERFORMANCE TABLE SECTION */}
      <div className="bg-[#111111] border border-[#222] rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaTable className="text-purple-500"/> Team Performance Table</h2>
          <p className="text-sm text-gray-500 mt-1">Select a sales manager to pull their real-time tabular data.</p>
        </div>
        <div className="w-full sm:w-72 relative">
          <FaChevronLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs z-10" />
          <select
            value={selectedManagerName}
            onChange={(e) => setSelectedManagerName(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] text-white text-sm font-bold rounded-xl pl-9 pr-4 py-3 outline-none focus:border-purple-500 cursor-pointer shadow-sm appearance-none relative"
          >
            <option value="" disabled>-- Select Sales Manager --</option>
            {managers.map((m: any) => (
              <option key={m.id || m._id || m.name} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedManagerName ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-[#222] rounded-2xl min-h-[300px]">
          <FaTable className="text-4xl mb-4 opacity-20" />
          <p>Please select a manager from the dropdown above to view their table.</p>
        </div>
      ) : (
        <div className="animate-fadeIn space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#111] border border-[#222] rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Assigned</p>
              <p className="text-3xl font-black text-white">{activeManagerLeads.length}</p>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Active Pipeline</p>
              <p className="text-3xl font-black text-blue-400">{activeManagerLeads.length - completedCount}</p>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Site Visits</p>
              <p className="text-3xl font-black text-orange-400">{visitCount}</p>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Completed</p>
              <p className="text-3xl font-black text-green-500">{completedCount}</p>
            </div>
          </div>

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
                    <th className="px-4 py-4">USE TYPE</th><th className="px-4 py-4">PLAN TO BUY?</th>
                    <th className="px-4 py-4">DECISION MAKER?</th><th className="px-4 py-4">LOAN?</th>
                    <th className="px-6 py-4">SITE VISIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {isLoading ? (
                    <tr><td colSpan={9} className="text-center py-8">Syncing database...</td></tr>
                  ) : activeManagerLeads.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8">No leads found for {selectedManagerName}.</td></tr>
                  ) : activeManagerLeads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-[#222] transition-colors">
                      <td className="px-6 py-4 font-bold text-purple-400">#{lead.id}</td>
                      <td className="px-4 py-4 text-white font-medium">{lead.name}</td>
                      <td className="px-4 py-4 text-gray-200">{lead.propType || "Pending"}</td>
                      <td className="px-4 py-4 text-green-400 font-semibold">{lead.salesBudget}</td>
                      <td className="px-4 py-4">{lead.useType || "Pending"}</td>
                      <td className="px-4 py-4">{lead.planningPurchase || "Pending"}</td>
                      <td className="px-4 py-4">{lead.decisionMaker || "Pending"}</td>
                      <td className="px-4 py-4">{lead.loanPlanned || "Pending"}</td>
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
// SALES MANAGER MODULE
// ============================================================================
function SalesManagerView({ managers, allLeads, followUps, isLoading, adminUser, refetch }: any) {
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [subView, setSubView] = useState<"cards" | "detail">("cards"); 
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchManager, setSearchManager] = useState("");

  const [showSalesForm, setShowSalesForm] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [salesForm, setSalesForm] = useState({
    propertyType: "", location: "", budget: "", useType: "", purchaseDate: "", decisionMaker: "", loan: "", siteVisit: ""
  });
  
  const followUpEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedLead) {
      const updated = allLeads.find((l: any) => String(l.id) === String(selectedLead.id));
      if (updated) setSelectedLead(updated);
    }
  }, [allLeads]);

  const filteredManagers = managers.filter((m: any) => m.name?.toLowerCase().includes(searchManager.toLowerCase()));
  const activeManagerLeads = allLeads.filter((l: any) => l.assigned_to === selectedManager?.name);
  const currentLeadFollowUps = followUps.filter((f: any) => String(f.leadId) === String(selectedLead?.id));

  const handleSendCustomNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customNote.trim() || !selectedLead) return;
    const newMsg = {
      leadId: String(selectedLead.id), 
      salesManagerName: adminUser.name,
      createdBy: "admin", 
      message: customNote, 
      siteVisitDate: null, 
      createdAt: new Date().toISOString()
    };
    
    setCustomNote("");
    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMsg) });
      refetch();
    } catch (e) { console.log(e); }
  };

  const handleSalesFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;

    const messageContent = "📝 Detailed Salesform Submitted:\n" +
      "• Property Type: " + (salesForm.propertyType || 'N/A') + "\n" +
      "• Location: " + (salesForm.location || 'N/A') + "\n" +
      "• Budget: " + (salesForm.budget || 'N/A') + "\n" +
      "• Use Type: " + (salesForm.useType || 'N/A') + "\n" +
      "• Planning to Purchase: " + (salesForm.purchaseDate || 'N/A') + "\n" +
      "• Decision Maker: " + (salesForm.decisionMaker || 'N/A') + "\n" +
      "• Loan Planned: " + (salesForm.loan || 'N/A') + "\n" +
      "• Site Visit Requested: " + (salesForm.siteVisit ? formatDate(salesForm.siteVisit) : 'No');

    const newMsg = {
      leadId: String(selectedLead.id),
      salesManagerName: adminUser.name,
      createdBy: "admin",
      message: messageContent,
      siteVisitDate: salesForm.siteVisit || null,
      createdAt: new Date().toISOString()
    };

    const newStatus = salesForm.siteVisit ? 'Visit Scheduled' : selectedLead.status;

    setShowSalesForm(false);
    setSalesForm({ propertyType: "", location: "", budget: "", useType: "", purchaseDate: "", decisionMaker: "", loan: "", siteVisit: "" });

    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMsg) });
      await fetch(`/api/walkin_enquiries/${selectedLead.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedLead.name, status: newStatus })
      });
      refetch();
    } catch (e) { console.log(e); }
  };

  const handleMarkCompleted = async (leadToComplete: any) => {
    if (!leadToComplete) return;
    const leadId = leadToComplete.id;
    const newMsg = {
      leadId: String(leadId),
      salesManagerName: adminUser.name,
      createdBy: "admin",
      message: "✅ Lead marked as COMPLETED by Admin.",
      siteVisitDate: null,
      createdAt: new Date().toISOString()
    };

    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMsg) });
      await fetch(`/api/walkin_enquiries/${leadId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" })
      });
      refetch();
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    if (subView === "detail") followUpEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [followUps, subView, selectedLead]);

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-[#222] bg-[#111111] flex flex-col h-full flex-shrink-0 z-20 shadow-xl">
        <div className="p-5 border-b border-[#222]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
            <input 
              type="text" placeholder="Search Managers..." value={searchManager} onChange={e => setSearchManager(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-purple-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
             <div className="p-8 text-center text-gray-500 text-sm">Loading managers...</div>
          ) : filteredManagers.length === 0 ? (
             <div className="p-8 text-center text-gray-500 text-sm">No managers found.</div>
          ) : (
            filteredManagers.map((manager: any) => {
              const isSelected = selectedManager?.id === manager.id;
              const count = allLeads.filter((l: any) => l.assigned_to === manager.name).length;
              return (
                <div 
                  key={manager.id || manager._id || manager.name}
                  onClick={() => { setSelectedManager(manager); setSubView("cards"); setSelectedLead(null); }}
                  className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-b border-[#1a1a1a]
                    ${isSelected ? "bg-[#1a1a1a] border-l-4 border-l-purple-500" : "hover:bg-[#151515] border-l-4 border-l-transparent"}
                  `}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0
                    ${isSelected ? "bg-purple-600" : "bg-[#333] text-gray-400"}
                  `}>
                    {manager.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-gray-200 truncate text-sm">{manager.name}</h3>
                      <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-bold">{count} leads</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate capitalize">{manager.role?.replace("_", " ")}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] relative">
        <div className="p-5 border-b border-[#222] bg-[#111111] flex justify-between items-center shadow-sm z-10 flex-shrink-0 gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FaUsers className="text-purple-500"/>
              {selectedManager ? `${selectedManager.name}'s Leads` : "Select a Manager"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Manage and track cards dynamically.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#121212]">
          {!selectedManager ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <FaIdCard className="text-4xl mb-4 opacity-20" />
              <p>Select a sales manager from the left sidebar to view their cards.</p>
            </div>
          ) : (
            <div className="p-6 h-full">
              {subView === "cards" && (
                <div className="animate-fadeIn grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {activeManagerLeads.length === 0 ? (
                    <p className="text-gray-500 text-sm col-span-full">No leads assigned yet.</p>
                  ) : activeManagerLeads.map((lead: any) => {
                    const isCompleted = lead.status === "Completed";
                    return (
                      <div
                        key={lead.id}
                        className={`rounded-2xl p-6 border shadow-sm transition-all group flex flex-col justify-between cursor-pointer
                          ${isCompleted ? "bg-green-900/20 border-green-700/40 hover:border-green-500/60" : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-purple-500/50"}
                        `}
                        onClick={() => { setSelectedLead(lead); setSubView("detail"); }}
                      >
                        <div>
                          <div className={`flex justify-between items-start mb-5 pb-4 border-b ${isCompleted ? "border-green-800/40" : "border-[#2a2a2a]"}`}>
                            <h3 className={`text-lg font-bold transition-colors line-clamp-1 pr-2 ${isCompleted ? "text-green-300" : "text-white group-hover:text-purple-400"}`}>
                              <span className={`mr-2 ${isCompleted ? "text-green-500" : "text-purple-500"}`}>#{lead.id}</span>
                              {lead.name}
                            </h3>
                            {isCompleted ? (
                              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-500/50 text-green-400 bg-green-500/15 flex-shrink-0">
                                <FaCheckCircle /> Completed
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-500/30 text-blue-400 bg-blue-500/10 flex-shrink-0">
                                {lead.status || 'ROUTED'}
                              </span>
                            )}
                          </div>

                          <div className="space-y-3 mb-5">
                            <div><p className="text-xs text-gray-400 font-medium">Budget</p><p className="text-sm font-semibold text-green-400">{lead.salesBudget}</p></div>
                            <div><p className="text-xs text-gray-400 font-medium">Property</p><p className={`text-sm font-medium ${isCompleted ? "text-green-200" : "text-white"}`}>{lead.propType || "Pending"}</p></div>
                            <div className={`p-3 rounded-lg border flex flex-col gap-1.5 ${isCompleted ? "bg-green-900/10 border-green-800/30" : "bg-[#222] border-[#2a2a2a]"}`}>
                              <p className="text-xs text-gray-400 flex items-center gap-2"><FaPhoneAlt className="text-gray-500 w-3 h-3" /> Pri: <span className="font-mono text-gray-200">{maskPhone(lead.phone)}</span></p>
                              {lead.alt_phone && lead.alt_phone !== "N/A" && (
                                <p className="text-xs text-gray-500 flex items-center gap-2"><FaPhoneAlt className="text-gray-600 w-3 h-3" /> Alt: <span className="font-mono text-gray-400">{maskPhone(lead.alt_phone)}</span></p>
                              )}
                            </div>
                            {lead.mongoVisitDate && (
                              <div className={`flex items-center gap-1.5 text-xs font-semibold ${isCompleted ? "text-green-400/80" : "text-orange-400"}`}>
                                <FaCalendarAlt className="text-[10px]" /> {formatDate(lead.mongoVisitDate).split(",")[0]}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`pt-4 border-t mt-auto ${isCompleted ? "border-green-800/30" : "border-[#2a2a2a]"}`}>
                          {isCompleted ? (
                             <div className="text-xs text-green-500/70 font-bold text-center">Lead Completed</div>
                          ) : (
                            <div className="flex justify-between items-center gap-2">
                              <p className="text-gray-500 text-[10px]">{formatDate(lead.created_at).split(",")[0]}</p>
                              <button onClick={(e) => { e.stopPropagation(); handleMarkCompleted(lead); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 border border-green-500/50 hover:bg-green-600 hover:text-white text-green-400 text-xs font-bold rounded-lg transition-colors z-10 relative">
                                <FaCheckCircle /> Complete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {subView === "detail" && selectedLead && (
                <div className="animate-fadeIn max-w-[1200px] mx-auto flex flex-col h-full">
                  <div className={`flex items-center justify-between mb-4 rounded-2xl border p-4 sm:p-5 shadow-xl flex-shrink-0 transition-colors ${selectedLead.status === "Completed" ? "bg-green-900/15 border-green-700/40" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSubView("cards")} className="w-10 h-10 flex items-center justify-center bg-[#222] hover:bg-[#333] border border-[#444] rounded-lg text-gray-400 transition-colors cursor-pointer">
                        <FaChevronLeft className="text-sm" />
                      </button>
                      <h1 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className={selectedLead.status === "Completed" ? "text-green-500" : "text-purple-500"}>#{selectedLead.id}</span>
                        <span>{selectedLead.name}</span>
                        {selectedLead.status === "Completed" && <span className="text-xs font-normal text-green-400 border border-green-600/40 bg-green-900/20 px-2 py-0.5 rounded-full">Completed</span>}
                      </h1>
                    </div>
                    <div className="flex gap-3">
                      {!showSalesForm && selectedLead.status !== "Completed" && (
                        <button onClick={() => setShowSalesForm(true)} className="border border-blue-900/50 hover:bg-blue-900/20 text-blue-400 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-md">
                          <FaFileInvoice /> + Salesform (Admin Override)
                        </button>
                      )}
                      {selectedLead.status !== "Completed" && (
                        <button onClick={() => handleMarkCompleted(selectedLead)} className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-md">
                          <FaCheckCircle /> Mark Complete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-2">
                    <div className="w-full lg:w-[45%] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 h-full pb-2">
                      {showSalesForm ? (
                        <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm flex-1 flex flex-col min-h-max">
                          <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3">
                            <div><h3 className="text-lg font-bold text-white">Fill Detail Capturing Salesform</h3><p className="text-xs text-blue-400 mt-0.5">Admin Override for Lead #{selectedLead.id}</p></div>
                            <button type="button" onClick={() => setShowSalesForm(false)} className="text-gray-400 hover:text-white transition-colors cursor-pointer"><FaTimes /></button>
                          </div>
                          <form onSubmit={handleSalesFormSubmit} className="flex flex-col gap-3 flex-1">
                            <div><label className="text-xs text-gray-400 mb-1 block">Property Type?</label>
                              <input type="text" placeholder="e.g. 1BHK" value={salesForm.propertyType} onChange={e => setSalesForm({ ...salesForm, propertyType: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                            </div>
                            <div><label className="text-xs text-gray-400 mb-1 block">Budget?</label>
                              <input type="text" placeholder="e.g. 5 cr" value={salesForm.budget} onChange={e => setSalesForm({ ...salesForm, budget: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div><label className="text-xs text-gray-400 mb-1 block">Self-use / Inv?</label>
                                <select value={salesForm.useType} onChange={e => setSalesForm({ ...salesForm, useType: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white outline-none cursor-pointer">
                                  <option value="">Select</option><option value="Self Use">Self Use</option><option value="Investment">Investment</option>
                                </select>
                              </div>
                              <div><label className="text-xs text-gray-400 mb-1 block">Plan to buy?</label>
                                <select value={salesForm.purchaseDate} onChange={e => setSalesForm({ ...salesForm, purchaseDate: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white outline-none cursor-pointer">
                                  <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div><label className="text-xs text-gray-400 mb-1 block">Decision Maker?</label>
                                <select value={salesForm.decisionMaker} onChange={e => setSalesForm({ ...salesForm, decisionMaker: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white outline-none cursor-pointer">
                                  <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option>
                                </select>
                              </div>
                              <div><label className="text-xs text-gray-400 mb-1 block">Loan?</label>
                                <select value={salesForm.loan} onChange={e => setSalesForm({ ...salesForm, loan: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white outline-none cursor-pointer">
                                  <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option>
                                </select>
                              </div>
                            </div>
                            <div><label className="text-xs text-gray-400 mb-1 block text-purple-400 font-bold">Schedule site visit?</label>
                              <input type="datetime-local" value={salesForm.siteVisit} onChange={e => setSalesForm({ ...salesForm, siteVisit: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white outline-none cursor-pointer" />
                            </div>
                            <button type="submit" className="mt-auto w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors cursor-pointer">Submit Override Form</button>
                          </form>
                        </div>
                      ) : (
                        <>
                          <div className={`rounded-xl border p-5 shadow-sm flex-1 ${selectedLead.status === "Completed" ? "bg-green-900/10 border-green-700/30" : "bg-[#1a1a1a] border-[#333]"}`}>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                              <div><p className="text-xs text-gray-500 font-medium mb-1">✉ Email</p><p className="text-white font-semibold text-sm">{selectedLead.email !== "N/A" ? selectedLead.email : "N/A"}</p></div>
                              <div><p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><FaPhoneAlt className="text-[10px]" /> Phone</p><p className="font-mono text-white font-semibold text-sm">{selectedLead.phone}</p></div>
                              <div className="col-span-2"><p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><FaPhoneAlt className="text-[10px] text-gray-600" /> Alt Phone</p><p className="font-mono text-white font-semibold text-sm">{selectedLead.alt_phone && selectedLead.alt_phone !== "N/A" ? selectedLead.alt_phone : "Not Provided"}</p></div>
                              <div><p className="text-xs text-gray-500 font-medium mb-1">Property Type</p><p className="text-white font-semibold text-sm">{selectedLead.propType || "Pending"}</p></div>
                              <div><p className="text-xs text-gray-500 font-medium mb-1">Budget</p><p className="text-green-400 font-bold text-sm">{selectedLead.salesBudget !== "Pending" ? selectedLead.salesBudget : selectedLead.budget}</p></div>
                              <div><p className="text-xs text-gray-500 font-medium mb-1">Type of Use</p><p className="text-white font-semibold text-sm">{selectedLead.useType !== "Pending" ? selectedLead.useType : (selectedLead.purpose || "N/A")}</p></div>
                              <div><p className="text-xs text-gray-500 font-medium mb-1">Planning to Buy?</p><p className="text-white font-semibold text-sm">{selectedLead.planningPurchase || "Pending"}</p></div>
                              <div><p className="text-xs text-gray-500 font-medium mb-1">Decision Maker?</p><p className="text-white font-semibold text-sm">{selectedLead.decisionMaker || "Pending"}</p></div>
                              <div><p className="text-xs text-gray-500 font-medium mb-1">Loan Planned?</p><p className="text-white font-semibold text-sm">{selectedLead.loanPlanned || "Pending"}</p></div>
                              <div className="col-span-2"><p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">📍 Site Visit</p><p className="text-blue-400 font-semibold text-sm">{selectedLead.mongoVisitDate ? formatDate(selectedLead.mongoVisitDate) : "Pending"}</p></div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 flex-shrink-0 mt-auto pt-2">
                            <button className="bg-[#1e293b] border border-[#3b82f6] hover:bg-[#1e3a8a] text-blue-400 hover:text-white flex flex-col items-center justify-center py-3 rounded-xl transition-colors cursor-pointer gap-2">
                              <FaMicrophone className="text-xl" /><span className="font-bold text-sm">Browser Call</span>
                            </button>
                            <button className="bg-[#064e3b]/30 border border-[#10b981] hover:bg-[#065f46] text-green-500 hover:text-white flex flex-col items-center justify-center py-3 rounded-xl transition-colors cursor-pointer gap-2">
                              <FaWhatsapp className="text-2xl" /><span className="font-bold text-sm">Send WhatsApp</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="w-full lg:w-[55%] flex flex-col bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden shadow-lg h-full min-h-0">
                      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-[#181818]">
                        <div className="flex justify-start">
                          <div className="bg-[#222] border border-[#333] rounded-2xl rounded-tl-none p-4 max-w-[85%]">
                            <div className="flex justify-between items-center mb-2 gap-6">
                              <span className="font-bold text-sm text-gray-400">System (Front Desk)</span>
                              <span className="text-[10px] text-gray-500">{formatDate(selectedLead.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-300">Lead assigned to {selectedLead.assigned_to}. Action required.</p>
                          </div>
                        </div>
                        
                        {currentLeadFollowUps.map((msg: any, idx: number) => {
                          const isAdmin = msg.createdBy === 'admin';
                          return (
                            <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <div className={`rounded-2xl p-4 max-w-[85%] shadow-md ${isAdmin ? 'bg-purple-900/30 border border-purple-500/30 rounded-tr-none' : 'bg-[#2a2135] border border-[#4c1d95] rounded-tl-none'}`}>
                                <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                <div className="flex justify-between items-center mt-3 gap-6">
                                  <span className={`font-bold text-[10px] ${isAdmin ? 'text-purple-400' : 'text-gray-400'}`}>
                                    — {isAdmin ? `${msg.salesManagerName || 'Admin'} (Admin)` : msg.salesManagerName} (admin)
                                  </span>
                                  <span className="text-[10px] text-gray-500">{formatDate(msg.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={followUpEndRef} />
                      </div>

                      {/* Input */}
                      {selectedLead.status !== "Completed" && (
                        <form onSubmit={handleSendCustomNote} className="p-4 bg-[#1a1a1a] border-t border-[#333] flex gap-3 items-center flex-shrink-0">
                          <input type="text" value={customNote} onChange={(e) => setCustomNote(e.target.value)} placeholder="Add Admin note..." className="flex-1 bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors" />
                          <button type="submit" className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-md flex-shrink-0">
                            <FaPaperPlane className="text-sm ml-[-2px]" />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RECEPTIONIST MODULE
// ============================================================================
function ReceptionistView({ receptionists, allLeads, isLoading, refetch }: any) {
  const [selectedReceptionist, setSelectedReceptionist] = useState<any>(null);
  const [searchRecep, setSearchRecep] = useState("");
  
  const [subView, setSubView] = useState<"cards" | "detail">("cards");
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const filteredRecep = receptionists.filter((r: any) => r.name?.toLowerCase().includes(searchRecep.toLowerCase()));
  const receptionistLeads = allLeads;

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-[#222] bg-[#111111] flex flex-col h-full flex-shrink-0 z-20 shadow-xl">
        <div className="p-5 border-b border-[#222]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
            <input 
              type="text" placeholder="Search Receptionists..." 
              value={searchRecep} onChange={e => setSearchRecep(e.target.value)} 
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-pink-500 outline-none transition-colors" 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? <div className="p-8 text-center text-gray-500 text-sm">Loading staff...</div> : filteredRecep.length === 0 ? <div className="p-8 text-center text-gray-500 text-sm">No receptionists found.</div> : (
            filteredRecep.map((recep: any) => {
              const isSelected = selectedReceptionist?.id === recep.id;
              const count = allLeads.length;

              return (
                <div key={recep.id || recep.name || recep._id} onClick={() => { setSelectedReceptionist(recep); setSubView("cards"); }} className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-b border-[#1a1a1a] ${isSelected ? "bg-[#1a1a1a] border-l-4 border-l-pink-500" : "hover:bg-[#151515] border-l-4 border-l-transparent"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${isSelected ? "bg-pink-600" : "bg-[#333] text-gray-400"}`}>{recep.name?.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-gray-200 truncate text-sm">{recep.name}</h3>
                      <span className="text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full font-bold">{count} logged</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate capitalize">{recep.role?.replace("_", " ")}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] relative">
        <div className="p-5 border-b border-[#222] bg-[#111111] flex justify-between items-center shadow-sm z-10 flex-shrink-0 gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FaClipboardList className="text-pink-500"/>
              {selectedReceptionist ? `${selectedReceptionist.name}'s Logged Enquiries` : "Select a Receptionist"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Review walk-in forms registered by this desk.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {!selectedReceptionist ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600"><FaClipboardList className="text-4xl mb-4 opacity-20" /><p>Select a receptionist from the left to view their logged data.</p></div>
          ) : (
            <>
              {subView === "cards" && (
                <div className="animate-fadeIn grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {receptionistLeads.length === 0 ? <p className="text-gray-500 text-sm">No forms logged by this receptionist yet.</p> : receptionistLeads.map((lead: any) => {
                    
                    const statusColors: any = {
                      "Completed": { text: "text-green-500", border: "border-green-500/30", bg: "bg-green-500/10" },
                      "Visit Scheduled": { text: "text-yellow-500", border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
                      "Routed": { text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" }
                    };
                    const leadStatus = lead.status || "Routed";
                    const colorSet = statusColors[leadStatus] || statusColors["Routed"];

                    return (
                      <div key={lead.id} onClick={() => { setSelectedLead(lead); setSubView("detail"); }} className="bg-[#111] border border-[#222] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-pink-500/50 transition-colors cursor-pointer">
                        <div>
                          <div className="flex justify-between items-start mb-5 pb-4 border-b border-[#222]">
                            <h3 className="text-lg font-bold text-white line-clamp-1 pr-2">
                              <span className="mr-2 text-purple-500">#{lead.id}</span>
                              {lead.name}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colorSet.border} ${colorSet.text} ${colorSet.bg}`}>
                              {leadStatus}
                            </span>
                          </div>
                          
                          <div className="space-y-4 mb-6">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Estimated Budget</p>
                              <p className="text-sm font-semibold text-white">{lead.salesBudget || lead.budget || "N/A"}</p>
                            </div>
                            
                            <div className="bg-[#151515] p-3 rounded-lg border border-[#222] flex flex-col gap-2">
                              <p className="text-xs text-gray-400 flex items-center gap-2"><FaPhoneAlt className="text-gray-500 w-3 h-3"/> Primary: <span className="font-mono text-gray-200">{maskPhone(lead.phone)}</span></p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-[#222] flex justify-between items-center text-sm mt-auto">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                              {String(lead.assigned_to || "U").charAt(0).toUpperCase()}
                            </div>
                            <p className="text-xs text-gray-400">Assigned: <span className="font-semibold text-white">{lead.assigned_to || "Unassigned"}</span></p>
                          </div>
                          <p className="text-[10px] text-gray-600">{formatDate(lead.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {subView === "detail" && selectedLead && (
                <div className="animate-fadeIn max-w-[1200px] mx-auto flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-6 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-5 shadow-xl">
                    <button onClick={() => setSubView("cards")} className="w-10 h-10 flex items-center justify-center bg-[#222] hover:bg-[#333] border border-[#444] rounded-lg text-gray-400 transition-colors cursor-pointer">
                      <FaChevronLeft className="text-sm" />
                    </button>
                    <div>
                      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="text-pink-500">#{selectedLead.id}</span> 
                        <span>{selectedLead.name}</span>
                        <span className="text-xs font-normal border border-[#333] bg-[#222] px-2 py-0.5 rounded-full">{selectedLead.status}</span>
                      </h1>
                      <p className="text-xs mt-1 text-gray-500">Logged by: {selectedReceptionist.name} on {formatDate(selectedLead.created_at)}</p>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-8 shadow-xl flex-1 overflow-y-auto">
                    <h3 className="text-sm font-bold text-gray-400 border-b border-[#2a2a2a] pb-2 mb-6 uppercase tracking-widest">Lead Captured Data</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6">
                      <div><p className="text-xs text-gray-500 mb-1">Email</p><p className="text-white font-medium">{selectedLead.email !== "N/A" ? selectedLead.email : "N/A"}</p></div>
                      <div><p className="text-xs text-gray-500 mb-1">Phone</p><p className="font-mono text-white font-medium">{selectedLead.phone}</p></div>
                      <div><p className="text-xs text-gray-500 mb-1">Alt Phone</p><p className="font-mono text-white font-medium">{selectedLead.alt_phone && selectedLead.alt_phone !== "N/A" ? selectedLead.alt_phone : "Not Provided"}</p></div>
                      
                      <div><p className="text-xs text-gray-500 mb-1">Occupation</p><p className="text-white font-medium">{selectedLead.occupation || "N/A"}</p></div>
                      <div className="col-span-2"><p className="text-xs text-gray-500 mb-1">Organization / Address</p><p className="text-white font-medium">{selectedLead.organization} / {selectedLead.address}</p></div>

                      <div><p className="text-xs text-gray-500 mb-1">Budget</p><p className="text-green-400 font-bold">{selectedLead.budget || "N/A"}</p></div>
                      <div><p className="text-xs text-gray-500 mb-1">Configuration</p><p className="text-white font-medium">{selectedLead.configuration || "N/A"}</p></div>
                      <div><p className="text-xs text-gray-500 mb-1">Purpose</p><p className="text-white font-medium">{selectedLead.purpose || "N/A"}</p></div>

                      <div><p className="text-xs text-gray-500 mb-1">Source</p><p className="text-white font-medium">{selectedLead.source || "N/A"}</p></div>
                      <div className="col-span-2"><p className="text-xs text-pink-500 mb-1 font-bold">Assigned Sales Manager</p><p className="text-white font-bold">{selectedLead.assigned_to || "N/A"}</p></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility formatting functions
const formatDate = (dateString: string) => {
  if (!dateString || dateString === "Pending" || dateString === "N/A" || dateString === "Completed") return "-";
  try { return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return dateString; }
};

const maskPhone = (phone: any) => {
  if (!phone || phone === "N/A") return "N/A";
  const clean = String(phone).replace(/[^a-zA-Z0-9]/g, '');
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 2)}*****${clean.slice(-3)}`;
};