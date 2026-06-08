"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface TenantBranding {
  crm_title: string;
  logo: string | null;
  favicon: string | null;
  primary_color: string;
  secondary_color: string;
  sidebar_theme: string;
}

interface TenantContextType {
  slug?: string;
  branding: TenantBranding | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType>({
  branding: null,
  isLoading: true,
});

export const useTenant = () => useContext(TenantContext);

export default function TenantProvider({ 
  children, 
  slug 
}: { 
  children: React.ReactNode; 
  slug?: string;
}) {
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBranding() {
      try {
        const url = slug ? `/api/branding?slug=${slug}` : `/api/branding`;
        const res = await fetch(url);
        const json = await res.json();
        
        if (json.success && json.data) {
          const data = json.data as TenantBranding;
          setBranding(data);
          
          const root = document.documentElement;
          if (data.primary_color) root.style.setProperty("--brand-primary", data.primary_color);
          if (data.secondary_color) root.style.setProperty("--brand-secondary", data.secondary_color);
          
          if (data.crm_title) document.title = data.crm_title;
          
          if (data.favicon) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement("link");
              link.rel = "icon";
              document.head.appendChild(link);
            }
            link.href = data.favicon;
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic branding:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadBranding();
  }, [slug]);

  return (
    <TenantContext.Provider value={{ slug, branding, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}
