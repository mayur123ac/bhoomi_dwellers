"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FaUserTie, FaListUl, FaPlus,
  FaTicketAlt, FaSitemap, FaThLarge, FaCog, FaSun, FaBell, FaLock, FaIdCard
} from "react-icons/fa";

// Define our TypeScript types
type RoleType = { _id: string; name: string };
type EmployeeType = { _id: string; name: string; email: string; role: string; isActive: boolean };

export default function EmployeesPage() {
  const router = useRouter();

  // --- LAYOUT & USER STATE ---
  const [user, setUser] = useState<{name: string, role: string, email: string} | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // --- EMPLOYEE PAGE STATE ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  
  const [dbRoles, setDbRoles] = useState<RoleType[]>([]);
  const [employees, setEmployees] = useState<EmployeeType[]>([]);
  const [newRoleInput, setNewRoleInput] = useState("");

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
        body: JSON.stringify({ name, email, password, role }),
      });

      if (res.ok) {
        setName(""); setEmail(""); setPassword(""); setRole("");
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
        fetchEmployees(); // Instantly re-render table and dropdown logic
      }
    } catch (error) {
      alert("Error updating status");
    }
  };

  // Show a loading state briefly while checking credentials
  if (isAuthorized === null) return <div className="min-h-screen bg-[#121212]"></div>;

  // Find the user currently selected in the "Manage Access" dropdown
  const selectedManageUser = employees.find(e => e._id === selectedManageUserId);

  return (
    <div className="flex h-screen bg-[#121212] font-sans text-white overflow-hidden">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-20 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col items-center py-6 flex-shrink-0 z-40">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-xl font-bold text-white mb-10 shadow-sm cursor-pointer">
          B
        </div>

        <nav className="flex flex-col space-y-6 w-full">
          
          {/* 1. Dashboard Overview */}
          <Link href="/dashboard" className="group relative flex justify-center cursor-pointer w-full" title="Dashboard">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors border border-transparent hover:border-[#3a3a3a]">
              <FaThLarge className="w-6 h-6" />
            </div>
          </Link>

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

          {/* 4. Add Employee (ACTIVE PAGE) - ID Card */}
          <div className="group relative flex justify-center cursor-pointer w-full" title="Add Employee / Configurations">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"></div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-900/20 border border-purple-800 text-purple-400">
              <FaIdCard className="w-6 h-6" />
            </div>
          </div>

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
            
            <div 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              className="w-9 h-9 rounded-full bg-green-900/30 text-green-500 border border-green-500/50 flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm hover:bg-green-900/50 transition-colors"
            >
              {user?.name.charAt(0).toUpperCase()}
            </div>

            {isProfileOpen && (
              <div className="absolute top-12 right-0 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-5 z-50 animate-fadeIn">
                <div className="mb-4">
                  <h3 className="text-white font-bold text-lg">{user?.name}</h3>
                  <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                </div>
                <hr className="border-[#2a2a2a] mb-4" />
                <div className="space-y-2 mb-6 text-sm">
                  <p className="text-gray-400 flex justify-between">Role: <span className="text-white font-bold capitalize">{user?.role}</span></p>
                  <p className="text-gray-400 flex justify-between">Team Lead: <span className="text-white font-bold">{user?.role.toLowerCase() === 'admin' ? 'Admin' : 'Unassigned'}</span></p>
                  <p className="text-gray-400 flex justify-between">Password: <span className="text-white font-bold tracking-widest">********</span></p>
                </div>
                <button onClick={handleLogout} className="w-full bg-[#3B1F1F] text-[#F28B82] hover:bg-red-900/40 border border-red-900/30 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer">
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#121212]">
          
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
            <>
              {/* ADMIN SECURE CONTENT BELOW */}
              <h1 className="text-2xl font-bold mb-6">Master Configurations</h1>

              {/* Tabs - Locations & Projects removed */}
              <div className="flex flex-wrap gap-2 mb-8">
                <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg border border-purple-500 shadow-sm"><FaUserTie /> Employees</button>
                <button className="flex items-center gap-2 bg-[#1a1a1a] text-gray-400 px-4 py-2 rounded-lg border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors"><FaListUl /> Lead Statuses</button>
              </div>

              {/* Add Custom Role Section */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-5 mb-6 flex flex-wrap items-end gap-4 shadow-sm">
                <div className="flex-1 max-w-sm">
                  <label className="block text-xs text-purple-400 font-semibold mb-2">Add a Custom System Role</label>
                  <input type="text" value={newRoleInput} onChange={(e)=>setNewRoleInput(e.target.value)} className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="e.g. Marketing Lead" />
                </div>
                <button onClick={handleAddNewRole} type="button" className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm font-semibold py-2.5 px-4 rounded-lg border border-[#3a3a3a] transition-colors flex items-center gap-2">
                  <FaPlus className="text-purple-500 text-xs" /> Add to Dropdown
                </button>
              </div>

              {/* Create Employee Form */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6 mb-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-5">Create & Assign Role to Employee</h2>
                <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-5 gap-5 items-end">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name</label>
                    <input type="text" value={name} onChange={(e)=>setName(e.target.value)} required className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
                    <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="email@company.com" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
                    <input type="text" value={password} onChange={(e)=>setPassword(e.target.value)} required className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-white transition-colors" placeholder="Set password" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Assign Role</label>
                    <select value={role} onChange={(e)=>setRole(e.target.value)} required className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-gray-300 transition-colors cursor-pointer">
                      <option value="" disabled>-- Choose Role --</option>
                      {dbRoles.map((r) => (
                        <option key={r._id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm cursor-pointer">
                    Add Employee
                  </button>
                </form>
              </div>

              {/* 🔥 NEW: ACCOUNT ACTIVATION DROPDOWN MODULE 🔥 */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6 mb-8 shadow-sm">
                <h2 className="text-lg font-semibold mb-5">Account Activation Management</h2>
                <div className="flex flex-col md:flex-row items-end gap-5">
                  <div className="flex-1 w-full max-w-md">
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Select Employee</label>
                    <select 
                      value={selectedManageUserId} 
                      onChange={(e) => setSelectedManageUserId(e.target.value)} 
                      className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none text-white transition-colors cursor-pointer"
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
                          ? "bg-red-600 hover:bg-red-700 text-white" 
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {selectedManageUser.isActive ? "Deactivate Account" : "Activate Account"}
                    </button>
                  ) : (
                    <button disabled className="py-2.5 px-6 rounded-lg font-bold text-sm bg-[#2a2a2a] text-gray-500 cursor-not-allowed">
                      Select User
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Registered Employees Table */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[#2a2a2a] bg-[#1a1a1a]"><h2 className="text-lg font-semibold">Registered Employees Database</h2></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs uppercase bg-[#2a2a2a]">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Name</th>
                        <th className="px-6 py-4 font-semibold">Username</th>
                        <th className="px-6 py-4 font-semibold">Email</th>
                        <th className="px-6 py-4 font-semibold">Assigned Role</th>
                        <th className="px-6 py-4 font-semibold text-center">System Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {employees.map((emp) => (
                        <tr key={emp._id} className="hover:bg-[#252525] transition-colors">
                          <td className="px-6 py-4 text-white font-medium">{emp.name}</td>
                          <td className="px-6 py-4">N/A</td>
                          <td className="px-6 py-4">{emp.email}</td>
                          <td className="px-6 py-4 text-purple-400 font-semibold capitalize">{emp.role}</td>
                          <td className="px-6 py-4 text-center">
                            {/* Visual Indicator matching screenshot perfectly */}
                            <span 
                              className={`border px-3 py-1 rounded text-xs font-bold uppercase tracking-widest inline-block w-[80px] ${
                                emp.isActive 
                                ? "border-green-500/30 text-green-500 bg-green-500/10" 
                                : "border-red-500/30 text-red-500 bg-red-500/10"
                              }`}
                            >
                              {emp.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      
                      {employees.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No employees found in the database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          )}
        </main>
      </div>
    </div>
  );
}