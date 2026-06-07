import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function notActivatedHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Card Not Activated</title>
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
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    </div>
    <h1>Card Not Activated</h1>
    <p>This Smart NFC Card hasn't been set up yet. The owner needs to activate it and create their profile.</p>
    <p class="brand">Powered by ContentDash</p>
  </div>
</body>
</html>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cardSlug: string }> }
) {
  const { cardSlug } = await params;

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

  const { data: card } = await supabase
    .from("NFCCard")
    .select("id, destinationUrl, isActive, isActivated, profileSlug")
    .eq("cardSlug", cardSlug)
    .single();

  if (!card) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!card.isActivated) {
    return new Response(notActivatedHtml(), {
      headers: { "Content-Type": "text/html" },
    });
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

  supabase
    .from("NFCTapEvent")
    .insert({
      id: crypto.randomUUID(),
      cardId: card.id,
      ipAddress,
      userAgent,
      deviceType,
    })
    .then(() => {});

  if (card.profileSlug) {
    const profileUrl = new URL(`/p/${card.profileSlug}`, req.url);
    return NextResponse.redirect(profileUrl, 302);
  }

  if (card.destinationUrl) {
    return NextResponse.redirect(new URL(card.destinationUrl, req.url), 302);
  }

  return NextResponse.redirect(new URL("/", req.url));
}
