import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co").hostname,
      },
      {
        protocol: "https",
        hostname: "api.omnisocials.com",
      },
    ],
  },
  serverExternalPackages: ["crypto"],
};

export default nextConfig;
