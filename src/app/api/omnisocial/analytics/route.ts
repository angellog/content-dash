import { NextRequest } from "next/server";
import { proxyOmniSocial } from "@/lib/api/omnisocial-proxy";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  const platform = searchParams.get("platform");
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  if (platform) params.set("platform", platform);
  if (start_date) params.set("start_date", start_date);
  if (end_date) params.set("end_date", end_date);

  const query = params.toString();
  return proxyOmniSocial(req, `/analytics${query ? `?${query}` : ""}`);
}
