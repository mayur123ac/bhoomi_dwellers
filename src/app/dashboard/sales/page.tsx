"use client";

import { useEffect, useState, useRef } from "react"; 
import { useRouter } from "next/navigation";
import { 
  FaThLarge, FaCog, FaSun, FaBell, FaFileInvoice, 
  FaChevronLeft, FaClipboardList, FaCheckCircle, FaPaperPlane, FaTimes, FaPhoneAlt, FaCalendarAlt, FaUserCircle, FaMicrophone, FaWhatsapp, FaRobot, FaEyeSlash, FaSearch
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

export default function SalesDashboard() {
  const router = useRouter();
  
  // ================= STATE MANAGEMENT =================
  const [user, setUser] = useState({ name: "Loading...", role: "Sales Manager", email: "", password: "" });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeView, setActiveView] = useState("overview"); 
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showSalesForm, setShowSalesForm] = useState(false);
  const [salesForm, setSalesForm] = useState({
    propertyType: "", location: "", budget: "", useType: "", purchaseDate: "", decisionMaker: "", loan: "", siteVisit: ""
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Custom Notifications & Modals
  const [toastMsg, setToastMsg] = useState<{title: string, icon: any, color: string} | null>(null);
  const [confirmCompleteState, setConfirmCompleteState] = useState(false); 

  // State for the completed lead detail modal
  const [selectedCompletedLead, setSelectedCompletedLead] = useState<any>(null);

  // Data State
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [completedLeadsDB, setCompletedLeadsDB] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  const [followUps, setFollowUps] = useState<any[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([{ sender: "ai", text: "Hello! I am your CRM Assistant. Ask me about your total leads, or type a client's name to pull up their details!" }]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const followUpEndRef = useRef<HTMLDivElement>(null);

  const getTomorrowDateStr = () => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.toISOString().split('T')[0];
  };

  const getTodayDateStr = () => {
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeView === "assistant") chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (activeView === "detail") followUpEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, followUps, activeView]);

  useEffect(() => {
    const storedUser = localStorage.getItem("crm_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ ...parsedUser, name: parsedUser.name || "User", password: parsedUser.password || "********" });
        if (parsedUser.role?.toLowerCase() !== "sales manager" && parsedUser.role?.toLowerCase() !== "admin") {
          router.push("/dashboard");
        } else {
          fetchLeads(parsedUser.name);
        }
      } catch (e) { router.push("/"); }
    } else { router.push("/"); }
  }, [router]);

  // ================= DATA FETCHING =================
  const fetchLeads = async (managerName: string) => {
    setIsLoading(true);
    try {
      let pgLeads: any[] = [];
      const res = await fetch("/api/walkin_enquiries");
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) pgLeads = json.data.filter((lead: any) => lead.assigned_to === managerName);
      }

      let mongoFollowUps: any[] = [];
      try {
        const followUpRes = await fetch("/api/followups");
        if (followUpRes.ok) {
          const followUpJson = await followUpRes.json();
          mongoFollowUps = followUpJson.data || [];
          setFollowUps(mongoFollowUps);
        }
      } catch(e) {}

      try {
        const compRes = await fetch("/api/completed_leads");
        if (compRes.ok) {
          const compJson = await compRes.json();
          setCompletedLeadsDB(compJson.data || []);
        }
      } catch(e) {}

      let budgetCounts: Record<string, number> = {
        "50L to 1Cr": 0, "1Cr to 1.5Cr": 0, "1.5Cr to 2Cr": 0, "2Cr to 2.5Cr": 0, "2.5Cr to 3Cr": 0, "3Cr+": 0
      };

      const mergedLeads = pgLeads.map((lead: any) => {
        const leadFups = mongoFollowUps.filter(f => String(f.leadId) === String(lead.id));
        const salesForms = leadFups.filter(f => f.message && f.message.includes("Detailed Salesform Submitted"));
        const latestFormMsg = salesForms.length > 0 ? salesForms[salesForms.length - 1].message : "";
        
        const extractField = (fieldName: string) => {
          if (!latestFormMsg) return "Pending";
          const regex = new RegExp(`• ${fieldName}: (.*)`);
          const match = latestFormMsg.match(regex);
          return match ? match[1].trim() : "Pending";
        };

        const fupsWithDate = leadFups.filter(f => f.siteVisitDate && f.siteVisitDate.trim() !== "");
        const latestVisitDate = fupsWithDate.length > 0 ? fupsWithDate[fupsWithDate.length - 1].siteVisitDate : null;

        const activeBudget = extractField("Budget") !== "Pending" ? extractField("Budget") : lead.budget;
        let b = String(activeBudget || "Unknown").trim().toLowerCase().replace(/\s+/g, "");
        
        if (lead.status !== "Completed") {
          if (b.includes("50l") || b.includes("under")) budgetCounts["50L to 1Cr"]++;
          else if (b.includes("1crto1.5") || b.includes("1-1.5")) budgetCounts["1Cr to 1.5Cr"]++;
          else if (b.includes("1.5crto2") || b.includes("1.5-2")) budgetCounts["1.5Cr to 2Cr"]++;
          else if (b.includes("2crto2.5") || b.includes("2-2.5")) budgetCounts["2Cr to 2.5Cr"]++;
          else if (b.includes("2.5crto3") || b.includes("2.5-3")) budgetCounts["2.5Cr to 3Cr"]++;
          else if (b.includes("3cr+")) budgetCounts["3Cr+"]++;
          else budgetCounts["50L to 1Cr"]++;
        }

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

      const colors = ["#8b5cf6", "#3b82f6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];
      const newChartData = Object.keys(budgetCounts).map((key, i) => ({ name: key, value: budgetCounts[key], color: colors[i % colors.length] }));

      setAllLeads(mergedLeads);
      setChartData(newChartData);

    } catch (error) { console.error("Failed to fetch leads", error); } finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_user");
    router.push("/");
  };

  // ================= FORM SUBMISSIONS =================
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
      salesManagerName: user.name,
      message: messageContent,
      siteVisitDate: salesForm.siteVisit || null, 
      createdAt: new Date().toISOString()
    };

    setFollowUps(prev => [...prev, newMsg]);
    setShowSalesForm(false);
    
    const formattedVisit = salesForm.siteVisit || selectedLead.mongoVisitDate;
    const newStatus = salesForm.siteVisit ? 'Visit Scheduled' : selectedLead.status;
    
    const updatedLeadData = { 
      ...selectedLead, 
      name: selectedLead.name, 
      mongoVisitDate: formattedVisit, 
      status: newStatus,
      propType: salesForm.propertyType || "N/A",
      salesBudget: salesForm.budget || "N/A",
      useType: salesForm.useType || "N/A",
      planningPurchase: salesForm.purchaseDate || "N/A",
      decisionMaker: salesForm.decisionMaker || "N/A",
      loanPlanned: salesForm.loan || "N/A"
    };

    setSelectedLead(updatedLeadData);
    setAllLeads(prev => prev.map(l => l.id === selectedLead.id ? updatedLeadData : l));

    if (salesForm.siteVisit) {
      const visitDateStr = salesForm.siteVisit.split('T')[0];
      if (visitDateStr === getTomorrowDateStr()) {
        setToastMsg({ title: `Site Visit Scheduled for Tomorrow: ${selectedLead.name} (Lead #${selectedLead.id})`, icon: <FaBell />, color: 'blue' });
        setTimeout(() => setToastMsg(null), 3000); 
      }
    }

    setSalesForm({ propertyType: "", location: "", budget: "", useType: "", purchaseDate: "", decisionMaker: "", loan: "", siteVisit: "" });

    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMsg) });
      await fetch(`/api/walkin_enquiries/${selectedLead.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedLead.name, status: newStatus })
      });
      fetchLeads(user.name);
    } catch (e) { console.log(e); }
  };

  const handleSendCustomNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customNote.trim() || !selectedLead) return;

    const newMsg = {
      leadId: String(selectedLead.id), salesManagerName: user.name, message: customNote, siteVisitDate: null, createdAt: new Date().toISOString()
    };
    setFollowUps(prev => [...prev, newMsg]);
    setCustomNote("");

    try { await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMsg) }); } catch (e) { console.log(e); }
  };

  // 🔥 MARK COMPLETED — REMOVES FROM PIPELINE & HARD DELETES FROM DB 🔥
  const executeMarkCompleted = async () => {
    if (!selectedLead) return;
    
    setConfirmCompleteState(false);

    const completedAt = new Date().toISOString();

    const followUpMsg = {
      leadId: String(selectedLead.id), 
      salesManagerName: user.name,
      message: "✅ Lead marked as COMPLETED by Sales Manager.",
      siteVisitDate: null,
      createdAt: completedAt
    };

    const completedLeadData = {
      lead_id: selectedLead.id,                                                              
      name: selectedLead.name || "N/A",
      email: selectedLead.email !== "N/A" ? selectedLead.email : "N/A",
      phone: selectedLead.phone || "N/A",
      budget: selectedLead.salesBudget !== "Pending" ? selectedLead.salesBudget : (selectedLead.budget || "N/A"),
      property_type: selectedLead.propType !== "Pending" ? selectedLead.propType : "N/A",              
      location: selectedLead.preferred_location || selectedLead.location || "N/A",
      site_visit_date: selectedLead.mongoVisitDate || "Pending",                                        
      completed_at: completedAt,                                                                        
    };

    // Optimistically update UI
    setFollowUps(prev => [...prev, followUpMsg]);
    
    // 🔥 Remove completely from `allLeads` so the card vanishes instantly from the assigned leads view
    setAllLeads(prev => prev.filter(l => l.id !== selectedLead.id));
    
    setCompletedLeadsDB(prev => [completedLeadData, ...prev]);

    setToastMsg({ title: `Lead #${selectedLead.id} successfully completed!`, icon: <FaCheckCircle />, color: 'green' });
    setTimeout(() => setToastMsg(null), 3000); 

    try {
      await fetch("/api/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(followUpMsg) });
      
      // 🔥 HARD DELETE from the active walkin_enquiries database
      await fetch(`/api/walkin_enquiries/${selectedLead.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      
      // Insert the completed lead record into the completed database
      await fetch("/api/completed_leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          name: selectedLead.name || "N/A",
          email: selectedLead.email !== "N/A" ? selectedLead.email : "N/A",
          phone: selectedLead.phone || "N/A",
          budget: selectedLead.salesBudget !== "Pending" ? selectedLead.salesBudget : (selectedLead.budget || "N/A"),
          propertyType: selectedLead.propType !== "Pending" ? selectedLead.propType : "N/A",
          location: selectedLead.preferred_location || selectedLead.location || "N/A",
          siteVisitDate: selectedLead.mongoVisitDate || "Pending",
        })
      });

      setActiveView("completed");
    } catch (e) { console.log(e); }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "Pending" || dateString === "N/A" || dateString === "Completed") return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateString; }
  };

  const maskPhone = (phone: any) => {
    if (!phone || phone === "N/A") return "N/A";
    const clean = String(phone).replace(/[^a-zA-Z0-9]/g, '');
    if (clean.length <= 5) return clean; 
    return `${clean.slice(0, 2)}*****${clean.slice(-3)}`;
  };

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.toLowerCase();
    setChatMessages(prev => [...prev, { sender: "user", text: chatInput }]);
    setChatInput("");

    setTimeout(() => {
      let aiResponse = "I can help you analyze your CRM data. Ask me about total leads or interested clients.";
      const matchedClient = allLeads.find(e => userMsg.includes(e.name.toLowerCase().split(" ")[0]));
      if (matchedClient) {
        aiResponse = `**Details for ${matchedClient.name} (Lead #${matchedClient.id})**\n\n• **Email:** ${matchedClient.email !== "N/A" ? matchedClient.email : "Not Provided"}\n• **Primary Phone:** ${maskPhone(matchedClient.phone)}\n• **Budget:** ${matchedClient.salesBudget}\n• **Type:** ${matchedClient.propType}`;
      } 
      else if (userMsg.includes("total")) aiResponse = `You currently have ${allLeads.length} total leads recorded in the system.`;
      setChatMessages(prev => [...prev, { sender: "ai", text: aiResponse }]);
    }, 600);
  };

  const openCompletedLeadModal = (completedLead: any) => {
    const leadId = completedLead.lead_id || completedLead.id;
    const fullLeadData = allLeads.find(l => String(l.id) === String(leadId));
    setSelectedCompletedLead({ ...completedLead, fullData: fullLeadData || null });
  };

  const todayStr = getTodayDateStr();
  const tomorrowStr = getTomorrowDateStr();

  const filteredLeads = allLeads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || String(lead.id).includes(searchTerm)
  );

  const activePipelineLeads = filteredLeads.filter(lead => lead.status !== "Completed");
  
  const filteredCompletedLeadsDB = completedLeadsDB.filter(lead => 
    (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || String(lead.lead_id || lead.id || "").includes(searchTerm)
  );

  const upcomingVisits = activePipelineLeads.filter(lead => {
    if (!lead.mongoVisitDate) return false;
    const visitDateStr = lead.mongoVisitDate.split('T')[0];
    return visitDateStr >= todayStr; 
  }).sort((a, b) => new Date(a.mongoVisitDate).getTime() - new Date(b.mongoVisitDate).getTime());

  const unreadForms = activePipelineLeads.filter(lead => lead.status === 'Routed').length;
  const currentLeadFollowUps = followUps.filter(f => String(f.leadId) === String(selectedLead?.id));

  const openLeadDetail = (lead: any) => {
    setSelectedLead(lead);
    setShowSalesForm(false); 
    setActiveView("detail");
  }

  return (
    <div className="flex h-screen bg-[#121212] font-sans text-white overflow-hidden relative">
      
      {/* 🔥 CUSTOM TOAST NOTIFICATION 🔥 */}
      {toastMsg && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] bg-${toastMsg.color}-600 border border-${toastMsg.color}-400 text-white px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.4)] flex items-center gap-4 animate-fadeIn`}>
          <div className={`text-${toastMsg.color}-200 text-lg`}>{toastMsg.icon}</div>
          <span className="text-sm font-bold tracking-wide">{toastMsg.title}</span>
          <button onClick={() => setToastMsg(null)} className={`ml-4 text-${toastMsg.color}-200 hover:text-white transition-colors`}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* 🔥 CUSTOM CONFIRMATION MODAL 🔥 */}
      {confirmCompleteState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1a1a1a] border border-[#333] w-[400px] rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              <FaCheckCircle />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Complete this Lead?</h3>
            <p className="text-sm text-gray-400 mb-6">Are you sure you want to complete the lead for <span className="text-white font-bold">{selectedLead?.name}</span>? This will permanently move them out of your active pipeline.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setConfirmCompleteState(false)} className="px-6 py-2.5 rounded-xl bg-[#222] border border-[#444] text-white font-semibold hover:bg-[#333] transition-colors cursor-pointer">Cancel</button>
              <button onClick={executeMarkCompleted} className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors shadow-lg shadow-green-600/20 cursor-pointer">Yes, Complete</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 🔥 NEW: COMPLETED LEAD DETAIL MODAL                      */}
      {/* Opens when a customer name is clicked in the table       */}
      {/* ======================================================= */}
      {selectedCompletedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] w-full max-w-[620px] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-900/40 flex items-center justify-center text-green-400">
                  <FaCheckCircle />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-green-400">#{selectedCompletedLead.lead_id || selectedCompletedLead.id || "N/A"}</span>
                    {selectedCompletedLead.name}
                  </h3>
                  <p className="text-xs text-green-500 font-semibold">✅ Completed Lead</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompletedLead(null)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#222] hover:bg-[#333] border border-[#3a3a3a] text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">

              {/* Assigned To */}
              {selectedCompletedLead.fullData?.assigned_to && (
                <div className="bg-purple-900/20 rounded-xl p-4 flex items-center gap-4 border border-purple-500/20">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                    {String(selectedCompletedLead.fullData.assigned_to).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-300 font-bold tracking-widest uppercase">Assigned To</p>
                    <p className="font-bold text-white text-base">{selectedCompletedLead.fullData.assigned_to}</p>
                  </div>
                </div>
              )}

              {/* Core Details Grid */}
              <div className="bg-[#222] rounded-xl border border-[#2a2a2a] p-5 grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">✉ Email</p>
                  <p className="text-white font-semibold text-sm break-all">
                    {selectedCompletedLead.email !== "N/A" ? selectedCompletedLead.email : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><FaPhoneAlt className="text-[10px]"/> Phone</p>
                  <p className="font-mono text-white font-semibold text-sm">
                    {selectedCompletedLead.fullData?.phone || selectedCompletedLead.phone || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Property Type</p>
                  <p className="text-white font-semibold text-sm">
                    {selectedCompletedLead.fullData?.propType || selectedCompletedLead.property_type || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Budget</p>
                  <p className="text-green-400 font-bold text-sm">
                    {selectedCompletedLead.fullData?.salesBudget || selectedCompletedLead.budget || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Type of Use</p>
                  <p className="text-white font-semibold text-sm">
                    {selectedCompletedLead.fullData?.useType !== "Pending" ? selectedCompletedLead.fullData?.useType : (selectedCompletedLead.fullData?.purpose || "N/A")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Planning to Buy?</p>
                  <p className="text-white font-semibold text-sm">
                    {selectedCompletedLead.fullData?.planningPurchase || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Decision Maker?</p>
                  <p className="text-white font-semibold text-sm">
                    {selectedCompletedLead.fullData?.decisionMaker || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Loan Planned?</p>
                  <p className="text-white font-semibold text-sm">
                    {selectedCompletedLead.fullData?.loanPlanned || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">📍 Location</p>
                  <p className="text-white font-semibold text-sm">
                    {selectedCompletedLead.location || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Status</p>
                  <p className="text-green-400 font-semibold text-sm">Completed</p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><FaCalendarAlt className="text-[10px]"/> Site Visit Date</p>
                  <p className="text-blue-400 font-semibold text-sm">
                    {selectedCompletedLead.site_visit_date && selectedCompletedLead.site_visit_date !== "Pending"
                      ? formatDate(selectedCompletedLead.site_visit_date)
                      : "Not Scheduled"}
                  </p>
                </div>
              </div>

              {/* Completion Timestamp */}
              <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                <FaCheckCircle className="text-green-500 text-xl flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Completed On (Button Clicked)</p>
                  <p className="text-green-400 font-bold text-sm mt-0.5">
                    {selectedCompletedLead.completed_at
                      ? formatDate(selectedCompletedLead.completed_at)
                      : "N/A"}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-20 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col items-center py-6 flex-shrink-0 z-40 shadow-sm">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-xl font-bold text-white mb-10 shadow-lg shadow-purple-600/20 cursor-pointer">B</div>
        <nav className="flex flex-col space-y-6 w-full items-center">
          <div onClick={() => setActiveView("overview")} className="group relative flex justify-center cursor-pointer w-full" title="Dashboard">
            {activeView === "overview" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-[#3a3a3a] ${activeView === "overview" ? "bg-purple-900/20 border-purple-800 text-purple-400" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}><FaThLarge className="w-6 h-6" /></div>
          </div>
          <div onClick={() => setActiveView("forms")} className="group relative flex justify-center cursor-pointer w-full" title="Assigned Forms">
            {(activeView === "forms" || activeView === "detail") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>}
            <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-transparent ${(activeView === "forms" || activeView === "detail") ? "bg-purple-900/20 border-purple-800 text-purple-400" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
              <FaFileInvoice className="w-6 h-6" />
              {unreadForms > 0 && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1a1a1a] animate-pulse"></div>}
            </div>
          </div>

          <div onClick={() => setActiveView("completed")} className="group relative flex justify-center cursor-pointer w-full" title="Completed Leads">
            {activeView === "completed" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r shadow-[0_0_10px_2px_rgba(34,197,94,0.5)]"></div>}
            <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-transparent ${activeView === "completed" ? "bg-green-900/20 border-green-800 text-green-400" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}><FaCheckCircle className="w-6 h-6" /></div>
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

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between px-8 flex-shrink-0 z-30 shadow-sm">
          <h1 className="text-white font-semibold flex items-center text-sm md:text-base tracking-wide">BhoomiDwellersCRM <span className="text-gray-500 text-xs md:text-sm font-normal ml-2">- Workspace</span></h1>
          <div className="flex items-center space-x-6 relative">
            <button className="text-yellow-500 hover:text-yellow-400 cursor-pointer transition-colors"><FaSun className="w-5 h-5" /></button>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="text-gray-400 hover:text-white cursor-pointer transition-colors relative">
              <FaBell className="w-5 h-5" />
              {upcomingVisits.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse">{upcomingVisits.length}</span>}
            </button>

            {isNotificationsOpen && (
              <div className="absolute top-12 right-12 w-80 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-4 z-50 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-[#2a2a2a] pb-3 mb-3">
                  <h3 className="font-bold text-sm text-white">Upcoming Site Visits</h3>
                  <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full">{upcomingVisits.length}</span>
                </div>
                {upcomingVisits.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-2 text-center">No upcoming site visits scheduled.</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {upcomingVisits.map(v => {
                      const vDate = v.mongoVisitDate.split('T')[0];
                      const isToday = vDate === todayStr;
                      const isTomorrow = vDate === tomorrowStr;
                      let displayDate = formatDate(v.mongoVisitDate);
                      if (isToday) displayDate = `Today at ${displayDate.split(", ")[1]}`;
                      else if (isTomorrow) displayDate = `Tomorrow at ${displayDate.split(", ")[1]}`;
                      return (
                        <div key={v.id} onClick={() => {openLeadDetail(v); setIsNotificationsOpen(false);}} className="p-3 rounded-lg bg-[#222] border border-[#333] hover:border-purple-500/50 transition-colors cursor-pointer group">
                          <p className="text-sm font-semibold text-purple-400 group-hover:text-purple-300">#{v.id} - {v.name}</p>
                          <p className="text-xs mt-1.5 flex items-center gap-2 font-medium">
                            <FaCalendarAlt className={isToday ? "text-red-400" : isTomorrow ? "text-orange-400" : "text-blue-400"}/>
                            <span className={isToday ? "text-red-400" : isTomorrow ? "text-orange-400" : "text-blue-400"}>{displayDate}</span>
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            
            <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-9 h-9 rounded-full bg-purple-900/30 text-purple-400 border border-purple-500/50 flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm hover:bg-purple-900/50 transition-colors">
              {String(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            {isProfileOpen && (
              <div className="absolute top-12 right-0 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-5 z-50 animate-fadeIn">
                <div className="mb-4">
                  <h3 className="text-white font-bold text-lg">{user.name}</h3>
                  <p className="text-gray-400 text-sm truncate">{user.email}</p>
                </div>
                <hr className="border-[#2a2a2a] mb-4" />
                <div className="space-y-2 mb-6 text-sm">
                  <p className="text-gray-400 flex justify-between">Role: <span className="text-white font-bold capitalize bg-purple-900/30 px-2 py-0.5 rounded text-xs border border-purple-500/30">{user.role}</span></p>
                </div>
                <button onClick={handleLogout} className="w-full bg-[#3B1F1F] text-[#F28B82] hover:bg-red-900/40 border border-red-900/30 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer">Logout</button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-[#121212] custom-scrollbar">
          
          {/* ========================================================= */}
          {/* SETTINGS TAB */}
          {/* ========================================================= */}
          {activeView === "settings" && (
            <div className="animate-fadeIn max-w-4xl mx-auto">
               <h1 className="text-3xl font-bold mb-8 text-white">Settings & Profile</h1>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] shadow-sm flex flex-col items-center justify-center">
                     <FaCalendarAlt className="text-5xl text-purple-500 mb-4" />
                     <h2 className="text-4xl font-black tracking-tight mb-2 text-white">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</h2>
                     <p className="text-gray-400 font-medium text-lg">{currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] shadow-sm">
                     <h3 className="text-lg font-bold text-purple-400 border-b border-purple-500/20 pb-2 mb-6 uppercase tracking-wider">Account Details</h3>
                     <div className="space-y-6">
                       <div><p className="text-xs text-gray-500 font-medium mb-1">Full Name</p><p className="font-semibold text-lg text-white">{user?.name || "User"}</p></div>
                       <div><p className="text-xs text-gray-500 font-medium mb-1">Registered Email</p><p className="font-medium text-white">{user?.email || "No Email"}</p></div>
                       <div>
                         <p className="text-xs text-gray-500 font-medium mb-1">System Password</p>
                         <div className="flex items-center justify-between bg-[#121212] p-3 rounded-lg border border-[#2a2a2a]">
                           <span className="font-mono tracking-widest text-white">{showPassword ? user.password : "••••••••••••"}</span>
                           <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-purple-500 cursor-pointer"><FaEyeSlash /></button>
                         </div>
                       </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* 🔥 AI ASSISTANT TAB 🔥 */}
          {activeView === "assistant" && (
             <div className="animate-fadeIn max-w-4xl mx-auto h-[80vh] flex flex-col pb-4">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-xl bg-purple-900/30 flex items-center justify-center text-purple-400 text-2xl"><FaRobot /></div>
                   <div><h1 className="text-2xl font-bold text-white">CRM AI Assistant</h1><p className="text-sm text-gray-400">Ask questions about your data or retrieve specific client details.</p></div>
                </div>
                <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-xl flex flex-col overflow-hidden">
                   <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[#121212]">
                     {chatMessages.map((msg, idx) => (
                       <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                               {msg.sender === 'user' ? <FaUserCircle className="text-lg"/> : <FaRobot className="text-lg"/>}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[#222] text-gray-200 border border-[#2a2a2a] rounded-tl-none'}`}>
                              {msg.text}
                            </div>
                         </div>
                       </div>
                     ))}
                     <div ref={chatEndRef} />
                   </div>
                   <form onSubmit={handleChatSubmit} className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a] flex gap-3">
                     <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a client's name or ask a question..." className="flex-1 bg-[#222] border border-[#333] rounded-xl px-5 py-3 text-sm outline-none focus:border-purple-500 text-white transition-colors" />
                     <button type="submit" className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-500 transition-colors shadow-lg cursor-pointer"><FaPaperPlane className="text-sm ml-[-2px]"/></button>
                   </form>
                </div>
             </div>
          )}

          {activeView !== "settings" && activeView !== "detail" && activeView !== "assistant" && (
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center flex-wrap gap-3">
                Hi, {String(user?.name || "User").split(" ")[0]} <span className="text-sm font-normal text-purple-400 border border-purple-900/50 px-3 py-1 rounded-full shadow-sm capitalize">{user.role}</span>
              </h1>
              <button className="text-purple-500 text-sm font-semibold flex items-center gap-2 hover:text-purple-400 cursor-pointer bg-purple-900/10 px-4 py-2 rounded-lg" onClick={() => fetchLeads(user.name)}>↻ Refresh Data</button>
            </div>
          )}

          {/* ========================================================= */}
          {/* OVERVIEW TAB */}
          {/* ========================================================= */}
          {activeView === "overview" && (
            <div className="animate-fadeIn flex flex-col gap-8">
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] shadow-sm">
                <h2 className="text-lg font-bold mb-6 text-white">Active Leads by Budget Range</h2>
                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500 text-sm py-20">Loading analytics...</div>
                ) : chartData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500 text-sm py-20">No budget data available</div>
                ) : (
                  <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 30, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                        <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", color: "#fff" }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center">
                  <h2 className="text-lg font-bold">Assigned Leads Overview</h2>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                      <input type="text" placeholder="Search Name or Lead No..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-[#121212] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-purple-500 outline-none transition-colors w-64" />
                    </div>
                    <div className="text-sm text-gray-400 font-medium">Total: {activePipelineLeads.length}</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs text-gray-500 uppercase bg-[#222]">
                      <tr>
                        <th className="px-6 py-4">LEAD NO.</th>
                        <th className="px-4 py-4">NAME</th>
                        <th className="px-4 py-4">PROP. TYPE</th>
                        <th className="px-4 py-4">BUDGET</th>
                        <th className="px-4 py-4">USE TYPE</th>
                        <th className="px-4 py-4">PLAN TO BUY?</th>
                        <th className="px-4 py-4">DECISION MAKER?</th>
                        <th className="px-4 py-4">LOAN PLANNED?</th>
                        <th className="px-6 py-4">SITE VISIT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {isLoading ? (
                         <tr><td colSpan={9} className="text-center py-8">Loading leads...</td></tr>
                      ) : activePipelineLeads.length === 0 ? (
                         <tr><td colSpan={9} className="text-center py-8">No leads found.</td></tr>
                      ) : (
                        activePipelineLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-[#252525] transition-colors cursor-pointer" onClick={() => openLeadDetail(lead)}>
                            <td className="px-6 py-4 font-bold text-purple-400">#{lead.id}</td>
                            <td className="px-4 py-4 text-white font-medium">{lead.name}</td>
                            <td className="px-4 py-4 text-gray-200 font-medium">{lead.propType || "Pending"}</td>
                            <td className="px-4 py-4 text-green-400 font-semibold">{lead.salesBudget}</td>
                            <td className="px-4 py-4">{lead.useType || "Pending"}</td>
                            <td className="px-4 py-4">{lead.planningPurchase || "Pending"}</td>
                            <td className="px-4 py-4">{lead.decisionMaker || "Pending"}</td>
                            <td className="px-4 py-4">{lead.loanPlanned || "Pending"}</td>
                            <td className="px-6 py-4">
                              {lead.mongoVisitDate ? (
                                <span className="text-orange-400 font-medium whitespace-nowrap">{formatDate(lead.mongoVisitDate).split(",")[0]}</span>
                              ) : (
                                <span className="text-xs italic text-gray-600">Pending</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* FORMS LIST TAB (Cards View) */}
          {/* ========================================================= */}
          {activeView === "forms" && (
            <div className="animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-[#2a2a2a] pb-6 gap-4">
                <h1 className="text-2xl font-bold text-white">Full Leads Pipeline</h1>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                    <input type="text" placeholder="Search Name or Lead No..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-purple-500 outline-none w-64 transition-colors" />
                  </div>
                  <div className="text-sm text-gray-400">Total Assigned: {activePipelineLeads.length}</div>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center text-gray-500 py-10">Fetching leads from database...</div>
              ) : activePipelineLeads.length === 0 ? (
                <div className="text-center text-gray-500 py-10">No active forms available.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activePipelineLeads.map((lead) => (
                    <div key={lead.id} onClick={() => openLeadDetail(lead)} className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] shadow-sm hover:border-purple-500/50 hover:bg-[#1e1e1e] transition-all cursor-pointer group flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-6 border-b border-[#2a2a2a] pb-4">
                          <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1 pr-2">
                             <span className="text-purple-500 mr-2">#{lead.id}</span>
                             {lead.name}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-500/30 text-green-500 bg-green-500/10">
                            {lead.status || 'ROUTED'}
                          </span>
                        </div>
                        <div className="space-y-4 mb-6">
                          <div><p className="text-xs text-gray-400 font-medium">Estimated Budget</p><p className="text-sm font-semibold text-green-400">{lead.salesBudget}</p></div>
                          <div className="bg-[#222] p-3 rounded-lg border border-[#2a2a2a] flex flex-col gap-2">
                             <p className="text-xs text-gray-400 flex items-center gap-2"><FaPhoneAlt className="text-gray-500 w-3 h-3"/> Primary: <span className="font-mono text-gray-200">{maskPhone(lead.phone)}</span></p>
                             {lead.alt_phone && lead.alt_phone !== "N/A" && (
                                <p className="text-xs text-gray-500 flex items-center gap-2"><FaPhoneAlt className="text-gray-600 w-3 h-3"/> Alt: <span className="font-mono text-gray-400">{maskPhone(lead.alt_phone)}</span></p>
                             )}
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-[#2a2a2a] flex justify-between items-center text-sm mt-auto">
                        {lead.mongoVisitDate ? (
                           <span className="text-xs font-semibold text-orange-400 flex items-center gap-1"><FaCalendarAlt/> {formatDate(lead.mongoVisitDate).split(",")[0]}</span>
                        ) : (
                           <span className="text-xs text-gray-500 italic">No visit set</span>
                        )}
                        <p className="text-gray-500 text-[10px]">{formatDate(lead.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* COMPLETED TAB — Table with clickable Name & all columns    */}
          {/* ========================================================= */}
          {activeView === "completed" && (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-8 border-b border-[#2a2a2a] pb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FaCheckCircle className="text-green-500"/> Completed Leads
                </h1>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                    <input type="text" placeholder="Search Name or Lead No..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-[#121212] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-green-500 outline-none w-64 transition-colors" />
                  </div>
                  <div className="text-sm text-gray-400 font-medium">Total: {filteredCompletedLeadsDB.length}</div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs text-gray-500 uppercase bg-[#222]">
                      <tr>
                        <th className="px-6 py-4 whitespace-nowrap">Lead No.</th>
                        <th className="px-4 py-4 whitespace-nowrap">Name</th>
                        <th className="px-4 py-4 whitespace-nowrap">Email</th>
                        <th className="px-4 py-4 whitespace-nowrap">Phone Number</th>
                        <th className="px-4 py-4 whitespace-nowrap">Budget</th>
                        <th className="px-4 py-4 whitespace-nowrap">Type of Property</th>
                        <th className="px-4 py-4 whitespace-nowrap">Location</th>
                        <th className="px-6 py-4 whitespace-nowrap">Completed On (Site Visit)</th>
                        <th className="px-6 py-4 whitespace-nowrap">Complete Button Clicked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {isLoading ? (
                         <tr><td colSpan={9} className="text-center py-8">Loading completed leads...</td></tr>
                      ) : filteredCompletedLeadsDB.length === 0 ? (
                         <tr><td colSpan={9} className="text-center py-8 text-gray-500 italic">No completed leads found.</td></tr>
                      ) : (
                        filteredCompletedLeadsDB.map((lead, idx) => (
                          <tr key={idx} className="hover:bg-[#252525] transition-colors">
                            <td className="px-6 py-4 font-bold text-green-400 whitespace-nowrap">
                              #{lead.lead_id || lead.id || "N/A"}
                            </td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => openCompletedLeadModal(lead)}
                                className="text-white font-semibold hover:text-green-400 underline underline-offset-2 decoration-dotted decoration-green-600 transition-colors cursor-pointer text-left"
                                title="Click to view full lead details"
                              >
                                {lead.name}
                              </button>
                            </td>
                            <td className="px-4 py-4 truncate max-w-[150px]">
                              {lead.email && lead.email !== "N/A" ? lead.email : "N/A"}
                            </td>
                            <td className="px-4 py-4 font-mono whitespace-nowrap">
                              {maskPhone(lead.phone)}
                            </td>
                            <td className="px-4 py-4 text-green-400 font-semibold whitespace-nowrap">
                              {lead.budget || "N/A"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {lead.property_type || "N/A"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {lead.location || "N/A"}
                            </td>
                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                              {lead.site_visit_date && lead.site_visit_date !== "Pending"
                                ? formatDate(lead.site_visit_date)
                                : <span className="text-gray-500 italic text-xs">Not Scheduled</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {lead.completed_at
                                ? <span className="text-green-400 font-medium">{formatDate(lead.completed_at)}</span>
                                : <span className="text-gray-500 italic text-xs">N/A</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LEAD DETAIL VIEW & SALES FORM TOGGLE */}
          {/* ========================================================= */}
          {activeView === "detail" && selectedLead && (
            <div className="animate-fadeIn max-w-[1200px] mx-auto flex flex-col h-[calc(100vh-160px)]">
              
              <div className="flex items-center justify-between mb-4 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4 sm:p-5 shadow-xl flex-shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveView(selectedLead.status === "Completed" ? "completed" : "forms")} className="w-10 h-10 flex items-center justify-center bg-[#222] hover:bg-[#333] border border-[#444] rounded-lg text-gray-400 transition-colors"><FaChevronLeft className="text-sm" /></button>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                      <span className="text-purple-500">#{selectedLead.id}</span> 
                      <span>{selectedLead.name}</span>
                    </h1>
                  </div>
                </div>
                <div className="flex gap-3">
                  {!showSalesForm && selectedLead.status !== "Completed" && (
                    <button onClick={() => setShowSalesForm(true)} className="border border-blue-900/50 hover:bg-blue-900/20 text-blue-400 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-md"><FaFileInvoice /> + Salesform</button>
                  )}
                  {selectedLead.status !== "Completed" ? (
                    <button onClick={() => setConfirmCompleteState(true)} className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-md"><FaCheckCircle /> Completed</button>
                  ) : (
                    <div className="bg-green-900/30 text-green-500 font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-2 border border-green-500/50"><FaCheckCircle /> Resolved</div>
                  )}
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-2">
                
                {/* --- LEFT PANEL: DYNAMIC (Sales Form OR Lead Details) --- */}
                <div className="w-full lg:w-[45%] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 h-full pb-2">
                  
                  {showSalesForm ? (
                    <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm flex-1 flex flex-col min-h-max">
                      <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3">
                        <div>
                          <h3 className="text-lg font-bold text-white">Fill Detail Capturing Salesform</h3>
                          <p className="text-xs text-blue-400 mt-0.5">For Lead #{selectedLead.id}</p>
                        </div>
                        <button type="button" onClick={() => setShowSalesForm(false)} className="text-gray-400 hover:text-white transition-colors p-1"><FaTimes /></button>
                      </div>
                      
                      <form onSubmit={handleSalesFormSubmit} className="flex flex-col gap-3 flex-1">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Lead Name</label>
                          <input type="text" value={selectedLead?.name || ""} onChange={(e) => setSelectedLead({...selectedLead, name: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">What Property Type are you looking for?</label>
                          <input type="text" placeholder="e.g. Villa, Apartment" value={salesForm.propertyType} onChange={e => setSalesForm({...salesForm, propertyType: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">What is your Preferred Location?</label>
                          <input type="text" placeholder="e.g. Delhi, Mumbai" value={salesForm.location} onChange={e => setSalesForm({...salesForm, location: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">What is the approximate budget?</label>
                          <input type="text" placeholder="e.g. 5 cr" value={salesForm.budget} onChange={e => setSalesForm({...salesForm, budget: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Self-use or investment?</label>
                            <select value={salesForm.useType} onChange={e => setSalesForm({...salesForm, useType: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none">
                              <option value="">Select</option><option value="Self Use">Self Use</option><option value="Investment">Investment</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Planning to purchase?</label>
                            <select value={salesForm.purchaseDate} onChange={e => setSalesForm({...salesForm, purchaseDate: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none">
                              <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Decision Maker?</label>
                            <select value={salesForm.decisionMaker} onChange={e => setSalesForm({...salesForm, decisionMaker: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none">
                              <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Loan Planned?</label>
                            <select value={salesForm.loan} onChange={e => setSalesForm({...salesForm, loan: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none">
                              <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block text-purple-400 font-bold">Would you like to schedule a site visit?</label>
                          <input type="datetime-local" value={salesForm.siteVisit} onChange={e => setSalesForm({...salesForm, siteVisit: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none" />
                        </div>
                        <button type="submit" className="mt-auto w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors">
                          Submit Salesform to History
                        </button>
                      </form>
                    </div>
                  ) : (
                    <>
                      <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-4 shadow-sm flex-shrink-0">
                        <div className="bg-purple-900/20 rounded-lg p-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                            {String(selectedLead.assigned_to || "V").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[10px] text-purple-300 font-bold tracking-widest uppercase mb-0.5">Assigned To</p>
                            <p className="font-bold text-white text-lg">{selectedLead.assigned_to}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-5 shadow-sm flex-1">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                          <div><p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">✉ Email</p><p className="text-white font-semibold text-sm">{selectedLead.email !== "N/A" ? selectedLead.email : "N/A"}</p></div>
                          <div><p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><FaPhoneAlt className="text-[10px]"/> Phone</p><p className="font-mono text-white font-semibold text-sm">{selectedLead.phone}</p></div>
                          
                          <div><p className="text-xs text-gray-500 font-medium mb-1">Property Type</p><p className="text-white font-semibold text-sm">{selectedLead.propType || "Pending"}</p></div>
                          <div><p className="text-xs text-gray-500 font-medium mb-1">Budget</p><p className="text-green-400 font-bold text-sm">{selectedLead.salesBudget !== "Pending" ? selectedLead.salesBudget : selectedLead.budget}</p></div>
                          
                          <div><p className="text-xs text-gray-500 font-medium mb-1">Type of Use</p><p className="text-white font-semibold text-sm">{selectedLead.useType !== "Pending" ? selectedLead.useType : (selectedLead.purpose || "N/A")}</p></div>
                          <div><p className="text-xs text-gray-500 font-medium mb-1">Planning to Buy?</p><p className="text-white font-semibold text-sm">{selectedLead.planningPurchase || "Pending"}</p></div>
                          
                          <div><p className="text-xs text-gray-500 font-medium mb-1">Decision Maker?</p><p className="text-white font-semibold text-sm">{selectedLead.decisionMaker || "Pending"}</p></div>
                          <div><p className="text-xs text-gray-500 font-medium mb-1">Loan Planned?</p><p className="text-white font-semibold text-sm">{selectedLead.loanPlanned || "Pending"}</p></div>

                          <div><p className="text-xs text-gray-500 font-medium mb-1">Status</p><p className={selectedLead.status === "Completed" ? "text-green-400 font-semibold text-sm" : "text-purple-400 font-semibold text-sm"}>{selectedLead.status || "Interested"}</p></div>
                          
                          <div className="col-span-2"><p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">📍 Site Visit Date</p><p className="text-blue-400 font-semibold text-sm">{selectedLead.mongoVisitDate ? formatDate(selectedLead.mongoVisitDate) : "Pending"}</p></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 flex-shrink-0 mt-auto pt-2">
                        <button className="bg-[#1e293b] border border-[#3b82f6] hover:bg-[#1e3a8a] text-blue-400 hover:text-white flex flex-col items-center justify-center py-3 rounded-xl transition-colors cursor-pointer gap-2">
                           <FaMicrophone className="text-xl" />
                           <span className="font-bold text-sm">Browser Call</span>
                        </button>
                        <button className="bg-[#064e3b]/30 border border-[#10b981] hover:bg-[#065f46] text-green-500 hover:text-white flex flex-col items-center justify-center py-3 rounded-xl transition-colors cursor-pointer gap-2">
                           <FaWhatsapp className="text-2xl" />
                           <span className="font-bold text-sm">Send WhatsApp</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* --- RIGHT PANEL: FOLLOW-UPS CHAT --- */}
                <div className="w-full lg:w-[55%] flex flex-col bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden shadow-lg h-full min-h-0">
                  <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-[#181818]">
                    
                    <div className="flex justify-start">
                      <div className="bg-[#222] border border-[#333] rounded-2xl rounded-tl-none p-4 max-w-[85%]">
                        <div className="flex justify-between items-center mb-2 gap-6">
                          <span className="font-bold text-sm text-purple-400">System (Front Desk)</span>
                          <span className="text-[10px] text-gray-500">{formatDate(selectedLead.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-300">Lead assigned to {selectedLead.assigned_to}. Action required.</p>
                      </div>
                    </div>

                    {currentLeadFollowUps.map((msg: any, idx: number) => (
                      <div key={idx} className="flex justify-start">
                        <div className="bg-[#2a2135] border border-[#4c1d95] rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-md">
                          <div className="flex justify-between items-center mb-3 gap-6">
                            <span className="font-bold text-sm text-white">{msg.salesManagerName}</span>
                            <span className="text-[10px] text-gray-400">{formatDate(msg.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={followUpEndRef} />
                  </div>
                  
                  {selectedLead.status !== "Completed" && (
                    <form onSubmit={handleSendCustomNote} className="p-4 bg-[#1a1a1a] border-t border-[#333] flex gap-3 items-center flex-shrink-0">
                      <input type="text" value={customNote} onChange={(e) => setCustomNote(e.target.value)} placeholder="Add custom follow-up note..." className="flex-1 bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors" />
                      <button type="submit" className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-md flex-shrink-0">
                        <FaPaperPlane className="text-sm ml-[-2px]"/>
                      </button>
                    </form>
                  )}
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}} />
    </div>
  );
}