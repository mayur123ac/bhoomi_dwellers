"use client";

import React, { useEffect, useState } from "react";
import { useTenant } from "@/components/TenantProvider";

interface BillingUsage {
  status: string;
  plan_started_at: string | null;
  plan_expires_at: string | null;
  max_users: number;
  max_leads: number;
  current_users: number;
  current_leads: number;
}

export default function TenantBillingPage() {
  // (tenant destructuring removed, as it's not present on context and not used here)
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/org/billing/usage");
        if (!res.ok) {
          throw new Error("Failed to fetch billing usage");
        }
        const data = await res.json();
        setUsage(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (error || !usage) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-md">Error: {error}</div>;
  }

  const userPercent = Math.min((usage.current_users / usage.max_users) * 100, 100);
  const leadPercent = Math.min((usage.current_leads / usage.max_leads) * 100, 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Billing & Usage</h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your subscription plan, view limits, and track resource usage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plan Overview Card */}
        <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">Current Plan Status</h3>
              <div className="mt-2 flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(usage.status)}`}>
                  {usage.status}
                </span>
                {usage.plan_expires_at && (
                  <span className="text-sm text-slate-500">
                    Expires on: {new Date(usage.plan_expires_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <button 
                className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
                onClick={() => alert("To upgrade your plan, please contact Nexora Platform Support.")}
              >
                Contact Support to Upgrade
              </button>
            </div>
          </div>
        </div>

        {/* User Quota Card */}
        <div className="col-span-1 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-700">Team Members</h3>
            <span className="text-sm font-semibold text-slate-900">
              {usage.current_users} / {usage.max_users}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
            <div 
              className={`h-2.5 rounded-full ${userPercent > 90 ? 'bg-red-500' : 'bg-[var(--brand-primary)]'}`}
              style={{ width: `${userPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500">
            {usage.max_users - usage.current_users} seats remaining
          </p>
        </div>

        {/* Leads Quota Card */}
        <div className="col-span-1 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-700">Total Leads</h3>
            <span className="text-sm font-semibold text-slate-900">
              {usage.current_leads.toLocaleString()} / {usage.max_leads.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
            <div 
              className={`h-2.5 rounded-full ${leadPercent > 90 ? 'bg-red-500' : 'bg-[var(--brand-primary)]'}`}
              style={{ width: `${leadPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500">
            {usage.max_leads - usage.current_leads} leads remaining
          </p>
        </div>
      </div>
    </div>
  );
}
