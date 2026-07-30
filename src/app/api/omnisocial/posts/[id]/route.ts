import { NextRequest } from "next/server";
import { proxyOmniSocial } from "@/lib/api/omnisocial-proxy";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyOmniSocial(req, `/posts/${id}`);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  return proxyOmniSocial(req, `/posts/${id}`, { method: "PATCH", body });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyOmniSocial(req, `/posts/${id}`, { method: "DELETE" });
}
