"use client";

import { useEffect, useState, useRef } from "react"; 
import { useRouter } from "next/navigation";
import { 
  FaThLarge, FaCog, FaBell, FaTimes, FaClipboardList, 
  FaChevronLeft, FaRobot, FaPaperPlane, FaCalendarAlt, FaEye, FaEyeSlash, FaPhoneAlt, FaUserCircle, FaBriefcase, FaSearch
} from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ReceptionistDashboard() {
  const router = useRouter();
  
  // ================= STATE MANAGEMENT =================
  const [user, setUser] = useState({ name: "Loading...", role: "Receptionist", email: "", password: "" });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { sender: "ai", text: "Hello! I am your CRM Assistant. Ask me about your total leads, or type a client's name to pull up their details!" }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Data States
  const [salesManagers, setSalesManagers] = useState<any[]>([]);
  const [isFetchingManagers, setIsFetchingManagers] = useState(true);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [isFetchingEnquiries, setIsFetchingEnquiries] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [searchRecep, setSearchRecep] = useState("");

  // 🔥 UPDATED FORM STATE
  const [enquiryForm, setEnquiryForm] = useState({
    fullName: "", mobile: "", altMobile: "", email: "", address: "", 
    occupation: "", organization: "", budget: "", 
    configuration: "", purpose: "", source: "", assignedTo: "",
    siteVisitDate: "", appxPurchaseDate: "", loanPlanned: "", sourceOther: "",
    cpDetails: { name: "", company: "", phone: "" }
  });

  // ================= EFFECTS =================
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeTab === "assistant") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  useEffect(() => {
    const storedUser = localStorage.getItem("crm_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ ...parsedUser, name: parsedUser.name || "User", password: parsedUser.password || "********" });
        
        if (parsedUser.role?.toLowerCase() === "receptionist" || parsedUser.role?.toLowerCase() === "admin") {
          fetchSalesManagers();
          fetchEnquiries();
        } else {
          router.push("/dashboard");
        }
      } catch (e) {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  // ================= DATA FETCHING =================
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return "Invalid Date";
    }
  };

  const fetchEnquiries = async () => {
    setIsFetchingEnquiries(true);
    try {
      const res = await fetch("/api/walkin_enquiries");
      
      if (res.ok) {
        const json = await res.json();
        const dataArray = json.data || json; // Safely handle different response structures
        
        if (Array.isArray(dataArray)) {
          let configCounts: Record<string, number> = {
            "1 BHK": 0, "2 BHK": 0, "3 BHK": 0, "4+ BHK": 0, "Other": 0
          };

          const formattedData = dataArray.map((item: any) => {
            const c = String(item.configuration || "").trim();
            if (configCounts[c] !== undefined) {
              configCounts[c]++;
            } else {
              configCounts["Other"]++; 
            }

            return {
              ...item,
              assignedTo: item.assigned_to || "Unassigned",
              altPhone: item.alt_phone, 
              date: formatDate(item.created_at) 
            };
          });

          setEnquiries(formattedData);

          setChartData([
            { name: "1 BHK", value: configCounts["1 BHK"], color: "#d946ef" },
            { name: "2 BHK", value: configCounts["2 BHK"], color: "#8b5cf6" },
            { name: "3 BHK", value: configCounts["3 BHK"], color: "#3b82f6" },
            { name: "4+ BHK", value: configCounts["4+ BHK"], color: "#0ea5e9" },
            { name: "Other", value: configCounts["Other"], color: "#6b7280" }
          ].filter(data => data.value > 0)); 
        }
      }
    } catch (error) {
      console.error("Failed to load enquiries", error);
    } finally {
      setIsFetchingEnquiries(false);
    }
  };

  const fetchSalesManagers = async () => {
    setIsFetchingManagers(true);
    try {
      const res = await fetch("/api/users/sales-manager"); 
      if (res.ok) {
        const json = await res.json();
        // Safely extract the data array whether it's wrapped in {success: true, data: []} or just []
        const dataArray = json.data || json;
        if (Array.isArray(dataArray)) {
          setSalesManagers(dataArray);
        }
      }
    } catch (error) {
      console.error("Failed to load managers", error);
    } finally {
      setIsFetchingManagers(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_user");
    router.push("/");
  };

  // 🔥 UPDATED FORM SUBMISSION PAYLOAD
  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      name: enquiryForm.fullName,
      phone: enquiryForm.mobile,
      alt_phone: enquiryForm.altMobile || null, 
      email: enquiryForm.email || "N/A",
      address: enquiryForm.address || "N/A",
      occupation: enquiryForm.occupation || "N/A",
      organization: enquiryForm.organization || "N/A",
      budget: enquiryForm.budget || "Pending",
      configuration: enquiryForm.configuration || "N/A",
      purpose: enquiryForm.purpose || "N/A",
      source: enquiryForm.source,
      source_other: enquiryForm.source === "Others" ? enquiryForm.sourceOther : null,
      cp_name: enquiryForm.source === "Channel Partner" ? enquiryForm.cpDetails.name : null,
      cp_company: enquiryForm.source === "Channel Partner" ? enquiryForm.cpDetails.company : null,
      cp_phone: enquiryForm.source === "Channel Partner" ? enquiryForm.cpDetails.phone : null,
      loan_planned: enquiryForm.loanPlanned || "Pending",
      assignedTo: enquiryForm.assignedTo,
      status: "Routed"
    };

    try {
      const res = await fetch("/api/walkin_enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });

      if (res.ok) {
        fetchEnquiries(); 
        alert(`Success! Lead routed to ${enquiryForm.assignedTo}!`);
        setIsEnquiryModalOpen(false);
        setEnquiryForm({ 
          fullName: "", mobile: "", altMobile: "", email: "", address: "", 
          occupation: "", organization: "", budget: "", configuration: "", purpose: "", 
          source: "", assignedTo: "", siteVisitDate: "", appxPurchaseDate: "",
          loanPlanned: "", sourceOther: "", cpDetails: { name: "", company: "", phone: "" }
        });
      } else {
        alert("Server Error. Ensure you updated the schema in PostgreSQL to accept the new fields!");
      }
    } catch (error) {
      alert("Network Error while submitting form.");
    }
  };

  const maskPhoneNumber = (phone: any) => {
    if (!phone || phone === "N/A") return "N/A";
    const cleanPhone = String(phone).replace(/[^a-zA-Z0-9]/g, '');
    if (cleanPhone.length <= 5) return cleanPhone; 
    const firstTwo = cleanPhone.slice(0, 2);
    const lastThree = cleanPhone.slice(-3);
    const maskedSection = "*".repeat(cleanPhone.length - 5);
    return `${firstTwo}${maskedSection}${lastThree}`;
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.toLowerCase();
    setChatMessages(prev => [...prev, { sender: "user", text: chatInput }]);
    setChatInput("");

    setTimeout(() => {
      let aiResponse = "I can help you analyze your CRM data. Ask me about total leads or interested clients.";
      
      const matchedClient = enquiries.find(e => userMsg.includes(e.name.toLowerCase().split(" ")[0]));

      if (matchedClient) {
        aiResponse = `Here is the data for ${matchedClient.name}:\n\n• Phone: ${maskPhoneNumber(matchedClient.phone)}\n• Email: ${matchedClient.email !== "N/A" ? matchedClient.email : "Not Provided"}\n• Budget: ${matchedClient.budget}\n• Config: ${matchedClient.configuration}\n• Created On: ${matchedClient.date}\n• Assigned To: ${matchedClient.assignedTo}`;
      } 
      else if (userMsg.includes("total") || userMsg.includes("how many")) {
        aiResponse = `You currently have ${enquiries.length} total leads recorded in the system.`;
      } 
      else if (userMsg.includes("interested")) {
        const interested = enquiries.filter(e => e.status?.toLowerCase() === "interested").length;
        aiResponse = `There are currently ${interested} clients marked as 'Interested'.`;
      } 

      setChatMessages(prev => [...prev, { sender: "ai", text: aiResponse }]);
    }, 600);
  };

  // Filter leads based on search term
  const receptionistLeads = enquiries.filter((e: any) => 
    e.name?.toLowerCase().includes(searchRecep.toLowerCase()) || 
    String(e.id).includes(searchRecep) ||
    e.phone?.includes(searchRecep)
  );

  return (
    <div className="flex h-screen font-sans bg-[#121212] text-white overflow-hidden">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-20 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col items-center py-6 flex-shrink-0 z-40 shadow-sm">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-xl font-bold text-white mb-10 shadow-lg shadow-purple-600/20 cursor-pointer">B</div>
        <nav className="flex flex-col space-y-6 w-full items-center">
          <div onClick={() => setActiveTab("overview")} className="group relative flex justify-center cursor-pointer w-full" title="Dashboard">
            {activeTab === "overview" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeTab === "overview" ? "bg-purple-900/20 text-purple-400" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"}`}><FaThLarge className="w-6 h-6" /></div>
          </div>
          <div onClick={() => setActiveTab("forms")} className="group relative flex justify-center cursor-pointer w-full" title="Forms List">
            {(activeTab === "forms" || activeTab === "detail") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${(activeTab === "forms" || activeTab === "detail") ? "bg-purple-900/20 text-purple-400" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"}`}><FaClipboardList className="w-6 h-6" /></div>
          </div>
          <div onClick={() => setActiveTab("assistant")} className="group relative flex justify-center cursor-pointer w-full" title="CRM AI Assistant">
            {activeTab === "assistant" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeTab === "assistant" ? "bg-purple-900/20 text-purple-400" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"}`}><FaRobot className="w-6 h-6" /></div>
          </div>
          <div onClick={() => setActiveTab("settings")} className="group relative flex justify-center cursor-pointer w-full mt-auto" title="Settings & Profile">
            {activeTab === "settings" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeTab === "settings" ? "bg-purple-900/20 text-purple-400" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"}`}><FaCog className="w-6 h-6" /></div>
          </div>
        </nav>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* HEADER */}
        <header className="h-16 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between px-8 flex-shrink-0 z-30 shadow-sm">
          <h1 className="font-bold flex items-center text-sm md:text-base tracking-wide">BhoomiDwellersCRM <span className="text-gray-400 text-xs md:text-sm font-normal ml-2">- Front Desk</span></h1>
          <div className="flex items-center space-x-6 relative">
            
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="text-gray-400 hover:text-purple-500 cursor-pointer transition-colors relative">
              <FaBell className="w-5 h-5" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute top-12 right-12 w-72 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-4 z-50 animate-fadeIn">
                <h3 className="font-bold text-sm mb-3 border-b border-[#2a2a2a] pb-2">Notifications</h3>
                <p className="text-xs text-gray-500 italic">All caught up! No recent notifications.</p>
              </div>
            )}

            <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-9 h-9 rounded-full border border-purple-500/30 text-purple-500 bg-purple-500/10 flex items-center justify-center font-bold text-sm cursor-pointer shadow-md hover:scale-105 transition-transform">
              {String(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            {isProfileOpen && (
              <div className="absolute top-12 right-0 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-5 z-50 animate-fadeIn">
                <div className="mb-4">
                  <h3 className="font-bold text-lg">{user?.name || "User"}</h3>
                  <p className="text-gray-400 text-sm truncate">{user?.email || "No email"}</p>
                </div>
                <hr className="border-[#2a2a2a] mb-4" />
                <div className="space-y-4 mb-6 text-sm">
                  <p className="text-gray-400 flex justify-between items-center">
                    Role: <span className="text-purple-400 font-bold capitalize bg-purple-500/10 px-2 py-0.5 rounded">{user?.role || "Employee"}</span>
                  </p>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Password</p>
                    <div className="flex items-center justify-between bg-[#121212] border border-[#2a2a2a] p-2 rounded-md">
                      <span className="font-mono text-gray-300 tracking-widest text-xs">{showPassword ? user.password : "••••••••"}</span>
                      <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-purple-400 cursor-pointer">
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                </div>
                <button onClick={handleLogout} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer">Logout</button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          
          {/* ========================================================================= */}
          {/* SETTINGS TAB */}
          {/* ========================================================================= */}
          {activeTab === "settings" && (
            <div className="animate-fadeIn max-w-4xl mx-auto">
               <h1 className="text-3xl font-bold mb-8 text-white">Settings & Profile</h1>
               
               <div className="w-full lg:w-2/3 grid grid-cols-2 gap-6">
                  {/* Digital Clock Widget */}
                  <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] shadow-sm flex flex-col items-center justify-center">
                     <FaCalendarAlt className="text-5xl text-purple-500 mb-4" />
                     <h2 className="text-4xl font-black tracking-tight mb-2 text-white">
                       {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                     </h2>
                     <p className="text-gray-400 font-medium text-lg">
                       {currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                     </p>
                  </div>

                  {/* Profile Info */}
                  <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] shadow-sm">
                     <h3 className="text-lg font-bold text-purple-400 border-b border-purple-500/20 pb-2 mb-6 uppercase tracking-wider">Account Details</h3>
                     <div className="space-y-6">
                       <div>
                         <p className="text-xs text-gray-500 font-medium mb-1">Full Name</p>
                         <p className="font-semibold text-lg text-white">{user?.name || "User"}</p>
                       </div>
                       <div>
                         <p className="text-xs text-gray-500 font-medium mb-1">Registered Email</p>
                         <p className="font-medium text-white">{user?.email || "No Email"}</p>
                       </div>
                       <div>
                         <p className="text-xs text-gray-500 font-medium mb-1">System Password</p>
                         <div className="flex items-center justify-between bg-[#121212] p-3 rounded-lg border border-[#2a2a2a]">
                           <span className="font-mono tracking-widest text-white">{showPassword ? user.password : "••••••••••••"}</span>
                           <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-purple-500 cursor-pointer">
                             {showPassword ? <FaEyeSlash /> : <FaEye />}
                           </button>
                         </div>
                       </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* AI ASSISTANT TAB */}
          {/* ========================================================================= */}
          {activeTab === "assistant" && (
             <div className="animate-fadeIn max-w-4xl mx-auto h-[80vh] flex flex-col pb-4">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-xl bg-purple-900/30 flex items-center justify-center text-purple-400 text-2xl">
                      <FaRobot />
                   </div>
                   <div>
                     <h1 className="text-2xl font-bold text-white">CRM AI Assistant</h1>
                     <p className="text-sm text-gray-400">Ask questions about your data or retrieve specific client details.</p>
                   </div>
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
                     <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a client's name or ask a question..." className="flex-1 bg-[#222] border border-[#333] rounded-xl p-4 text-sm outline-none focus:border-purple-500 text-white transition-colors" />
                     <button type="submit" className="w-14 h-14 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-500 transition-colors shadow-lg cursor-pointer"><FaPaperPlane className="text-sm ml-[-2px]"/></button>
                   </form>
                </div>
             </div>
          )}

          {/* Header for non-full-screen tabs */}
          {activeTab !== "settings" && activeTab !== "detail" && activeTab !== "assistant" && (
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center flex-wrap gap-3">
                Hi, {String(user?.name || "User").split(" ")[0]} <span className="text-sm font-normal text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full shadow-sm capitalize">{user?.role || "Employee"}</span>
              </h1>
              <button onClick={fetchEnquiries} className="text-purple-400 text-sm font-semibold flex items-center gap-2 hover:text-purple-500 cursor-pointer bg-purple-500/10 px-4 py-2 rounded-lg transition-colors">↻ Refresh Live Data</button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* OVERVIEW TAB */}
          {/* ========================================================================= */}
          {activeTab === "overview" && (
            <div className="animate-fadeIn pb-10">
              <div className="flex flex-col lg:flex-row gap-6 mb-8">
                
                {/* PIE CHART */}
                <div className="w-full lg:w-1/3 bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] shadow-sm flex flex-col items-center">
                  <h2 className="text-lg font-bold mb-2 self-start">Room Configurations</h2>
                  <p className="text-xs text-gray-400 self-start mb-6">Calculated from {enquiries.length} live records</p>
                  
                  {isFetchingEnquiries ? (
                     <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Calculating chart data...</div>
                  ) : chartData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Not enough data to calculate</div>
                  ) : (
                    <div className="w-full h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            isAnimationActive={false} 
                            data={chartData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius="50%" 
                            outerRadius="80%" 
                            paddingAngle={5} 
                            dataKey="value" 
                            stroke="none"
                          >
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", color: "#fff" }} 
                            itemStyle={{ color: "#fff" }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* QUICK STATS */}
                <div className="w-full lg:w-2/3 grid grid-cols-2 gap-6">
                  <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
                    <p className="text-gray-400 text-sm font-medium mb-2">Total Walk-ins Logged</p>
                    <p className="text-5xl font-black mb-2 text-white">{isFetchingEnquiries ? "..." : enquiries.length}</p>
                    <p className="text-green-500 text-xs font-bold flex items-center gap-1">▲ Syncing Live</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                    <p className="text-gray-400 text-sm font-medium mb-2">Most Recent Walk-in</p>
                    <p className="text-xl font-bold mb-1 truncate">{enquiries.length > 0 ? enquiries[0].name : "N/A"}</p>
                    <p className="text-purple-400 text-xs font-semibold">Assigned to: {enquiries.length > 0 ? enquiries[0].assignedTo : "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* REAL-TIME TABLE */}
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center">
                  <h2 className="text-lg font-bold">Front Desk Log</h2>
                  <div className="flex gap-4 items-center">
                    <div className="relative hidden md:block">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                      <input type="text" placeholder="Search leads..." value={searchRecep} onChange={e => setSearchRecep(e.target.value)} className="bg-[#121212] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-purple-500 outline-none w-48 transition-colors" />
                    </div>
                    <button onClick={() => setIsEnquiryModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md text-xs flex items-center gap-2 cursor-pointer">+ New Entry</button>
                  </div>
                </div>
                
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#222]">
                        <th className="p-4 text-xs text-gray-400 font-bold uppercase tracking-wider border-b border-[#2a2a2a]">Lead No.</th>
                        <th className="p-4 text-xs text-gray-400 font-bold uppercase tracking-wider border-b border-[#2a2a2a]">Client Name</th>
                        <th className="p-4 text-xs text-gray-400 font-bold uppercase tracking-wider border-b border-[#2a2a2a]">Email ID</th>
                        <th className="p-4 text-xs text-gray-400 font-bold uppercase tracking-wider border-b border-[#2a2a2a]">Budget</th>
                        <th className="p-4 text-xs text-gray-400 font-bold uppercase tracking-wider border-b border-[#2a2a2a]">Phone</th>
                        <th className="p-4 text-xs text-gray-400 font-bold uppercase tracking-wider border-b border-[#2a2a2a]">Alt. Phone</th>
                        <th className="p-4 text-xs text-gray-400 font-bold uppercase tracking-wider border-b border-[#2a2a2a]">Date Created</th>
                        <th className="p-4 text-xs text-gray-400 font-bold uppercase tracking-wider border-b border-[#2a2a2a]">Sales Manager</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {isFetchingEnquiries ? (
                        <tr><td colSpan={8} className="p-8 text-center text-gray-400 text-sm">Fetching live table data...</td></tr>
                      ) : receptionistLeads.length === 0 ? (
                        <tr><td colSpan={8} className="p-8 text-center text-gray-400 text-sm">No matching leads found.</td></tr>
                      ) : (
                        receptionistLeads.map((enquiry: any) => (
                          <tr key={enquiry.id} className="hover:bg-[#252525] transition-colors cursor-pointer" onClick={() => { setSelectedEnquiry(enquiry); setActiveTab("detail"); }}>
                            <td className="p-4 text-sm font-bold text-purple-500">#{enquiry.id}</td>
                            <td className="p-4 text-sm font-semibold">{enquiry.name}</td>
                            <td className="p-4 text-sm text-gray-400 truncate max-w-[150px]">{enquiry.email !== "N/A" ? enquiry.email : <span className="italic">Not provided</span>}</td>
                            <td className="p-4 text-sm text-green-500 font-medium">{enquiry.budget}</td>
                            <td className="p-4 text-sm font-mono tracking-wide">{maskPhoneNumber(enquiry.phone)}</td>
                            <td className="p-4 text-sm font-mono tracking-wide text-gray-400">{maskPhoneNumber(enquiry.altPhone)}</td>
                            <td className="p-4 text-xs text-gray-500">{enquiry.date}</td>
                            <td className="p-4 text-sm">
                              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-semibold">{enquiry.assignedTo || "Unassigned"}</span>
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

          {/* ========================================================================= */}
          {/* FORMS TAB (CARDS VIEW) */}
          {/* ========================================================================= */}
          {activeTab === "forms" && (
            <div className="animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h2 className="text-xl font-bold">Recent Enquiries</h2>
                <div className="flex gap-4 items-center">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                    <input type="text" placeholder="Search leads..." value={searchRecep} onChange={e => setSearchRecep(e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-purple-500 outline-none w-48 transition-colors" />
                  </div>
                  <button onClick={() => setIsEnquiryModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-md text-sm flex items-center gap-2 cursor-pointer"><FaClipboardList /> + Add New Form</button>
                </div>
              </div>

              {isFetchingEnquiries ? (
                <div className="text-center text-gray-400 py-10">Fetching live database forms...</div>
              ) : receptionistLeads.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No matching forms found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {receptionistLeads.map((enquiry: any, index: number) => (
                    <div key={index} onClick={() => { setSelectedEnquiry(enquiry); setActiveTab("detail"); }} className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] shadow-sm hover:bg-[#1e1e1e] hover:border-purple-500/50 transition-all cursor-pointer group flex flex-col justify-between">
                      
                      <div>
                        <div className="flex justify-between items-start mb-6 border-b border-[#2a2a2a] pb-4">
                          <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1 pr-2 flex items-center gap-2">
                            <span className="text-purple-500 flex-shrink-0">#{enquiry.id}</span>
                            <span className="line-clamp-1">{enquiry.name}</span>
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${enquiry.status === 'Routed' ? 'border border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border border-yellow-500/30 text-yellow-500 bg-yellow-500/10'}`}>
                            {enquiry.status}
                          </span>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                          <div><p className="text-xs text-gray-400 font-medium">Estimated Budget</p><p className="text-sm font-semibold">{enquiry.budget}</p></div>
                          
                          <div className="bg-[#222] p-3 rounded-lg border border-[#2a2a2a] flex flex-col gap-2">
                             <p className="text-xs text-gray-400 flex items-center gap-2"><FaPhoneAlt className="text-gray-500 w-3 h-3"/> Primary: <span className="font-mono text-gray-200">{maskPhoneNumber(enquiry.phone)}</span></p>
                             {enquiry.altPhone && enquiry.altPhone !== "N/A" && (
                                <p className="text-xs text-gray-500 flex items-center gap-2"><FaPhoneAlt className="text-gray-600 w-3 h-3"/> Alt: <span className="font-mono text-gray-400">{maskPhoneNumber(enquiry.altPhone)}</span></p>
                             )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#2a2a2a] flex justify-between items-center text-sm mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 text-white flex items-center justify-center text-xs font-bold">
                            {String(enquiry.assignedTo || "U").charAt(0).toUpperCase()}
                          </div>
                          <p className="text-xs text-gray-400">Assigned: <span className="font-semibold text-white">{enquiry.assignedTo || "Unassigned"}</span></p>
                        </div>
                        <p className="text-xs text-gray-500">{enquiry.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* DETAIL VIEW */}
          {/* ========================================================================= */}
          {activeTab === "detail" && selectedEnquiry && (
            <div className="animate-fadeIn max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-8 shadow-xl">
                <button onClick={() => setActiveTab("forms")} className="w-10 h-10 flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#2a2a2a] rounded-xl text-gray-400 transition-colors cursor-pointer shadow-sm"><FaChevronLeft className="text-sm" /></button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                    <span className="text-purple-500">#{selectedEnquiry.id}</span> 
                    <span>{selectedEnquiry.name}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedEnquiry.status === 'Routed' ? 'border border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border border-yellow-500/30 text-yellow-500 bg-yellow-500/10'}`}>{selectedEnquiry.status}</span>
                  </h1>
                  <p className="text-sm mt-1 text-gray-400">Created on {selectedEnquiry.date}</p>
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-8 shadow-xl">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-green-500/30 text-green-500 bg-green-500/10 flex items-center justify-center font-bold text-xl shadow-md">
                      {String(selectedEnquiry.assignedTo || "U").charAt(0).toUpperCase()}
                    </div>
                    <div><p className="text-xs text-purple-200 font-bold tracking-wider uppercase mb-1">Assigned Sales Manager</p><p className="font-bold text-lg">{selectedEnquiry.assignedTo}</p></div>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs text-purple-200 uppercase tracking-wider font-bold mb-1">Source</p>
                    <p className="font-semibold flex items-center sm:justify-end gap-2">
                       <FaBriefcase className="text-purple-300 opacity-70"/> {selectedEnquiry.source || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 border-b border-[#2a2a2a] pb-2 mb-4 uppercase tracking-widest">Contact Information</h3>
                      <div className="space-y-4">
                        <div><p className="text-xs text-gray-400 font-medium mb-1 ">Phone Number </p><p className="font-semibold text-lg tracking-widest">{maskPhoneNumber(selectedEnquiry.phone)}</p></div>
                        <div><p className="text-xs text-gray-400 font-medium mb-1">Alt. Phone </p><p className="font-semibold text-lg tracking-widest">{selectedEnquiry.altPhone ? maskPhoneNumber(selectedEnquiry.altPhone) : "N/A"}</p></div>
                        <div><p className="text-xs text-gray-400 font-medium mb-1">Email Address</p><p className="font-medium">{selectedEnquiry.email}</p></div>
                        <div><p className="text-xs text-gray-400 font-medium mb-1">Residential Address</p><p className="font-medium">{selectedEnquiry.address}</p></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 border-b border-[#2a2a2a] pb-2 mb-4 uppercase tracking-widest">Professional Info</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-gray-400 font-medium mb-1">Occupation</p><p className="font-medium">{selectedEnquiry.occupation}</p></div>
                        <div><p className="text-xs text-gray-400 font-medium mb-1">Organization</p><p className="font-medium">{selectedEnquiry.organization}</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 border-b border-[#2a2a2a] pb-2 mb-4 uppercase tracking-widest">Property Requirements</h3>
                      <div className="bg-[#222] border border-[#2a2a2a] rounded-xl p-5 space-y-5">
                        <div><p className="text-xs text-gray-400 font-medium mb-1 pl-2">Estimated Budget</p><p className="text-green-500 font-bold text-xl">{selectedEnquiry.budget}</p></div>
                        <div className="grid grid-cols-2 gap-4 border-t border-[#2a2a2a] pt-5">
                          <div><p className="text-xs text-gray-400 font-medium mb-1 pl-2">Configuration</p><p className="font-medium text-white">{selectedEnquiry.configuration}</p></div>
                          <div><p className="text-xs text-gray-400 font-medium mb-1 pl-2">Purpose of Purchase</p><p className="font-medium text-white">{selectedEnquiry.purpose}</p></div>
                        </div>
                        <div className="border-t border-[#2a2a2a] pt-5">
                           <p className="text-xs text-gray-400 font-medium mb-1 pl-2">Loan Planned?</p>
                           <p className="font-medium text-white">{selectedEnquiry.loan_planned || "Pending"}</p>
                        </div>
                      </div>
                    </div>

                    {/* 🔥 SOURCE DETAILS (CP / OTHERS) 🔥 */}
                    <div className="bg-[#222] border border-[#333] rounded-xl p-5">
                      <h3 className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-4 border-b border-[#333] pb-2">Acquisition Data</h3>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">Primary Source</p>
                            <p className="text-white font-medium text-sm">{selectedEnquiry.source || "N/A"}</p>
                         </div>
                         {selectedEnquiry.source === "Others" && (
                            <div>
                               <p className="text-xs text-gray-500 font-medium mb-1">Specified Name</p>
                               <p className="text-white font-medium text-sm">{selectedEnquiry.source_other}</p>
                            </div>
                         )}
                      </div>
                      
                      {selectedEnquiry.source === "Channel Partner" && (
                         <div className="mt-4 pt-4 border-t border-[#333] grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                               <p className="text-xs text-gray-500 font-medium mb-1">CP Name</p>
                               <p className="text-white font-medium text-sm">{selectedEnquiry.cp_name || "N/A"}</p>
                            </div>
                            <div>
                               <p className="text-xs text-gray-500 font-medium mb-1">CP Company</p>
                               <p className="text-white font-medium text-sm">{selectedEnquiry.cp_company || "N/A"}</p>
                            </div>
                            <div>
                               <p className="text-xs text-gray-500 font-medium mb-1">CP Phone</p>
                               <p className="text-white font-medium text-sm">{selectedEnquiry.cp_phone || "N/A"}</p>
                            </div>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* THE ENQUIRY FORM MODAL */}
          {/* ========================================================================= */}
          {isEnquiryModalOpen && (
            <div className="fixed inset-0 bg-black/80 z-[100] flex justify-center items-center p-4 sm:p-6 animate-fadeIn">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                
                <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center bg-[#151515]">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaUserCircle className="text-purple-500"/> Client Enquiry Form</h2>
                    <p className="text-xs text-gray-400 mt-1">Fill out all details accurately to route to the Sales Manager.</p>
                  </div>
                  <button onClick={() => setIsEnquiryModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-2"><FaTimes className="text-xl" /></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#0a0a0a]">
                  <form id="enquiryForm" onSubmit={handleEnquirySubmit} className="space-y-8">
                    
                    {/* Block 1 */}
                    <div className="bg-[#111111] p-6 rounded-xl border border-[#222]">
                      <h3 className="text-sm font-bold text-purple-400 mb-5 uppercase tracking-wider border-b border-purple-500/20 pb-2">Personal Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Full Name *</label>
                          <input type="text" required value={enquiryForm.fullName} onChange={e => setEnquiryForm({...enquiryForm, fullName: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="e.g. Mayur Acharya" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Address</label>
                          <input type="text" value={enquiryForm.address} onChange={e => setEnquiryForm({...enquiryForm, address: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="Full residential address" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Mobile No *</label>
                          <input type="tel" required value={enquiryForm.mobile} onChange={e => setEnquiryForm({...enquiryForm, mobile: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="+91 0000000000" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Alt Mobile No</label>
                          <input type="tel" value={enquiryForm.altMobile} onChange={e => setEnquiryForm({...enquiryForm, altMobile: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="+91 0000000000" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Email ID</label>
                          <input type="email" value={enquiryForm.email} onChange={e => setEnquiryForm({...enquiryForm, email: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="email@example.com" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Occupation</label>
                          <select value={enquiryForm.occupation} onChange={e => setEnquiryForm({...enquiryForm, occupation: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors cursor-pointer">
                            <option value="" disabled>Select Occupation</option>
                            <option value="Salaried">Salaried</option><option value="Self Employed">Self Employed</option>
                            <option value="Business owner">Business Owner</option><option value="House maker">House Maker</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Organization / Office Add.</label>
                          <input type="text" value={enquiryForm.organization} onChange={e => setEnquiryForm({...enquiryForm, organization: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="Company Name & Location" />
                        </div>
                        
                        {/* 🔥 FEATURE 1: LOAN PLANNED 🔥 */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Loan Planned *</label>
                          <select required value={enquiryForm.loanPlanned} onChange={e => setEnquiryForm({...enquiryForm, loanPlanned: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors cursor-pointer">
                            <option value="" disabled>Select Option</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>

                      </div>
                    </div>

                    {/* Block 2 */}
                    <div className="bg-[#111111] p-6 rounded-xl border border-[#222]">
                      <h3 className="text-sm font-bold text-purple-400 mb-5 uppercase tracking-wider border-b border-purple-500/20 pb-2">Requirement & Timeline</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Budget *</label>
                          <select required value={enquiryForm.budget} onChange={e => setEnquiryForm({...enquiryForm, budget: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors cursor-pointer">
                            <option value="" disabled>Select Budget</option>
                            <option value="50L to 1Cr">50L to 1Cr</option>
                            <option value="1Cr to 1.5Cr">1Cr to 1.5Cr</option>
                            <option value="1.5Cr to 2Cr">1.5Cr to 2Cr</option>
                            <option value="2Cr to 2.5Cr">2Cr to 2.5Cr</option>
                            <option value="2.5Cr to 3Cr">2.5Cr to 3Cr</option>
                            <option value="3Cr+">3Cr+</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Configuration (BHK)</label>
                          <select value={enquiryForm.configuration} onChange={e => setEnquiryForm({...enquiryForm, configuration: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors cursor-pointer">
                            <option value="" disabled>Select BHK</option>
                            <option value="1 BHK">1 BHK</option><option value="2 BHK">2 BHK</option>
                            <option value="3 BHK">3 BHK</option><option value="4+ BHK">4+ BHK</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Purpose</label>
                          <select value={enquiryForm.purpose} onChange={e => setEnquiryForm({...enquiryForm, purpose: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors cursor-pointer">
                            <option value="" disabled>Select Purpose</option>
                            <option value="Personal use">Personal Use</option><option value="Investment">Investment</option>
                            <option value="Second home">Second home</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Block 3 */}
                    <div className="bg-[#111111] p-6 rounded-xl border border-green-500/20">
                      <h3 className="text-sm font-bold text-green-500 mb-5 uppercase tracking-wider border-b border-green-500/20 pb-2">Routing & Source</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        
                        {/* 🔥 FEATURE 2: UPDATED SOURCE DROPDOWN 🔥 */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Source *</label>
                          <select required value={enquiryForm.source} onChange={e => setEnquiryForm({...enquiryForm, source: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors cursor-pointer">
                            <option value="" disabled>Select Source</option>
                            <option value="Advertisement">Advertisement</option>
                            <option value="Referral">Referral</option>
                            <option value="Exhibition">Exhibition</option>
                            <option value="Channel Partner">Channel Partner</option>
                            <option value="Website">Website</option>
                            <option value="Call Center">Call Center</option>
                            <option value="Others">Others</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-green-500 mb-1.5 font-bold pl-2">Assign to Sales Manager *</label>
                          <select required value={enquiryForm.assignedTo} onChange={e => setEnquiryForm({...enquiryForm, assignedTo: e.target.value})} className="w-full bg-[#1a1a1a] border-2 border-green-500/50 rounded-lg p-3 text-sm focus:border-green-500 outline-none text-white transition-colors cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                            <option value="" disabled>-- Select Available Manager --</option>
                            {isFetchingManagers ? (
                              <option disabled>Loading managers...</option>
                            ) : salesManagers.length > 0 ? (
                              salesManagers.map((m, idx) => <option key={idx} value={m.name}>{m.name}</option>)
                            ) : (
                              <option disabled>No Managers found in DB</option>
                            )}
                          </select>
                        </div>

                        {/* 🔥 FEATURE 2.1: CONDITIONAL "OTHERS" INPUT 🔥 */}
                        {enquiryForm.source === "Others" && (
                          <div className="sm:col-span-2 mt-2">
                             <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">Specify Source *</label>
                             <input required type="text" value={enquiryForm.sourceOther} onChange={e => setEnquiryForm({...enquiryForm, sourceOther: e.target.value})} className="w-full bg-[#1a1a1a] border border-purple-500/50 rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="Please specify the lead source" />
                          </div>
                        )}

                        {/* 🔥 FEATURE 3: CONDITIONAL "CHANNEL PARTNER" INPUTS 🔥 */}
                        {enquiryForm.source === "Channel Partner" && (
                          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5 mt-2 p-5 bg-[#1e1e1e] rounded-xl border border-[#333]">
                             <h4 className="sm:col-span-3 text-xs font-bold text-purple-400 mb-1">Channel Partner Details</h4>
                             <div>
                               <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">CP Name *</label>
                               <input required type="text" value={enquiryForm.cpDetails.name} onChange={e => setEnquiryForm({...enquiryForm, cpDetails: {...enquiryForm.cpDetails, name: e.target.value}})} className="w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="Name" />
                             </div>
                             <div>
                               <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">CP Company *</label>
                               <input required type="text" value={enquiryForm.cpDetails.company} onChange={e => setEnquiryForm({...enquiryForm, cpDetails: {...enquiryForm.cpDetails, company: e.target.value}})} className="w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="Company Name" />
                             </div>
                             <div>
                               <label className="block text-xs text-gray-400 mb-1.5 font-medium pl-2">CP Contact *</label>
                               <input required type="tel" value={enquiryForm.cpDetails.phone} onChange={e => setEnquiryForm({...enquiryForm, cpDetails: {...enquiryForm.cpDetails, phone: e.target.value}})} className="w-full bg-[#121212] border border-[#333] rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="Phone No." />
                             </div>
                          </div>
                        )}

                      </div>
                    </div>
                  </form>
                </div>
                
                <div className="p-6 border-t border-[#2a2a2a] bg-[#151515] flex justify-end gap-4 shadow-inner">
                  <button onClick={() => setIsEnquiryModalOpen(false)} type="button" className="px-6 py-2.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors font-bold cursor-pointer hover:bg-red-500/10">Cancel</button>
                  <button form="enquiryForm" type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2.5 rounded-lg font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-colors cursor-pointer">Submit & Route Lead</button>
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