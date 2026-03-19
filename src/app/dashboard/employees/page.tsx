"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUserTie, FaListUl, FaPlus,
  FaTicketAlt, FaSitemap, FaThLarge, FaCog, FaSun, FaBell, FaLock, FaIdCard,
  FaClipboardList, FaUsers, FaEye, FaEyeSlash, FaTrash, FaUserEdit,
  FaPhoneAlt  // 🔥 ADD THIS
} from "react-icons/fa";

// Define our TypeScript types
type RoleType = { _id: string; name: string };
type EmployeeType = { _id: string; name: string; username: string; email: string; role: string; isActive: boolean; password?: string };

export default function EmployeesPage() {
  const router = useRouter();

  // --- LAYOUT & USER STATE ---
  const [activeView, setActiveView] = useState("employees"); // Setting a pseudo active view for sidebar sync
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [user, setUser] = useState<{name: string, role: string, email: string, password?: string} | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  

  // --- EMPLOYEE PAGE STATE ---
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  
  const [dbRoles, setDbRoles] = useState<RoleType[]>([]);
  const [employees, setEmployees] = useState<EmployeeType[]>([]);
  const [newRoleInput, setNewRoleInput] = useState("");
  const [revealedPasswords, setRevealedPasswords] = useState<{ [key: string]: boolean }>({});

  // --- INLINE EDIT STATE ---
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editForm, setEditForm]       = useState<Partial<EmployeeType>>({});
  const [editSaving, setEditSaving]   = useState(false);
  const [editError, setEditError]     = useState("");

  // --- ACCESS MANAGEMENT STATE ---
  const [selectedManageUserId, setSelectedManageUserId] = useState("");

  // Fetch logged-in user and enforce strict RBAC Security
  useEffect(() => {
    const storedUser = localStorage.getItem("crm_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Strict Admin Check
      if (parsedUser.role.toLowerCase() === "admin") {
        setIsAuthorized(true);
        fetchRoles();
        fetchEmployees();
      } else {
        setIsAuthorized(false); // Lock them out
      }
    } else {
      router.push("/"); // Boot to login if no session exists
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("crm_user");
    router.push("/");
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) setDbRoles(await res.json());
    } catch (error) {
      console.log("Failed to fetch roles", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) setEmployees(await res.json());
    } catch (error) {
      console.log("Failed to fetch employees", error);
    }
  };

  const handleAddNewRole = async () => {
    if (!newRoleInput.trim()) return;
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleInput }),
      });
      if (res.ok) {
        setNewRoleInput("");
        fetchRoles(); 
      } else {
        const data = await res.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert("Something went wrong");
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password, role }),
      });

      if (res.ok) {
        setName(""); setUsername(""); setEmail(""); setPassword(""); setRole("");
        fetchEmployees(); 
      } else {
        const data = await res.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert("Something went wrong");
    }
  };

  // Function to toggle Active/Inactive status
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });

      if (res.ok) {
        fetchEmployees(); 
      }
    } catch (error) {
      alert("Error updating status");
    }
  };

  // Function to entirely delete an employee
  const handleDeleteEmployee = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete the account for ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch("/api/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        if (selectedManageUserId === userId) setSelectedManageUserId(""); 
        fetchEmployees(); 
      } else {
        const data = await res.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert("Error deleting employee.");
    }
  };
  const handleEditStart = (emp: EmployeeType) => {
    setEditingId(emp._id);
    setEditError("");
    setEditForm({
      name:     emp.name,
      username: emp.username,
      email:    emp.email,
      password: emp.password || "",
      role:     emp.role,
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
    setEditError("");
  };

  const handleEditSave = async (userId: string) => {
    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, editData: editForm }),
      });

      const data = await res.json();

      if (res.ok) {
        setEditingId(null);
        setEditForm({});
        fetchEmployees(); // 🔥 Re-fetch to reflect latest DB state
      } else {
        setEditError(data.message || "Failed to save changes.");
      }
    } catch (error) {
      setEditError("Something went wrong. Please try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const toggleRowPassword = (id: string) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 🔥 FIXED: All main dashboard links point back to /dashboard 🔥
  const menuItems = [
    { id: "dashboard",    icon: FaThLarge,      label: "Overview",      link: "/dashboard" },
    { id: "receptionist", icon: FaClipboardList, label: "Receptionist",  link: "/dashboard" },
    { id: "sales",        icon: FaUsers,         label: "Sales Managers",link: "/dashboard" },
    { id: "employees",    icon: FaIdCard,        label: "Add Employee",  link: "/dashboard/employees" },
    { id: "callers",      icon: FaPhoneAlt,      label: "Caller Panel",  link: "/dashboard/caller" }, // 🔥 FIXED
  ];

  // Show a loading state briefly while checking credentials
  if (isAuthorized === null) return <div className="min-h-screen bg-[#0a0a0a]"></div>;

  const selectedManageUser = employees.find(e => e._id === selectedManageUserId);

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

      {/* ================= ATLAS-STYLE FLOATING SIDEBAR ================= */}
      <motion.aside
        initial={{ width: "80px" }} animate={{ width: isSidebarHovered ? "240px" : "80px" }} transition={{ duration: 0.2, ease: "easeInOut" }}
        onMouseEnter={() => setIsSidebarHovered(true)} onMouseLeave={() => setIsSidebarHovered(false)}
        className="fixed left-0 top-0 h-screen bg-[#111111] border-r border-[#222] z-50 flex flex-col py-6 overflow-hidden shadow-2xl"
      >
        <div className="flex items-center px-5 mb-10 whitespace-nowrap">
          <div className="w-10 h-10 min-w-[40px] bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg cursor-pointer">
            B
          </div>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: isSidebarHovered ? 1 : 0 }} className="ml-4 font-bold text-lg text-white tracking-wide">
            Bhoomi CRM
          </motion.span>
        </div>

       <nav className="flex flex-col gap-2 px-3 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.link}
              onClick={() => { 
                  setIsSidebarHovered(false);
                  // Save return tab for non-employee, non-caller routes
                  if (item.id !== "employees" && item.id !== "callers") {
                    localStorage.setItem("return_tab", item.id);
                  }
              }}
              className={`flex items-center px-3 py-3.5 rounded-xl cursor-pointer transition-colors whitespace-nowrap relative group
                ${activeView === item.id ? "bg-purple-500/10 text-purple-400" : "text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-300"}
              `}
            >
              {activeView === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full" />}
              <item.icon className="w-5 h-5 min-w-[20px] ml-1" />
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: isSidebarHovered ? 1 : 0 }} className={`ml-5 font-semibold text-sm ${activeView === item.id ? "text-purple-300" : ""}`}>
                {item.label}
              </motion.span>
            </Link>
          ))}
        </nav>

        <div className="px-3 mt-auto">
          <div className="flex items-center px-3 py-3.5 rounded-xl cursor-pointer text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-300 transition-colors whitespace-nowrap">
            <FaCog className="w-5 h-5 min-w-[20px] ml-1" />
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: isSidebarHovered ? 1 : 0 }} className="ml-5 font-semibold text-sm">
              Settings
            </motion.span>
          </div>
        </div>
      </motion.aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col pl-[80px] h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-[#111111]/80 backdrop-blur-md border-b border-[#222] flex items-center justify-between px-8 z-30">
          <h1 className="text-white font-bold text-lg capitalize tracking-wide flex items-center gap-3">
            Add Employee 
            <span className="bg-[#222] text-gray-400 px-2 py-0.5 rounded text-xs border border-[#333]">Admin Root</span>
          </h1>
          
          <div className="flex items-center space-x-6 relative">
            <button className="text-gray-400 hover:text-white cursor-pointer transition-colors relative">
              <FaBell className="w-5 h-5" />
            </button>
            
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
                        <span className="font-mono text-gray-300 tracking-widest text-xs">{showPassword ? user?.password : "••••••••"}</span>
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

        {/* SCROLLABLE BODY */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a] custom-scrollbar">
          
          {/* 🔥 STRICT RBAC SECURITY GATE 🔥 */}
          {!isAuthorized ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center text-4xl mb-6">
                <FaLock />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
              <p className="text-gray-400 mb-8 max-w-md">You do not have the required Administrator permissions to view the Master Configurations database.</p>
              <Link href="/dashboard" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                Return to Dashboard
              </Link>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              {/* ADMIN SECURE CONTENT BELOW */}
              <h1 className="text-2xl font-bold mb-6 text-white">Master Configurations</h1>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-8">
                <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg border border-purple-500 shadow-sm"><FaUserTie /> Employees</button>
                <button className="flex items-center gap-2 bg-[#111] text-gray-400 px-4 py-2 rounded-lg border border-[#222] hover:bg-[#222] transition-colors"><FaListUl /> Lead Statuses</button>
              </div>

              {/* Add Custom Role Section */}
              <div className="bg-[#111111] rounded-xl border border-[#222] p-5 mb-6 flex flex-wrap items-end gap-4 shadow-sm">
                <div className="flex-1 max-w-sm">
                  <label className="block text-xs text-purple-400 font-semibold mb-2">Add a Custom System Role</label>
                  <input type="text" value={newRoleInput} onChange={(e)=>setNewRoleInput(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="e.g. Marketing Lead" />
                </div>
                <button onClick={handleAddNewRole} type="button" className="bg-[#222] hover:bg-[#333] text-white text-sm font-semibold py-2.5 px-4 rounded-lg border border-[#444] transition-colors flex items-center gap-2 cursor-pointer">
                  <FaPlus className="text-purple-500 text-xs" /> Add to Dropdown
                </button>
              </div>

              {/* Create Employee Form */}
              <div className="bg-[#111111] rounded-xl border border-[#222] p-6 mb-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-5 text-white">Create & Assign Role to Employee</h2>
               <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name</label>
                    <input type="text" value={name} onChange={(e)=>setName(e.target.value)} required 
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-white transition-colors" 
                      placeholder="e.g. John Doe" />
                  </div>

                  {/* 🔥 NEW USERNAME FIELD */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Username</label>
                    <input type="text" value={username} onChange={(e)=>setUsername(e.target.value)} required 
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-white transition-colors" 
                      placeholder="e.g. johndoe" />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
                    <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required 
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-white transition-colors" 
                      placeholder="email@company.com" />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
                    <input type="text" value={password} onChange={(e)=>setPassword(e.target.value)} required 
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-white transition-colors" 
                      placeholder="Set password" />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Assign Role</label>
                    <select value={role} onChange={(e)=>setRole(e.target.value)} required 
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-gray-300 transition-colors cursor-pointer">
                      <option value="" disabled>-- Choose Role --</option>
                      {dbRoles.map((r) => (
                        <option key={r._id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" 
                    className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm cursor-pointer">
                    Add Employee
                  </button>

                 </form>
              </div>

              {/* 🔥 ACCOUNT ACTIVATION DROPDOWN MODULE 🔥 */}
              <div className="bg-[#111111] rounded-xl border border-[#222] p-6 mb-8 shadow-sm">
                <h2 className="text-lg font-semibold mb-5 text-white">Account Activation Management</h2>
                <div className="flex flex-col md:flex-row items-end gap-5">
                  <div className="flex-1 w-full max-w-md">
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Select Employee</label>
                    <select 
                      value={selectedManageUserId} 
                      onChange={(e) => setSelectedManageUserId(e.target.value)} 
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-white transition-colors cursor-pointer"
                    >
                      <option value="" disabled>-- Select user to manage --</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.email} ({emp.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Dynamic Action Button based on User selection */}
                  {selectedManageUser ? (
                    <button 
                      onClick={() => handleToggleStatus(selectedManageUser._id, selectedManageUser.isActive)}
                      className={`py-2.5 px-6 rounded-lg font-bold text-sm transition-colors cursor-pointer ${
                        selectedManageUser.isActive 
                          ? "bg-red-600 hover:bg-red-700 text-white border border-red-500" 
                          : "bg-green-600 hover:bg-green-700 text-white border border-green-500"
                      }`}
                    >
                      {selectedManageUser.isActive ? "Deactivate Account" : "Activate Account"}
                    </button>
                  ) : (
                    <button disabled className="py-2.5 px-6 rounded-lg font-bold text-sm bg-[#222] border border-[#333] text-gray-500 cursor-not-allowed">
                      Select User
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Registered Employees Table */}
              <div className="bg-[#111111] rounded-xl border border-[#222] overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[#222] bg-[#151515]">
                  <h2 className="text-lg font-semibold text-white">Registered Employees Database</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs uppercase bg-[#1a1a1a]">
                      <tr>
                        <th className="px-6 py-4 font-semibold border-b border-[#222]">Name</th>
                        <th className="px-6 py-4 font-semibold border-b border-[#222]">Username</th>
                        <th className="px-6 py-4 font-semibold border-b border-[#222]">Email</th>
                        <th className="px-6 py-4 font-semibold border-b border-[#222]">Password</th>
                        <th className="px-6 py-4 font-semibold border-b border-[#222]">Assigned Role</th>
                        <th className="px-6 py-4 font-semibold border-b border-[#222] text-center">System Status</th>
                        <th className="px-6 py-4 font-semibold border-b border-[#222] text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222]">
                      {employees.map((emp) => {
                        const isRevealed = revealedPasswords[emp._id] || false;
                        const isEditing  = editingId === emp._id;

                        return (
                          <tr key={emp._id} className={`transition-colors group ${isEditing ? "bg-[#1a1a2e]" : "hover:bg-[#151515]"}`}>

                            {/* NAME */}
                            <td className="px-4 py-3 text-white font-medium">
                              {isEditing
                                ? <input value={editForm.name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full bg-[#0f0f0f] border border-purple-500/50 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-purple-400" />
                                : emp.name}
                            </td>

                            {/* USERNAME */}
                            <td className="px-4 py-3 text-gray-300 font-mono">
                              {isEditing
                                ? <input value={editForm.username || ""} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                                    className="w-full bg-[#0f0f0f] border border-purple-500/50 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-purple-400" />
                                : emp.username}
                            </td>

                            {/* EMAIL */}
                            <td className="px-4 py-3">
                              {isEditing
                                ? <input type="email" value={editForm.email || ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                                    className="w-full bg-[#0f0f0f] border border-purple-500/50 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-purple-400" />
                                : emp.email}
                            </td>

                            {/* PASSWORD */}
                            <td className="px-4 py-3">
                              {isEditing
                                ? <input value={editForm.password || ""} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                                    className="w-full bg-[#0f0f0f] border border-purple-500/50 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-purple-400" />
                                : (
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-gray-300 tracking-wider">
                                      {isRevealed ? (emp.password || "N/A") : "••••••••"}
                                    </span>
                                    <button onClick={() => toggleRowPassword(emp._id)} className="text-gray-500 hover:text-purple-400 transition-colors cursor-pointer">
                                      {isRevealed ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                  </div>
                                )}
                            </td>

                            {/* ROLE */}
                            <td className="px-4 py-3 text-purple-400 font-semibold capitalize">
                              {isEditing
                                ? (
                                  <select value={editForm.role || ""} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                                    className="w-full bg-[#0f0f0f] border border-purple-500/50 rounded-lg px-2.5 py-1.5 text-sm text-purple-300 outline-none focus:border-purple-400 cursor-pointer">
                                    {dbRoles.map(r => (
                                      <option key={r._id} value={r.name}>{r.name}</option>
                                    ))}
                                  </select>
                                )
                                : emp.role}
                            </td>

                            {/* STATUS */}
                            <td className="px-4 py-3 text-center">
                              <span className={`border px-3 py-1 rounded text-xs font-bold uppercase tracking-widest inline-block w-[80px] ${
                                emp.isActive
                                  ? "border-green-500/30 text-green-500 bg-green-500/10"
                                  : "border-red-500/30 text-red-500 bg-red-500/10"
                              }`}>
                                {emp.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>

                            {/* ACTIONS */}
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <div className="flex flex-col items-center gap-1.5">
                                  {/* Save / Cancel buttons */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleEditSave(emp._id)}
                                      disabled={editSaving}
                                      className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    >
                                      {editSaving ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      onClick={handleEditCancel}
                                      className="bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                  {/* Inline error message */}
                                  {editError && (
                                    <span className="text-red-400 text-xs text-center leading-tight max-w-[120px]">{editError}</span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  {/* Edit button */}
                                  <button
                                    onClick={() => handleEditStart(emp)}
                                    className="text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 p-2 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Employee"
                                  >
                                    <FaUserEdit />
                                  </button>
                                  {/* Delete button */}
                                  <button
                                    onClick={() => handleDeleteEmployee(emp._id, emp.name)}
                                    className="text-gray-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Employee Permanently"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              )}
                            </td>

                          </tr>
                        );
                      })}

                      {employees.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            No employees found in the database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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