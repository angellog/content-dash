import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "@/lib/encryption";
import { agentConfigPutSchema, validateBody } from "@/lib/validations/schemas";

function maskKey(key: string) {
  if (key.length <= 4) return "****";
  return `****${key.slice(-4)}`;
}

// A client resubmitting the masked display value from GET (`****` or `****abcd`)
// must never be treated as a new key — encrypting it would destroy the stored key.
function isNewKeyValue(value: string | undefined): value is string {
  return !!value && !value.startsWith("****");
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isActive: false, llmProvider: null });
  }

  const { data: config } = await supabase
    .from("AgentConfig")
    .select("llmProvider, llmApiKeyEncrypted, twilioAccountSid, twilioAuthTokenEncrypted, twilioWhatsappNumber, isActive, agentFramework, hermesEndpointUrl, hermesApiKeyEncrypted, higgsfieldApiKeyEncrypted")
    .eq("userId", user.id)
    .single();

  if (!config) {
    return NextResponse.json({ isActive: false, llmProvider: null });
  }

  let maskedKey = null;
  if (config.llmApiKeyEncrypted) {
    try { maskedKey = maskKey(decrypt(config.llmApiKeyEncrypted)); } catch { maskedKey = "****"; }
  }

  let maskedToken = null;
  if (config.twilioAuthTokenEncrypted) {
    try { maskedToken = maskKey(decrypt(config.twilioAuthTokenEncrypted)); } catch { maskedToken = "****"; }
  }

  let maskedHermesKey = null;
  if (config.hermesApiKeyEncrypted) {
    try { maskedHermesKey = maskKey(decrypt(config.hermesApiKeyEncrypted)); } catch { maskedHermesKey = "****"; }
  }

  let maskedHiggsfieldKey = null;
  if (config.higgsfieldApiKeyEncrypted) {
    try { maskedHiggsfieldKey = maskKey(decrypt(config.higgsfieldApiKeyEncrypted)); } catch { maskedHiggsfieldKey = "****"; }
  }

  return NextResponse.json({
    isActive: config.isActive,
    llmProvider: config.llmProvider,
    llmApiKeyMasked: maskedKey,
    agentFramework: config.agentFramework || "openclaw",
    hermesEndpointUrl: config.hermesEndpointUrl || "",
    hermesApiKeyMasked: maskedHermesKey,
    higgsfieldApiKeyMasked: maskedHiggsfieldKey,
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
  const parsed = validateBody(agentConfigPutSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { llmProvider, llmApiKey, twilioAccountSid, twilioAuthToken, twilioWhatsappNumber, isActive, agentFramework, hermesEndpointUrl, hermesApiKey, higgsfieldApiKey } = parsed.data;

  const { data: existing } = await supabase
    .from("AgentConfig")
    .select("id")
    .eq("userId", user.id)
    .single();

  const updateData: Record<string, unknown> = {
    llmProvider: llmProvider ?? "openai",
    agentFramework: agentFramework ?? "openclaw",
    hermesEndpointUrl: hermesEndpointUrl || null,
    twilioAccountSid: twilioAccountSid || null,
    twilioWhatsappNumber: twilioWhatsappNumber || null,
    isActive: isActive ?? true,
    updatedAt: new Date().toISOString(),
  };

  if (isNewKeyValue(llmApiKey)) {
    try { updateData.llmApiKeyEncrypted = encrypt(llmApiKey); } catch { return NextResponse.json({ error: "Failed to encrypt LLM API key" }, { status: 500 }); }
  }
  if (isNewKeyValue(twilioAuthToken)) {
    try { updateData.twilioAuthTokenEncrypted = encrypt(twilioAuthToken); } catch { return NextResponse.json({ error: "Failed to encrypt Twilio auth token" }, { status: 500 }); }
  }
  if (isNewKeyValue(hermesApiKey)) {
    try { updateData.hermesApiKeyEncrypted = encrypt(hermesApiKey); } catch { return NextResponse.json({ error: "Failed to encrypt Hermes API key" }, { status: 500 }); }
  }
  if (isNewKeyValue(higgsfieldApiKey)) {
    try { updateData.higgsfieldApiKeyEncrypted = encrypt(higgsfieldApiKey); } catch { return NextResponse.json({ error: "Failed to encrypt Higgsfield API key" }, { status: 500 }); }
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
    agentFramework: result.agentFramework,
    hermesEndpointUrl: result.hermesEndpointUrl,
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
