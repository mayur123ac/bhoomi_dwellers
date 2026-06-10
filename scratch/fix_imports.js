const fs = require('fs');
const path = 'd:/CRM-SaasV2/frontend/src/app/org/[slug]/dashboard/receptionist/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const correctImports = `
//receptionist frontend
"use client";
import { useRequestLock } from '@/lib/hooks/useRequestLock';

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { clearCrmSession, getStoredCrmUser, installLoggedOutBackGuard } from "@/lib/authSession";
import { getDashboardPath } from "@/lib/rbac";
import { buildTheme } from "@/lib/theme";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaThLarge, FaCog, FaBell, FaTimes, FaClipboardList,
  FaChevronLeft, FaRobot, FaPaperPlane, FaCalendarAlt, FaEye, FaEyeSlash,
  FaPhoneAlt, FaUserCircle, FaBriefcase, FaSearch, FaDownload,
  FaFileInvoice, FaHandshake, FaUniversity, FaUsers, FaFileAlt,
  FaCheck, FaClock, FaMicrophone, FaWhatsapp, FaCheckCircle,
  FaExchangeAlt, FaUserTie, FaSun, FaMoon
} from "react-icons/fa";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Ghost, AlertTriangle } from "lucide-react";
import LostLeadModal from "@/components/LostLeadModal";
import MarkClosingModal from "@/components/MarkClosingModal";
import AIInsightCard from "@/components/AIInsightCard";
import { RoleBasedSidebar } from "@/components/RoleBasedSidebar";
`;

// we just replace everything from top until "import { RoleBasedSidebar }"
content = content.replace(/^.*?import \{ RoleBasedSidebar \} from "@\/components\/RoleBasedSidebar";/s, correctImports.trim());

fs.writeFileSync(path, content, 'utf8');
console.log('Restored imports.');
