import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { competitorPostSchema, validateBody } from "@/lib/validations/schemas";

export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("CompetitorWatch")
    .select("*")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competitors: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = validateBody(competitorPostSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("CompetitorWatch")
    .insert({
      id: crypto.randomUUID(),
      userId: user.id,
      ...parsed.data,
      handleInstagram: parsed.data.handleInstagram || null,
      handleYoutube: parsed.data.handleYoutube || null,
      handleTiktok: parsed.data.handleTiktok || null,
      handleX: parsed.data.handleX || null,
      handleLinkedin: parsed.data.handleLinkedin || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(_req: NextRequest) {
  return NextResponse.json({ error: "Use DELETE /api/competitors/[id]" }, { status: 400 });
}
