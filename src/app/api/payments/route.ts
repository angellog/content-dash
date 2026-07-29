import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { paymentPostSchema, validateBody } from "@/lib/validations/schemas";
import { rateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";
import { priceForQuantity, toDbColor } from "@/lib/nfc-pricing";

const FLW_BASE = "https://api.flutterwave.com/v3";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rl = rateLimit(ip, RATE_LIMITS.payments.limit, RATE_LIMITS.payments.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = validateBody(paymentPostSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { cardColor, quantity = 1, cardName, redirectType, destinationUrl } = parsed.data;

  const amount = priceForQuantity(quantity);

  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Payment gateway not configured" },
      { status: 503 }
    );
  }

  const txRef = `CD-NFC-${Date.now()}-${user.id.slice(0, 8)}`;

  function generateActivationCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `card-${Date.now().toString(36)}`;
  }

  const activationCode = generateActivationCode();
  const profileSlug = cardName ? generateSlug(cardName) : `card-${Date.now().toString(36)}`;
  const cardSlug = `nfc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    const { error: cardError } = await supabase
      .from("NFCCard")
      .insert({
        id: crypto.randomUUID(),
        userId: user.id,
        cardSlug,
        cardName: cardName || `NFC Card - ${cardColor}`,
        color: toDbColor(cardColor),
        redirectType: redirectType || "CUSTOM_URL",
        destinationUrl: destinationUrl || "https://contentdash.ai",
        isActive: false,
        orderStatus: "ORDERED",
        txRef,
        activationCode,
        isActivated: false,
        profileSlug,
      });

    if (cardError) {
      return NextResponse.json({ error: "Failed to create card record" }, { status: 500 });
    }

    const flwRes = await fetch(`${FLW_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency: "USD",
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/nfc?payment_callback=true`,
        payment_options: "card,usdt,banktransfer",
        customer: {
          email: user.email,
          name: cardName || "NFC Card Order",
        },
        customizations: {
          title: "ContentDash NFC Cards",
          description: `${quantity}x ${cardColor.replace(/-/g, " ")} Smart NFC Card(s)`,
          logo: "https://content-dash-rho.vercel.app/favicon.ico",
        },
        meta: {
          userId: user.id,
          txRef,
          cardColor,
          quantity,
          cardName,
          redirectType,
          destinationUrl,
        },
      }),
    });

    const data = await flwRes.json();

    if (data.status === "success" && data.data?.link) {
      return NextResponse.json({
        paymentLink: data.data.link,
        txRef,
        amount,
        activationCode,
        profileSlug,
      });
    }

    return NextResponse.json(
      { error: data.message || "Failed to initialize payment" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Payment service unavailable" },
      { status: 502 }
    );
  }
}
