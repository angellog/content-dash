import { NextRequest } from "next/server";
import { proxyLibrary } from "@/lib/api/library-proxy";

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
