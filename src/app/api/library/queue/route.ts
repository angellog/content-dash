import { NextRequest, NextResponse } from "next/server";
import { proxyLibrary } from "@/lib/api/library-proxy";
import {
  libraryQueuePostSchema,
  libraryQueuePatchSchema,
  libraryQueueDeleteSchema,
  validateBody,
} from "@/lib/validations/schemas";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  for (const key of ["status", "target_id", "limit", "offset"]) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  const query = params.toString();
  return proxyLibrary(req, `/api/bridge/queue${query ? `?${query}` : ""}`);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = validateBody(libraryQueuePostSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  return proxyLibrary(req, "/api/bridge/queue", { method: "POST", body: parsed.data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = validateBody(libraryQueuePatchSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  return proxyLibrary(req, "/api/bridge/queue", { method: "PATCH", body: parsed.data });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const parsed = validateBody(libraryQueueDeleteSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  return proxyLibrary(req, "/api/bridge/queue", { method: "DELETE", body: parsed.data });
}
