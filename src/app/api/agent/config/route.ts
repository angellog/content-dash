import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "@/lib/encryption";

function maskKey(key: string) {
  if (key.length <= 4) return "****";
  return `****${key.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isActive: false, llmProvider: null });
  }

  const { data: config } = await supabase
    .from("AgentConfig")
    .select("llmProvider, llmApiKeyEncrypted, twilioAccountSid, twilioAuthTokenEncrypted, twilioWhatsappNumber, isActive")
    .eq("userId", user.id)
    .single();

  if (!config) {
    return NextResponse.json({ isActive: false, llmProvider: null });
  }

  let maskedKey = null;
  if (config.llmApiKeyEncrypted) {
    try { maskedKey = maskKey(decrypt(config.llmApiKeyEncrypted)); } catch { maskedKey = maskKey(config.llmApiKeyEncrypted); }
  }

  let maskedToken = null;
  if (config.twilioAuthTokenEncrypted) {
    try { maskedToken = maskKey(decrypt(config.twilioAuthTokenEncrypted)); } catch { maskedToken = maskKey(config.twilioAuthTokenEncrypted); }
  }

  return NextResponse.json({
    isActive: config.isActive,
    llmProvider: config.llmProvider,
    llmApiKeyMasked: maskedKey,
    twilioAccountSid: config.twilioAccountSid,
    twilioAuthTokenMasked: maskedToken,
    twilioWhatsappNumber: config.twilioWhatsappNumber,
  });
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { llmProvider, llmApiKey, twilioAccountSid, twilioAuthToken, twilioWhatsappNumber, isActive } = body;

  const { data: existing } = await supabase
    .from("AgentConfig")
    .select("id")
    .eq("userId", user.id)
    .single();

  const updateData: Record<string, unknown> = {
    llmProvider: llmProvider ?? "openai",
    twilioAccountSid: twilioAccountSid || null,
    twilioWhatsappNumber: twilioWhatsappNumber || null,
    isActive: isActive ?? true,
    updatedAt: new Date().toISOString(),
  };

  if (llmApiKey && llmApiKey !== "****") {
    try { updateData.llmApiKeyEncrypted = encrypt(llmApiKey); } catch { updateData.llmApiKeyEncrypted = llmApiKey; }
  }
  if (twilioAuthToken && twilioAuthToken !== "****") {
    try { updateData.twilioAuthTokenEncrypted = encrypt(twilioAuthToken); } catch { updateData.twilioAuthTokenEncrypted = twilioAuthToken; }
  }

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("AgentConfig")
      .update(updateData)
      .eq("userId", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await supabase
      .from("AgentConfig")
      .insert({ id: crypto.randomUUID(), userId: user.id, ...updateData })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  return NextResponse.json({
    isActive: result.isActive,
    llmProvider: result.llmProvider,
    twilioAccountSid: result.twilioAccountSid,
    twilioWhatsappNumber: result.twilioWhatsappNumber,
  });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("AgentConfig").delete().eq("userId", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ isActive: false });
}
