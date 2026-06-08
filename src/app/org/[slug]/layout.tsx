import React from "react";
import TenantProvider from "@/components/TenantProvider";

export default async function TenantLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  return (
    <TenantProvider slug={slug}>
      {children}
    </TenantProvider>
  );
}
