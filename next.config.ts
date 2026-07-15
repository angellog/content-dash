import type { NextConfig } from "next";

// ContentDash's users and data live in the Supabase project it SHARES with
// feetbit-content-library — NOT feetbit-unified's separate project. A build
// pointed at the wrong project ships a login page that rejects every real
// user with "Invalid login credentials". Fail the build loudly instead.
const EXPECTED_SUPABASE_PROJECT_REF = "oeaajqcssoukezpqtbtg";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!process.env.ALLOW_SUPABASE_PROJECT_MISMATCH) {
  if (!supabaseUrl) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is not set for this environment. ContentDash must point at ` +
        `project ${EXPECTED_SUPABASE_PROJECT_REF} — set it in .env locally and in Vercel for ` +
        `Production AND Preview.`
    );
  }
  if (!supabaseUrl.includes(EXPECTED_SUPABASE_PROJECT_REF)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL points at ${supabaseUrl}, but ContentDash's accounts live in ` +
        `project ${EXPECTED_SUPABASE_PROJECT_REF}. Shipping this build would make every login fail ` +
        `with "Invalid login credentials". Fix the env var (or set ALLOW_SUPABASE_PROJECT_MISMATCH=1 ` +
        `only for an intentional project migration).`
    );
  }
}

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
