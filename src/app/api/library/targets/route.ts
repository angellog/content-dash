import { NextRequest } from "next/server";
import { proxyLibrary } from "@/lib/api/library-proxy";

export async function GET(req: NextRequest) {
  return proxyLibrary(req, "/api/bridge/targets");
}
