"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  FaThLarge, FaClipboardList, FaTimesCircle, FaUpload, FaFileExcel,
  FaPhoneAlt, FaEnvelope, FaMoneyBillWave, FaMapMarkerAlt, FaBullseye,
  FaCheckCircle, FaTimes, FaSave, FaPaperPlane, FaCalendarAlt,
  FaSearch, FaChevronRight, FaUser, FaAngleLeft, FaBell, FaCog,
  FaEye, FaTrash, FaFilter, FaSortAmountDown, FaWhatsapp, FaMicrophone,
  FaChartBar, FaUserTie, FaExclamationTriangle
} from "react-icons/fa";
import { MdOutlinePhoneInTalk } from "react-icons/md";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type LeadSource = "Website" | "Facebook" | "Instagram" | "Referral" | "Other" | string;

interface RawLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source?: LeadSource;
  budget?: string;
  location?: string;
  [key: string]: any;
}

interface SavedLead extends RawLead {
  savedAt: string;
  followUps: FollowUp[];
  status: "saved" | "interested" | "not_interested";
  interestStatus?: "Interested" | "Not Interested" | "Maybe";
  siteVisitDate?: string;
}

interface FollowUp {
  id: string;
  message: string;
  createdAt: string;
  createdBy: string;
}

type SidebarSection = "dashboard" | "forms" | "not_interested";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const formatDate = (ds?: string) => {
  if (!ds) return "—";
  try {
    return new Date(ds).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return ds; }
};

const maskPhone = (phone?: string) => {
  if (!phone) return "N/A";
  const c = String(phone).replace(/\D/g, "");
  if (c.length <= 5) return c;
  return `${c.slice(0, 2)}*****${c.slice(-3)}`;
};

const SOURCE_COLORS: Record<string, string> = {
  Website:   "text-blue-400 bg-blue-500/10 border-blue-500/30",
  Facebook:  "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  Instagram: "text-pink-400 bg-pink-500/10 border-pink-500/30",
  Referral:  "text-green-400 bg-green-500/10 border-green-500/30",
  Other:     "text-gray-400 bg-gray-500/10 border-gray-500/30",
};

const sourceBadge = (src?: string) => {
  const cls = SOURCE_COLORS[src || "Other"] ?? SOURCE_COLORS["Other"];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
      {src || "Unknown"}
    </span>
  );
};

const interestBadge = (status?: string) => {
  if (!status) return null;
  const map: Record<string, string> = {
    Interested:     "text-green-400 bg-green-500/10 border-green-500/30",
    "Not Interested": "text-red-400 bg-red-500/10 border-red-500/30",
    Maybe:          "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] ?? "text-gray-400 bg-gray-500/10 border-gray-500/30"}`}>
      {status}
    </span>
  );
};

