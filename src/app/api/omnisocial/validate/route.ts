import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OMNISOCIAL_API_BASE } from "@/lib/omnisocial";
import { omnisocialValidateSchema, validateBody } from "@/lib/validations/schemas";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = validateBody(omnisocialValidateSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const res = await fetch(`${OMNISOCIAL_API_BASE}/accounts`, {
      headers: { Authorization: `Bearer ${parsed.data.apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json({ valid: false });
    }

    const data = await res.json();
    const accounts = data.data ?? data.accounts ?? data ?? [];
    return NextResponse.json({ valid: true, accounts });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
