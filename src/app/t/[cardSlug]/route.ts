import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function styledHtml(title: string, message: string, iconSvg: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #a1a1aa; }
    .container { text-align: center; padding: 2rem; max-width: 400px; }
    .icon { width: 64px; height: 64px; margin: 0 auto 1.5rem; border-radius: 50%; background: rgba(99,102,241,0.1); display: flex; align-items: center; justify-content: center; }
    .icon svg { width: 28px; height: 28px; stroke: #818cf8; }
    h1 { color: #f4f4f5; font-size: 1.5rem; margin-bottom: 0.75rem; }
    p { font-size: 0.875rem; line-height: 1.5; margin-bottom: 1rem; }
    .brand { font-size: 0.75rem; color: #52525b; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        ${iconSvg}
      </svg>
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <p class="brand">Powered by ContentDash</p>
  </div>
</body>
</html>`;
}

const LOCK_ICON = '<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />';
const QUESTION_ICON = '<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01" />';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cardSlug: string }> }
) {
  const { cardSlug } = await params;

  // Resolved with the service role rather than the anon key. The anon path
  // relied on a "Public read cards by cardSlug" RLS policy, and because RLS is
  // row-level and not column-level, that policy handed anyone holding the
  // publishable key every column of any slugged card — activationCode, txRef
  // and flwTransactionId included, none of which this route needs. Reading as
  // the service role is what lets that policy be dropped.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    // Fail loudly and visibly. Card resolution now depends on this key, and
    // rendering "Card Not Found" would blame the card for a server misconfig.
    console.error("SUPABASE_SERVICE_ROLE_KEY not set — cannot resolve NFC card taps");
    return new Response(
      styledHtml(
        "Temporarily Unavailable",
        "This card can't be resolved right now. Please try again in a moment.",
        QUESTION_ICON
      ),
      { status: 503, headers: { "Content-Type": "text/html" } }
    );
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: card } = await admin
    .from("NFCCard")
    .select("id, destinationUrl, isActive, isActivated, profileSlug")
    .eq("cardSlug", cardSlug)
    .single();

  if (!card) {
    return new Response(
      styledHtml("Card Not Found", "This NFC card doesn't exist or the link may be incorrect.", QUESTION_ICON),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (!card.isActivated) {
    return new Response(
      styledHtml("Card Not Activated", "This Smart NFC Card hasn't been set up yet. The owner needs to activate it and create their profile.", LOCK_ICON),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  let deviceType = "OTHER";
  if (userAgent) {
    if (/iPhone|iPad/i.test(userAgent)) deviceType = "IOS";
    else if (/Android/i.test(userAgent)) deviceType = "ANDROID";
    else if (/Macintosh|Windows|Linux/i.test(userAgent)) deviceType = "DESKTOP";
  }

  // Reuses the same service-role client as the lookup above: this is the only
  // writer of tap events, so the table needs no public INSERT policy and the
  // counts can't be inflated by anyone posting straight at PostgREST.
  //
  // Awaited deliberately — a fire-and-forget insert races the response, and a
  // serverless instance that freezes after responding drops the row silently.
  const { error: tapError } = await admin.from("NFCTapEvent").insert({
    id: crypto.randomUUID(),
    cardId: card.id,
    ipAddress,
    userAgent,
    deviceType,
  });
  if (tapError) {
    // Never fail the redirect over analytics — the tap must still resolve.
    console.error(`Failed to record tap for card ${card.id}:`, tapError);
  }

  if (card.profileSlug) {
    const profileUrl = new URL(`/p/${card.profileSlug}`, req.url);
    return NextResponse.redirect(profileUrl, 302);
  }

  if (card.destinationUrl) {
    return NextResponse.redirect(new URL(card.destinationUrl, req.url), 302);
  }

  return NextResponse.redirect(new URL("/", req.url));
}
