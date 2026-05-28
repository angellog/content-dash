import { NextRequest } from "next/server";
import { proxyOmniSocial } from "@/lib/api/omnisocial-proxy";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  const platform = searchParams.get("platform");
  const status = searchParams.get("status");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");
  if (platform) params.set("platform", platform);
  if (status) params.set("status", status);
  if (limit) params.set("limit", limit);
  if (offset) params.set("offset", offset);

  const query = params.toString();
  return proxyOmniSocial(req, `/posts${query ? `?${query}` : ""}`);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyOmniSocial(req, "/posts", {
    method: "POST",
    body: {
      text: body.text,
      media: body.media,
      platforms: body.platforms,
      scheduled_at: body.scheduled_at,
    },
  });
}
