// src/app/platform-admin/layout.tsx
import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignOutButton from "./components/SignOutButton";
import PlatformSidebar from "./components/PlatformSidebar";

export const metadata = {
  title: "Nexora Command Center",
  description: "Enterprise SaaS control platform",
};

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const role = headersList.get("x-user-role");
  if (role !== "super_admin") {
    // Fallback protection if middleware missed it
    redirect("/platform-admin/login");
  }

  const userName = headersList.get("x-user-name") || "Platform Admin";

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] flex font-sans">
      {/* Premium Sidebar Component */}
      <PlatformSidebar userName={userName} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050816] relative">
        {/* Topbar */}
        <header className="h-20 bg-[rgba(11,16,35,0.8)] backdrop-blur-[16px] border-b border-[#1E293B]/50 flex items-center justify-between px-10 z-10 sticky top-0">
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Command Center</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative hidden lg:block">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                placeholder="Search tenant, user, or action..." 
                className="bg-[#111827] border border-[#1E293B] text-sm text-[#F8FAFC] placeholder-[#475569] rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/50 transition-all w-80 shadow-inner" 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
                <kbd className="px-1.5 py-0.5 bg-[#1E293B] border border-[#334155] rounded text-[10px] text-[#94A3B8] font-mono font-medium">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-[#1E293B] border border-[#334155] rounded text-[10px] text-[#94A3B8] font-mono font-medium">K</kbd>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 pl-4 border-l border-[#1E293B]">
              <button className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors relative p-2 rounded-lg hover:bg-[#111827]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#3B82F6] rounded-full border-2 border-[#070B1A] shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              </button>
              <SignOutButton />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-10 relative">
          {/* Subtle Background Glow for Dashboard */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#3B82F6]/5 rounded-full blur-[150px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#7C3AED]/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-[1400px] mx-auto relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
