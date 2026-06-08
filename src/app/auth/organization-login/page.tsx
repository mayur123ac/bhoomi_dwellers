"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrganizationLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual login flow
    // 1. Validate credentials
    // 2. Fetch organization slug
    // 3. router.push(`/org/${slug}/dashboard`)
    alert("Organization login not implemented yet.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* TODO: Implement Organization Login UI */}
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold mb-6 text-center">Organization Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input 
              type="email" 
              className="w-full border px-3 py-2 rounded" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input 
              type="password" 
              className="w-full border px-3 py-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
