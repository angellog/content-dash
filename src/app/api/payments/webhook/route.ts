import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
import { priceForQuantity } from "@/lib/nfc-pricing";

const FLW_SECRET_HASH = process.env.FLW_WEBHOOK_HASH;
const FLW_BASE = "https://api.flutterwave.com/v3";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("verif-hash");

  if (!signature || !FLW_SECRET_HASH) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const sigBuf = Buffer.from(signature);
  const hashBuf = Buffer.from(FLW_SECRET_HASH);
  if (sigBuf.length !== hashBuf.length || !timingSafeEqual(sigBuf, hashBuf)) {
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

  const data = payload.data as Record<string, unknown> | undefined;
  const transactionId = data?.id;
  if (!transactionId) {
    return NextResponse.json({ received: true });
  }

  const secretKey = process.env.FLW_SECRET_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!secretKey || !serviceKey || !supabaseUrl) {
    console.error("Payment webhook misconfigured: missing FLW_SECRET_KEY or Supabase service credentials");
    // Non-2xx so Flutterwave retries once configuration is fixed
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // Don't trust the webhook payload for money state — re-verify with Flutterwave
  const verifyRes = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  }).catch(() => null);

  if (!verifyRes || !verifyRes.ok) {
    return NextResponse.json({ error: "Verification unavailable" }, { status: 502 });
  }

  const verification = await verifyRes.json();
  const tx = verification?.data as Record<string, unknown> | undefined;
  if (verification?.status !== "success" || tx?.status !== "successful") {
    return NextResponse.json({ received: true });
  }

  const txRef = tx.tx_ref as string | undefined;
  if (!txRef) {
    return NextResponse.json({ received: true });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: card, error: findError } = await supabase
    .from("NFCCard")
    .select("id, orderStatus")
    .eq("txRef", txRef)
    .single();

  if (findError || !card) {
    console.error(`Payment webhook: no NFCCard found for tx_ref ${txRef}`);
    return NextResponse.json({ received: true });
  }

  // Idempotency: Flutterwave may deliver the same event more than once
  if (card.orderStatus !== "ORDERED") {
    return NextResponse.json({ received: true });
  }

  // `meta` here comes from Flutterwave's verify API — it echoes what we sent at
  // checkout, not anything the webhook caller supplied.
  const meta = tx.meta as Record<string, unknown> | undefined;
  const quantity = Math.max(1, Number(meta?.quantity) || 1);
  const expectedAmount = priceForQuantity(quantity);
  if (tx.currency !== "USD" || Number(tx.amount) < expectedAmount) {
    console.error(
      `Payment webhook: amount mismatch for tx_ref ${txRef} — got ${tx.amount} ${tx.currency}, expected ${expectedAmount} USD`
    );
    return NextResponse.json({ received: true });
  }

  const { error: updateError } = await supabase
    .from("NFCCard")
    .update({
      orderStatus: "PAID",
      isActive: true,
      flwTransactionId: String(transactionId),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", card.id);

  if (updateError) {
    console.error("Payment webhook: failed to mark card paid:", updateError);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
