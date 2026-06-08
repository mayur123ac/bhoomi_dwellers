"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function PlatformDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/platform/stats");
        const json = await res.json();
        if (json.success) setStats(json.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const revenueData = [
    { name: 'May 29', value: 20000 },
    { name: 'May 30', value: 35000 },
    { name: 'May 31', value: 30000 },
    { name: 'Jun 1',  value: 45000 },
    { name: 'Jun 2',  value: 38000 },
    { name: 'Jun 3',  value: 55000 },
    { name: 'Jun 4',  value: 70000 },
    { name: 'Jun 5',  value: 65000 },
  ];

  const tenantStatusData = [
    { name: 'Active', value: stats?.organizations?.active || 842, color: '#10B981' },
    { name: 'Trial', value: 278, color: '#F59E0B' },
    { name: 'Maintenance', value: 98, color: '#3B82F6' },
    { name: 'Suspended', value: 66, color: '#EF4444' },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">Overview</h1>
          <p className="text-sm text-[#94A3B8] mt-1 font-medium">Platform health and operational metrics</p>
        </div>
        <div className="flex space-x-4">
          <div className="bg-[#111827] border border-[#1E293B] hover:border-[#3B82F6]/30 transition-colors cursor-pointer text-[#94A3B8] px-4 py-2 rounded-xl text-sm font-medium flex items-center shadow-sm">
            <svg className="w-4 h-4 mr-2 text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            May 29 - Jun 5, 2026
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {[
          { title: "Total Organizations", value: stats?.organizations?.total || '1,284', trend: "+12.5%", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", color: "#3B82F6" },
          { title: "Active Tenants", value: stats?.organizations?.active || '842', trend: "+8.4%", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", color: "#10B981" },
          { title: "Monthly Revenue", value: "$1.2M", trend: "+15.3%", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "#7C3AED" },
          { title: "Active Users", value: stats?.users?.total ? `${(stats.users.total / 1000).toFixed(1)}K` : '15.6K', trend: "+11.7%", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", color: "#2563EB" },
          { title: "Global Leads", value: stats?.leads?.total ? `${(stats.leads.total / 1000).toFixed(1)}K` : '245K', trend: "+22.1%", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", color: "#F59E0B" }
        ].map((card, idx) => (
          <div key={idx} className="bg-[#111827] hover:bg-[#151D33] rounded-2xl border border-[#1E293B] p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.15)]">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">{card.title}</h3>
              <div className="p-2.5 rounded-xl border" style={{ backgroundColor: `${card.color}15`, borderColor: `${card.color}30`, color: card.color }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.icon}></path></svg>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold text-[#F8FAFC] tracking-tight">{card.value}</p>
              <div className="flex items-center mt-3">
                <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded flex items-center mr-2">
                  <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  {card.trend}
                </span>
                <span className="text-xs font-medium text-[#475569]">vs last 30d</span>
              </div>
            </div>
            {/* Subtle glow orb */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" style={{ backgroundColor: card.color }}></div>
          </div>
        ))}
      </div>

      {/* Middle Row: Chart & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111827] rounded-2xl border border-[#1E293B] p-7 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-base font-bold text-[#F8FAFC]">Revenue Overview</h3>
            <select className="bg-[#151D33] border border-[#1E293B] text-xs font-semibold text-[#94A3B8] rounded-lg px-3 py-1.5 outline-none hover:border-[#3B82F6]/50 transition-colors">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}K`} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151D33', borderColor: '#1E293B', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ r: 0 }}
                  activeDot={{ r: 6, fill: '#3B82F6', stroke: '#111827', strokeWidth: 3 }}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] rounded-2xl border border-[#1E293B] p-7 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-[#F8FAFC] mb-2">Tenant Status Distribution</h3>
          <p className="text-xs text-[#94A3B8] mb-8">Breakdown of operational states</p>
          
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tenantStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {tenantStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151D33', borderColor: '#1E293B', borderRadius: '12px' }}
                  itemStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-3xl font-bold text-[#F8FAFC]">{tenantStatusData.reduce((a, b) => a + b.value, 0)}</span>
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mt-1">Total</span>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            {tenantStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></span>
                  <span className="text-[#94A3B8] font-medium">{item.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-[#F8FAFC] font-bold">{item.value}</span>
                  <span className="text-[#475569] w-10 text-right text-xs">({Math.round((item.value / 1284) * 100)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Organizations & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111827] rounded-2xl border border-[#1E293B] shadow-sm overflow-hidden flex flex-col">
          <div className="px-7 py-5 border-b border-[#1E293B] flex justify-between items-center bg-[#151D33]/30">
            <h2 className="text-base font-bold text-[#F8FAFC]">Recent Organizations</h2>
            <Link href="/platform-admin/organizations" className="text-xs font-bold text-[#3B82F6] hover:text-[#60A5FA] transition-colors">View All Directory →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#070B1A]/50 border-b border-[#1E293B]">
                <tr>
                  <th className="px-7 py-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Company</th>
                  <th className="px-7 py-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Plan</th>
                  <th className="px-7 py-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="px-7 py-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {[
                  { id: 1, name: 'Bhoomi Realty', slug: 'bhoomi', plan: 'Enterprise', status: 'Active', created: 'Jun 5, 2026' },
                  { id: 2, name: 'Solari Innovations', slug: 'solari', plan: 'Growth', status: 'Active', created: 'Jun 4, 2026' },
                  { id: 3, name: 'Vortex Corp', slug: 'vortex', plan: 'Enterprise', status: 'Trial', created: 'Jun 3, 2026' },
                  { id: 4, name: 'Apex Solutions', slug: 'apex', plan: 'Starter', status: 'Active', created: 'Jun 2, 2026' },
                ].map((org: any) => (
                  <tr key={org.id} className="hover:bg-[#151D33] transition-colors group">
                    <td className="px-7 py-4">
                      <div className="font-bold text-[#F8FAFC]">{org.name}</div>
                      <div className="text-xs font-medium text-[#475569] mt-0.5">{org.slug}.nexora.io</div>
                    </td>
                    <td className="px-7 py-4 font-medium text-[#94A3B8]">{org.plan}</td>
                    <td className="px-7 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                        org.status === 'Active' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                        org.status === 'Trial' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' :
                        'bg-[#1E293B] text-[#94A3B8] border-[#334155]'
                      }`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="px-7 py-4 text-[#94A3B8] text-xs font-medium">{org.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#111827] rounded-2xl border border-[#1E293B] shadow-sm flex flex-col">
          <div className="px-7 py-5 border-b border-[#1E293B] flex justify-between items-center bg-[#151D33]/30">
            <h2 className="text-base font-bold text-[#F8FAFC]">System Health</h2>
            <button className="text-xs font-bold text-[#3B82F6] hover:text-[#60A5FA] transition-colors">Details →</button>
          </div>
          <div className="p-7 space-y-6">
            {[
              { name: "API Gateway", status: "Operational", color: "#10B981" },
              { name: "Database Primary", status: "Operational", color: "#10B981" },
              { name: "S3 Storage", status: "Operational", color: "#10B981" },
              { name: "Email Service", status: "Operational", color: "#10B981" },
              { name: "Webhook Delivery", status: "Operational", color: "#10B981" }
            ].map((sys, idx) => (
              <div key={idx} className="flex items-center justify-between group">
                <span className="text-sm font-semibold text-[#E2E8F0] group-hover:text-[#3B82F6] transition-colors">{sys.name}</span>
                <div className="flex items-center px-2 py-1 bg-[#050816] border border-[#1E293B] rounded-md">
                  <span className="w-2 h-2 rounded-full mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]" style={{ backgroundColor: sys.color }}></span>
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">{sys.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
