import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { nfcProfileUpsertSchema, validateBody } from "@/lib/validations/schemas";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cardId = req.nextUrl.searchParams.get("cardId");
  if (!cardId) return NextResponse.json({ error: "cardId is required" }, { status: 400 });

  const { data: card } = await supabase
    .from("NFCCard")
    .select("id, userId")
    .eq("id", cardId)
    .eq("userId", user.id)
    .single();

  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const { data: profile } = await supabase
    .from("NFCProfile")
    .select("*, links:NFCLink(id, type, label, url, linkOrder)")
    .eq("cardId", cardId)
    .single();

  if (!profile) return NextResponse.json({ profile: null });

  if (profile.links) {
    profile.links.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      ((a.linkOrder as number) ?? 0) - ((b.linkOrder as number) ?? 0)
    );
  }

  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = validateBody(nfcProfileUpsertSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { cardId, displayName, bio, avatarUrl, theme, links } = parsed.data;

  const { data: card } = await supabase
    .from("NFCCard")
    .select("id, userId, cardSlug")
    .eq("id", cardId)
    .eq("userId", user.id)
    .single();

  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const { data: existingProfile } = await supabase
    .from("NFCProfile")
    .select("id")
    .eq("cardId", cardId)
    .single();

  let profileId: string;

  if (existingProfile) {
    profileId = existingProfile.id;
    const { error: profileError } = await supabase
      .from("NFCProfile")
      .update({
        displayName,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
        theme,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  } else {
    const { data: newProfile, error: profileError } = await supabase
      .from("NFCProfile")
      .insert({
        id: crypto.randomUUID(),
        cardId,
        displayName,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
        theme,
      })
      .select()
      .single();

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
    profileId = newProfile.id;

    const slugBase = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const profileSlug = slugBase || `profile-${Date.now().toString(36)}`;

    await supabase
      .from("NFCCard")
      .update({ profileSlug, updatedAt: new Date().toISOString() })
      .eq("id", cardId);
  }

  if (links && links.length > 0) {
    await supabase.from("NFCLink").delete().eq("profileId", profileId);

    const linkRows = links.map((link, index) => ({
      id: link.id || crypto.randomUUID(),
      profileId,
      type: link.type,
      label: link.label,
      url: link.url,
      linkOrder: link.linkOrder ?? index,
    }));

    const { error: linksError } = await supabase.from("NFCLink").insert(linkRows);
    if (linksError) return NextResponse.json({ error: linksError.message }, { status: 500 });
  }

  const { data: updatedCard } = await supabase
    .from("NFCCard")
    .select("profileSlug")
    .eq("id", cardId)
    .single();

  return NextResponse.json({
    profileId,
    profileSlug: updatedCard?.profileSlug,
  });
}
