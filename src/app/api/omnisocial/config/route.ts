import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    });
  }

  const { data: config } = await supabase
    .from("OmniSocialConfig")
    .select("apiKeyEncrypted, status, lastSyncedAt")
    .eq("userId", user.id)
    .single();

  if (!config || config.status !== "ACTIVE") {
    return NextResponse.json({
      status: config?.status ?? "NOT_CONFIGURED",
      connected: false,
      apiKeyMasked: config ? maskApiKey(config.apiKeyEncrypted) : null,
      lastSyncedAt: config?.lastSyncedAt ?? null,
    });
  }

  return NextResponse.json({
    status: config.status,
    connected: true,
    apiKeyMasked: maskApiKey(config.apiKeyEncrypted),
    lastSyncedAt: config.lastSyncedAt,
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

  const { apiKey } = await req.json();
  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("OmniSocialConfig")
    .select("id")
    .eq("userId", user.id)
    .single();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("OmniSocialConfig")
      .update({ apiKeyEncrypted: apiKey, status: "ACTIVE", updatedAt: new Date().toISOString() })
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
        apiKeyEncrypted: apiKey,
        status: "ACTIVE",
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
