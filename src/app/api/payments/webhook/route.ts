import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createHmac } from "crypto";

const FLW_SECRET_HASH = process.env.FLW_WEBHOOK_HASH;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("verif-hash");

  if (!signature || signature !== FLW_SECRET_HASH) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event !== "charge.completed") {
    return NextResponse.json({ received: true });
  }

  const data = payload.data as Record<string, unknown>;
  if (data.status !== "successful") {
    return NextResponse.json({ received: true });
  }

  const meta = data.meta as Record<string, string> | undefined;
  if (!meta?.userId || !meta?.cardName) {
    return NextResponse.json({ received: true });
  }

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

  const { error } = await supabase.from("NFCCard").insert({
    id: crypto.randomUUID(),
    userId: meta.userId,
    cardName: meta.cardName,
    redirectType: (meta.redirectType || "CUSTOM_URL").toUpperCase(),
    targetUrl: meta.targetUrl || "",
    cardSlug: `card-${Date.now().toString(36)}`,
    isActive: true,
  });

  if (error) {
    console.error("Failed to create NFC card after payment:", error);
  }

  return NextResponse.json({ received: true });
}
