import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

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
    .select("id, destinationUrl, isActive")
    .eq("cardSlug", cardSlug)
    .single();

  if (!card || !card.isActive) {
    return NextResponse.redirect(new URL("/", req.url));
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

  return NextResponse.redirect(new URL(card.destinationUrl, req.url), 302);
}
