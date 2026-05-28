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
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  if (platform) params.set("platform", platform);
  if (start_date) params.set("start_date", start_date);
  if (end_date) params.set("end_date", end_date);

  const query = params.toString();
  const res = await fetch(
    `${OMNISOCIAL_API_BASE}/analytics${query ? `?${query}` : ""}`,
    {
      headers: { Authorization: `Bearer ${auth.apiKey}` },
    },
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
