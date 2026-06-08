"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  return (
    <button 
      className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-md hover:bg-slate-100 transition-colors"
      onClick={() => {
        document.cookie = "crm_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        window.location.href = "/platform-admin/login";
      }}
    >
      Sign Out
    </button>
  );
}
