"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaBuilding } from "react-icons/fa";
import { MdPerson, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useTenant } from "@/components/TenantProvider";
import { getDashboardPath } from "@/lib/rbac";

export default function Login() {
  const router = useRouter();
  const { branding, slug, isLoading: tenantLoading } = useTenant();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, slug }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("crm_user", JSON.stringify(data.user));

        // Use centralized RBAC for role-based redirect
        router.push(getDashboardPath(data.user.role || "", String(slug)));
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

  // ─── Theme Tokens ─────────────────────────────────────────────────────────
  const theme = {
    pageBg: isDark ? "bg-[#0A0A0F]" : "bg-[#F0F0F7]",
    cardBg: isDark ? "bg-[#121218]" : "bg-white",
    inputBg: isDark ? "bg-[#14141B]" : "bg-[#F5F5FC]",
    cardBorder: isDark ? "border-[#2A2A35]" : "border-[#D8D8E8]",
    inputBorder: isDark ? "border-[#2A2A35]" : "border-[#C8C8DC]",
    heading: isDark ? "text-white" : "text-[#0A0A1A]",
    subtext: isDark ? "text-[#888899]" : "text-[#555568]",
    label: isDark ? "text-[#B0B0C4]" : "text-[#444458]",
    inputText: isDark ? "text-white" : "text-[#0A0A1A]",
    inputPlaceholder: isDark ? "placeholder-[#44445A]" : "placeholder-[#AAAABC]",
    iconColor: isDark ? "text-[#55556A]" : "text-[#9090A8]",
    toggleBg: isDark ? "bg-[#1C1C2A] border-[#2A2A38]" : "bg-[#E8E8F5] border-[#C4C4DC]",
    toggleText: isDark ? "text-yellow-300" : "text-indigo-500",
    divider: isDark ? "border-[#1E1E2A]" : "border-[#E0E0EE]",
    logoBg: isDark ? "bg-[#1A1A28]" : "bg-[#EAEAF8]",
    errorBg: isDark ? "bg-red-950/40 border-red-600/40 text-red-400" : "bg-red-50 border-red-300 text-red-600",
  };

  if (tenantLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center transition-all duration-300 relative px-4 py-8 pb-20"
      style={
        isDark
          ? {
              backgroundColor: "#0A0A0F",
              backgroundImage:
                "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(var(--brand-primary-rgb, 123,47,247), 0.12) 0%, transparent 70%)",
            }
          : {
              backgroundImage: "url('/assets/bglo.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
      }
    >
      <button
        onClick={() => setIsDark(!isDark)}
        aria-label="Toggle theme"
        className={`fixed top-4 right-4 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all duration-200 hover:scale-105 ${theme.toggleBg} ${theme.toggleText} shadow-lg`}
      >
        {isDark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      <div
        className={`fixed bottom-0 left-0 right-0 border-t ${isDark ? "border-[#1E1E2C] bg-[#0A0A0F]/90" : "border-[#DDDDF0] bg-[#F0F0F7]/90"} backdrop-blur-sm px-6 py-3 flex items-center justify-center transition-colors duration-300`}
      >
        <p className={`text-[9px] sm:text-[10px] font-semibold tracking-[0.15em] uppercase text-center transition-colors duration-300 ${isDark ? "text-[#3A3A55]" : "text-[#9898B8]"}`}>
          © {new Date().getFullYear()} {branding?.crm_title || "CRM Portal"}. Engineered by Nexora.
        </p>
      </div>

      <div
        className={`${theme.cardBg} w-full max-w-[400px] rounded-2xl border ${theme.cardBorder} p-4 sm:p-6 shadow-2xl transition-colors duration-300`}
      >
        {/* Logo and Tenant Branding */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div
            className={`w-12 h-12 sm:w-16 sm:h-16 ${theme.logoBg} rounded-xl flex items-center justify-center mb-3 transition-colors duration-300 overflow-hidden`}
            style={{ boxShadow: "0 0 0 1px var(--brand-primary, rgba(123,47,247,0.2))" }}
          >
            {branding?.logo ? (
              <img src={branding.logo} alt="Company Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <FaBuilding className="text-3xl" style={{ color: "var(--brand-primary, #9F5CFF)" }} />
            )}
          </div>
          <h1 className={`${theme.heading} text-[1.1rem] sm:text-[1.35rem] font-bold tracking-tight transition-colors duration-300 text-center`}>
            {branding?.crm_title || "CRM Portal"}
          </h1>
          <p className={`${theme.subtext} text-xs mt-0.5 transition-colors duration-300`}>Tenant Access Portal</p>
        </div>

        <div className={`border-t ${theme.divider} mb-5 transition-colors duration-300`} />

        <form onSubmit={handleLogin} className="space-y-4 mb-7">
          <div>
            <label className={`block ${theme.label} text-xs font-medium mb-1.5 transition-colors duration-300`}>Email</label>
            <div className="relative">
              <MdPerson className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.iconColor} text-[1.1rem] transition-colors duration-300`} />
              <input
                type="text"
                className={`w-full ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} border ${theme.inputBorder} rounded-xl py-2 sm:py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 transition-all duration-200`}
                placeholder="name@company.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className={`${theme.label} text-xs font-medium transition-colors duration-300`}>Password</label>
            </div>
            <div className="relative">
              <MdLock className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.iconColor} text-[1.1rem] transition-colors duration-300`} />
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} border ${theme.inputBorder} rounded-xl py-2 sm:py-2.5 pl-9 pr-10 text-sm focus:outline-none focus:ring-1 transition-all duration-200`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.iconColor} hover:text-[#9F5CFF] transition-colors duration-150 cursor-pointer`}
              >
                {showPassword ? <MdVisibilityOff className="text-[1.1rem]" /> : <MdVisibility className="text-[1.1rem]" />}
              </button>
            </div>
          </div>

          {error && (
            <div className={`${theme.errorBg} border text-xs p-3 rounded-xl flex items-start animate-fadeIn transition-colors duration-300`}>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-semibold py-2.5 sm:py-3 rounded-xl text-sm sm:text-base transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-1"
            style={{
              background: `linear-gradient(135deg, var(--brand-primary, #12B5CB), var(--brand-secondary, #7B2FF7))`,
            }}
          >
            {isLoading ? "Authenticating..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}