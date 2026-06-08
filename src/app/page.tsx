"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getDashboardPath } from "@/lib/rbac";
import { motion, useScroll, useTransform, useInView, AnimatePresence, type Variants } from "framer-motion";

// ─── Color system & tokens ───────────────────────────────────────────────────
const C = {
  bg1: "#050816",
  bg2: "#0F172A",
  card: "#0F172A",
  elevated: "#1E293B",
  accent: "#3B82F6",
  accent2: "#2563EB",
  glow: "#22D3EE",
  purple: "#8B5CF6",
  border: "#1E293B",
  text: "#F8FAFC",
  muted: "#94A3B8",
  success: "#10B981",
  danger: "#EF4444",
  amber: "#F59E0B",
};

// ─── Framer Motion Variants ──────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const blurReveal: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: "easeOut" } },
};

// ─── Background Effects (replaces canvas — more performant) ──────────────────
function BackgroundEffects() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {/* Animated mesh gradient orbs */}
      <div style={{
        position: "absolute", top: "-10%", left: "-10%", width: "60vw", height: "60vw", borderRadius: "50%",
        background: `radial-gradient(circle, ${C.accent}12 0%, transparent 60%)`,
        animation: "orbFloat 25s ease-in-out infinite",
        filter: "blur(60px)",
      }} />
      <div style={{
        position: "absolute", top: "20%", right: "-20%", width: "70vw", height: "70vw", borderRadius: "50%",
        background: `radial-gradient(circle, ${C.purple}0C 0%, transparent 60%)`,
        animation: "orbFloat 35s ease-in-out infinite reverse",
        filter: "blur(80px)",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", left: "10%", width: "50vw", height: "50vw", borderRadius: "50%",
        background: `radial-gradient(circle, ${C.glow}08 0%, transparent 60%)`,
        animation: "orbFloat 30s ease-in-out infinite 5s",
        filter: "blur(70px)",
      }} />
    </div>
  );
}

// ─── Typewriter effect ───────────────────────────────────────────────────────
function Typewriter({ texts, speed = 80, pause = 2000 }: { texts: string[]; speed?: number; pause?: number }) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(true);
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (typing) {
      if (display.length < texts[idx].length) {
        timeout = setTimeout(() => setDisplay(texts[idx].slice(0, display.length + 1)), speed);
      } else {
        timeout = setTimeout(() => setTyping(false), pause);
      }
    } else {
      if (display.length > 0) {
        timeout = setTimeout(() => setDisplay(display.slice(0, -1)), 40);
      } else {
        setIdx((idx + 1) % texts.length);
        setTyping(true);
      }
    }
    return () => clearTimeout(timeout);
  }, [display, typing, idx, texts, speed, pause]);
  return (
    <span style={{ background: `linear-gradient(135deg, #60A5FA, #A78BFA)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
      {display}
      <span style={{ animation: "blink 1s step-end infinite", borderLeft: `2px solid #A78BFA`, marginLeft: 2 }}>&nbsp;</span>
    </span>
  );
}

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ value, label }: { value: string; label: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const numMatch = value.match(/[\d,.]+/);
  const numericPart = numMatch ? numMatch[0] : "";
  const prefix = value.slice(0, value.indexOf(numericPart));
  const suffix = value.slice(value.indexOf(numericPart) + numericPart.length);
  const targetNum = parseFloat(numericPart.replace(/,/g, ""));
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView || isNaN(targetNum)) return;
    const dur = 1800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(targetNum * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, targetNum]);

  const formatCount = () => {
    if (numericPart.includes(".")) return count.toFixed(1);
    if (numericPart.includes(",")) return Math.floor(count).toLocaleString();
    return Math.floor(count).toString();
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      style={{ textAlign: "center" }}
    >
      <div style={{
        fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em",
        background: `linear-gradient(135deg, ${C.text}, ${C.muted})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>
        {prefix}{isInView ? formatCount() : "0"}{suffix}
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 4, fontWeight: 500 }}>{label}</div>
    </motion.div>
  );
}

// ─── AI Notification Pill ────────────────────────────────────────────────────
function AIPill({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <motion.div
      variants={blurReveal}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        background: C.elevated, border: `1px solid ${C.border}`,
        borderRadius: 100, padding: "8px 16px", fontSize: 13,
        color: C.text, whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}` }} />
      <span style={{ color: C.muted }}>{icon}</span>
      <span>{text}</span>
    </motion.div>
  );
}

