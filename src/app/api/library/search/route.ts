import { NextRequest, NextResponse } from "next/server";
import { proxyLibrary } from "@/lib/api/library-proxy";
import { librarySearchSchema, validateBody } from "@/lib/validations/schemas";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = validateBody(librarySearchSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  return proxyLibrary(req, "/api/bridge/search", { method: "POST", body: parsed.data });
}
