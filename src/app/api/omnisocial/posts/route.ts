import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { OMNISOCIAL_API_BASE } from "@/lib/omnisocial";

async function getAuthenticatedClient(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };

  const config = await prisma.omniSocialConfig.findUnique({
    where: { userId: user.id },
  });
  if (!config || config.status !== "ACTIVE")
    return {
      error: NextResponse.json(
        { error: "OmniSocial not configured" },
        { status: 403 },
      ),
    };

  return { apiKey: config.apiKeyEncrypted, userId: user.id };
}

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedClient(req);
  if ("error" in auth) return auth.error;

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
  const res = await fetch(`${OMNISOCIAL_API_BASE}/posts${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${auth.apiKey}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedClient(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();

  const res = await fetch(`${OMNISOCIAL_API_BASE}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: body.text,
      media: body.media,
      platforms: body.platforms,
      scheduled_at: body.scheduled_at,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