// ─── Feature Card ────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, glow = C.accent }: { icon: React.ReactNode; title: string; desc: string; glow?: string }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      variants={cardReveal}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{
        background: hov ? C.elevated : C.card,
        border: `1px solid ${hov ? glow + "55" : C.border}`,
        borderRadius: 16, padding: "28px 24px",
        transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
        boxShadow: hov ? `0 12px 40px ${glow}18` : "none",
        cursor: "default",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${glow}18`, border: `1px solid ${glow}33`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, marginBottom: 16, color: glow,
      }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 8, letterSpacing: "-0.01em" }}>{title}</div>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{desc}</div>
    </motion.div>
  );
}

// ─── Dashboard Preview ───────────────────────────────────────────────────────
function DashboardMock() {
  const bars = [65, 82, 54, 90, 71, 88, 60, 95, 73, 84, 67, 78];
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) setTimeout(() => setAnimated(true), 300);
  }, [isInView]);

  return (
    <div ref={ref} style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 20, overflow: "hidden",
      boxShadow: `0 0 80px ${C.accent}18, 0 32px 64px rgba(0,0,0,0.5)`,
    }}>
      {/* Titlebar */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#EF4444", "#F59E0B", "#10B981"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
        </div>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>nexora.ai / org / bhoomi-dwellers / dashboard</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 0, minHeight: 480 }}>
        {/* Sidebar */}
        <div style={{ background: C.bg2, borderRight: `1px solid ${C.border}`, padding: "20px 0" }}>
          <div style={{ padding: "0 16px 20px", borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>N</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Bhoomi Dwellers</div>
                <div style={{ fontSize: 10, color: C.muted }}>Organization Workspace</div>
              </div>
            </div>
          </div>
          {[
            { icon: "◈", label: "Dashboard", active: true },
            { icon: "◎", label: "Leads", badge: "248" },
            { icon: "◷", label: "Pipeline" },
            { icon: "⊡", label: "Automations" },
            { icon: "◉", label: "Team" },
            { icon: "⊞", label: "Analytics" },
            { icon: "✦", label: "AI Assistant", accent: true },
          ].map(item => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 16px", margin: "2px 8px", borderRadius: 8,
              background: item.active ? `${C.accent}18` : "transparent",
              color: item.active ? C.accent : item.accent ? C.glow : C.muted,
              fontSize: 12, cursor: "pointer",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
              </span>
              {item.badge && <span style={{ background: C.accent, color: "#fff", borderRadius: 100, padding: "1px 7px", fontSize: 10, fontWeight: 600 }}>{item.badge}</span>}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ padding: 20, background: C.bg1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total Leads", val: "2,847", delta: "+12%", pos: true },
              { label: "Active Pipeline", val: "₹4.2Cr", delta: "+8%", pos: true },
              { label: "Conversions", val: "18.4%", delta: "+3.1%", pos: true },
              { label: "Avg. Response", val: "4.2 min", delta: "-18%", pos: true },
            ].map(k => (
              <div key={k.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>{k.val}</div>
                <div style={{ fontSize: 11, color: k.pos ? C.success : C.danger, marginTop: 4 }}>{k.delta} vs last month</div>
              </div>
            ))}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Lead Volume & Conversions</div>
                <div style={{ fontSize: 11, color: C.muted }}>Last 12 months</div>
              </div>
              <div style={{ fontSize: 11, color: C.accent, background: `${C.accent}15`, padding: "4px 10px", borderRadius: 6 }}>AI Forecast Active</div>
            </div>
            <svg width="100%" viewBox="0 0 400 100" preserveAspectRatio="none" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.accent} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={C.accent} stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.glow} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={C.glow} stopOpacity="0" />
                </linearGradient>
              </defs>
              {bars.map((h, i) => (
                <rect key={i} x={i * 33 + 2} y={animated ? 100 - h : 100} width={26} height={animated ? h : 0} rx={4} fill="url(#barGrad)" style={{ transition: `all 0.8s ease ${i * 0.05}s` }} />
              ))}
              <polyline points={bars.map((h, i) => `${i * 33 + 15},${100 - h * 0.6}`).join(" ")} fill="none" stroke={C.glow} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`M0,${100 - bars[0] * 0.6} ${bars.map((h, i) => `L${i * 33 + 15},${100 - h * 0.6}`).join(" ")} L${11 * 33 + 15},100 L0,100 Z`} fill="url(#areaGrad)" />
            </svg>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: `${C.purple}12`, border: `1px solid ${C.purple}30`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.purple, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>✦</span> AI INSIGHT
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>3 high-intent leads from MagicBricks detected. Recommend follow-up within 2 hours for optimal conversion.</div>
            </div>
            <div style={{ background: `${C.success}10`, border: `1px solid ${C.success}25`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.success, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>⊕</span> AUTOMATION ACTIVE
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>WhatsApp drip campaign sent to 142 warm leads. Open rate: 68%. 18 site visit requests received.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Login Modal (PRESERVED — auth logic untouched) ──────────────────────────
function LoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [redirectTarget, setRedirectTarget] = useState("");
  const [redirectSlug, setRedirectSlug] = useState("");
  const failsafeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (failsafeRef.current) clearTimeout(failsafeRef.current); };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) return;
    setErrorMsg("");
    setStep("loading");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Invalid credentials. Please try again.");
        setStep("error");
        return;
      }

      const user = data.user;
      const slug = user?.organizationSlug;
      const role = user?.role?.toLowerCase() ?? "";

      if (!slug && role !== "super_admin") {
        setErrorMsg("Login succeeded but no organization was found for this account.");
        setStep("error");
        return;
      }

      try { localStorage.setItem("crm_user", JSON.stringify(user)); } catch {}

      const target = getDashboardPath(user?.role, slug);
      setRedirectTarget(target);
      setRedirectSlug(slug);
      setStep("success");

      failsafeRef.current = setTimeout(() => { window.location.href = target; }, 3000);
      setTimeout(() => { window.location.href = target; }, 600);
    } catch (err) {
      console.error("[LoginModal] Network error:", err);
      setErrorMsg("Could not reach the server. Please check your connection.");
      setStep("error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(5,8,22,0.85)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 24, padding: 40, width: "100%", maxWidth: 420,
          boxShadow: `0 0 0 1px ${C.accent}20, 0 40px 80px rgba(0,0,0,0.6), 0 0 80px ${C.accent}12`,
          position: "relative", overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 200, height: 120, borderRadius: "50%",
          background: `${C.accent}20`, filter: "blur(40px)", pointerEvents: "none",
        }} />

        {step === "success" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${C.success}18`, border: `1px solid ${C.success}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 20px" }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>Workspace Detected</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
              <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block", marginRight: 8 }}>◌</span>
              Redirecting to your dashboard…
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.elevated, borderRadius: 10, padding: "10px 16px", border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.muted }}>Redirecting to</span>
              <code style={{ fontSize: 12, color: C.accent, fontFamily: "monospace" }}>{redirectTarget}</code>
            </div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}33, ${C.purple}33)`, border: `1px solid ${C.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, margin: "0 auto 16px" }}>
                <span style={{ background: `linear-gradient(135deg, ${C.glow}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>N</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6, letterSpacing: "-0.03em" }}>Organization Login</div>
              <div style={{ fontSize: 13, color: C.muted }}>Access your secure enterprise workspace</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: C.muted, marginBottom: 6, display: "block", fontWeight: 500 }}>Organization Email</label>
              <input
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@yourcompany.com" type="email"
                style={{
                  width: "100%", padding: "12px 16px", background: C.bg2,
                  border: `1px solid ${email ? C.accent + "50" : C.border}`,
                  borderRadius: 10, color: C.text, fontSize: 14,
                  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s", fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: C.muted, marginBottom: 6, display: "block", fontWeight: 500 }}>Password</label>
              <input
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••" type="password"
                style={{
                  width: "100%", padding: "12px 16px", background: C.bg2,
                  border: `1px solid ${password ? C.accent + "50" : C.border}`,
                  borderRadius: 10, color: C.text, fontSize: 14,
                  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s", fontFamily: "inherit",
                }}
              />
            </div>

            {step === "error" && errorMsg && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: `${C.danger}15`, border: `1px solid ${C.danger}40`, color: C.danger, fontSize: 13 }}>
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={step === "loading"}
              style={{
                width: "100%", padding: "13px", borderRadius: 10,
                background: step === "loading" ? C.elevated : `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
                border: `1px solid ${C.accent}40`, color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: step === "loading" ? "not-allowed" : "pointer",
                letterSpacing: "0.01em", transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {step === "loading" ? (
                <><span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>◌</span> Authenticating…</>
              ) : step === "error" ? "Try Again →" : "Access Organization Workspace →"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20, justifyContent: "center" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, boxShadow: `0 0 6px ${C.success}` }} />
              <span style={{ fontSize: 11, color: C.muted }}>256-bit encrypted · Zero data retention · SOC 2 compliant</span>
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => window.location.href = "/platform-admin/login"}
                style={{
                  background: "rgba(255, 255, 255, 0.03)", border: `1px solid rgba(255, 255, 255, 0.08)`,
                  padding: "8px 16px", borderRadius: 100, color: C.muted, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.2s ease",
                  display: "flex", alignItems: "center", gap: 6,
                }}
                onMouseOver={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)"; e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)"; }}
                onMouseOut={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"; }}
              >
                <span style={{ fontSize: 10 }}>🛡️</span> Platform Admin
              </button>
            </div>
          </>
        )}

        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: C.muted, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>
      </motion.div>
    </motion.div>
  );
}

// ─── Workflow Step ────────────────────────────────────────────────────────────
function WorkflowStep({ num, title, desc, active, last }: { num: number; title: string; desc: string; active: boolean; last: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: num * 0.1 }}
      style={{ display: "flex", gap: 20, position: "relative" }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <motion.div
          animate={{
            scale: active ? 1.1 : 1,
            boxShadow: active ? `0 0 24px ${C.accent}50` : "0 0 0 transparent",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: active ? `linear-gradient(135deg, ${C.accent}, ${C.purple})` : C.card,
            border: `1px solid ${active ? C.accent : C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: active ? "#fff" : C.muted,
            transition: "background 0.4s, border-color 0.4s, color 0.4s",
          }}
        >{num}</motion.div>
        {!last && <div style={{ width: 1, flex: 1, background: `linear-gradient(${C.accent}40, ${C.border})`, margin: "8px 0", minHeight: 40 }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 32, paddingTop: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: active ? C.text : C.muted, marginBottom: 4, transition: "color 0.3s" }}>{title}</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{desc}</div>
      </div>
    </motion.div>
  );
}

