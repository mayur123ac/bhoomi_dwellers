"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaBuilding } from "react-icons/fa";
import { MdPerson, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md"; // 🔥 MdEmail → MdPerson

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // 🔥 was: email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }), // 🔥 was: { email, password }
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("crm_user", JSON.stringify(data.user));
        
        const userRole = data.user.role.toLowerCase();
        if (userRole === "receptionist") {
          router.push("/dashboard/receptionist");
        } else if (userRole === "admin") {
          router.push("/dashboard");
        } else if (userRole === "sales manager") {
          router.push("/dashboard/sales");
        } else if (userRole === "caller") {   // 🔥 ADD THIS
          router.push("/dashboard/caller");
        } else {
          router.push("/dashboard");
        }
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Invalid credentials.");
      }
    } catch (err) {
      setError("Something went wrong communicating with the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl border border-[#2a2a2a] p-8 shadow-2xl">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#2a2a2a] rounded-xl flex items-center justify-center mb-4">
            <FaBuilding className="text-purple-500 text-2xl" />
          </div>
          <h1 className="text-white text-2xl font-bold">Bhoomi Dwellers</h1>
          <p className="text-gray-400 text-sm mt-1">Real Estate CRM Portal</p>
        </div>

        {/* Login Form */}
        <div className="border-t border-[#2a2a2a] pt-6">
          <h2 className="text-white text-xl font-semibold mb-1">Welcome Back</h2>
          <p className="text-gray-400 text-sm mb-6">Sign in to manage your leads and properties.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Email or Username</label>
              <div className="relative">
                <MdPerson className="absolute left-3 top-3.5 text-gray-500 text-lg" />
                <input 
                  type="text"  // 🔥 must be "text" not "email" — browser blocks usernames on type="email"
                  className="w-full bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="name@gmail.com or username"
                  value={identifier}                        // 🔥 was: email
                  onChange={(e) => setIdentifier(e.target.value)} // 🔥 was: setEmail
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-white text-sm font-medium">Password</label>
                <Link href="#" className="text-purple-500 text-sm hover:text-purple-400">Forgot Password?</Link>
              </div>
              <div className="relative">
                <MdLock className="absolute left-3 top-3.5 text-gray-500 text-lg" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg py-2.5 pl-10 pr-10 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  {showPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-500/50 text-red-500 text-sm p-3.5 rounded-lg flex items-start animate-fadeIn mt-2">
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors mt-4 flex justify-center items-center gap-2 cursor-pointer"
            >
              {isLoading ? "Authenticating..." : <>Log In <span>→</span></>}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-400">
            New Employee? <Link href="/signup" className="text-purple-500 hover:text-purple-400 font-medium">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}