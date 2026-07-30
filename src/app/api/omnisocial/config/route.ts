import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseOmniSocialInput, ConnectionType } from "@/lib/api/omnisocial-proxy";
import { encrypt, decrypt } from "@/lib/encryption";
import { omnisocialConfigPutSchema, validateBody } from "@/lib/validations/schemas";

function maskApiKey(key: string) {
  if (key.length <= 4) return "****";
  return `****${key.slice(-4)}`;
}

export async function GET(_req: NextRequest) {
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
    let maskedKey = null;
    if (config?.apiKeyEncrypted) {
      try { maskedKey = maskApiKey(decrypt(config.apiKeyEncrypted)); } catch { maskedKey = "****"; }
    }
    return NextResponse.json({
      status: config?.status ?? "NOT_CONFIGURED",
      connected: false,
      apiKeyMasked: maskedKey,
      lastSyncedAt: config?.lastSyncedAt ?? null,
      connectionType: config?.connectionType ?? null,
      mcpUrl: config?.mcpUrl ?? null,
    });
  }

  let decryptedKey: string;
  try { decryptedKey = decrypt(config.apiKeyEncrypted); } catch { return NextResponse.json({ error: "Failed to decrypt API key" }, { status: 500 }); }

  return NextResponse.json({
    status: config.status,
    connected: true,
    apiKeyMasked: maskApiKey(decryptedKey),
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
  const parsed = validateBody(omnisocialConfigPutSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const rawInput = parsed.data.apiKey || parsed.data.input || "";

  const { apiKey, mcpUrl } = parseOmniSocialInput(rawInput);
  const connectionType: ConnectionType = mcpUrl ? "mcp_url" : "api_key";

  let encryptedKey: string;
  try { encryptedKey = encrypt(apiKey); } catch { return NextResponse.json({ error: "Failed to encrypt API key" }, { status: 500 }); }

  const { data: existing } = await supabase
    .from("OmniSocialConfig")
    .select("id")
    .eq("userId", user.id)
    .single();

  const upsertData = {
    apiKeyEncrypted: encryptedKey,
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

  let displayKey: string;
  try { displayKey = decrypt(result.apiKeyEncrypted); } catch { return NextResponse.json({ error: "Failed to decrypt stored key for display" }, { status: 500 }); }

  return NextResponse.json({
    status: result.status,
    connected: true,
    apiKeyMasked: maskApiKey(displayKey),
    lastSyncedAt: result.lastSyncedAt,
    connectionType: result.connectionType,
    mcpUrl: result.mcpUrl,
  });
}

export async function DELETE(_req: NextRequest) {
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