// ─────────────────────────────────────────────
// TICKET POPUP
// ─────────────────────────────────────────────
function TicketPopup({
  lead, onClose, onSave, alreadySaved,
}: {
  lead: RawLead;
  onClose: () => void;
  onSave: (lead: RawLead) => void;
  alreadySaved: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1">Lead Ticket</p>
            <h2 className="text-xl font-bold text-white">{lead.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 cursor-pointer">
            <FaTimes />
          </button>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="col-span-2 bg-[#222] rounded-xl p-3 border border-[#333]">
            <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><FaPhoneAlt className="text-[9px]" /> Phone</p>
            <p className="text-white font-mono font-semibold">{lead.phone || "N/A"}</p>
          </div>
          {lead.email && (
            <div className="col-span-2 bg-[#222] rounded-xl p-3 border border-[#333]">
              <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><FaEnvelope className="text-[9px]" /> Email</p>
              <p className="text-white font-semibold text-sm truncate">{lead.email}</p>
            </div>
          )}
          <div className="bg-[#222] rounded-xl p-3 border border-[#333]">
            <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><FaMoneyBillWave className="text-[9px]" /> Budget</p>
            <p className="text-green-400 font-bold">{lead.budget || "N/A"}</p>
          </div>
          <div className="bg-[#222] rounded-xl p-3 border border-[#333]">
            <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><FaMapMarkerAlt className="text-[9px]" /> Location</p>
            <p className="text-white font-semibold text-sm">{lead.location || "N/A"}</p>
          </div>
          <div className="col-span-2 flex items-center justify-between bg-[#222] rounded-xl p-3 border border-[#333]">
            <div>
              <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><FaBullseye className="text-[9px]" /> Source</p>
              {sourceBadge(lead.source)}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 mb-1">Lead ID</p>
              <p className="text-purple-400 font-bold font-mono">#{lead.id}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-[#222] hover:bg-[#333] border border-[#333] text-gray-300 font-semibold py-2.5 rounded-xl transition-colors cursor-pointer text-sm"
          >
            Close
          </button>
          <button
            onClick={() => { onSave(lead); onClose(); }}
            disabled={alreadySaved}
            className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-sm shadow-lg
              ${alreadySaved
                ? "bg-green-800/30 border border-green-600/30 text-green-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20"
              }`}
          >
            {alreadySaved ? <><FaCheckCircle /> Saved</> : <><FaSave /> Save to Forms</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DETAIL VIEW
// ─────────────────────────────────────────────
function LeadDetailView({
  lead, onBack, onUpdateLead, callerName,
}: {
  lead: SavedLead;
  onBack: () => void;
  onUpdateLead: (updated: SavedLead) => void;
  callerName: string;
}) {
  const [noteInput, setNoteInput] = useState("");
  const [visitDate, setVisitDate] = useState(lead.siteVisitDate || "");
  const followUpEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    followUpEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lead.followUps]);

  const sendNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    const newFup: FollowUp = {
      id: Date.now().toString(),
      message: noteInput,
      createdAt: new Date().toISOString(),
      createdBy: callerName,
    };
    onUpdateLead({ ...lead, followUps: [...lead.followUps, newFup] });
    setNoteInput("");
  };

  const setInterest = (status: "Interested" | "Not Interested" | "Maybe") => {
    onUpdateLead({
      ...lead,
      interestStatus: status,
      status: status === "Not Interested" ? "not_interested" : "saved",
    });
  };

  const scheduleVisit = () => {
    if (!visitDate) return;
    const msg = `📅 Site visit scheduled for ${formatDate(visitDate)}`;
    const newFup: FollowUp = {
      id: Date.now().toString(),
      message: msg,
      createdAt: new Date().toISOString(),
      createdBy: callerName,
    };
    onUpdateLead({ ...lead, siteVisitDate: visitDate, followUps: [...lead.followUps, newFup] });
  };

  return (
    <div className="animate-fadeIn flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-[#222] hover:bg-[#333] border border-[#444] rounded-lg text-gray-400 transition-colors cursor-pointer"
          >
            <FaAngleLeft />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{lead.name}</h1>
            <p className="text-xs text-gray-500">Saved {formatDate(lead.savedAt)}</p>
          </div>
        </div>

        {/* Interest buttons */}
        <div className="flex items-center gap-2">
          {lead.interestStatus && interestBadge(lead.interestStatus)}
          {lead.interestStatus !== "Interested" && (
            <button
              onClick={() => setInterest("Interested")}
              className="flex items-center gap-2 bg-green-600/10 hover:bg-green-600 border border-green-500/30 text-green-400 hover:text-white font-bold px-3 py-2 rounded-lg text-xs transition-all cursor-pointer"
            >
              <FaCheckCircle /> Interested
            </button>
          )}
          {lead.interestStatus !== "Not Interested" && (
            <button
              onClick={() => setInterest("Not Interested")}
              className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white font-bold px-3 py-2 rounded-lg text-xs transition-all cursor-pointer"
            >
              <FaTimes /> Not Interested
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* LEFT — Personal Info */}
        <div className="w-full lg:w-[42%] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">

          {/* Personal card */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-4 border-b border-[#2a2a2a] pb-2">
              Personal Information
            </h3>
            <div className="space-y-3 text-sm">
              {[
                { label: "Phone",    value: lead.phone,    icon: <FaPhoneAlt className="text-[10px]" /> },
                { label: "Email",    value: lead.email || "Not provided", icon: <FaEnvelope className="text-[10px]" /> },
                { label: "Budget",   value: lead.budget || "N/A",   icon: <FaMoneyBillWave className="text-[10px]" /> },
                { label: "Location", value: lead.location || "N/A", icon: <FaMapMarkerAlt className="text-[10px]" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex justify-between items-start">
                  <p className="text-gray-500 text-xs flex items-center gap-1 pt-0.5">{icon} {label}</p>
                  <p className={`text-right font-semibold max-w-[55%] break-words ${label === "Budget" ? "text-green-400" : "text-white"}`}>{value}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1">
                <p className="text-gray-500 text-xs flex items-center gap-1"><FaBullseye className="text-[10px]" /> Source</p>
                {sourceBadge(lead.source)}
              </div>
            </div>
          </div>

          {/* Site visit card */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-4 border-b border-[#2a2a2a] pb-2 flex items-center gap-2">
              <FaCalendarAlt /> Site Visit
            </h3>
            {lead.siteVisitDate ? (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-center">
                <p className="text-xs text-orange-400 font-bold mb-1">Scheduled</p>
                <p className="text-white font-bold">{formatDate(lead.siteVisitDate)}</p>
              </div>
            ) : (
              <p className="text-gray-600 text-sm text-center py-2">No visit scheduled</p>
            )}
            <div className="mt-4 space-y-2">
              <label className="text-xs text-gray-500">Schedule / Reschedule</label>
              <input
                ref={inputRef}
                type="datetime-local"
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
                onClick={() => inputRef.current?.showPicker?.()}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition-colors"
              />
              <button
                onClick={scheduleVisit}
                disabled={!visitDate}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Confirm Visit
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600 text-blue-400 hover:text-white flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1">
              <MdOutlinePhoneInTalk className="text-lg" />
              <span className="font-bold text-[10px]">Browser Call</span>
            </button>
            <button className="bg-green-600/10 border border-green-500/30 hover:bg-green-600 text-green-400 hover:text-white flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer gap-1">
              <FaWhatsapp className="text-xl" />
              <span className="font-bold text-[10px]">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* RIGHT — Follow-up Panel */}
        <div className="w-full lg:w-[58%] flex flex-col bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#2a2a2a] bg-[#151515] flex-shrink-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FaClipboardList className="text-purple-400" /> Follow-up Timeline
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5 bg-[#111]">
            {/* System message */}
            <div className="flex justify-start">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-md">
                <div className="flex justify-between items-center mb-2 gap-6">
                  <span className="font-bold text-xs text-purple-400">System</span>
                  <span className="text-[10px] text-gray-500">{formatDate(lead.savedAt)}</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Lead saved to Forms. Begin follow-up process.
                </p>
              </div>
            </div>

            {lead.followUps.map((fup) => (
              <div key={fup.id} className="flex justify-start">
                <div className="bg-[#2a2135] border border-[#4c1d95] rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-lg">
                  <div className="flex justify-between items-center mb-2 gap-6">
                    <span className="font-bold text-xs text-white">{fup.createdBy}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(fup.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{fup.message}</p>
                </div>
              </div>
            ))}

            {lead.followUps.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-700 py-10">
                <FaClipboardList className="text-3xl mb-3 opacity-30" />
                <p className="text-sm">No follow-ups yet. Add the first note below.</p>
              </div>
            )}
            <div ref={followUpEndRef} />
          </div>

          <form onSubmit={sendNote} className="p-4 bg-[#1a1a1a] border-t border-[#2a2a2a] flex gap-3 items-center flex-shrink-0">
            <input
              type="text"
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              placeholder="Add follow-up note..."
              className="flex-1 bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-lg flex-shrink-0"
            >
              <FaPaperPlane className="text-sm" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD SECTION
// ─────────────────────────────────────────────
function DashboardSection({ rawLeads, savedLeads, callerName }: {
  rawLeads: RawLead[];
  savedLeads: SavedLead[];
  callerName: string;
}) {
  const interested    = savedLeads.filter(l => l.interestStatus === "Interested").length;
  const notInterested = savedLeads.filter(l => l.interestStatus === "Not Interested").length;
  const visits        = savedLeads.filter(l => l.siteVisitDate).length;
  const pending       = savedLeads.filter(l => !l.interestStatus).length;

  const sourceMap = rawLeads.reduce<Record<string, number>>((acc, l) => {
    const src = l.source || "Unknown";
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: "Total Uploaded",   value: rawLeads.length,   color: "text-white",       bg: "bg-purple-500/10 border-purple-500/20" },
    { label: "Saved to Forms",   value: savedLeads.length, color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20" },
    { label: "Interested",       value: interested,         color: "text-green-400",   bg: "bg-green-500/10 border-green-500/20" },
    { label: "Not Interested",   value: notInterested,      color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
    { label: "Visits Scheduled", value: visits,             color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20" },
    { label: "Pending Review",   value: pending,            color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20" },
  ];

  return (
    <div className="animate-fadeIn space-y-8">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Welcome, {callerName.split(" ")[0]}!</h2>
          <p className="text-sm text-gray-500 mt-1">Presales Caller Dashboard — manage your lead pipeline below.</p>
        </div>
        <div className="w-12 h-12 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400 text-xl font-bold">
          {callerName.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`rounded-2xl p-5 border ${s.bg}`}>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {Object.keys(sourceMap).length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <FaChartBar className="text-purple-400" /> Lead Source Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).map(([src, count]) => {
              const pct = rawLeads.length > 0 ? Math.round((count / rawLeads.length) * 100) : 0;
              return (
                <div key={src}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 font-medium">{src}</span>
                    <span className="text-white font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {rawLeads.length === 0 && (
        <div className="border-2 border-dashed border-[#2a2a2a] rounded-2xl p-12 text-center text-gray-600">
          <FaFileExcel className="text-5xl mx-auto mb-4 opacity-20" />
          <p className="font-semibold mb-1">No leads uploaded yet</p>
          <p className="text-sm">Upload an Excel file from the top bar to get started.</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function PresalesCallerPanel() {
  const router = useRouter();

  // user
  const [user, setUser] = useState({ name: "Caller", role: "Caller", email: "" });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // sidebar
  const [section, setSection] = useState<SidebarSection>("dashboard");

  // data
  const [rawLeads, setRawLeads]     = useState<RawLead[]>([]);
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [columns, setColumns]       = useState<string[]>([]);

  // table UI
  const [searchTerm, setSearchTerm]         = useState("");
  const [sourceFilter, setSourceFilter]     = useState("All");
  const [ticketLead, setTicketLead]         = useState<RawLead | null>(null);

  // detail view
  const [detailLead, setDetailLead] = useState<SavedLead | null>(null);

  // upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("crm_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  // ── Excel parse ──
 const parseExcel = useCallback((file: File) => {
    setUploadError("");
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
        const data  = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb    = XLSX.read(data, { type: "array" });
        const ws    = wb.Sheets[wb.SheetNames[0]];
        const json  = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

        if (json.length === 0) { setUploadError("The Excel file appears to be empty."); return; }

        const rawCols = Object.keys(json[0]);

        // 🔥 THIS WAS MISSING — define map before using it
        const map = (keys: string[], candidates: string[]): string => {
            for (const k of keys) {
            const found = candidates.find(c => c.toLowerCase().includes(k));
            if (found) return found;
            }
            return "";
        };

        const nameCol     = map(["name","customer","client","contact"], rawCols);
        const phoneCol    = map(["phone","mobile","contact","number","tel"], rawCols);
        const emailCol    = map(["email","mail"], rawCols);
        const sourceCol   = map(["source","platform","channel","medium"], rawCols);
        const budgetCol   = map(["budget","price","amount","cost"], rawCols);
        const locationCol = map(["location","city","area","place","address"], rawCols);

        const leads: RawLead[] = json.map((row: Record<string, any>, i: number) => ({
            id:       String(i + 1).padStart(4, "0"),
            name:     String(row[nameCol]     || row[rawCols[0]] || `Lead ${i + 1}`),
            phone:    String(row[phoneCol]    || row[rawCols[1]] || ""),
            email:    emailCol    ? String(row[emailCol])    : "",
            source:   sourceCol   ? String(row[sourceCol])   : "Other",
            budget:   budgetCol   ? String(row[budgetCol])   : "",
            location: locationCol ? String(row[locationCol]) : "",
            ...row,
        }));

        setRawLeads(leads);
        setColumns(["id", "name", "phone", "email", "source", "budget", "location"]);
        setSection("dashboard");
        } catch {
        setUploadError("Failed to parse file. Please upload a valid .xlsx or .xls file.");
        }
    };
    reader.readAsArrayBuffer(file);
    }, []);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) parseExcel(file);
        e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseExcel(file);
  };

  // ── Save lead ──
  const saveLead = useCallback((lead: RawLead) => {
    setSavedLeads(prev => {
      if (prev.find(l => l.id === lead.id)) return prev;
      return [...prev, { ...lead, savedAt: new Date().toISOString(), followUps: [], status: "saved" }];
    });
  }, []);

  const isLeadSaved = (id: string) => savedLeads.some(l => l.id === id);

  // ── Update saved lead ──
  const updateLead = useCallback((updated: SavedLead) => {
    setSavedLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    if (detailLead?.id === updated.id) setDetailLead(updated);
    // If marked not interested, go back to forms list
    if (updated.status === "not_interested" && detailLead?.id === updated.id) {
      setDetailLead(null);
      setSection("not_interested");
    }
  }, [detailLead]);

  // ── Filtered leads for table ──
  const filteredRaw = useMemo(() => {
    return rawLeads.filter(l => {
      const matchSearch = !searchTerm
        || l.name.toLowerCase().includes(searchTerm.toLowerCase())
        || l.phone.includes(searchTerm)
        || String(l.id).includes(searchTerm);
      const matchSource = sourceFilter === "All" || l.source === sourceFilter;
      return matchSearch && matchSource;
    });
  }, [rawLeads, searchTerm, sourceFilter]);

  const uniqueSources = useMemo(() => ["All", ...Array.from(new Set(rawLeads.map(l => l.source || "Other")))], [rawLeads]);

  const formLeads        = savedLeads.filter(l => l.status !== "not_interested");
  const notIntLeads      = savedLeads.filter(l => l.status === "not_interested");

  const handleLogout = () => { localStorage.removeItem("crm_user"); router.push("/"); };

  // ── Sidebar items ──
  const sidebarItems = [
    { id: "dashboard" as SidebarSection,      icon: FaThLarge,      label: "Dashboard",      badge: null },
    { id: "forms" as SidebarSection,           icon: FaClipboardList, label: "Forms",          badge: formLeads.length },
    { id: "not_interested" as SidebarSection,  icon: FaTimesCircle,  label: "Not Interested", badge: notIntLeads.length },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-200 font-sans overflow-hidden">

      {/* ── TICKET POPUP ── */}
      {ticketLead && (
        <TicketPopup
          lead={ticketLead}
          onClose={() => setTicketLead(null)}
          onSave={saveLead}
          alreadySaved={isLeadSaved(ticketLead.id)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className="w-20 bg-[#111111] border-r border-[#222] flex flex-col items-center py-6 flex-shrink-0 z-40 shadow-sm">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-xl font-bold text-white mb-10 shadow-lg cursor-pointer">
          B
        </div>
        <nav className="flex flex-col gap-2 w-full px-2 flex-1">
          {sidebarItems.map(({ id, icon: Icon, label, badge }) => (
            <div
              key={id}
              onClick={() => { setSection(id); setDetailLead(null); }}
              title={label}
              className={`relative flex flex-col items-center justify-center py-3 rounded-xl cursor-pointer transition-colors group
                ${section === id ? "bg-purple-500/10 text-purple-400" : "text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-300"}`}
            >
              {section === id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full" />
              )}
              <Icon className="w-5 h-5" />
              {badge !== null && badge! > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {badge! > 9 ? "9+" : badge}
                </span>
              )}
            </div>
          ))}
        </nav>
        <div className="px-2 w-full mt-auto">
          <div className="flex flex-col items-center justify-center py-3 rounded-xl cursor-pointer text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-300 transition-colors">
            <FaCog className="w-5 h-5" />
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[#111111]/80 backdrop-blur-md border-b border-[#222] flex items-center justify-between px-8 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
              Presales — Caller Panel
              <span className="bg-[#222] text-gray-400 px-2 py-0.5 rounded text-xs border border-[#333]">
                {section === "dashboard" ? "Overview" : section === "forms" ? "Forms" : "Not Interested"}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Upload Excel button */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer border
                  ${isDragging
                    ? "bg-green-600 border-green-400 text-white"
                    : "bg-[#1a1a1a] border-[#333] text-gray-300 hover:border-purple-500/50 hover:text-white"
                  }`}
              >
                <FaFileExcel className="text-green-400" />
                {rawLeads.length > 0 ? `${rawLeads.length} Leads` : "Upload Excel"}
                <FaUpload className="text-xs" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {uploadError && (
              <span className="text-red-400 text-xs flex items-center gap-1">
                <FaExclamationTriangle /> {uploadError}
              </span>
            )}

            {/* Profile */}
            <div className="relative">
              <div
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-9 h-9 rounded-full bg-purple-900/30 text-purple-400 border border-purple-500/50 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-purple-900/50 transition-colors"
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              {isProfileOpen && (
                <div className="absolute top-12 right-0 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-4 z-50 animate-fadeIn">
                  <h3 className="text-white font-bold">{user.name}</h3>
                  <p className="text-gray-400 text-xs truncate mb-3">{user.email}</p>
                  <hr className="border-[#2a2a2a] mb-3" />
                  <p className="text-gray-400 text-sm flex justify-between">
                    Role <span className="text-purple-400 font-bold capitalize">{user.role}</span>
                  </p>
                  <button
                    onClick={handleLogout}
                    className="w-full mt-4 bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/30 py-2 rounded-lg font-semibold transition-colors cursor-pointer text-sm"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a] custom-scrollbar">

          {/* ── DASHBOARD ── */}
          {section === "dashboard" && (
            <DashboardSection rawLeads={rawLeads} savedLeads={savedLeads} callerName={user.name} />
          )}

          {/* ── LEADS TABLE (shown from dashboard when leads exist) ── */}
          {section === "dashboard" && rawLeads.length > 0 && (
            <div className="mt-8 animate-fadeIn">
              {/* Table controls */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-purple-500 outline-none transition-colors"
                  />
                </div>
                <select
                  value={sourceFilter}
                  onChange={e => setSourceFilter(e.target.value)}
                  className="bg-[#1a1a1a] border border-[#222] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500 cursor-pointer"
                >
                  {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-xs text-gray-500 self-center flex-shrink-0">
                  {filteredRaw.length} of {rawLeads.length} leads
                </span>
              </div>

              {/* Table */}
              <div className="bg-[#111111] rounded-2xl border border-[#222] overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[#222] bg-[#151515] flex justify-between items-center">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    <FaUpload className="text-purple-400" /> Uploaded Leads
                  </h3>
                  <span className="text-[10px] text-gray-500 bg-[#222] px-2 py-0.5 rounded border border-[#333]">
                    Click any row to open ticket
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-[11px] uppercase bg-[#1a1a1a] text-gray-500">
                      <tr>
                        <th className="px-4 py-3 border-b border-[#222]">#</th>
                        <th className="px-4 py-3 border-b border-[#222]">Name</th>
                        <th className="px-4 py-3 border-b border-[#222]">Phone</th>
                        <th className="px-4 py-3 border-b border-[#222]">Email</th>
                        <th className="px-4 py-3 border-b border-[#222]">Source</th>
                        <th className="px-4 py-3 border-b border-[#222]">Budget</th>
                        <th className="px-4 py-3 border-b border-[#222]">Location</th>
                        <th className="px-4 py-3 border-b border-[#222] text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {filteredRaw.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-600">
                            No leads match your search.
                          </td>
                        </tr>
                      ) : (
                        filteredRaw.map(lead => {
                          const saved = isLeadSaved(lead.id);
                          return (
                            <tr
                              key={lead.id}
                              onClick={() => setTicketLead(lead)}
                              className="hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                            >
                              <td className="px-4 py-3 font-mono text-purple-400 font-bold">#{lead.id}</td>
                              <td className="px-4 py-3 text-white font-semibold group-hover:text-purple-300 transition-colors">
                                {lead.name}
                              </td>
                              <td className="px-4 py-3 font-mono">{maskPhone(lead.phone)}</td>
                              <td className="px-4 py-3 max-w-[140px] truncate">{lead.email || "—"}</td>
                              <td className="px-4 py-3">{sourceBadge(lead.source)}</td>
                              <td className="px-4 py-3 text-green-400 font-semibold">{lead.budget || "—"}</td>
                              <td className="px-4 py-3">{lead.location || "—"}</td>
                              <td className="px-4 py-3 text-center">
                                {saved ? (
                                  <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full">
                                    Saved
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-500 bg-[#222] border border-[#333] px-2 py-0.5 rounded-full">
                                    New
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── FORMS SECTION ── */}
          {section === "forms" && !detailLead && (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaClipboardList className="text-purple-400" /> Saved Forms
                </h2>
                <span className="text-xs text-gray-500 bg-[#1a1a1a] border border-[#222] px-3 py-1.5 rounded-full">
                  {formLeads.length} leads
                </span>
              </div>

              {formLeads.length === 0 ? (
                <div className="border-2 border-dashed border-[#2a2a2a] rounded-2xl p-16 text-center text-gray-600">
                  <FaSave className="text-5xl mx-auto mb-4 opacity-20" />
                  <p className="font-semibold mb-1">No saved leads yet</p>
                  <p className="text-sm">Save a lead from the Leads table to see it here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {formLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => setDetailLead(lead)}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500/50 rounded-2xl p-5 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4 pb-3 border-b border-[#2a2a2a]">
                        <div>
                          <p className="text-[10px] text-purple-400 font-bold mb-1">#{lead.id}</p>
                          <h3 className="text-white font-bold group-hover:text-purple-300 transition-colors">{lead.name}</h3>
                        </div>
                        {lead.interestStatus
                          ? interestBadge(lead.interestStatus)
                          : <span className="text-[10px] font-bold text-gray-500 bg-[#222] border border-[#333] px-2 py-0.5 rounded-full">Pending</span>
                        }
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <FaPhoneAlt className="text-[10px] flex-shrink-0" />
                          <span className="font-mono">{maskPhone(lead.phone)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <FaMoneyBillWave className="text-[10px] flex-shrink-0" />
                          <span className="text-green-400 font-semibold">{lead.budget || "N/A"}</span>
                        </div>
                        {lead.siteVisitDate && (
                          <div className="flex items-center gap-2 text-orange-400 text-xs">
                            <FaCalendarAlt className="text-[9px]" />
                            <span>{formatDate(lead.siteVisitDate).split(",")[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#2a2a2a] flex justify-between items-center">
                        <span className="text-[10px] text-gray-600">{formatDate(lead.savedAt).split(",")[0]}</span>
                        <div className="flex items-center gap-2">
                          {sourceBadge(lead.source)}
                          <span className="text-[10px] text-gray-500 group-hover:text-purple-400 transition-colors font-bold">
                            Open →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FORMS — DETAIL VIEW ── */}
          {section === "forms" && detailLead && (
            <LeadDetailView
              lead={detailLead}
              onBack={() => setDetailLead(null)}
              onUpdateLead={updateLead}
              callerName={user.name}
            />
          )}

          {/* ── NOT INTERESTED SECTION ── */}
          {section === "not_interested" && (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaTimesCircle className="text-red-400" /> Not Interested
                </h2>
                <span className="text-xs text-gray-500 bg-[#1a1a1a] border border-[#222] px-3 py-1.5 rounded-full">
                  {notIntLeads.length} leads
                </span>
              </div>

              {notIntLeads.length === 0 ? (
                <div className="border-2 border-dashed border-[#2a2a2a] rounded-2xl p-16 text-center text-gray-600">
                  <FaTimesCircle className="text-5xl mx-auto mb-4 opacity-20" />
                  <p className="font-semibold mb-1">No rejected leads</p>
                  <p className="text-sm">Leads marked as Not Interested will appear here.</p>
                </div>
              ) : (
                <div className="bg-[#111111] rounded-2xl border border-[#222] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                      <thead className="text-[11px] uppercase bg-[#1a1a1a] text-gray-500">
                        <tr>
                          <th className="px-5 py-3 border-b border-[#222]">#</th>
                          <th className="px-5 py-3 border-b border-[#222]">Name</th>
                          <th className="px-5 py-3 border-b border-[#222]">Phone</th>
                          <th className="px-5 py-3 border-b border-[#222]">Budget</th>
                          <th className="px-5 py-3 border-b border-[#222]">Source</th>
                          <th className="px-5 py-3 border-b border-[#222]">Follow-ups</th>
                          <th className="px-5 py-3 border-b border-[#222]">Saved On</th>
                          <th className="px-5 py-3 border-b border-[#222]"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1a1a]">
                        {notIntLeads.map(lead => (
                          <tr key={lead.id} className="hover:bg-[#1a1a1a] transition-colors group">
                            <td className="px-5 py-3 font-mono text-red-400 font-bold">#{lead.id}</td>
                            <td className="px-5 py-3 text-white font-semibold">{lead.name}</td>
                            <td className="px-5 py-3 font-mono">{maskPhone(lead.phone)}</td>
                            <td className="px-5 py-3 text-green-400">{lead.budget || "—"}</td>
                            <td className="px-5 py-3">{sourceBadge(lead.source)}</td>
                            <td className="px-5 py-3">
                              <span className="text-[10px] bg-[#222] border border-[#333] px-2 py-0.5 rounded-full font-bold">
                                {lead.followUps.length} notes
                              </span>
                            </td>
                            <td className="px-5 py-3 text-[11px]">{formatDate(lead.savedAt).split(",")[0]}</td>
                            <td className="px-5 py-3">
                              <button
                                onClick={() => {
                                  setDetailLead(lead);
                                  setSection("forms");
                                  // temporarily move back to forms to view detail
                                  setSavedLeads(prev => prev.map(l =>
                                    l.id === lead.id ? { ...l, status: "saved", interestStatus: undefined } : l
                                  ));
                                }}
                                className="text-gray-500 hover:text-purple-400 transition-colors cursor-pointer text-xs flex items-center gap-1"
                              >
                                <FaEye /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}} />
    </div>
  );
}