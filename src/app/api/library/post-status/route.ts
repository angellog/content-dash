import { NextRequest, NextResponse } from "next/server";
import { proxyLibrary } from "@/lib/api/library-proxy";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("post_id");
  if (!postId) {
    return NextResponse.json({ error: "post_id required" }, { status: 400 });
  }

  return proxyLibrary(req, `/api/bridge/post-status?post_id=${encodeURIComponent(postId)}`);
}
