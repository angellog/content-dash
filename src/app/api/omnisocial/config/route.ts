import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getAuthenticatedUser(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };

  return { userId: user.id };
}

function maskApiKey(key: string) {
  if (key.length <= 4) return "****";
  return `****${key.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if ("error" in auth) return auth.error;

  const config = await prisma.omniSocialConfig.findUnique({
    where: { userId: auth.userId },
  });

  if (!config)
    return NextResponse.json({ status: "NOT_CONFIGURED", apiKeyMasked: null, lastSyncedAt: null });

  return NextResponse.json({
    status: config.status,
    apiKeyMasked: maskApiKey(config.apiKeyEncrypted),
    lastSyncedAt: config.lastSyncedAt,
  });
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if ("error" in auth) return auth.error;

  const { apiKey } = await req.json();
  if (!apiKey || typeof apiKey !== "string")
    return NextResponse.json({ error: "apiKey is required" }, { status: 400 });

  const config = await prisma.omniSocialConfig.upsert({
    where: { userId: auth.userId },
    update: {
      apiKeyEncrypted: apiKey,
      status: "ACTIVE",
    },
    create: {
      userId: auth.userId,
      apiKeyEncrypted: apiKey,
      status: "ACTIVE",
    },
  });

  return NextResponse.json({
    status: config.status,
    apiKeyMasked: maskApiKey(config.apiKeyEncrypted),
    lastSyncedAt: config.lastSyncedAt,
  });
}
