import { NextRequest } from "next/server";
import { proxyOmniSocial } from "@/lib/api/omnisocial-proxy";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids");
  if (!ids) {
    return new Response(JSON.stringify({ error: "ids is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return proxyOmniSocial(req, `/analytics/posts?ids=${encodeURIComponent(ids)}`);
}
