import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { nfcActivateSchema, validateBody } from "@/lib/validations/schemas";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = validateBody(nfcActivateSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { activationCode } = parsed.data;

  const { data: card, error: findError } = await supabase
    .from("NFCCard")
    .select("id, cardName, cardSlug, profileSlug, isActivated, userId")
    .eq("activationCode", activationCode)
    .single();

  if (findError || !card) {
    return NextResponse.json({ error: "Invalid activation code" }, { status: 404 });
  }

  if (card.isActivated) {
    return NextResponse.json({ error: "This card is already activated" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("NFCCard")
    .update({
      isActivated: true,
      userId: user.id,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", card.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    cardId: card.id,
    cardName: card.cardName,
    cardSlug: card.cardSlug,
    profileSlug: card.profileSlug,
  });
}
