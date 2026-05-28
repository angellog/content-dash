import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("WhatsAppBillboardCampaign")
    .select("*")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.campaignName || !body.mediaUrl || !body.scheduledAt) {
    return NextResponse.json({ error: "campaignName, mediaUrl, scheduledAt required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("WhatsAppBillboardCampaign")
    .insert({
      id: crypto.randomUUID(),
      userId: user.id,
      campaignName: body.campaignName,
      mediaUrl: body.mediaUrl,
      caption: body.caption || null,
      redirectUrl: body.redirectUrl || null,
      scheduledAt: body.scheduledAt,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