// ─── Trust Badge ─────────────────────────────────────────────────────────────
function TrustBadge({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div
      variants={cardReveal}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: "20px 20px", display: "flex", alignItems: "flex-start", gap: 14,
      }}
    >
      <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{desc}</div>
      </div>
    </motion.div>
  );
}

// ─── AI Chat Bubble ──────────────────────────────────────────────────────────
function AIChatBubble({ label, message, type = "alert" }: { label: string; message: string; type?: "alert" | "warn" | "success" | "insight" }) {
  const colors = { alert: C.accent, warn: C.amber, success: C.success, insight: C.purple };
  const col = colors[type];
  return (
    <motion.div
      variants={cardReveal}
      whileHover={{ x: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      style={{
        background: C.elevated, border: `1px solid ${col}25`,
        borderRadius: 14, padding: "14px 16px", fontSize: 13,
        borderLeft: `3px solid ${col}`,
      }}
    >
      <div style={{ fontSize: 10, color: col, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        ✦ {label}
      </div>
      <div style={{ color: C.text, lineHeight: 1.5 }}>{message}</div>
    </motion.div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function NexoraAI() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dashboard parallax
  const dashRef = useRef(null);
  const { scrollYProgress: dashProgress } = useScroll({ target: dashRef, offset: ["start end", "end start"] });
  const dashY = useTransform(dashProgress, [0, 1], [60, -40]);
  const dashRotateX = useTransform(dashProgress, [0, 0.4, 1], [3, 0, -1]);
  const dashScale = useTransform(dashProgress, [0, 0.4], [0.94, 1]);

  // Hero parallax
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroY = useTransform(scrollY, [0, 500], [0, -60]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % 5), 2200);
    return () => clearInterval(t);
  }, []);

  const features = [
    { icon: "◈", title: "AI Lead Intelligence", desc: "Predictive scoring ranks every lead by conversion probability. Detect high-intent signals before your team does.", glow: C.accent },
    { icon: "⟳", title: "Workflow Automation", desc: "Build trigger-based automation chains without code. Set once, scale infinitely across your entire pipeline.", glow: C.purple },
    { icon: "◷", title: "Team Productivity Tracking", desc: "Real-time KPF monitoring, activity logs, call analytics, and hierarchy-based performance dashboards.", glow: C.success },
    { icon: "✉", title: "WhatsApp & Comms Hub", desc: "One-click WhatsApp templates, AI-composed messages, multi-channel threading — all in one inbox.", glow: C.amber },
    { icon: "◉", title: "Real-Time Analytics", desc: "Live dashboards with source attribution, cost-per-sale, funnel velocity, and AI-generated insights.", glow: C.glow },
    { icon: "⊛", title: "Smart Follow-Up Engine", desc: "3-year drip sequences, AI-timed follow-ups, and re-churn automation for inactive leads.", glow: C.accent },
    { icon: "⊞", title: "Tenant Branding", desc: "Custom domain, white-label login, branded client apps, and org-specific configuration per tenant.", glow: C.purple },
    { icon: "⊡", title: "Secure Multi-Tenant Infra", desc: "Isolated data silos, OTP-based auth, role-based access, IP restrictions, and enterprise-grade encryption.", glow: C.success },
  ];

  const aiInsights: Array<{ label: string; message: string; type: "alert" | "warn" | "success" | "insight" }> = [
    { label: "HIGH-INTENT SIGNAL", message: "Lead Rajesh M. visited the pricing page 4 times in 48 hrs. Probability of conversion: 89%. Recommend immediate call.", type: "alert" },
    { label: "ACTION REQUIRED", message: "3 leads from MagicBricks have not been contacted in >6 hours. Auto-assign triggered. Response SLA at risk.", type: "warn" },
    { label: "WEEKLY AI REPORT", message: "AI-generated: Sales velocity up 22% this week. Channel partner apps drove ₹1.4Cr in bookings. Full report ready.", type: "insight" },
    { label: "AUTOMATION RESULT", message: "Drip campaign 'Site Visit Invite Q2' achieved 71% open rate. 28 appointments auto-scheduled via AI calling.", type: "success" },
  ];

  const workflow = [
    { title: "Organization Setup", desc: "Super admin provisions your tenant. Custom domain, branding, and user roles configured in minutes." },
    { title: "Team Onboarding", desc: "Hierarchy-based access deployed. Sales, telecaller, and manager roles assigned with granular permissions." },
    { title: "Lead Management", desc: "All portals integrated. MagicBricks, 99Acres, Facebook, WhatsApp — leads flow into one unified pipeline." },
    { title: "AI Automation", desc: "Drip campaigns, auto-calling, follow-up sequences, and workflow triggers go live immediately." },
    { title: "Business Growth", desc: "Real-time analytics track every ₹ spent and earned. Scale with zero additional infrastructure overhead." },
  ];

  const trust = [
    { icon: "⌁", title: "End-to-End Encryption", desc: "AES-256 at rest, TLS 1.3 in transit. Your organization's data is never accessible cross-tenant." },
    { icon: "⊞", title: "Role-Based Access Control", desc: "Granular permissions per designation. Managers see hierarchy-wide data; agents see only their leads." },
    { icon: "⊛", title: "Tenant Isolation", desc: "Hard database-level separation. No shared tables, no shared compute. Each org is a sealed environment." },
    { icon: "◈", title: "Audit Logs", desc: "Every action timestamped and attributed. Full compliance trail for enterprise security audits." },
    { icon: "◷", title: "99.9% Uptime SLA", desc: "Multi-region infrastructure with automatic failover. No maintenance windows during business hours." },
    { icon: "⌬", title: "Scalable Architecture", desc: "From 5 users to 500, zero reconfiguration. Add projects, users, and leads with no performance degradation." },
  ];

  return (
    <div style={{ background: C.bg1, color: C.text, fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, button { font-family: inherit; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes orbFloat { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-20px) scale(1.05); } 66% { transform: translate(-20px,15px) scale(0.97); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg1}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        .nav-link:hover { color: ${C.text} !important; }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px ${C.purple}40 !important; }
        .cta-secondary:hover { background: ${C.elevated} !important; transform: translateY(-2px); }
        .premium-nav-link:hover { color: #fff !important; background: rgba(255,255,255,0.04); transform: translateY(-1px); }
        .premium-cta-primary:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 24px ${C.purple}50, inset 0 1px 1px rgba(255,255,255,0.4) !important; }
        .premium-cta-secondary:hover { background: rgba(255, 255, 255, 0.05) !important; border-color: rgba(255, 255, 255, 0.2) !important; transform: translateY(-1px); }
        .mobile-menu-btn { display: none; background: transparent; border: none; color: #fff; font-size: 24px; cursor: pointer; }
        @media (max-width: 768px) {
          .desktop-nav-links, .desktop-nav-ctas { display: none !important; }
          .mobile-menu-btn { display: block; }
          .responsive-grid-2 { grid-template-columns: 1fr !important; gap: 40px !important; }
          .dashboard-wrap { display: none !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 640px) {
          .footer-grid { grid-template-columns: 1fr !important; }
          .stats-row { gap: 24px !important; }
        }
      `}</style>

      <BackgroundEffects />

      <AnimatePresence>
        {loginOpen && <LoginModal key="login-modal" onClose={() => setLoginOpen(false)} />}
      </AnimatePresence>

      {/* ── PREMIUM FLOATING NAV ──────────────────────────────────────────── */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ position: "fixed", top: 24, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "center", pointerEvents: "none", padding: "0 24px" }}
      >
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: "80%", maxWidth: 800, height: 60, background: `${C.accent}20`,
          filter: "blur(50px)", borderRadius: "100%", zIndex: -1,
          transition: "opacity 0.5s ease", opacity: scrolled ? 0.4 : 0.8,
        }} />

        <nav style={{
          pointerEvents: "auto",
          background: scrolled ? "rgba(5, 8, 22, 0.85)" : "rgba(5, 8, 22, 0.45)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          border: `1px solid rgba(255, 255, 255, 0.04)`,
          boxShadow: `0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 20px ${C.purple}10`,
          borderRadius: 100, padding: "8px 12px 8px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40,
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          width: "100%", maxWidth: 1000, position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%",
            background: `linear-gradient(90deg, transparent, ${C.glow}15, transparent)`,
            animation: "shimmer 6s infinite linear", pointerEvents: "none", zIndex: 0,
          }} />

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1, cursor: "pointer" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.glow}, ${C.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 16, color: "#fff",
              boxShadow: `0 0 20px ${C.glow}60`,
            }}>N</div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "#fff" }}>Nexora <span style={{ color: C.muted, fontWeight: 500 }}>AI</span></span>
          </div>

          {/* Desktop Links */}
          <div className="desktop-nav-links" style={{ display: "flex", gap: 6, alignItems: "center", position: "relative", zIndex: 1 }}>
            {["Platform", "Pricing", "Docs", "Blog"].map((l, i) => (
              <a key={l} href="#" className="premium-nav-link" style={{
                fontSize: 14, color: i === 0 ? "#fff" : C.muted, fontWeight: i === 0 ? 600 : 500,
                textDecoration: "none", padding: "8px 18px", borderRadius: 100,
                transition: "all 0.3s ease", position: "relative",
              }}>
                {l}
                {i === 0 && <span style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 16, height: 2, background: C.glow, borderRadius: 2, boxShadow: `0 0 10px ${C.glow}` }} />}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="desktop-nav-ctas" style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <button onClick={() => setLoginOpen(true)} style={{ padding: "10px 22px", borderRadius: 100, background: "rgba(15, 23, 42, 0.6)", border: `1px solid rgba(255, 255, 255, 0.08)`, color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease", backdropFilter: "blur(10px)" }} className="premium-cta-secondary">Log In</button>
            <button style={{ padding: "10px 26px", borderRadius: 100, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, border: `1px solid rgba(255, 255, 255, 0.15)`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", boxShadow: `0 6px 16px ${C.purple}30, inset 0 1px 1px rgba(255,255,255,0.3)` }} className="premium-cta-primary">Request Demo</button>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ position: "relative", zIndex: 1 }}>
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                position: "absolute", top: 80, left: 24, right: 24,
                background: "rgba(11, 16, 35, 0.9)", backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)", border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", gap: 16,
                boxShadow: `0 20px 40px rgba(0,0,0,0.5)`, pointerEvents: "auto",
              }}
            >
              {["Platform", "Pricing", "Docs", "Blog"].map(l => (
                <a key={l} href="#" style={{ fontSize: 16, color: C.text, textDecoration: "none", fontWeight: 500, padding: "8px 0", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>{l}</a>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                <button onClick={() => { setLoginOpen(true); setMobileMenuOpen(false); }} style={{ padding: "14px", borderRadius: 12, background: "rgba(255, 255, 255, 0.05)", border: `1px solid rgba(255, 255, 255, 0.1)`, color: C.text, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Log In</button>
                <button style={{ padding: "14px", borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Request Demo</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <main style={{ position: "relative", zIndex: 1 }}>
        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <motion.section style={{ padding: "160px max(24px, calc((100vw - 1200px) / 2)) 100px", textAlign: "center", position: "relative", opacity: heroOpacity, y: heroY }}>
          <div style={{
            position: "absolute", top: 80, left: "50%", transform: "translateX(-50%)",
            width: 600, height: 300, borderRadius: "50%",
            background: `radial-gradient(ellipse, ${C.accent}12 0%, transparent 70%)`,
            pointerEvents: "none", filter: "blur(40px)",
          }} />

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 100, background: `${C.accent}15`, border: `1px solid ${C.accent}30`, marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 12, color: C.accent, fontWeight: 500, letterSpacing: "0.04em" }}>AI-Powered CRM Infrastructure</span>
            </div>
          </motion.div>

          {/* Heading — line-by-line reveal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 style={{ fontSize: "clamp(36px, 5vw, 68px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.04em", marginBottom: 24, maxWidth: 900, margin: "0 auto 24px" }}>
              The Intelligent CRM Platform<br />
              Built For{" "}
              <Typewriter texts={["Modern Organizations", "Real Estate Builders", "Enterprise Teams", "Ambitious Realtors"]} />
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: C.muted, maxWidth: 640, margin: "0 auto 40px", lineHeight: 1.7, fontWeight: 400 }}>
              Automate operations, manage leads, empower teams, and scale your organization with AI-powered workflows and enterprise-grade CRM infrastructure.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}
          >
            <button style={{
              padding: "14px 32px", borderRadius: 12,
              background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
              border: "none", color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.01em",
              boxShadow: `0 0 0 0 ${C.accent}`, transition: "all 0.25s ease",
            }} className="cta-primary">
              Request Demo →
            </button>
            <button onClick={() => setLoginOpen(true)} style={{
              padding: "14px 32px", borderRadius: 12,
              background: C.card, border: `1px solid ${C.border}`,
              color: C.text, fontSize: 15, fontWeight: 600,
              cursor: "pointer", transition: "all 0.25s ease",
            }} className="cta-secondary">
              Organization Login
            </button>
          </motion.div>

          {/* AI Notification Pills */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 48 }}
          >
            <AIPill icon="⚡" text="High-intent lead detected" color={C.accent} />
            <AIPill icon="⏰" text="3 urgent follow-ups pending" color={C.amber} />
            <AIPill icon="✦" text="AI report generated" color={C.purple} />
          </motion.div>

          {/* Animated Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="stats-row"
            style={{ display: "flex", gap: 48, justifyContent: "center", marginTop: 64, flexWrap: "wrap" }}
          >
            <AnimatedCounter value="500+" label="Organizations" />
            <AnimatedCounter value="2.4M+" label="Leads Managed" />
            <AnimatedCounter value="₹850Cr+" label="Pipeline Tracked" />
            <AnimatedCounter value="80%" label="Less Manual Work" />
          </motion.div>
        </motion.section>

        {/* ── DASHBOARD PREVIEW (Parallax + Perspective) ─────────────────── */}
        <section ref={dashRef} className="dashboard-wrap" style={{ padding: "40px max(24px, calc((100vw - 1200px) / 2)) 100px", perspective: 1200 }}>
          <motion.div style={{ y: dashY, rotateX: dashRotateX, scale: dashScale, transformOrigin: "center top" }}>
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <DashboardMock />
            </motion.div>
          </motion.div>
        </section>

        {/* ── FEATURES (Stagger Grid Reveal) ──────────────────────────────── */}
        <section style={{ padding: "100px max(24px, calc((100vw - 1200px) / 2))" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>PLATFORM CAPABILITIES</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>Every tool your organization needs,<br />unified under one intelligent platform.</h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 520, margin: "0 auto" }}>From first lead to final handover — Nexora AI covers the full lifecycle with precision automation.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}
          >
            {features.map(f => <FeatureCard key={f.title} {...f} />)}
          </motion.div>
        </section>

        {/* ── AI SHOWCASE (Stagger Chat Bubbles) ──────────────────────────── */}
        <section style={{ padding: "100px max(24px, calc((100vw - 1200px) / 2))", background: C.bg2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div style={{ fontSize: 12, color: C.purple, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>AI AUTOMATION SHOWCASE</div>
              <h2 style={{ fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 20, lineHeight: 1.2 }}>Your CRM that thinks,<br />acts, and closes — 24/7.</h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 32 }}>Nexora&apos;s AI continuously monitors your pipeline, surfaces high-intent signals, triggers follow-ups, and generates actionable intelligence — all without human intervention.</p>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
              >
                {["AI Calling", "WhatsApp Drips", "Lead Scoring", "Auto-Assignment", "Drip Campaigns", "Smart Reports"].map(t => (
                  <motion.span key={t} variants={cardReveal} style={{ fontSize: 12, color: C.muted, background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 12px" }}>{t}</motion.span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={staggerContainer}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              {aiInsights.map((ins, i) => <AIChatBubble key={i} {...ins} />)}
            </motion.div>
          </div>
        </section>

        {/* ── WORKFLOW ────────────────────────────────────────────────────── */}
        <section style={{ padding: "100px max(24px, calc((100vw - 1200px) / 2))" }}>
          <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7 }}
            >
              <div style={{ fontSize: 12, color: C.success, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>ONBOARDING FLOW</div>
              <h2 style={{ fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 20, lineHeight: 1.2 }}>Up and running in one business day.</h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 40 }}>From organization provisioning to full AI automation — Nexora deploys without months of implementation cycles or expensive consultants.</p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                style={{ padding: "12px 28px", borderRadius: 10, background: `${C.success}15`, border: `1px solid ${C.success}30`, color: C.success, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                See how it works →
              </motion.button>
            </motion.div>
            <div>
              {workflow.map((step, i) => (
                <WorkflowStep key={i} num={i + 1} title={step.title} desc={step.desc} active={i === activeStep} last={i === workflow.length - 1} />
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST ──────────────────────────────────────────────────────── */}
        <section style={{ padding: "100px max(24px, calc((100vw - 1200px) / 2))", background: C.bg2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <div style={{ fontSize: 12, color: C.amber, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>ENTERPRISE TRUST</div>
            <h2 style={{ fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>Infrastructure built for enterprises<br />that cannot afford downtime.</h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 520, margin: "0 auto" }}>Every organization on Nexora operates in a fully isolated, encrypted, and auditable environment.</p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}
          >
            {trust.map(t => <TrustBadge key={t.title} {...t} />)}
          </motion.div>
        </section>

        {/* ── PRICING ────────────────────────────────────────────────────── */}
        <section style={{ padding: "100px max(24px, calc((100vw - 1200px) / 2))" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <div style={{ fontSize: 12, color: C.glow, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>PRICING PLANS</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>Simple, transparent pricing.</h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 520, margin: "0 auto" }}>Start with our demo or scale up to full enterprise capability.</p>
          </motion.div>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
            {/* Demo Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -6 }}
              style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 20,
                padding: 40, width: "100%", maxWidth: 360, display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>Demo</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
                <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color: C.text }}>₹0</span>
                <span style={{ fontSize: 14, color: C.muted }}>/ 14 days</span>
              </div>
              <p style={{ fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 1.6 }}>Experience the full power of Nexora AI in a sandbox environment.</p>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {["Full feature access", "Up to 5 team members", "AI predictive scoring", "WhatsApp automation (limited)"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.text }}>
                    <span style={{ color: C.success }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button style={{
                padding: "14px", borderRadius: 10, width: "100%",
                background: "transparent", border: `1px solid ${C.accent}`,
                color: C.accent, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              }} className="cta-secondary">Start Demo</button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -6 }}
              style={{
                background: `linear-gradient(180deg, ${C.elevated}, ${C.card})`, border: `1px solid ${C.accent}40`, borderRadius: 20,
                padding: 40, width: "100%", maxWidth: 360, display: "flex", flexDirection: "column",
                boxShadow: `0 0 40px ${C.accent}15`, position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${C.accent}, ${C.purple})` }} />
              <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>RECOMMENDED</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>Enterprise</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
                <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: C.text }}>Contact Us</span>
              </div>
              <p style={{ fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 1.6 }}>Tailored infrastructure for scaling real estate organizations.</p>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {["Unlimited team members", "White-label tenant branding", "Custom AI drip workflows", "Dedicated success manager", "99.9% Uptime SLA"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.text }}>
                    <span style={{ color: C.success }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button style={{
                padding: "14px", borderRadius: 10, width: "100%",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, border: "none",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: `0 4px 14px ${C.accent}40`, transition: "all 0.2s",
              }} className="cta-primary">Contact for Pricing</button>
            </motion.div>
          </div>
        </section>

        {/* ── CTA BANNER (Cinematic) ──────────────────────────────────────── */}
        <section style={{ padding: "120px max(24px, calc((100vw - 1200px) / 2))", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* Cinematic radial glow */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 800, height: 600, borderRadius: "50%",
            background: `radial-gradient(ellipse, ${C.accent}15 0%, ${C.purple}08 40%, transparent 70%)`,
            pointerEvents: "none", filter: "blur(60px)",
          }} />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7 }}
            style={{ maxWidth: 760, margin: "0 auto", position: "relative", zIndex: 1 }}
          >
            <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>GET STARTED</div>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 56px)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 20, lineHeight: 1.1 }}>Ready to deploy AI-powered CRM infrastructure for your organization?</h2>
            <p style={{ fontSize: 16, color: C.muted, marginBottom: 40, lineHeight: 1.7 }}>Join 500+ Indian real estate organizations that have replaced manual operations with Nexora AI&apos;s intelligent automation platform.</p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: "16px 36px", borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
                  border: "none", color: "#fff", fontSize: 16, fontWeight: 700,
                  cursor: "pointer", letterSpacing: "0.01em",
                  boxShadow: `0 0 40px ${C.accent}30`, transition: "box-shadow 0.25s ease",
                }}
              >
                Book a Free Demo →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLoginOpen(true)}
                style={{
                  padding: "16px 36px", borderRadius: 12,
                  background: C.card, border: `1px solid ${C.border}`,
                  color: C.text, fontSize: 16, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.25s ease",
                }}
              >
                Organization Login
              </motion.button>
            </motion.div>
          </motion.div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: "60px max(24px, calc((100vw - 1200px) / 2)) 40px", background: C.bg2, position: "relative" }}>
          {/* Subtle grid fade */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 200,
            backgroundImage: `linear-gradient(rgba(59,130,246,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.02) 1px, transparent 1px)`,
            backgroundSize: "48px 48px", pointerEvents: "none",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
          }} />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
            className="footer-grid"
            style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 60, marginBottom: 60, position: "relative", zIndex: 1 }}
          >
            <motion.div variants={cardReveal}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#fff" }}>N</div>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Nexora AI</span>
              </div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, maxWidth: 280, marginBottom: 20 }}>The intelligent CRM infrastructure platform for modern Indian real estate organizations.</p>
              <div style={{ display: "flex", gap: 12 }}>
                {["𝕏", "in", "◉"].map(s => (
                  <div key={s} style={{ width: 34, height: 34, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.muted, cursor: "pointer" }}>{s}</div>
                ))}
              </div>
            </motion.div>
            {[
              { title: "Platform", links: ["Features", "Pricing", "Integrations", "API Docs", "Changelog"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press", "Contact"] },
              { title: "Support", links: ["Help Center", "Status", "Privacy Policy", "Terms of Service", "Security"] },
            ].map(col => (
              <motion.div key={col.title} variants={cardReveal}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>{col.title}</div>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ display: "block", fontSize: 13, color: C.muted, textDecoration: "none", marginBottom: 10, transition: "color 0.2s" }} className="nav-link">{l}</a>
                ))}
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, position: "relative", zIndex: 1 }}
          >
            <div style={{ fontSize: 12, color: C.muted }}>© 2025 Nexora AI Technologies Pvt. Ltd. All rights reserved.</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 12, color: C.muted }}>All systems operational · 99.98% uptime</span>
            </div>
          </motion.div>
        </footer>
      </main>
    </div>
  );
}