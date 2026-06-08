"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PlatformOrganizations() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchOrgs() {
    setLoading(true);
    try {
      const res = await fetch("/api/platform/organizations");
      const json = await res.json();
      if (json.success) setOrgs(json.data);
    } catch (err) {
      console.error("Failed to fetch orgs", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change this organization to ${newStatus}?`)) return;
    
    try {
      const res = await fetch(`/api/platform/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchOrgs();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">Organizations Directory</h1>
          <p className="text-[#94A3B8] mt-1 font-medium text-sm">Manage all tenants and subscriptions on the platform.</p>
        </div>
        <Link 
          href="/platform-admin/organizations/create" 
          className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <svg className="w-5 h-5 mr-2 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          <span className="relative z-10">New Organization</span>
        </Link>
      </div>

      <div className="bg-[#111827] rounded-2xl border border-[#1E293B] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3B82F6] mb-4"></div>
            <div className="text-sm font-semibold text-[#94A3B8]">Loading tenants...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2 p-4">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Users</th>
                  <th className="px-6 py-3">Leads</th>
                  <th className="px-6 py-3">MRR</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="space-y-4">
                {orgs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <div className="text-[#94A3B8] font-medium bg-[#151D33] p-6 rounded-xl border border-[#1E293B] inline-block">
                        No organizations found.
                      </div>
                    </td>
                  </tr>
                ) : (
                  orgs.map((org) => (
                    <tr key={org.id} className="bg-[#151D33] hover:bg-[#1E293B] group transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-xl relative">
                      <td className="px-6 py-4 rounded-l-xl border-y border-l border-[#1E293B] group-hover:border-[#3B82F6]/30 transition-colors">
                        <div className="font-bold text-[#F8FAFC]">{org.name}</div>
                        <div className="text-xs font-medium text-[#475569] mt-0.5">{org.slug}.nexora.io</div>
                      </td>
                      <td className="px-6 py-4 border-y border-[#1E293B] group-hover:border-[#3B82F6]/30 transition-colors">
                        <div className="inline-flex items-center text-xs font-bold text-[#E2E8F0] bg-[#070B1A] px-2.5 py-1 rounded-md border border-[#1E293B]">
                          Enterprise
                        </div>
                      </td>
                      <td className="px-6 py-4 border-y border-[#1E293B] group-hover:border-[#3B82F6]/30 transition-colors">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                          org.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                          org.status === 'suspended' ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20' :
                          org.status === 'trial' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' :
                          org.status === 'maintenance' ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20' :
                          'bg-[#1E293B] text-[#94A3B8] border-[#334155]'
                        }`}>
                          {org.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5 animate-pulse"></span>}
                          {org.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-y border-[#1E293B] group-hover:border-[#3B82F6]/30 transition-colors font-medium">
                        <span className="text-[#F8FAFC]">{org.total_users}</span>
                        <span className="text-[#475569] ml-1">/ {org.max_users}</span>
                      </td>
                      <td className="px-6 py-4 border-y border-[#1E293B] group-hover:border-[#3B82F6]/30 transition-colors text-[#94A3B8] font-medium text-xs">
                        {org.max_leads.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 border-y border-[#1E293B] group-hover:border-[#3B82F6]/30 transition-colors">
                        <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-2 py-1 rounded-md border border-[#10B981]/20">$299</span>
                      </td>
                      <td className="px-6 py-4 border-y border-[#1E293B] group-hover:border-[#3B82F6]/30 transition-colors text-[#94A3B8] text-xs font-medium">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 rounded-r-xl border-y border-r border-[#1E293B] group-hover:border-[#3B82F6]/30 transition-colors text-right space-x-3">
                        <Link href={`/platform-admin/organizations/${org.id}`} className="text-[#3B82F6] hover:text-[#60A5FA] font-bold text-xs transition-colors">
                          Manage
                        </Link>
                        {org.status === 'active' ? (
                          <button onClick={() => handleStatusChange(org.id, 'suspended')} className="text-[#EF4444] hover:text-red-400 font-bold text-xs transition-colors">Suspend</button>
                        ) : (
                          <button onClick={() => handleStatusChange(org.id, 'active')} className="text-[#10B981] hover:text-green-400 font-bold text-xs transition-colors">Activate</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
