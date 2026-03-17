"use client";

import { useEffect, useState, useRef } from "react"; 
import { useRouter } from "next/navigation";
import { 
  FaThLarge, FaCog, FaSun, FaBell, FaFileInvoice, 
  FaChevronLeft, FaCheckCircle, FaPaperPlane, FaTimes, FaPhoneAlt, FaCalendarAlt, FaUserCircle, FaMicrophone, FaWhatsapp, FaRobot, FaEyeSlash, FaSearch, FaEye, FaUniversity, FaBriefcase, FaUsers, FaFileAlt, FaCheck, FaClock
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie, Legend } from "recharts";

// ============================================================================
// SHARED REAL-TIME DATA HOOK
// ============================================================================
function useAdminData() {
  const [managers, setManagers] = useState<any[]>([]);
  const [receptionists, setReceptionists] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
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

      let pgLeads = [];
      const resLeads = await fetch("/api/walkin_enquiries");
      if (resLeads.ok) {
        const json = await resLeads.json();
        pgLeads = Array.isArray(json.data) ? json.data : [];
      }

      let mongoFollowUps = [];
      const resFups = await fetch("/api/followups");
      if (resFups.ok) {
        const json = await resFups.json();
        mongoFollowUps = Array.isArray(json.data) ? json.data : [];
      }

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
          loanPlanned: extractField("Loan Planned") !== "Pending" ? extractField("Loan Planned") : (lead.loan_planned || "Pending"),
          
          source: lead.source,
          sourceOther: lead.source_other,
          cpName: lead.cp_name,
          cpCompany: lead.cp_company,
          cpPhone: lead.cp_phone,
          altPhone: lead.alt_phone,
          address: lead.address,
          
          mongoVisitDate: latestVisitDate,
          status: latestVisitDate ? "Visit Scheduled" : lead.status
        };
      });

      setManagers(smData);
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
export default function SalesDashboard() {
  const router = useRouter();
  
  const [user, setUser] = useState({ name: "Loading...", role: "Sales Manager", email: "", password: "" });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeView, setActiveView] = useState("overview"); 
  const [showPassword, setShowPassword] = useState(false);

  const { managers, receptionists, allLeads, followUps, isLoading, refetch } = useAdminData();

  useEffect(() => {
    const storedUser = localStorage.getItem("crm_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ ...parsedUser, name: parsedUser.name || "User", password: parsedUser.password || "********" });
        if (parsedUser.role?.toLowerCase() !== "sales manager" && parsedUser.role?.toLowerCase() !== "admin") {
          router.push("/dashboard");
        }
      } catch (e) { router.push("/"); }
    } else { router.push("/"); }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("crm_user");
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-[#121212] font-sans text-white overflow-hidden relative">
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-20 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col items-center py-6 flex-shrink-0 z-40 shadow-sm">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-xl font-bold text-white mb-10 shadow-lg shadow-purple-600/20 cursor-pointer">B</div>
        <nav className="flex flex-col space-y-6 w-full items-center">
          <div onClick={() => setActiveView("overview")} className="group relative flex justify-center cursor-pointer w-full" title="Dashboard">
            {activeView === "overview" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-[#3a3a3a] ${activeView === "overview" ? "bg-purple-900/20 border-purple-800 text-purple-400" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}><FaThLarge className="w-6 h-6" /></div>
          </div>
          <div onClick={() => setActiveView("forms")} className="group relative flex justify-center cursor-pointer w-full" title="Assigned Leads">
            {(activeView === "forms" || activeView === "detail") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>}
            <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-transparent ${(activeView === "forms" || activeView === "detail") ? "bg-purple-900/20 border-purple-800 text-purple-400" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}><FaFileInvoice className="w-6 h-6" /></div>
          </div>
          <div onClick={() => setActiveView("assistant")} className="group relative flex justify-center cursor-pointer w-full" title="CRM AI Assistant">
            {activeView === "assistant" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeView === "assistant" ? "bg-purple-900/20 text-purple-400" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"}`}><FaRobot className="w-6 h-6" /></div>
          </div>
          <div onClick={() => setActiveView("settings")} className="group relative flex justify-center cursor-pointer w-full mt-auto" title="Settings & Profile">
            {activeView === "settings" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-[#3a3a3a] ${activeView === "settings" ? "bg-purple-900/20 border-purple-800 text-purple-400" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}><FaCog className="w-6 h-6" /></div>
          </div>
        </nav>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between px-8 flex-shrink-0 z-30 shadow-sm">
          <h1 className="text-white font-semibold flex items-center text-sm md:text-base tracking-wide">BhoomiDwellersCRM <span className="text-gray-500 text-xs md:text-sm font-normal ml-2">- Workspace</span></h1>
          <div className="flex items-center space-x-6 relative">
            <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-9 h-9 rounded-full bg-purple-900/30 text-purple-400 border border-purple-500/50 flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm hover:bg-purple-900/50 transition-colors">
              {String(user?.name || "U").charAt(0).toUpperCase()}
            </div>
            {isProfileOpen && (
              <div className="absolute top-12 right-0 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-5 z-50 animate-fadeIn">
                <div className="mb-4"><h3 className="text-white font-bold text-lg">{user.name}</h3><p className="text-gray-400 text-sm truncate">{user.email}</p></div>
                <hr className="border-[#2a2a2a] mb-4" />
                <div className="space-y-4 mb-6 text-sm">
                  <p className="text-gray-400 flex justify-between items-center">Role: <span className="text-purple-400 font-bold capitalize bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">{user?.role}</span></p>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Password</p>
                    <div className="flex items-center justify-between bg-[#121212] border border-[#2a2a2a] p-2 rounded-md">
                      <span className="font-mono text-gray-300 tracking-widest text-xs">{showPassword ? user.password : "••••••••"}</span>
                      <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-purple-400 cursor-pointer"><FaEyeSlash /></button>
                    </div>
                  </div>
                </div>
                <button onClick={handleLogout} className="w-full bg-[#3B1F1F] text-[#F28B82] hover:bg-red-900/40 border border-red-900/30 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer">Logout</button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-[#121212] custom-scrollbar">
          {activeView === "sales" || activeView === "overview" || activeView === "forms" || activeView === "detail" ? (
             <SalesManagerView managers={managers} allLeads={allLeads} followUps={followUps} isLoading={isLoading} adminUser={user} refetch={refetch} initialView={activeView} setMainView={setActiveView} />
          ) : activeView === "assistant" ? (
            <AssistantView allLeads={allLeads} />
          ) : (
             <div className="text-gray-400 text-center mt-20">Settings Module Loading...</div>
          )}
        </main>
      </div>
      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; } @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.2s ease-out; }`}} />
    </div>
  );
}

// ============================================================================
// SALES MANAGER MODULE
// ============================================================================
function SalesManagerView({ managers, allLeads, followUps, isLoading, adminUser, refetch, initialView, setMainView }: any) {
  const [subView, setSubView] = useState<"overview" | "cards" | "detail">(initialView === "overview" ? "overview" : initialView === "detail" ? "detail" : "cards"); 
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [detailTab, setDetailTab] = useState<"personal" | "loan">("personal");

  const [showSalesForm, setShowSalesForm] = useState(false);
  const [salesForm, setSalesForm] = useState({
    propertyType: "", location: "", budget: "", useType: "", purchaseDate: "", loanPlanned: "", siteVisit: ""
  });

  const [showLoanForm, setShowLoanForm] = useState(false);
  // 🔥 EXPANDED INDUSTRY-STANDARD LOAN TRACKING FORM STATE 🔥
  const [loanForm, setLoanForm] = useState({
    loanRequired: "", status: "", bank: "", amountReq: "", amountApp: "", cibil: "", agent: "", agentContact: "",
    empType: "", income: "", emi: "", 
    docPan: "Pending", docAadhaar: "Pending", docSalary: "Pending", docBank: "Pending", docProperty: "Pending", 
    notes: ""
  });
  
  const [customNote, setCustomNote] = useState("");
  const followUpEndRef = useRef<HTMLDivElement>(null);
  const [toastMsg, setToastMsg] = useState<{title: string, icon: any, color: string} | null>(null);

  useEffect(() => {
    setSubView(initialView === "overview" ? "overview" : initialView === "detail" && selectedLead ? "detail" : "cards");
  }, [initialView]);

  useEffect(() => {
    if (selectedLead) {
      const updated = allLeads.find((l: any) => String(l.id) === String(selectedLead.id));
      if (updated) setSelectedLead(updated);
    }
  }, [allLeads]);

  const activeManagerLeads = adminUser.role === "admin" ? allLeads : allLeads.filter((l: any) => l.assigned_to === adminUser.name);
  const currentLeadFollowUps = followUps.filter((f: any) => String(f.leadId) === String(selectedLead?.id));

  // 🔥 PARSES EXPANDED LOAN DETAILS FROM FOLLOWUPS 🔥
  const getLatestLoanDetails = () => {
    if (!selectedLead) return null;

    let extracted: Record<string, any> = {
      loanRequired: selectedLead.loanPlanned || "N/A",
      status: "Pending", bankName: "N/A", amountReq: "N/A", amountApp: "N/A",
      cibil: "N/A", agent: "N/A", agentContact: "N/A",
      empType: "N/A", income: "N/A", emi: "N/A",
      docPan: "Pending", docAadhaar: "Pending", docSalary: "Pending", docBank: "Pending", docProperty: "Pending",
      notes: "N/A"
    };

    const lUpdates = currentLeadFollowUps.filter((f: any) => f.message?.includes("🏦 Loan Update:"));
    if (lUpdates.length > 0) {
      const msg = lUpdates[lUpdates.length - 1].message;
      const getVal = (label: string) => { const match = msg.match(new RegExp(`• ${label}: (.*)`)); return match ? match[1].trim() : "N/A"; }
      
      extracted.loanRequired = getVal("Loan Required");
      extracted.status = getVal("Status");
      extracted.bankName = getVal("Bank Name");
      extracted.amountReq = getVal("Amount Requested");
      extracted.amountApp = getVal("Amount Approved");
      extracted.cibil = getVal("CIBIL Score");
      extracted.agent = getVal("Agent Name");
      extracted.agentContact = getVal("Agent Contact");
      extracted.empType = getVal("Employment Type");
      extracted.income = getVal("Monthly Income");
      extracted.emi = getVal("Existing EMIs");
      extracted.docPan = getVal("PAN Card");
      extracted.docAadhaar = getVal("Aadhaar Card");
      extracted.docSalary = getVal("Salary Slips");
      extracted.docBank = getVal("Bank Statements");
      extracted.docProperty = getVal("Property Docs");
      extracted.notes = getVal("Notes");
    }
    return extracted;
  };

  const getLoanStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("approved") || s.includes("disbursed")) return "bg-green-900/20 text-green-400 border-green-500/30";
    if (s.includes("rejected")) return "bg-red-900/20 text-red-400 border-red-500/30";
    if (s.includes("not required") || s.includes("n/a") || s.includes("pending")) return "bg-gray-900/20 text-gray-400 border-gray-500/30";
    return "bg-blue-900/20 text-blue-400 border-blue-500/30";
  };

  const handleSendCustomNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customNote.trim() || !selectedLead) return;
    
    const newMsg = {
      leadId: String(selectedLead.id), 
      salesManagerName: adminUser.name,
      createdBy: adminUser.role === "admin" ? "admin" : "sales", 
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

    let messageContent = "📝 Detailed Salesform Submitted:\n" +
      "• Property Type: " + (salesForm.propertyType || 'N/A') + "\n" +
      "• Location: " + (salesForm.location || 'N/A') + "\n" +
      "• Budget: " + (salesForm.budget || 'N/A') + "\n" +
      "• Use Type: " + (salesForm.useType || 'N/A') + "\n" +
      "• Planning to Purchase: " + (salesForm.purchaseDate || 'N/A') + "\n" +
      "• Loan Planned: " + (salesForm.loanPlanned || 'N/A') + "\n" +
      "• Site Visit Requested: " + (salesForm.siteVisit ? formatDate(salesForm.siteVisit) : 'No');

    const newMsg = {
      leadId: String(selectedLead.id),
      salesManagerName: adminUser.name,
      createdBy: adminUser.role === "admin" ? "admin" : "sales",
      message: messageContent,
      siteVisitDate: salesForm.siteVisit || null,
      createdAt: new Date().toISOString()
    };

    const newStatus = salesForm.siteVisit ? 'Visit Scheduled' : selectedLead.status;
    setShowSalesForm(false);
    setSalesForm({ propertyType: "", location: "", budget: "", useType: "", purchaseDate: "", loanPlanned: "", siteVisit: "" });

    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMsg) });
      await fetch(`/api/walkin_enquiries/${selectedLead.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedLead.name, status: newStatus })
      });
      refetch();
    } catch (e) { console.log(e); }
  };

  // 🔥 NEW REAL-ESTATE GRADE LOAN WORKFLOW SUBMISSION 🔥
  const handleLoanFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;

    const messageContent = "🏦 Loan Update:\n" +
      "• Loan Required: " + (loanForm.loanRequired || 'N/A') + "\n" +
      "• Status: " + (loanForm.status || 'N/A') + "\n" +
      "• Bank Name: " + (loanForm.bank || 'N/A') + "\n" +
      "• Amount Requested: " + (loanForm.amountReq || 'N/A') + "\n" +
      "• Amount Approved: " + (loanForm.amountApp || 'N/A') + "\n" +
      "• CIBIL Score: " + (loanForm.cibil || 'N/A') + "\n" +
      "• Agent Name: " + (loanForm.agent || 'N/A') + "\n" +
      "• Agent Contact: " + (loanForm.agentContact || 'N/A') + "\n" +
      "• Employment Type: " + (loanForm.empType || 'N/A') + "\n" +
      "• Monthly Income: " + (loanForm.income || 'N/A') + "\n" +
      "• Existing EMIs: " + (loanForm.emi || 'N/A') + "\n" +
      "• PAN Card: " + (loanForm.docPan || 'Pending') + "\n" +
      "• Aadhaar Card: " + (loanForm.docAadhaar || 'Pending') + "\n" +
      "• Salary Slips: " + (loanForm.docSalary || 'Pending') + "\n" +
      "• Bank Statements: " + (loanForm.docBank || 'Pending') + "\n" +
      "• Property Docs: " + (loanForm.docProperty || 'Pending') + "\n" +
      "• Notes: " + (loanForm.notes || 'N/A');

    const newMsg = {
      leadId: String(selectedLead.id),
      salesManagerName: adminUser.name,
      createdBy: adminUser.role === "admin" ? "admin" : "sales",
      message: messageContent,
      siteVisitDate: null,
      createdAt: new Date().toISOString()
    };

    // Full Payload for the MongoDB Database endpoint (bonus sync logic)
    const dbPayload = {
      leadId: String(selectedLead.id),
      salesManagerName: adminUser.name,
      ...loanForm
    };

    setShowLoanForm(false);
    setToastMsg({ title: `Loan Data Logged & Synced for ${selectedLead.name}`, icon: <FaCheckCircle />, color: 'blue' });
    setTimeout(() => setToastMsg(null), 3000);

    try {
      // Create Followup Entry History Log
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMsg) });
      // Call dedicated Loan API if it exists (fails gracefully if not created yet)
      await fetch("/api/loan/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dbPayload) }).catch(()=>{});
      refetch();
    } catch (e) { console.log(e); }
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
      notes: cur.notes !== "N/A" ? cur.notes : ""
    });
  };

  useEffect(() => {
    if (subView === "detail") followUpEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [followUps, subView, selectedLead, detailTab]);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "Pending" || dateString === "N/A") return "-";
    try { return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return dateString; }
  };

  const maskPhone = (phone: any) => {
    if (!phone || phone === "N/A") return "N/A";
    const clean = String(phone).replace(/[^a-zA-Z0-9]/g, '');
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 2)}*****${clean.slice(-3)}`;
  };

  const filteredLeads = activeManagerLeads.filter((lead: any) =>
    (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || String(lead.id).includes(searchTerm)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#121212] relative">
      
      {toastMsg && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] bg-${toastMsg.color}-600 border border-${toastMsg.color}-400 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 animate-fadeIn`}>
          <div className="text-lg">{toastMsg.icon}</div>
          <span className="text-sm font-bold">{toastMsg.title}</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ========================================================= */}
        {/* OVERVIEW TAB */}
        {/* ========================================================= */}
        {subView === "overview" && (
          <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center flex-wrap gap-3">
                Hi, {String(adminUser?.name || "User").split(" ")[0]}
                <span className="text-sm font-normal text-purple-400 border border-purple-900/50 px-3 py-1 rounded-full shadow-sm capitalize">{adminUser.role}</span>
              </h1>
              <button className="text-purple-500 text-sm font-semibold flex items-center gap-2 hover:text-purple-400 cursor-pointer bg-purple-900/10 px-4 py-2 rounded-lg" onClick={() => refetch()}>↻ Refresh Data</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Pipeline</p>
                <p className="text-3xl font-black text-white">{activeManagerLeads.length}</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Site Visits Planned</p>
                <p className="text-3xl font-black text-orange-400">{activeManagerLeads.filter((l:any) => l.mongoVisitDate).length}</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Loans Processing</p>
                <p className="text-3xl font-black text-blue-400">{activeManagerLeads.filter((l:any) => l.loanPlanned === "Yes").length}</p>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#2a2a2a] flex justify-between items-center bg-[#151515]">
                <h3 className="font-bold text-white flex items-center gap-2"><FaUsers className="text-purple-500"/> Pipeline Database</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="text-xs text-gray-500 uppercase bg-[#222]">
                    <tr>
                      <th className="px-6 py-4">LEAD NO.</th><th className="px-4 py-4">NAME</th>
                      <th className="px-4 py-4">PROP. TYPE</th><th className="px-4 py-4">BUDGET</th>
                      <th className="px-4 py-4">LOAN PLANNED?</th>
                      <th className="px-6 py-4">SITE VISIT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {isLoading ? (
                      <tr><td colSpan={6} className="text-center py-8">Loading database...</td></tr>
                    ) : activeManagerLeads.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8">No leads found.</td></tr>
                    ) : activeManagerLeads.map((lead: any) => (
                      <tr key={lead.id} className="hover:bg-[#252525] transition-colors cursor-pointer" onClick={() => { setSelectedLead(lead); setMainView("detail"); setSubView("detail"); }}>
                        <td className="px-6 py-4 font-bold text-purple-400">#{lead.id}</td>
                        <td className="px-4 py-4 text-white font-medium">{lead.name}</td>
                        <td className="px-4 py-4 text-gray-200 font-medium">{lead.propType || "Pending"}</td>
                        <td className="px-4 py-4 text-green-400 font-semibold">{lead.salesBudget}</td>
                        <td className="px-4 py-4">{lead.loanPlanned || "Pending"}</td>
                        <td className="px-6 py-4">
                          {lead.mongoVisitDate ? <span className="text-orange-400 font-medium whitespace-nowrap">{formatDate(lead.mongoVisitDate).split(",")[0]}</span> : <span className="text-xs italic text-gray-600">Pending</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* FORMS TAB (CARDS VIEW) */}
        {/* ========================================================= */}
        {subView === "cards" && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-8 border-b border-[#2a2a2a] pb-6">
              <h1 className="text-2xl font-bold text-white">Active Leads Pipeline</h1>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-purple-500 outline-none w-64 transition-colors" />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center text-gray-500 py-10">Fetching leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No leads available.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLeads.map((lead: any) => {
                  const hasLoan = lead.loanPlanned === "Yes";
                  return (
                    <div
                      key={lead.id}
                      className="rounded-2xl p-6 border shadow-sm transition-all group flex flex-col justify-between bg-[#1a1a1a] border-[#2a2a2a] hover:border-purple-500/50 hover:bg-[#1e1e1e] cursor-pointer"
                      onClick={() => { setSelectedLead(lead); setMainView("detail"); setSubView("detail"); }}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-5 pb-4 border-b border-[#2a2a2a]">
                          <h3 className="text-xl font-bold transition-colors line-clamp-1 pr-2 text-white group-hover:text-purple-400">
                            <span className="mr-2 text-purple-500">#{lead.id}</span>
                            {lead.name}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-500/30 text-blue-400 bg-blue-500/10 flex-shrink-0">
                            {lead.status || 'ROUTED'}
                          </span>
                        </div>

                        <div className="space-y-3 mb-5">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-xs text-gray-400 font-medium">Budget</p>
                              <p className="text-sm font-semibold text-green-400">{lead.salesBudget}</p>
                            </div>
                            {hasLoan && (
                              <div className="bg-blue-900/20 border border-blue-500/30 px-2 py-1 rounded text-blue-400 text-[10px] font-bold uppercase flex items-center gap-1">
                                <FaUniversity /> Loan Active
                              </div>
                            )}
                          </div>
                          {lead.propType && lead.propType !== "Pending" && (
                            <div>
                              <p className="text-xs text-gray-400 font-medium">Property</p>
                              <p className="text-sm font-medium text-white">{lead.propType}</p>
                            </div>
                          )}
                          <div className="p-3 rounded-lg border flex flex-col gap-1.5 bg-[#222] border-[#2a2a2a]">
                            <p className="text-xs text-gray-400 flex items-center gap-2"><FaPhoneAlt className="text-gray-500 w-3 h-3" /> <span className="font-mono text-gray-200">{maskPhone(lead.phone)}</span></p>
                          </div>
                          {lead.mongoVisitDate && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-400">
                              <FaCalendarAlt className="text-[10px]" /> {formatDate(lead.mongoVisitDate).split(",")[0]}
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

        {/* ========================================================= */}
        {/* LEAD DETAIL VIEW                                           */}
        {/* ========================================================= */}
        {subView === "detail" && selectedLead && (
          <div className="animate-fadeIn max-w-[1200px] mx-auto flex flex-col h-[calc(100vh-160px)]">

            {/* Detail header bar */}
            <div className="flex items-center justify-between mb-4 rounded-2xl border p-4 sm:p-5 shadow-xl flex-shrink-0 transition-colors bg-[#1a1a1a] border-[#2a2a2a]">
              <div className="flex items-center gap-4">
                <button onClick={() => { setMainView("forms"); setSubView("cards"); }} className="w-10 h-10 flex items-center justify-center bg-[#222] hover:bg-[#333] border border-[#444] rounded-lg text-gray-400 transition-colors">
                  <FaChevronLeft className="text-sm" />
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-purple-500">#{selectedLead.id}</span>
                  <span>{selectedLead.name}</span>
                </h1>
              </div>
              <div className="flex gap-3">
                {!showSalesForm && !showLoanForm && (
                  <>
                    <button onClick={() => { setShowSalesForm(true); setShowLoanForm(false); }} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-purple-600/20">
                      <FaFileInvoice /> Fill Salesform
                    </button>
                    <button onClick={() => { 
                      prefillLoanForm(); 
                      setShowLoanForm(true); 
                      setShowSalesForm(false); 
                    }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-600/20">
                      <FaUniversity /> Track Loan
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-2">

              {/* LEFT PANEL */}
              <div className="w-full lg:w-[45%] flex flex-col gap-4 pr-2 h-full pb-2">

                {showSalesForm ? (
                  <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-xl flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3">
                      <div><h3 className="text-lg font-bold text-white">Sales Data Form</h3><p className="text-xs text-purple-400 mt-0.5">For Lead #{selectedLead.id}</p></div>
                      <button type="button" onClick={() => setShowSalesForm(false)} className="text-gray-400 hover:text-white transition-colors p-1"><FaTimes /></button>
                    </div>
                    <form onSubmit={handleSalesFormSubmit} className="flex flex-col gap-4 flex-1">
                      <div><label className="text-xs text-gray-400 mb-1 block">Property Type?</label>
                        <input type="text" placeholder="e.g. 1BHK, 2BHK" value={salesForm.propertyType} onChange={e => setSalesForm({ ...salesForm, propertyType: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                      </div>
                      <div><label className="text-xs text-gray-400 mb-1 block">Preferred Location?</label>
                        <input type="text" placeholder="e.g. Dombivali, Kalyan" value={salesForm.location} onChange={e => setSalesForm({ ...salesForm, location: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                      </div>
                      <div><label className="text-xs text-gray-400 mb-1 block">Approximate budget?</label>
                        <input type="text" placeholder="e.g. 5 cr" value={salesForm.budget} onChange={e => setSalesForm({ ...salesForm, budget: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs text-gray-400 mb-1 block">Self-use or investment?</label>
                          <select value={salesForm.useType} onChange={e => setSalesForm({ ...salesForm, useType: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none">
                            <option value="">Select</option><option value="Self Use">Self Use</option><option value="Investment">Investment</option>
                          </select>
                        </div>
                        <div><label className="text-xs text-gray-400 mb-1 block">Planning to purchase?</label>
                          <select value={salesForm.purchaseDate} onChange={e => setSalesForm({ ...salesForm, purchaseDate: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none">
                            <option value="">Select</option><option value="Immediate">Immediate</option><option value="Next 3 Months">Next 3 Months</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="border-t border-[#333] pt-3 mt-1">
                        <label className="block text-xs text-blue-400 font-bold mb-1.5">Loan Planned?</label>
                        <select required value={salesForm.loanPlanned} onChange={e => setSalesForm({ ...salesForm, loanPlanned: e.target.value })} className="w-full bg-[#121212] border border-blue-500/30 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500 outline-none cursor-pointer">
                          <option value="" disabled>Select Option</option><option value="Yes">Yes</option><option value="No">No</option><option value="Not Sure">Not Sure</option>
                        </select>
                      </div>

                      <div className="mt-2 border-t border-[#333] pt-3"><label className="text-xs text-orange-400 font-bold mb-1.5 block">Schedule a site visit?</label>
                        <input type="datetime-local" value={salesForm.siteVisit} onChange={e => setSalesForm({ ...salesForm, siteVisit: e.target.value })} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white focus:border-orange-500 outline-none" />
                      </div>
                      <button type="submit" className="mt-auto w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors flex-shrink-0">Submit Salesform to History</button>
                    </form>
                  </div>

                ) : showLoanForm ? (
                  // 🔥 FULL REAL ESTATE GRADE LOAN TRACKING FORM 🔥
                  <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-xl flex-1 overflow-y-auto custom-scrollbar flex flex-col animate-fadeIn">
                    <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3 flex-shrink-0">
                      <div><h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><FaUniversity /> Loan Tracking Workflow</h3><p className="text-xs text-gray-400 mt-0.5">For Lead #{selectedLead.id}</p></div>
                      <button type="button" onClick={() => setShowLoanForm(false)} className="text-gray-400 hover:text-white transition-colors p-1"><FaTimes /></button>
                    </div>
                    
                    <form onSubmit={handleLoanFormSubmit} className="flex flex-col gap-6 flex-1">
                      
                      {/* Section 1: Requirement & Status */}
                      <div>
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">1. Loan Decision</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><label className="text-xs text-gray-400 mb-1 block">Loan Required? *</label>
                            <select required value={loanForm.loanRequired} onChange={e => setLoanForm({...loanForm, loanRequired: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none cursor-pointer">
                              <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option><option value="Not Sure">Not Sure</option>
                            </select>
                          </div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Loan Status *</label>
                            <select required value={loanForm.status} onChange={e => setLoanForm({...loanForm, status: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none cursor-pointer">
                              <option value="">Select Status</option>
                              <option value="Not Required">Not Required</option>
                              <option value="Required">Required</option>
                              <option value="Docs Pending">Docs Pending</option>
                              <option value="Under Process">Under Process</option>
                              <option value="Approved">Approved</option>
                              <option value="Disbursed">Disbursed</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Bank & Details */}
                      <div className="border-t border-[#333] pt-4">
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">2. Bank & Loan Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><label className="text-xs text-gray-400 mb-1 block">Bank Name</label><input type="text" value={loanForm.bank} onChange={e => setLoanForm({...loanForm, bank: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. HDFC" /></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Amount Required</label><input type="text" value={loanForm.amountReq} onChange={e => setLoanForm({...loanForm, amountReq: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. 60L" /></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Amount Approved</label><input type="text" value={loanForm.amountApp} onChange={e => setLoanForm({...loanForm, amountApp: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. 55L" /></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">CIBIL Score</label><input type="text" value={loanForm.cibil} onChange={e => setLoanForm({...loanForm, cibil: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. 750" /></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Agent Name</label><input type="text" value={loanForm.agent} onChange={e => setLoanForm({...loanForm, agent: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="Agent Name" /></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Agent Contact Number</label><input type="tel" value={loanForm.agentContact} onChange={e => setLoanForm({...loanForm, agentContact: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="Agent Phone" /></div>
                        </div>
                      </div>

                      {/* Section 3: Financials */}
                      <div className="border-t border-[#333] pt-4">
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">3. Financial Qualification</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div><label className="text-xs text-gray-400 mb-1 block">Employment</label>
                            <select value={loanForm.empType} onChange={e => setLoanForm({...loanForm, empType: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none cursor-pointer">
                              <option value="">Select</option><option value="Salaried">Salaried</option><option value="Self-employed">Self-employed</option>
                            </select>
                          </div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Monthly Income</label><input type="text" value={loanForm.income} onChange={e => setLoanForm({...loanForm, income: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. 1L" /></div>
                          <div><label className="text-xs text-gray-400 mb-1 block">Existing EMIs</label><input type="text" value={loanForm.emi} onChange={e => setLoanForm({...loanForm, emi: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. 15k" /></div>
                        </div>
                      </div>

                      {/* Section 4: Document Tracking */}
                      <div className="border-t border-[#333] pt-4">
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3 flex items-center gap-1"><FaFileAlt/> 4. Document Checklist</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#181818] p-3 rounded-lg border border-[#2a2a2a]">
                           {/* Doc Toggles */}
                           {['docPan', 'docAadhaar', 'docSalary', 'docBank', 'docProperty'].map((docKey) => {
                             const label = docKey === 'docPan' ? 'PAN Card' : docKey === 'docAadhaar' ? 'Aadhaar Card' : docKey === 'docSalary' ? 'Salary Slips / ITR' : docKey === 'docBank' ? 'Bank Statements' : 'Property Documents';
                             return (
                               <div key={docKey} className="flex items-center justify-between bg-[#121212] border border-[#333] p-2 rounded-lg">
                                  <span className="text-xs text-gray-300 font-medium">{label}</span>
                                  <select value={(loanForm as any)[docKey]} onChange={e => setLoanForm({...loanForm, [docKey]: e.target.value})} className={`text-xs font-bold bg-transparent outline-none cursor-pointer ${(loanForm as any)[docKey] === 'Uploaded' ? 'text-green-400' : 'text-gray-500'}`}>
                                    <option value="Pending">Pending</option>
                                    <option value="Uploaded">Uploaded</option>
                                  </select>
                               </div>
                             );
                           })}
                        </div>
                      </div>

                      {/* Section 5: Notes */}
                      <div className="border-t border-[#333] pt-4">
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">5. Notes / Remarks</h4>
                        <div><textarea value={loanForm.notes} onChange={e => setLoanForm({...loanForm, notes: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none resize-none h-20 custom-scrollbar" placeholder="Bank feedback, CIBIL issues, Internal notes..."></textarea></div>
                      </div>

                      <button type="submit" className="mt-4 flex-shrink-0 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors cursor-pointer">Save Loan Tracker Update</button>
                    </form>
                  </div>
                ) : (
                  
                  // 🔥 TABS FOR PERSONAL INFO VS LOAN TRACKING 🔥
                  <div className="flex flex-col h-full animate-fadeIn">
                    {/* Tab Buttons pinned to top */}
                    <div className="flex items-center gap-2 mb-4 bg-[#1a1a1a] border border-[#2a2a2a] p-1.5 rounded-xl flex-shrink-0">
                      <button onClick={() => setDetailTab('personal')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab === 'personal' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}>Personal Information</button>
                      <button onClick={() => setDetailTab('loan')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${detailTab === 'loan' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}>Loan Tracking</button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1a1a1a] border border-[#333] rounded-xl p-5 shadow-lg">
                      {detailTab === "personal" ? (
                        <div>
                          <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Email</p><p className="text-white font-semibold">{selectedLead.email !== "N/A" ? selectedLead.email : "Not Provided"}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><FaPhoneAlt className="text-[10px]" /> Phone</p><p className="font-mono text-white font-semibold">{selectedLead.phone}</p></div>
                            
                            {/* 🔥 Alternate Phone & Address 🔥 */}
                            <div><p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><FaPhoneAlt className="text-[10px] text-gray-600" /> Alt Phone</p><p className="font-mono text-white font-semibold">{selectedLead.altPhone && selectedLead.altPhone !== "N/A" ? selectedLead.altPhone : "Not Provided"}</p></div>
                            <div className="col-span-2"><p className="text-xs text-gray-500 font-medium mb-1">Residential Address</p><p className="text-white font-semibold">{selectedLead.address && selectedLead.address !== "N/A" ? selectedLead.address : "Not Provided"}</p></div>
                            
                            <div className="col-span-2 border-t border-white/5 pt-4"></div>
                            
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Budget</p><p className="text-green-400 font-bold">{selectedLead.salesBudget !== "Pending" ? selectedLead.salesBudget : selectedLead.budget}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Property Type</p><p className="text-white font-semibold">{selectedLead.propType || "Pending"}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Type of Use</p><p className="text-white font-semibold">{selectedLead.useType !== "Pending" ? selectedLead.useType : (selectedLead.purpose || "N/A")}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Planning to Buy?</p><p className="text-white font-semibold">{selectedLead.planningPurchase || "Pending"}</p></div>
                            
                            <div className="col-span-2 border-t border-white/5 pt-4"></div>

                            <div><p className="text-xs text-gray-500 font-medium mb-1">Loan Required?</p><p className="text-white font-semibold">{getLatestLoanDetails()?.loanRequired}</p></div>
                            <div><p className="text-xs text-gray-500 font-medium mb-1">Status</p><p className="text-purple-400 font-semibold">{selectedLead.status || "Routed"}</p></div>
                            
                            <div className="col-span-2 bg-[#222] p-4 rounded-xl border border-blue-900/20"><p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">📍 Site Visit Date</p><p className="text-lg font-black text-white">{selectedLead.mongoVisitDate ? formatDate(selectedLead.mongoVisitDate) : "Not Scheduled"}</p></div>
                          </div>

                          <div className="mt-6 bg-[#222] border border-[#333] rounded-xl p-4">
                            <h3 className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-3 border-b border-[#333] pb-2">Acquisition Data</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-gray-500 font-medium mb-1">Primary Source</p><p className="text-white font-medium text-sm">{selectedLead.source || "N/A"}</p></div>
                                {selectedLead.source === "Others" && (<div><p className="text-xs text-gray-500 font-medium mb-1">Specified Name</p><p className="text-white font-medium text-sm">{selectedLead.sourceOther}</p></div>)}
                            </div>
                            {selectedLead.source === "Channel Partner" && (
                                <div className="mt-4 pt-4 border-t border-[#333] grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">CP Name</p><p className="text-white font-medium text-sm">{selectedLead.cpName || "N/A"}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">CP Company</p><p className="text-white font-medium text-sm">{selectedLead.cpCompany || "N/A"}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">CP Phone</p><p className="text-white font-medium text-sm">{selectedLead.cpPhone || "N/A"}</p></div>
                                </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {(() => {
                            const curLoan: any = getLatestLoanDetails() || {};
                            const sColor = getLoanStatusColor(curLoan?.status || "");
                            
                            // 🔥 BONUS LOGIC: Deal Intelligence Flag 🔥
                            const isHighProbability = curLoan?.status?.toLowerCase() === "approved" && selectedLead.mongoVisitDate;
                            
                            return (
                              <>
                                <h3 className="text-sm font-bold text-blue-400 border-b border-[#333] pb-2 mb-6 uppercase tracking-widest flex items-center justify-between">
                                  <span className="flex items-center gap-2"><FaUniversity /> Deal Loan Overview</span>
                                </h3>

                                {isHighProbability && (
                                  <div className="mb-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 p-3 rounded-lg flex items-center justify-center gap-2 text-orange-400 font-bold tracking-wide shadow-md">
                                    🚀 HIGH PROBABILITY DEAL (Visit Done + Loan Approved)
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Loan Required?</p><p className="text-white font-semibold">{curLoan?.loanRequired}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Current Status</p><p className={`font-bold px-2 py-0.5 rounded inline-block border ${sColor}`}>{curLoan?.status}</p></div>
                                  
                                  <div className="col-span-2 border-t border-[#2a2a2a] pt-4"></div>
                                  
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Amount Requested</p><p className="text-orange-400 font-semibold">{curLoan?.amountReq}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Amount Approved</p><p className="text-green-400 font-semibold">{curLoan?.amountApp}</p></div>
                                  
                                  <div className="col-span-2 border-t border-[#2a2a2a] pt-4"></div>
                                  
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Bank Name</p><p className="text-white font-semibold">{curLoan?.bankName}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">CIBIL Score</p><p className="text-white font-semibold">{curLoan?.cibil}</p></div>
                                  
                                  <div className="col-span-2 border-t border-[#2a2a2a] pt-4"></div>

                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Agent Name</p><p className="text-white font-semibold">{curLoan?.agent}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Agent Contact</p><p className="text-white font-semibold">{curLoan?.agentContact}</p></div>
                                  
                                  <div className="col-span-2 border-t border-[#2a2a2a] pt-4"></div>
                                  
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Emp Type</p><p className="text-white font-semibold">{curLoan?.empType}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Monthly Income</p><p className="text-white font-semibold">{curLoan?.income}</p></div>
                                  <div><p className="text-xs text-gray-500 font-medium mb-1">Existing EMIs</p><p className="text-white font-semibold">{curLoan?.emi}</p></div>

                                  <div className="col-span-2 border-t border-[#2a2a2a] pt-4"></div>
                                  <div className="col-span-2 mb-2"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Document Status</p></div>

                                  {/* Dynamic Document Indicators */}
                                  {[
                                    { label: 'PAN Card', val: curLoan?.docPan },
                                    { label: 'Aadhaar', val: curLoan?.docAadhaar },
                                    { label: 'Salary/ITR', val: curLoan?.docSalary },
                                    { label: 'Bank Stmt', val: curLoan?.docBank },
                                    { label: 'Property Docs', val: curLoan?.docProperty }
                                  ].map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between bg-[#121212] border border-[#333] p-2 rounded-lg col-span-1">
                                      <span className="text-xs text-gray-400">{doc.label}</span>
                                      {doc.val === 'Uploaded' ? <FaCheck className="text-green-500 text-xs"/> : <FaClock className="text-gray-500 text-xs"/>}
                                    </div>
                                  ))}
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </div>

                    {/* 🔥 Contact Buttons Pinned to Bottom Outside the Scroll Area 🔥 */}
                    <div className="grid grid-cols-2 gap-3 mt-4 flex-shrink-0">
                       <button className="bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600 text-blue-400 hover:text-white flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1"><FaMicrophone className="text-lg" /><span className="font-bold text-[10px]">Browser Call</span></button>
                       <button className="bg-green-600/10 border border-green-500/30 hover:bg-green-600 text-green-400 hover:text-white flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1"><FaWhatsapp className="text-xl" /><span className="font-bold text-[10px]">WhatsApp</span></button>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT PANEL: FOLLOW-UPS */}
              <div className="w-full lg:w-[55%] flex flex-col bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden shadow-2xl h-full min-h-0">
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-[#181818]">
                  <div className="flex justify-start">
                    <div className="bg-[#222] border border-[#333] rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-md"><div className="flex justify-between items-center mb-2 gap-6"><span className="font-bold text-sm text-purple-400">System (Front Desk)</span><span className="text-[10px] text-gray-500">{formatDate(selectedLead.created_at)}</span></div><p className="text-sm text-gray-300 leading-relaxed">Lead assigned to {selectedLead.assigned_to}. Action required.</p></div>
                  </div>
                  {currentLeadFollowUps.map((msg: any, idx: number) => {
                    const isLoanUpdate = msg.message.includes("🏦 Loan Update");
                    const isSalesForm = msg.message.includes("📝 Detailed Salesform Submitted");
                    
                    let bgClass = 'bg-[#2a2135] border border-[#4c1d95]'; // standard purple
                    if (isLoanUpdate) bgClass = 'bg-blue-900/20 border border-blue-600/40';
                    else if (isSalesForm) bgClass = 'bg-[#222] border border-[#444]';

                    return (
                      <div key={idx} className="flex justify-start">
                        <div className={`rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-lg ${bgClass}`}>
                          <div className="flex justify-between items-center mb-3 gap-6">
                            <span className="font-bold text-sm text-white">
                              {msg.createdBy === 'admin' ? `${msg.salesManagerName || 'Admin'} (Admin)` : msg.salesManagerName}
                            </span>
                            <span className="text-[10px] text-gray-400">{formatDate(msg.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={followUpEndRef} />
                </div>
                
                <form onSubmit={handleSendCustomNote} className="p-4 bg-[#1a1a1a] border-t border-[#333] flex gap-3 items-center flex-shrink-0">
                  <input type="text" value={customNote} onChange={(e) => setCustomNote(e.target.value)} placeholder="Add follow-up note..." className="flex-1 bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors shadow-inner" />
                  <button type="submit" className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-lg"><FaPaperPlane className="text-sm ml-[-2px]" /></button>
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
function AssistantView({ allLeads }: { allLeads: any[] }) {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([{ sender: "ai", text: "Hello! I am your CRM Assistant. Ask me about your total leads, or type a client's name to pull up their details!" }]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const maskPhone = (phone: any) => {
    if (!phone || phone === "N/A") return "N/A";
    const clean = String(phone).replace(/[^a-zA-Z0-9]/g, '');
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 2)}*****${clean.slice(-3)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "Pending" || dateString === "N/A" || dateString === "Completed") return "-";
    try { return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return dateString; }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.toLowerCase().trim();
    setChatMessages(prev => [...prev, { sender: "user", text: chatInput }]);
    setChatInput("");

    setTimeout(() => {
      let aiResponse = "";

      if (userMsg.includes("analysis") || userMsg.includes("analyse") || userMsg.includes("analyze") || userMsg.includes("summary") || userMsg.includes("overview")) {
        const visitScheduled = allLeads.filter(l => l.status === "Visit Scheduled").length;
        const routed = allLeads.filter(l => l.status === "Routed").length;
        const budgetGroups: Record<string, number> = {};
        allLeads.forEach(l => { const b = l.salesBudget || l.budget || "Unknown"; budgetGroups[b] = (budgetGroups[b] || 0) + 1; });
        const topBudget = Object.entries(budgetGroups).sort((a, b) => b[1] - a[1]).slice(0, 3);
        aiResponse = `📊 Full Pipeline Analysis\n${"─".repeat(30)}\n\n📋 Total Leads: ${allLeads.length}\n📅 Visit Scheduled: ${visitScheduled}\n📥 Routed (New): ${routed}\n\n💰 Top Budget Ranges:\n` + topBudget.map(([b, count]) => `   • ${b}: ${count} lead${count > 1 ? "s" : ""}`).join("\n");
      }
      else if (userMsg.includes("total") || userMsg.includes("how many")) {
        aiResponse = `You have ${allLeads.length} total leads assigned to you.`;
      }
      else {
        const matched = allLeads.find(l => userMsg.includes(l.name.toLowerCase()) || userMsg.includes(l.name.toLowerCase().split(" ")[0]) || userMsg.includes(String(l.id)));
        if (matched) {
          aiResponse = `👤 Lead Details — #${matched.id}\n${"─".repeat(30)}\n\n• Name: ${matched.name}\n• Email: ${matched.email && matched.email !== "N/A" ? matched.email : "Not provided"}\n• Phone: ${maskPhone(matched.phone)}\n• Status: ${matched.status || "Routed"}\n• Budget: ${matched.salesBudget || matched.budget || "Pending"}\n• Property Type: ${matched.propType || "Pending"}\n• Type of Use: ${matched.useType !== "Pending" ? matched.useType : "Not specified"}\n• Loan Planned: ${matched.loanPlanned || "Pending"}\n• Site Visit: ${matched.mongoVisitDate ? formatDate(matched.mongoVisitDate) : "Not scheduled"}`;
        } else {
          aiResponse = `I can help you with:\n\n• Type a client's name or lead number to see their full details\n• Ask for "analysis" or "summary" for a pipeline overview\n• Ask "total leads" or "how many leads" for counts`;
        }
      }
      setChatMessages(prev => [...prev, { sender: "ai", text: aiResponse }]);
    }, 600);
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto h-[75vh] flex flex-col">
      <div className="flex items-center gap-4 mb-6"><div className="w-12 h-12 rounded-xl bg-purple-900/30 flex items-center justify-center text-purple-400 text-2xl shadow-inner"><FaRobot /></div><div><h1 className="text-2xl font-bold text-white tracking-tight">CRM AI Assistant</h1><p className="text-sm text-gray-400">Query your pipeline using natural language.</p></div></div>
      <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[#121212]">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>{msg.sender === 'user' ? <FaUserCircle /> : <FaRobot />}</div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[#222] text-gray-200 border border-[#2a2a2a] rounded-tl-none'}`}>{msg.text}</div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleChatSubmit} className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a] flex gap-3">
          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type here..." className="flex-1 bg-[#222] border border-[#333] rounded-xl px-5 py-3 text-sm outline-none focus:border-purple-500 text-white transition-all shadow-inner" />
          <button type="submit" className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-500 transition-all cursor-pointer"><FaPaperPlane className="text-sm ml-[-2px]" /></button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// RECEPTIONIST MODULE Placeholder
// ============================================================================
function ReceptionistView() { return null; }