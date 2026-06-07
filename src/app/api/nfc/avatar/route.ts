import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const cardId = formData.get("cardId") as string | null;

  if (!file || !cardId) {
    return NextResponse.json({ error: "File and cardId are required" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${user.id}/${cardId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("nfc-avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("nfc-avatars").getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
