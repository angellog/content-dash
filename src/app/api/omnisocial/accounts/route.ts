import { NextRequest } from "next/server";
import { proxyOmniSocial } from "@/lib/api/omnisocial-proxy";

export async function GET(req: NextRequest) {
  return proxyOmniSocial(req, "/accounts");
}
