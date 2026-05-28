import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OMNISOCIAL_API_BASE } from "@/lib/omnisocial";

export function parseOmniSocialInput(input: string): {
  apiKey: string;
  mcpUrl: string | null;
} {
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      const keyFromParam =
        url.searchParams.get("api_key") ??
        url.searchParams.get("apiKey") ??
        url.searchParams.get("key");
      if (keyFromParam) {
        return { apiKey: keyFromParam, mcpUrl: `${url.origin}${url.pathname}` };
      }
      const keyFromHash = url.hash.startsWith("#") ? url.hash.slice(1) : null;
      if (keyFromHash && keyFromHash.length > 8) {
        return { apiKey: keyFromHash, mcpUrl: `${url.origin}${url.pathname}` };
      }
      const pathKey = url.pathname.split("/").filter(Boolean).pop();
      if (pathKey && pathKey.length > 8 && !pathKey.includes(".")) {
        return { apiKey: pathKey, mcpUrl: url.origin };
      }
      return { apiKey: trimmed, mcpUrl: trimmed };
    } catch {
      return { apiKey: trimmed, mcpUrl: null };
    }
  }
  return { apiKey: trimmed, mcpUrl: null };
}

export type ConnectionType = "api_key" | "mcp_url";

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
    .select("apiKeyEncrypted, status, connectionType, mcpUrl")
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

  return {
    apiKey: config.apiKeyEncrypted,
    userId: user.id,
    connectionType: (config.connectionType as ConnectionType) ?? "api_key",
    mcpUrl: config.mcpUrl ?? null,
  };
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
