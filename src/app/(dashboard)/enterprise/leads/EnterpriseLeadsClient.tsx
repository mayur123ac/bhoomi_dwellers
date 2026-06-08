'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EnterpriseLeadsClient() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/enterprise/leads')
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-900 rounded-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Enterprise Leads
          </h1>
          <p className="text-slate-500 mt-1">Manage and track your entire sales pipeline.</p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 font-medium">
          + Add New Lead
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 bg-slate-50 dark:bg-slate-800/50">
          <input 
            type="text" 
            placeholder="Search leads..." 
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg flex-grow shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <select className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-inner focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Stages</option>
            <option value="New Lead">New Lead</option>
            <option value="Contacted">Contacted</option>
            <option value="Interested">Interested</option>
            <option value="Site Visit Scheduled">Site Visit Scheduled</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Loading enterprise data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Lead Info</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Temperature</th>
                  <th className="px-6 py-4">Executive</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{lead.name || 'Unnamed Lead'}</div>
                        <div className="text-sm text-slate-500">{lead.contact_no} • {lead.city || 'No City'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {lead.current_stage || 'New Lead'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          lead.lead_temperature === 'HOT' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300' :
                          lead.lead_temperature === 'WARM' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300' :
                          'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {lead.lead_temperature || 'COLD'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                            {(lead.assigned_executive_name || 'U')[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{lead.assigned_executive_name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/enterprise/leads/${lead.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors opacity-0 group-hover:opacity-100"
                        >
                          View Details &rarr;
                        </Link>
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
