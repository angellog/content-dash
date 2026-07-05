import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Server-to-server bridge to feetbit-content-library's /api/bridge/* routes.
// content-dash owns its own login check here; the bridge secret below is
// never sent to the browser, only used from this server-side module.
async function requireContentDashUser(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user };
}

async function libraryFetch(
  path: string,
  options?: { method?: string; body?: unknown }
) {
  const baseUrl = process.env.FEETBIT_LIBRARY_URL;
  const secret = process.env.FEETBIT_LIBRARY_BRIDGE_SECRET;

  if (!baseUrl || !secret) {
    return NextResponse.json(
      { error: "Content library bridge is not configured", status: "NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function proxyLibrary(
  req: NextRequest,
  path: string,
  options?: { method?: string; body?: unknown }
) {
  const auth = await requireContentDashUser(req);
  if ("error" in auth) return auth.error;

  return libraryFetch(path, options);
}
