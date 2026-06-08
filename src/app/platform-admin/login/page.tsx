"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { FaShieldAlt } from "react-icons/fa";

export default function PlatformLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/platform/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/platform-admin/dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050816] via-[#0B1023] to-[#111827] relative overflow-hidden font-sans">
      
      {/* Subtle Animated Mesh / Wave Pattern (CSS approximation) */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      
      {/* Blue Ambient Glow Lighting */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#3B82F6]/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#2563EB]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div 
        className="w-full max-w-md p-10 relative z-10 rounded-[20px] backdrop-blur-xl transition-all duration-300"
        style={{
          background: "rgba(17, 24, 39, 0.75)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          boxShadow: "0 0 60px rgba(59, 130, 246, 0.15)"
        }}
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#111827] border-2 border-transparent bg-clip-padding relative mb-6">
            {/* Glowing Blue Ring Around Logo */}
            <div className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] z-0 animate-pulse" style={{ opacity: 0.6, filter: 'blur(2px)' }}></div>
            <div className="absolute inset-[-2px] rounded-full bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] z-0"></div>
            <div className="absolute inset-[2px] rounded-full bg-[#111827] z-10 flex items-center justify-center">
              <span className="text-2xl font-bold text-white tracking-wider">N</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight mb-2">
            NEXORA <span className="text-[#3B82F6]">PLATFORM</span>
          </h1>
          <p className="text-[#94A3B8] text-sm font-medium">Secure Super Admin Access</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded-xl text-sm text-center font-medium shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Admin Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiMail className="h-5 w-5 text-[#94A3B8] group-focus-within:text-[#3B82F6] transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC] rounded-xl focus:ring-0 focus:border-[#3B82F6] outline-none transition-all placeholder-[#475569] shadow-inner"
                style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                placeholder="admin@nexora.io"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiLock className="h-5 w-5 text-[#94A3B8] group-focus-within:text-[#3B82F6] transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC] rounded-xl focus:ring-0 focus:border-[#3B82F6] outline-none transition-all placeholder-[#475569] shadow-inner"
                style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                placeholder="Enter your password"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors focus:outline-none"
                >
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-4 h-4">
                <input type="checkbox" className="peer appearance-none w-4 h-4 rounded border border-[#1E293B] bg-[#0F172A] checked:bg-[#3B82F6] checked:border-[#3B82F6] transition-colors cursor-pointer" />
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-[#94A3B8] group-hover:text-[#E2E8F0] transition-colors">Remember me</span>
            </label>
            <a href="#" className="text-[#3B82F6] hover:text-[#60A5FA] font-medium transition-colors">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold rounded-xl transition-all flex justify-center items-center group relative overflow-hidden"
            style={{ boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}
          >
            {/* Subtle glow hover effect on button */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="relative z-10 flex items-center tracking-wide">
                Access Platform 
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
            )}
          </button>
        </form>

        <div className="mt-10 flex items-center justify-center text-[#475569] text-xs font-medium tracking-wide">
          <FaShieldAlt className="mr-2 h-3.5 w-3.5 text-[#3B82F6]/70" />
          <span>Secure • Encrypted • Enterprise Protected</span>
        </div>
      </div>
    </div>
  );
}
