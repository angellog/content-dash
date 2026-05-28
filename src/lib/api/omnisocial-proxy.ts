import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OMNISOCIAL_API_BASE } from "@/lib/omnisocial";

export async function getOmniSocialApiKey(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: config, error } = await supabase
    .from("OmniSocialConfig")
    .select("apiKeyEncrypted, status")
    .eq("userId", user.id)
    .single();

  if (error || !config || config.status !== "ACTIVE") {
    return {
      error: NextResponse.json(
        { error: "OmniSocial not configured", status: "NOT_CONFIGURED" },
        { status: 403 }
      ),
    };
  }

  return { apiKey: config.apiKeyEncrypted, userId: user.id };
}

export async function proxyOmniSocial(
  req: NextRequest,
  path: string,
  options?: { method?: string; body?: unknown }
) {
  const auth = await getOmniSocialApiKey(req);
  if ("error" in auth) return auth.error;

  const url = `${OMNISOCIAL_API_BASE}${path}`;
  const fetchOptions: RequestInit = {
    method: options?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${auth.apiKey}`,
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  };

  const res = await fetch(url, fetchOptions);
  if (res.status === 204) return new NextResponse(null, { status: 204 });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
