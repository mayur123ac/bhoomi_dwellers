'use client';

import React, { useState, useEffect } from 'react';
import { PIPELINE_STAGES } from '@/lib/services/leadLifecycleService';

export default function LeadDetailClient({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We would fetch lead details and timeline in parallel
    // For now, let's mock the API call assuming we'll fetch from a route that combines them, or separate routes
    Promise.all([
      fetch(`/api/enterprise/leads`).then(res => res.json()), // We don't have a GET by ID yet, but we will assume it returns the list for now to filter
      fetch(`/api/enterprise/leads/${leadId}/timeline`).then(res => res.json())
    ]).then(([leadsData, timelineData]) => {
      // Find the specific lead
      const currentLead = leadsData.find((l: any) => l.id.toString() === leadId);
      setLead(currentLead);
      setTimeline(timelineData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [leadId]);

  if (loading) {
    return <div className="p-8 text-center animate-pulse text-slate-500">Loading lead details...</div>;
  }

  if (!lead) {
    return <div className="p-8 text-center text-red-500">Lead not found</div>;
  }

  const currentStageIndex = PIPELINE_STAGES.indexOf(lead.current_stage || 'New Lead');

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-900 rounded-xl flex gap-8">
      {/* LEFT COLUMN: Form and Data */}
      <div className="w-2/3 flex flex-col gap-6">
        {/* Header Profile */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex justify-between items-start">
          <div className="flex gap-5 items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {(lead.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">#{lead.lead_number ?? lead.id} — {lead.name || 'Unnamed Lead'}</h1>
              <div className="flex items-center gap-3 mt-1 text-slate-500 text-sm">
                <span>📞 {lead.contact_no}</span>
                <span>✉️ {lead.email || 'No Email'}</span>
                <span>📍 {lead.city || 'Unknown City'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
              lead.lead_temperature === 'HOT' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300' :
              lead.lead_temperature === 'WARM' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300' :
              'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {lead.lead_temperature || 'COLD'} LEAD
            </span>
            <span className="text-sm font-medium text-slate-500">Probability: {lead.conversion_probability || 0}%</span>
          </div>
        </div>

        {/* Pipeline Stepper */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Lead Pipeline</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${Math.max(0, (currentStageIndex / Math.max(1, PIPELINE_STAGES.length - 1))) * 100}%` }}
            ></div>
            
            {PIPELINE_STAGES.map((stage, idx) => {
              const isCompleted = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={stage} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isCurrent ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]' :
                    isCompleted ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white text-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-600'
                  }`}>
                    {isCompleted && !isCurrent ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase text-center max-w-[60px] leading-tight ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Data Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Business Information</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Project Interested</p>
              <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{lead.project_interested || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Budget Range</p>
              <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{lead.budget || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Property Type</p>
              <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{lead.property_type || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Source</p>
              <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{lead.source || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Assigned Executive</p>
              <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">{lead.assigned_executive_name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Assigned Manager</p>
              <p className="text-slate-900 dark:text-slate-100 font-medium mt-1">{lead.assigned_manager_name || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Global Timeline */}
      <div className="w-1/3 flex flex-col gap-6">
        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-5">
          <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-slate-700/50 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-all">
              📞 Log Call
            </button>
            <button className="bg-slate-700/50 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium transition-all">
              📝 Add Note
            </button>
            <button className="bg-slate-700/50 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-medium transition-all">
              📅 Schedule
            </button>
            <button className="bg-slate-700/50 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium transition-all">
              🔄 Reassign
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-grow flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Activity Timeline</h2>
          </div>
          <div className="p-5 overflow-y-auto max-h-[500px]">
            {timeline.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No activities logged yet.</p>
            ) : (
              <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 pl-5 space-y-6">
                {timeline.map((activity, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[27px] w-3 h-3 rounded-full bg-white dark:bg-slate-800 border-2 border-blue-500 top-1"></div>
                    <div className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {activity.event_type}
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      {new Date(activity.created_at).toLocaleString()} • by {activity.user_name || 'System'}
                    </div>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-3 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700/50">
                        {activity.metadata.newStage && (
                          <span>Changed stage to <span className="font-semibold text-blue-600">{activity.metadata.newStage}</span></span>
                        )}
                        {!activity.metadata.newStage && JSON.stringify(activity.metadata)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
