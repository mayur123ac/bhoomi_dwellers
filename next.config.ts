import type { NextConfig } from "next";


const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["twilio"],
  },
};

export default nextConfig;