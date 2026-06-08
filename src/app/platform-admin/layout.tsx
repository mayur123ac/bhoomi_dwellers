import React from "react";

export const metadata = {
  title: "Nexora Platform Admin",
  description: "Super Admin Console for Nexora AI SaaS",
};

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="platform-admin-root min-h-screen bg-[#050816] text-white">
      {/* TODO: Add Platform Admin specific layout elements here if needed */}
      {children}
    </div>
  );
}
