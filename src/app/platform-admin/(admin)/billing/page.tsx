"use client";

import React, { useState, useEffect } from "react";

export default function PlatformBillingDashboard() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [editData, setEditData] = useState({
    max_users: 0,
    max_leads: 0,
    plan_expires_at: "",
    status: "active"
  });

  async function fetchOrgs() {
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

  const handleEditClick = (org: any) => {
    setSelectedOrg(org);
    setEditData({
      max_users: org.max_users || 10,
      max_leads: org.max_leads || 10000,
      plan_expires_at: org.plan_expires_at ? new Date(org.plan_expires_at).toISOString().split('T')[0] : "",
      status: org.status || "active"
    });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/platform/organizations/${selectedOrg.id}/billing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        alert("Billing settings updated.");
        setSelectedOrg(null);
        fetchOrgs();
      } else {
        alert("Failed to update.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving billing data.");
    }
  };

  if (loading) return <div className="p-8 text-[#94A3B8]">Loading billing data...</div>;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#E2E8F0]">Billing & Quota Management</h1>
        <p className="text-[#94A3B8] mt-1">Manage subscription plans, expiration dates, and quotas across all tenants.</p>
      </div>

      <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.2)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#050A15]/50 border-b border-[#1E293B] text-xs uppercase tracking-wider text-[#94A3B8] font-semibold">
            <tr>
              <th className="px-6 py-4">Tenant</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Expires At</th>
              <th className="px-6 py-4">Users (Used / Max)</th>
              <th className="px-6 py-4">Leads Quota</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {orgs.map((org) => {
              const isExpired = org.plan_expires_at && new Date(org.plan_expires_at) < new Date();
              return (
                <tr key={org.id} className="hover:bg-[#1E3A8A]/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#E2E8F0]">{org.name}</div>
                    <div className="text-xs text-[#475569] mt-0.5">{org.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium border ${
                      isExpired ? 'bg-red-500/10 text-[#EF4444] border-red-500/20' :
                      org.status === 'active' ? 'bg-green-500/10 text-[#10B981] border-green-500/20' :
                      'bg-[#1E293B] text-[#94A3B8] border-[#334155]'
                    }`}>
                      {isExpired ? 'EXPIRED' : org.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#94A3B8]">
                    {org.plan_expires_at ? new Date(org.plan_expires_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-[#E2E8F0]">
                    <span className={org.total_users >= org.max_users ? 'text-[#EF4444] font-bold' : ''}>
                      {org.total_users}
                    </span> <span className="text-[#475569]">/ {org.max_users}</span>
                  </td>
                  <td className="px-6 py-4 text-[#94A3B8]">
                    {org.max_leads.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEditClick(org)}
                      className="text-[#3B82F6] hover:text-blue-400 font-medium transition-colors"
                    >
                      Manage Plan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedOrg && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.1)] p-8 w-full max-w-md relative">
            {/* Top Glow Line on Modal */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

            <h2 className="text-xl font-bold text-[#E2E8F0] mb-6">Edit Plan: <span className="text-[#3B82F6]">{selectedOrg.name}</span></h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Status</label>
                <select 
                  className="w-full bg-[#050A15] border border-[#1E293B] text-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                  value={editData.status}
                  onChange={(e) => setEditData({...editData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Expiration Date</label>
                <input 
                  type="date"
                  className="w-full bg-[#050A15] border border-[#1E293B] text-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                  value={editData.plan_expires_at}
                  onChange={(e) => setEditData({...editData, plan_expires_at: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Max Users</label>
                <input 
                  type="number"
                  className="w-full bg-[#050A15] border border-[#1E293B] text-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                  value={editData.max_users}
                  onChange={(e) => setEditData({...editData, max_users: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Max Leads</label>
                <input 
                  type="number"
                  className="w-full bg-[#050A15] border border-[#1E293B] text-[#E2E8F0] rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                  value={editData.max_leads}
                  onChange={(e) => setEditData({...editData, max_leads: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button 
                onClick={() => setSelectedOrg(null)}
                className="px-5 py-2.5 text-sm font-medium text-[#94A3B8] hover:text-[#E2E8F0] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-5 py-2.5 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1e40af] hover:to-[#2563eb] text-white text-sm font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
