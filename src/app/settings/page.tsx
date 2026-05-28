"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Wifi,
  WifiOff,
  Key,
  Users,
  CreditCard,
  ExternalLink,
  LogOut,
  Check,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface OmniSocialConfig {
  connected: boolean;
  status: string;
  lastSyncedAt?: string | null;
  apiKeyMasked?: string | null;
}

interface ConnectedAccount {
  platform: string;
  username: string;
  status: string;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<OmniSocialConfig>({
    connected: false,
    status: "NOT_CONFIGURED",
  });
  const [apiKey, setApiKey] = useState("");
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "valid" | "invalid" | "checking"
  >("idle");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
        setUserName(user.user_metadata?.name ?? null);
      }

      try {
        const [configRes, accountsRes] = await Promise.all([
          fetch("/api/omnisocial/config"),
          fetch("/api/omnisocial/accounts"),
        ]);

        if (configRes.ok) {
          const data = await configRes.json();
          setConfig(data);
        }
        if (accountsRes.ok) {
          const data = await accountsRes.json();
          setAccounts(data.accounts ?? data.data ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function validateKey(key: string) {
    if (!key) return;
    setValidationStatus("checking");
    try {
      const res = await fetch("https://api.omnisocials.com/v1/accounts", {
        headers: { Authorization: `Bearer ${key}` },
      });
      setValidationStatus(res.ok ? "valid" : "invalid");
    } catch {
      setValidationStatus("invalid");
    }
  }

  async function handleConnect() {
    if (!apiKey) return;
    setConnecting(true);
    setValidationStatus("checking");
    try {
      const validateRes = await fetch(
        "https://api.omnisocials.com/v1/accounts",
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      if (!validateRes.ok) {
        setValidationStatus("invalid");
        setConnecting(false);
        return;
      }

      setValidationStatus("valid");
      const accData = await validateRes.json();
      const fetchedAccounts = accData.data ?? accData.accounts ?? accData ?? [];

      const res = await fetch("/api/omnisocial/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setApiKey("");
        setAccounts(fetchedAccounts);
      }
    } catch {
      setValidationStatus("invalid");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/omnisocial/config", {
        method: "DELETE",
      });
      if (res.ok) {
        setConfig({ connected: false, status: "NOT_CONFIGURED" });
        setAccounts([]);
      }
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-7 w-7 text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        </div>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              {config.connected ? (
                <Wifi className="h-5 w-5 text-emerald-400" />
              ) : (
                <WifiOff className="h-5 w-5 text-zinc-500" />
              )}
              OmniSocial Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.connected ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-emerald-600 text-emerald-400"
                  >
                    Connected
                  </Badge>
                  <span className="text-xs text-zinc-500">
                    {config.status}
                  </span>
                </div>
                {config.apiKeyMasked && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Key className="h-4 w-4" />
                    <span>API Key: {config.apiKeyMasked}</span>
                  </div>
                )}
                {config.lastSyncedAt && (
                  <p className="text-sm text-zinc-400">
                    Last synced:{" "}
                    {new Date(config.lastSyncedAt).toLocaleString()}
                  </p>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  <WifiOff className="mr-2 h-4 w-4" />
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </Button>
              </>
            ) : (
              <>
                <Badge
                  variant="outline"
                  className="border-zinc-600 text-zinc-500"
                >
                  Not Connected
                </Badge>
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-zinc-300">
                    API Key
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="Enter your OmniSocial API key"
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setValidationStatus("idle");
                        }}
                        onBlur={() => validateKey(apiKey)}
                        className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 pr-10"
                      />
                      {validationStatus === "valid" && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                      )}
                      {validationStatus === "invalid" && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <Button
                      onClick={handleConnect}
                      disabled={
                        connecting || !apiKey || validationStatus === "invalid"
                      }
                      size="sm"
                    >
                      <Key className="mr-2 h-4 w-4" />
                      {connecting
                        ? "Validating..."
                        : validationStatus === "checking"
                          ? "Checking..."
                          : "Connect"}
                    </Button>
                  </div>
                  {validationStatus === "invalid" && (
                    <p className="text-xs text-red-400">
                      Invalid API key. Check your OmniSocial dashboard.
                    </p>
                  )}
                  <p className="text-xs text-zinc-500">
                    Get your API key from{" "}
                    <a
                      href="https://omnisocials.com"
                      target="_blank"
                      rel="noopener"
                      className="underline underline-offset-2 hover:text-zinc-300"
                    >
                      omnisocials.com
                    </a>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Users className="h-5 w-5 text-zinc-400" />
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!config.connected || accounts.length === 0 ? (
              <p className="text-sm text-zinc-500">
                {config.connected
                  ? "Loading accounts..."
                  : "Connect OmniSocial to see your accounts"}
              </p>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div key={account.platform}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {account.platform}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {account.username}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          account.status === "active"
                            ? "border-emerald-600 text-emerald-400"
                            : "border-zinc-600 text-zinc-500"
                        }
                      >
                        {account.status}
                      </Badge>
                    </div>
                    <Separator className="mt-3 bg-zinc-800" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <CreditCard className="h-5 w-5 text-zinc-400" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Email</p>
              <p className="text-sm text-zinc-200">
                {userEmail ?? "Not signed in"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Name</p>
              <p className="text-sm text-zinc-200">
                {userName ?? "—"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <CreditCard className="h-5 w-5 text-zinc-400" />
              NFC Cards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/nfc">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage NFC Cards
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
