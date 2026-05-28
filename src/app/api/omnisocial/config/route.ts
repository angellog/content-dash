import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseOmniSocialInput, ConnectionType } from "@/lib/api/omnisocial-proxy";

function maskApiKey(key: string) {
  if (key.length <= 4) return "****";
  return `****${key.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      status: "NOT_CONFIGURED",
      connected: false,
      apiKeyMasked: null,
      lastSyncedAt: null,
      connectionType: null,
      mcpUrl: null,
    });
  }

  const { data: config } = await supabase
    .from("OmniSocialConfig")
    .select("apiKeyEncrypted, status, lastSyncedAt, connectionType, mcpUrl")
    .eq("userId", user.id)
    .single();

  if (!config || config.status !== "ACTIVE") {
    return NextResponse.json({
      status: config?.status ?? "NOT_CONFIGURED",
      connected: false,
      apiKeyMasked: config ? maskApiKey(config.apiKeyEncrypted) : null,
      lastSyncedAt: config?.lastSyncedAt ?? null,
      connectionType: config?.connectionType ?? null,
      mcpUrl: config?.mcpUrl ?? null,
    });
  }

  return NextResponse.json({
    status: config.status,
    connected: true,
    apiKeyMasked: maskApiKey(config.apiKeyEncrypted),
    lastSyncedAt: config.lastSyncedAt,
    connectionType: config.connectionType,
    mcpUrl: config.mcpUrl,
  });
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const rawInput = body.apiKey ?? body.input ?? "";
  if (!rawInput || typeof rawInput !== "string") {
    return NextResponse.json({ error: "API key or MCP URL is required" }, { status: 400 });
  }

  const { apiKey, mcpUrl } = parseOmniSocialInput(rawInput);
  const connectionType: ConnectionType = mcpUrl ? "mcp_url" : "api_key";

  const { data: existing } = await supabase
    .from("OmniSocialConfig")
    .select("id")
    .eq("userId", user.id)
    .single();

  const upsertData = {
    apiKeyEncrypted: apiKey,
    connectionType,
    mcpUrl,
    status: "ACTIVE",
    updatedAt: new Date().toISOString(),
  };

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("OmniSocialConfig")
      .update(upsertData)
      .eq("userId", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await supabase
      .from("OmniSocialConfig")
      .insert({
        id: crypto.randomUUID(),
        userId: user.id,
        ...upsertData,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  return NextResponse.json({
    status: result.status,
    connected: true,
    apiKeyMasked: maskApiKey(result.apiKeyEncrypted),
    lastSyncedAt: result.lastSyncedAt,
    connectionType: result.connectionType,
    mcpUrl: result.mcpUrl,
  });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("OmniSocialConfig")
    .delete()
    .eq("userId", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ status: "NOT_CONFIGURED", connected: false });
}
