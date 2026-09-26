import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Mirrors the `media` bucket's allowed_mime_types and file_size_limit
// (supabase/migrations/20260926_media_bucket_and_upload_policies.sql), so a bad
// file gets a clear 4xx here instead of a storage error surfacing as a 500.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};
const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: `Unsupported file type "${file.type || "unknown"}" — use JPEG, PNG, WebP, GIF, MP4 or MOV` },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 50 MB" }, { status: 413 });
  }

  // The bucket's storage policy only accepts uploads/<caller's uid>/…
  const path = `uploads/${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
}
