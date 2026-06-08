"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export interface SidebarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface RoleBasedSidebarProps {
  items: SidebarItem[];
  activeId?: string; // Optional if using href matching
  onItemClick?: (id: string) => void;
}

export function RoleBasedSidebar({ items, activeId, onItemClick }: RoleBasedSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <>
      {/* ── BACKDROP OVERLAY ── */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-300 ease-in-out z-[45]"
        style={{
          backgroundColor: hoveredId ? "rgba(0,0,0,0.15)" : "transparent",
          backdropFilter: hoveredId ? "blur(4px)" : "blur(0px)",
          opacity: hoveredId ? 1 : 0,
        }}
      />

      {/* ── SIDEBAR CONTAINER ── */}
      <div 
        className="hidden md:flex flex-col h-screen flex-shrink-0 z-50 border-r"
        style={{
          backgroundColor: "#0B1120",
          borderColor: "#1E293B",
          width: "84px",
        }}
      >
        {/* LOGO */}
        <div className="flex items-center justify-center h-20 border-b border-[#1E293B] relative w-full">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xl z-50 shadow-[0_0_15px_rgba(192,38,211,0.4)]" 
            style={{ background: "linear-gradient(135deg, #C026D3, #7C3AED)" }}
          >
            N
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col mt-6 px-4 space-y-4 flex-1 relative items-center">
          {items.map(item => {
            const isPathActive = item.href ? pathname.startsWith(item.href) : false;
            const isActive = activeId 
              ? (activeId === item.id || (item.id === "forms" && activeId === "detail")) 
              : isPathActive;
            const isHovered = hoveredId === item.id;

            const handleClick = () => {
              if (item.onClick) item.onClick();
              if (onItemClick) onItemClick(item.id);
            };

            const content = (
              <div
                className="relative flex items-center justify-center cursor-pointer transition-colors"
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  backgroundColor: isActive ? "#111827" : "transparent",
                  border: isActive ? "1px solid #1E293B" : "1px solid transparent",
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div 
                    className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full shadow-[0_0_10px_rgba(192,38,211,0.6)]"
                    style={{ background: "linear-gradient(135deg, #C026D3, #7C3AED)" }}
                  />
                )}

                {/* Icon */}
                <div 
                  className="flex items-center justify-center flex-shrink-0 transition-colors z-10"
                  style={{ color: isActive || isHovered ? "#E5E7EB" : "#9CA3AF" }}
                >
                  {item.icon}
                </div>

                {/* Floating Hover Pill */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, x: -10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -5, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute left-[68px] flex items-center px-4 py-2.5 rounded-xl whitespace-nowrap pointer-events-none z-[60]"
                      style={{
                        backgroundColor: "#0F172A",
                        border: "1px solid rgba(255,255,255,0.06)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <span className="text-white font-medium text-[13px] tracking-tight">
                        {item.label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );

            return (
              <div key={item.id} className="relative z-50">
                {item.href ? (
                  <Link href={item.href} onClick={handleClick}>
                    {content}
                  </Link>
                ) : (
                  <div onClick={handleClick}>
                    {content}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}
