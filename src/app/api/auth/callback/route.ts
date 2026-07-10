import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Cookies set during exchangeCodeForSession must land on the redirect
  // response itself, not a throwaway one — a no-op setAll here means the
  // code exchange "succeeds" but no session is ever actually persisted,
  // which only surfaces later as a broken-feeling flow (e.g. password
  // recovery landing the user back at a page that isn't really signed in).
  let response = NextResponse.redirect(new URL(redirect, req.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.redirect(new URL(redirect, req.url));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", req.url));
  }

  return response;
}
