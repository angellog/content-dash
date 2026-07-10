"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function getPasswordStrength(password: string): { label: string; color: string } {
  if (password.length < 6) return { label: "Too short", color: "text-red-400" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Weak", color: "text-red-400" };
  if (score <= 3) return { label: "Medium", color: "text-yellow-400" };
  return { label: "Strong", color: "text-emerald-400" };
}

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // window.location.origin is always the real domain the page is
    // currently being served from — production, a preview URL, or local
    // dev — so this can never drift out of sync the way a hardcoded env
    // var or Supabase's dashboard "Site URL" default can (and did, twice).
    const emailRedirectTo = `${window.location.origin}/api/auth/callback`;

    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      });
      if (err) {
        setError(err.message);
      } else {
        setSent(true);
      }
    } else if (mode === "forgot") {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=/reset-password`,
      });
      if (err) {
        setError(err.message);
      } else {
        setSent(true);
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(err.message);
      } else {
        router.push(redirect);
      }
    }
    setLoading(false);
  };

  const strength = mode === "signup" && password.length > 0 ? getPasswordStrength(password) : null;

  if (sent) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-zinc-100">Check your email</CardTitle>
            <CardDescription className="text-zinc-400">
              {mode === "forgot"
                ? `We sent a password reset link to ${email}`
                : `We sent a confirmation link to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full border-zinc-700 text-zinc-300"
              onClick={() => {
                setSent(false);
                setMode("login");
              }}
            >
              Back to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-zinc-100">ContentDash</CardTitle>
          <CardDescription className="text-zinc-400">
            {mode === "login"
              ? "Sign in to your account"
              : mode === "signup"
                ? "Create your account"
                : "Reset your password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-300">
                    Password
                  </Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError(null);
                      }}
                      className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-300"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
                />
                {strength && (
                  <p className={`text-xs ${strength.color}`}>
                    Password strength: {strength.label}
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email || (mode !== "forgot" && !password)}
            >
              {loading
                ? "Loading..."
                : mode === "login"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send reset link"}
            </Button>
          </form>

          <Separator className="my-4 bg-zinc-800" />

          <p className="text-center text-sm text-zinc-500">
            {mode === "forgot" ? (
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="text-zinc-300 underline underline-offset-4 hover:text-white"
              >
                Back to login
              </button>
            ) : mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="text-zinc-300 underline underline-offset-4 hover:text-white"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-zinc-300 underline underline-offset-4 hover:text-white"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-zinc-500 animate-pulse">Loading...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
