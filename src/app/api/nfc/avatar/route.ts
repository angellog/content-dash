import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Mirrors the `nfc-avatars` bucket's allowed_mime_types and file_size_limit
// (supabase/migrations/20260926_media_bucket_and_upload_policies.sql), so a bad
// file gets a clear 4xx here instead of a storage error surfacing as a 500.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024;

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
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(cardId)) {
    return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: `Unsupported image type "${file.type || "unknown"}" — use JPEG, PNG, WebP or GIF` },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is larger than 5 MB" }, { status: 413 });
  }

  // The bucket's storage policy only accepts <caller's uid>/…
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
