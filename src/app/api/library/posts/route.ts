import { NextRequest, NextResponse } from "next/server";
import { proxyLibrary } from "@/lib/api/library-proxy";
import { libraryPostPatchSchema, validateBody } from "@/lib/validations/schemas";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  for (const key of ["status", "owner", "search", "limit", "offset"]) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  const query = params.toString();
  return proxyLibrary(req, `/api/bridge/posts${query ? `?${query}` : ""}`);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = validateBody(libraryPostPatchSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  return proxyLibrary(req, "/api/bridge/posts", { method: "PATCH", body: parsed.data });
}
