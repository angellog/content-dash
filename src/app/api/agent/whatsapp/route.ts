import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

function validateTwilioSignature(req: NextRequest): boolean {
  if (!TWILIO_AUTH_TOKEN) return false;

  const signature = req.headers.get("x-twilio-signature");
  if (!signature) return false;

  return true;
}

export async function POST(req: NextRequest) {
  if (!validateTwilioSignature(req)) {
    return NextResponse.json({ error: "Invalid Twilio signature" }, { status: 401 });
  }

  const formData = await req.formData();
  const from = formData.get("From") as string;
  const body = formData.get("Body") as string;
  const profileName = formData.get("ProfileName") as string;

  if (!from || !body) {
    return new Response("Missing From or Body", { status: 400 });
  }

  const phoneNumber = from.replace("whatsapp:", "");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  const { data: agentConfigs } = await supabase
    .from("AgentConfig")
    .select("userId, isActive, twilioWhatsappNumber")
    .eq("isActive", true);

  if (!agentConfigs || agentConfigs.length === 0) {
    return new Response(generateTwiml("AI agent is not active. Please configure it in ContentDash settings."), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const { data: omniConfig } = await supabase
    .from("OmniSocialConfig")
    .select("apiKeyEncrypted, status")
    .eq("userId", agentConfigs[0].userId)
    .single();

  const { data: agentConfigRow } = await supabase
    .from("AgentConfig")
    .select("llmProvider, llmApiKeyEncrypted")
    .eq("userId", agentConfigs[0].userId)
    .single();

  if (!agentConfigRow?.llmApiKeyEncrypted) {
    return new Response(generateTwiml("LLM not configured. Add your API key in ContentDash settings."), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  try {
    const executeRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agent/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: body,
        source: "whatsapp",
      }),
    });

    if (!executeRes.ok) {
      const errData = await executeRes.json().catch(() => ({}));
      return new Response(
        generateTwiml(`Agent error: ${errData.error || "Unknown error"}`),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    const result = await executeRes.json();
    const reply = result.response || "Action completed but no response generated.";

    return new Response(generateTwiml(reply), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    return new Response(
      generateTwiml("Failed to process your request. Please try again later."),
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}

function generateTwiml(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
