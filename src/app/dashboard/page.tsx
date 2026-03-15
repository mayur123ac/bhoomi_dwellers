"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FaUserPlus, FaChartBar, FaUsers, FaTicketAlt, 
  FaCheckCircle, FaSitemap, FaThLarge, FaCog, FaSun, FaBell, FaIdCard
} from "react-icons/fa";

export default function Dashboard() {
  const router = useRouter();
  
  // Default state includes email so the dropdown has data to show
  const [user, setUser] = useState({ 
    name: "Loading...", 
    role: "Loading...", 
    email: "" 
  });
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // 🔥 THE FIX: Prevent the UI from flashing until we verify the role
  const [isAuthorizing, setIsAuthorizing] = useState(true); 

  useEffect(() => {
    const storedUser = localStorage.getItem("crm_user");
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const userRole = String(parsedUser.role || "").toLowerCase();
      
      // 🔥 THE BOUNCER: Check role BEFORE showing anything
      if (userRole.includes("receptionist")) {
        router.push("/dashboard/receptionist"); // Or wherever your receptionist page is exactly
        return; // Stop running this code, keep the screen loading while it redirects
      } 
      
      // If they pass the check (Admin/Sales), set the user and drop the loading guard
      setUser(parsedUser);
      setIsAuthorizing(false); 
      
    } else {
      // If no user is logged in, kick them back to login
      router.push("/");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("crm_user");
    router.push("/");
  };

  // 🔥 THE GUARD SCREEN: Shows a spinner while checking roles instead of flashing the Admin UI
  if (isAuthorizing) {
    return (
      <div className="flex h-screen bg-[#121212] items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium animate-pulse">Verifying workspace access...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#121212] font-sans text-white overflow-hidden">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-20 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col items-center py-6 flex-shrink-0 z-40">
        
        {/* Company Logo */}
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-xl font-bold text-white mb-10 shadow-sm cursor-pointer">
          B
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col space-y-6 w-full">
          
          {/* 1. Dashboard Overview (Active state) */}
          <div className="group relative flex justify-center cursor-pointer w-full" title="Dashboard">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-900/20 border border-purple-800 text-purple-400">
              <FaThLarge className="w-6 h-6" />
            </div>
          </div>

          {/* 2. Tickets / Leads */}
          <div className="group relative flex justify-center cursor-pointer w-full" title="Tickets">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors border border-transparent hover:border-[#3a3a3a]">
              <FaTicketAlt className="w-6 h-6" />
            </div>
          </div>

          {/* 3. Teams / Hierarchy */}
          <div className="group relative flex justify-center cursor-pointer w-full" title="Teams">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors border border-transparent hover:border-[#3a3a3a]">
              <FaSitemap className="w-6 h-6" />
            </div>
          </div>

          {/* 4. Add Employee / Master Configs (Replaced Database Icon) */}
          <Link href="/dashboard/employees" className="group relative flex justify-center cursor-pointer w-full" title="Add Employee">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors border border-transparent hover:border-[#3a3a3a]">
              <FaIdCard className="w-6 h-6" />
            </div>
          </Link>

          {/* 5. Settings */}
          <div className="group relative flex justify-center cursor-pointer w-full" title="Settings">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors border border-transparent hover:border-[#3a3a3a]">
              <FaCog className="w-6 h-6" />
            </div>
          </div>
        </nav>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP HEADER (Navbar) */}
        <header className="h-16 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between px-8 flex-shrink-0 z-30">
          <h1 className="text-white font-semibold flex items-center text-sm md:text-base">
            BhoomiDwellersCRM <span className="text-gray-500 text-xs md:text-sm font-normal ml-2">- Workspace</span>
          </h1>
          
          <div className="flex items-center space-x-6 relative">
            <button className="text-yellow-500 hover:text-yellow-400 cursor-pointer transition-colors">
              <FaSun className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white cursor-pointer transition-colors">
              <FaBell className="w-5 h-5" />
            </button>
            
            {/* User Profile Avatar */}
            <div 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              className="w-9 h-9 rounded-full bg-green-900/30 text-green-500 border border-green-500/50 flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm hover:bg-green-900/50 transition-colors"
            >
              {String(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            {/* Profile Dropdown Modal */}
            {isProfileOpen && (
              <div className="absolute top-12 right-0 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-5 z-50 animate-fadeIn">
                <div className="mb-4">
                  <h3 className="text-white font-bold text-lg">{user.name}</h3>
                  <p className="text-gray-400 text-sm truncate">{user.email}</p>
                </div>
                <hr className="border-[#2a2a2a] mb-4" />
                <div className="space-y-2 mb-6 text-sm">
                  <p className="text-gray-400 flex justify-between">Role: <span className="text-white font-bold capitalize">{user.role}</span></p>
                  <p className="text-gray-400 flex justify-between">Team Lead: <span className="text-white font-bold">{(user.role || "").toLowerCase() === 'admin' ? 'Admin' : 'Unassigned'}</span></p>
                  <p className="text-gray-400 flex justify-between">Password: <span className="text-white font-bold tracking-widest">********</span></p>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="w-full bg-[#3B1F1F] text-[#F28B82] hover:bg-red-900/40 border border-red-900/30 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* SCROLLABLE DASHBOARD BODY */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#121212]">
          
          {/* Greeting Section */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center flex-wrap gap-3">
              Hi, {user.name}
              <span className="text-sm font-normal text-purple-400 bg-purple-900/20 border border-purple-900/50 px-3 py-1 rounded-full shadow-sm capitalize">
                {user.role}
              </span>
            </h1>
            <button className="text-purple-500 text-sm font-semibold flex items-center gap-2 hover:text-purple-400 cursor-pointer">
              🎥 Setup Guide
            </button>
          </div>

          <h2 className="text-lg font-bold mb-4">Get started</h2>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            
            {/* 🔥 Add Employee Card (Admin Only) 🔥 */}
            {(user.role || "").toLowerCase() === "admin" && (
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] flex flex-col items-center text-center shadow-sm hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 bg-[#121212] border border-[#2a2a2a] text-purple-500 rounded-full flex items-center justify-center text-xl mb-4">
                  <FaIdCard />
                </div>
                <h3 className="font-bold text-lg mb-1">Add Employee</h3>
                <p className="text-gray-400 text-xs mb-6 h-8">Create credentials and assign roles</p>
                <Link href="/dashboard/employees" className="w-full bg-[#f3e8ff] text-purple-700 hover:bg-purple-200 font-bold py-2.5 rounded-xl transition-colors text-sm">
                  + Add Employee
                </Link>
              </div>
            )}

            {/* Lead Card */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] flex flex-col items-center text-center shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 bg-[#121212] border border-[#2a2a2a] text-emerald-500 rounded-full flex items-center justify-center text-xl mb-4">
                <FaUserPlus />
              </div>
              <h3 className="font-bold text-lg mb-1">Lead</h3>
              <p className="text-gray-400 text-xs mb-6 h-8">Connect with potential customers</p>
              <button className="w-full bg-[#f3e8ff] text-purple-700 hover:bg-purple-200 font-bold py-2.5 rounded-xl transition-colors text-sm cursor-pointer">
                + Add site visit
              </button>
            </div>

            {/* Report Card */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] flex flex-col items-center text-center shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-14 bg-[#121212] border border-[#2a2a2a] text-orange-500 rounded-full flex items-center justify-center text-xl mb-4">
                <FaChartBar />
              </div>
              <h3 className="font-bold text-lg mb-1">Report</h3>
              <p className="text-gray-400 text-xs mb-6 h-8">Analyse your performance</p>
              <button className="w-full bg-[#f3e8ff] text-purple-700 hover:bg-purple-200 font-bold py-2.5 rounded-xl transition-colors text-sm cursor-pointer">
                Check reports
              </button>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-4">Current Data Reports</h2>
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a] flex justify-between items-start shadow-sm">
              <div>
                <p className="text-gray-400 text-xs font-semibold mb-1">Total Leads</p>
                <p className="text-3xl font-bold text-white">6</p>
              </div>
              <div className="w-10 h-10 bg-[#2a2a2a] rounded-xl flex items-center justify-center text-gray-400"><FaUsers className="w-5 h-5" /></div>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a] flex justify-between items-start shadow-sm">
              <div>
                <p className="text-gray-400 text-xs font-semibold mb-1">Active Site Visits</p>
                <p className="text-3xl font-bold text-yellow-500">4</p>
              </div>
              <div className="w-10 h-10 bg-[#2a2a2a] rounded-xl flex items-center justify-center text-yellow-500"><FaTicketAlt className="w-5 h-5" /></div>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a] flex justify-between items-start shadow-sm">
              <div>
                <p className="text-gray-400 text-xs font-semibold mb-1">Solved Tickets</p>
                <p className="text-3xl font-bold text-green-500">2</p>
              </div>
              <div className="w-10 h-10 bg-[#2a2a2a] rounded-xl flex items-center justify-center text-green-500"><FaCheckCircle className="w-5 h-5" /></div>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a] flex justify-between items-start shadow-sm">
              <div>
                <p className="text-gray-400 text-xs font-semibold mb-1">Active Teams</p>
                <p className="text-3xl font-bold text-purple-500">3</p>
              </div>
              <div className="w-10 h-10 bg-[#2a2a2a] rounded-xl flex items-center justify-center text-purple-500"><FaSitemap className="w-5 h-5" /></div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}