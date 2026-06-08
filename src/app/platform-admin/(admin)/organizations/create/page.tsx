"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiCheckCircle } from "react-icons/fi";

export default function CreateOrganization() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    slug: "",
    crmTitle: "",
    adminName: "",
    adminEmail: "",
    temporaryPassword: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E3A8A",
    plan: "starter",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug and title from company name if they are empty
      ...(name === "companyName" && !prev.slug ? { slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '-') } : {}),
      ...(name === "companyName" && !prev.crmTitle ? { crmTitle: `${value} CRM` } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.companyEmail?.trim()) {
      setError("Company email is required to create organization.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/platform/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/platform-admin/organizations");
      } else {
        setError(data.message || "Failed to create organization");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center bg-[#111827] border border-[#1E293B] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">Onboard New Tenant</h1>
          <p className="text-[#94A3B8] mt-1 text-sm font-medium">Provision and configure a secure isolated CRM instance.</p>
        </div>
        <Link 
          href="/platform-admin/organizations" 
          className="relative z-10 bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#3B82F6]/50 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center"
        >
          Cancel Setup
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.1)] flex items-center">
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. Company Basics */}
        <div className="bg-[#111827] rounded-2xl shadow-sm border border-[#1E293B] overflow-hidden group">
          <div className="px-8 py-5 border-b border-[#1E293B] bg-[#151D33]/30 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#F8FAFC] flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-xs mr-3 border border-[#3B82F6]/20">1</span>
              Company Details
            </h2>
            {formData.companyName && formData.slug && <FiCheckCircle className="text-[#10B981] w-5 h-5" />}
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Company Name <span className="text-[#3B82F6]">*</span></label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC] rounded-xl focus:ring-4 focus:ring-[#3B82F6]/15 focus:border-[#3B82F6] outline-none transition-all placeholder-[#475569] shadow-inner" 
                placeholder="e.g. Acme Corporation" 
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Company Email <span className="text-[#3B82F6]">*</span></label>
              <input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} required
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC] rounded-xl focus:ring-4 focus:ring-[#3B82F6]/15 focus:border-[#3B82F6] outline-none transition-all placeholder-[#475569] shadow-inner" 
                placeholder="billing@acme.com" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Tenant Slug / Subdomain <span className="text-[#3B82F6]">*</span></label>
              <div className="flex shadow-inner rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-[#3B82F6]/15 focus-within:border-[#3B82F6] border border-[#1E293B] transition-all">
                <input type="text" name="slug" value={formData.slug} onChange={handleChange} required pattern="[a-z0-9-]+"
                  className="w-full px-4 py-3 bg-[#0F172A] border-none text-[#F8FAFC] outline-none placeholder-[#475569]" 
                  placeholder="acme" 
                />
                <span className="inline-flex items-center px-4 bg-[#151D33] text-[#475569] text-sm font-medium border-l border-[#1E293B]">
                  .nexora.io
                </span>
              </div>
              <p className="text-[10px] text-[#475569] mt-2 font-medium tracking-wide uppercase">Lowercase letters, numbers, and dashes only.</p>
            </div>
          </div>
        </div>

        {/* 2. Administrator Credentials */}
        <div className="bg-[#111827] rounded-2xl shadow-sm border border-[#1E293B] overflow-hidden">
          <div className="px-8 py-5 border-b border-[#1E293B] bg-[#151D33]/30 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#F8FAFC] flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-xs mr-3 border border-[#3B82F6]/20">2</span>
              Initial Administrator
            </h2>
            {formData.adminName && formData.adminEmail && formData.temporaryPassword && <FiCheckCircle className="text-[#10B981] w-5 h-5" />}
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Admin Name <span className="text-[#3B82F6]">*</span></label>
              <input type="text" name="adminName" value={formData.adminName} onChange={handleChange} required
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC] rounded-xl focus:ring-4 focus:ring-[#3B82F6]/15 focus:border-[#3B82F6] outline-none transition-all placeholder-[#475569] shadow-inner" 
                placeholder="John Doe" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Admin Email <span className="text-[#3B82F6]">*</span></label>
              <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC] rounded-xl focus:ring-4 focus:ring-[#3B82F6]/15 focus:border-[#3B82F6] outline-none transition-all placeholder-[#475569] shadow-inner" 
                placeholder="admin@company.com" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Temporary Password <span className="text-[#3B82F6]">*</span></label>
              <input type="text" name="temporaryPassword" value={formData.temporaryPassword} onChange={handleChange} required minLength={8}
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC] rounded-xl focus:ring-4 focus:ring-[#3B82F6]/15 focus:border-[#3B82F6] outline-none transition-all placeholder-[#475569] shadow-inner" 
                placeholder="Enter a secure temporary password" 
              />
            </div>
          </div>
        </div>

        {/* 3. Subscription Setup */}
        <div className="bg-[#111827] rounded-2xl shadow-sm border border-[#1E293B] overflow-hidden">
          <div className="px-8 py-5 border-b border-[#1E293B] bg-[#151D33]/30 flex items-center">
            <h2 className="text-base font-bold text-[#F8FAFC] flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-xs mr-3 border border-[#3B82F6]/20">3</span>
              Subscription & Limits
            </h2>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['starter', 'growth', 'enterprise'].map((planOption) => (
                <label key={planOption} className={`relative flex flex-col p-6 cursor-pointer rounded-xl border-2 transition-all ${
                  formData.plan === planOption 
                    ? 'border-[#3B82F6] bg-[#3B82F6]/5' 
                    : 'border-[#1E293B] bg-[#0F172A] hover:border-[#475569]'
                }`}>
                  <input type="radio" name="plan" value={planOption} checked={formData.plan === planOption} onChange={handleChange} className="sr-only" />
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">{planOption}</span>
                    {formData.plan === planOption && <div className="w-4 h-4 rounded-full bg-[#3B82F6] flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white"></div></div>}
                    {formData.plan !== planOption && <div className="w-4 h-4 rounded-full border-2 border-[#475569]"></div>}
                  </div>
                  <div className="text-xs text-[#94A3B8] font-medium space-y-1">
                    <p>• {planOption === 'starter' ? '10' : planOption === 'growth' ? '50' : 'Unlimited'} Users</p>
                    <p>• {planOption === 'starter' ? '10k' : planOption === 'growth' ? '50k' : 'Unlimited'} Leads</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 4. White-Label Branding */}
        <div className="bg-[#111827] rounded-2xl shadow-sm border border-[#1E293B] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/10 rounded-full blur-[40px] pointer-events-none"></div>
          <div className="px-8 py-5 border-b border-[#1E293B] bg-[#151D33]/30 flex items-center">
            <h2 className="text-base font-bold text-[#F8FAFC] flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-xs mr-3 border border-[#3B82F6]/20">4</span>
              White-Label Branding
            </h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">CRM Dashboard Title</label>
              <input type="text" name="crmTitle" value={formData.crmTitle} onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC] rounded-xl focus:ring-4 focus:ring-[#3B82F6]/15 focus:border-[#3B82F6] outline-none transition-all placeholder-[#475569] shadow-inner" 
                placeholder="e.g. Acme CRM Console" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Primary Accent Color</label>
              <div className="flex items-center space-x-4 bg-[#0F172A] border border-[#1E293B] p-2 rounded-xl shadow-inner">
                <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange}
                  className="h-10 w-12 border-0 rounded-lg cursor-pointer bg-transparent" 
                />
                <input type="text" value={formData.primaryColor} readOnly className="w-full bg-transparent border-none text-[#F8FAFC] font-mono font-medium outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Secondary / UI Background</label>
              <div className="flex items-center space-x-4 bg-[#0F172A] border border-[#1E293B] p-2 rounded-xl shadow-inner">
                <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange}
                  className="h-10 w-12 border-0 rounded-lg cursor-pointer bg-transparent" 
                />
                <input type="text" value={formData.secondaryColor} readOnly className="w-full bg-transparent border-none text-[#F8FAFC] font-mono font-medium outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center justify-center min-w-[240px] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            {loading ? (
              <span className="relative z-10 flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Provisioning Infrastructure...
              </span>
            ) : (
              <span className="relative z-10">Deploy Tenant Environment</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
