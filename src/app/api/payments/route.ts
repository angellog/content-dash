import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const FLW_BASE = "https://api.flutterwave.com/v3";

const CARD_PRICES: Record<string, number> = {
  "matte-black": 29.99,
  "pearl-white": 29.99,
  "rose-gold": 39.99,
  "chrome-silver": 39.99,
  "obsidian-carbon": 49.99,
};

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { cardColor, quantity = 1, cardName, redirectType, targetUrl } = body;

  const unitPrice = CARD_PRICES[cardColor] ?? 29.99;
  const amount = unitPrice * quantity;

  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Payment gateway not configured" },
      { status: 503 }
    );
  }

  const txRef = `CD-NFC-${Date.now()}-${user.id.slice(0, 8)}`;

  try {
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
          cardColor,
          quantity,
          cardName,
          redirectType,
          targetUrl,
        },
      }),
    });

    const data = await flwRes.json();

    if (data.status === "success" && data.data?.link) {
      return NextResponse.json({
        paymentLink: data.data.link,
        txRef,
        amount,
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
