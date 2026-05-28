import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { OMNISOCIAL_API_BASE } from "@/lib/omnisocial";

async function getAuthenticatedClient(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };

  const config = await prisma.omniSocialConfig.findUnique({
    where: { userId: user.id },
  });
  if (!config || config.status !== "ACTIVE")
    return {
      error: NextResponse.json(
        { error: "OmniSocial not configured" },
        { status: 403 },
      ),
    };

  return { apiKey: config.apiKeyEncrypted, userId: user.id };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedClient(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const res = await fetch(`${OMNISOCIAL_API_BASE}/posts/${id}`, {
    headers: { Authorization: `Bearer ${auth.apiKey}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedClient(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();

  const res = await fetch(`${OMNISOCIAL_API_BASE}/posts/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${auth.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedClient(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const res = await fetch(`${OMNISOCIAL_API_BASE}/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.apiKey}` },
  });

  if (res.status === 204) return new NextResponse(null, { status: 204 });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
