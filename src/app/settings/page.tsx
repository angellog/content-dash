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
  Link as LinkIcon,
  ArrowLeftRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type InputMode = "api_key" | "mcp_url";

interface OmniSocialConfig {
  connected: boolean;
  status: string;
  lastSyncedAt?: string | null;
  apiKeyMasked?: string | null;
  connectionType?: string | null;
  mcpUrl?: string | null;
}

interface ConnectedAccount {
  platform: string;
  username: string;
  status: string;
}

function extractApiKey(input: string): { apiKey: string; mcpUrl: string | null } {
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      const keyFromParam =
        url.searchParams.get("api_key") ??
        url.searchParams.get("apiKey") ??
        url.searchParams.get("key");
      if (keyFromParam) return { apiKey: keyFromParam, mcpUrl: `${url.origin}${url.pathname}` };
      const pathKey = url.pathname.split("/").filter(Boolean).pop();
      if (pathKey && pathKey.length > 8 && !pathKey.includes(".")) {
        return { apiKey: pathKey, mcpUrl: url.origin };
      }
      return { apiKey: trimmed, mcpUrl: trimmed };
    } catch {
      return { apiKey: trimmed, mcpUrl: null };
    }
  }
  return { apiKey: trimmed, mcpUrl: null };
}

export default function SettingsPage() {
  const [config, setConfig] = useState<OmniSocialConfig>({
    connected: false,
    status: "NOT_CONFIGURED",
  });
  const [inputMode, setInputMode] = useState<InputMode>("api_key");
  const [inputValue, setInputValue] = useState("");
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

  async function validateKey(apiKey: string) {
    if (!apiKey) return;
    setValidationStatus("checking");
    try {
      const res = await fetch("https://api.omnisocials.com/v1/accounts", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      setValidationStatus(res.ok ? "valid" : "invalid");
    } catch {
      setValidationStatus("invalid");
    }
  }

  async function handleConnect() {
    if (!inputValue) return;
    const { apiKey, mcpUrl } = extractApiKey(inputValue);
    setConnecting(true);
    setValidationStatus("checking");
    try {
      const validateRes = await fetch(
        "https://api.omnisocials.com/v1/accounts",
        { headers: { Authorization: `Bearer ${apiKey}` } }
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
        body: JSON.stringify({ apiKey: inputValue }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setInputValue("");
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
      const res = await fetch("/api/omnisocial/config", { method: "DELETE" });
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
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="border-emerald-600 text-emerald-400">
                    Connected
                  </Badge>
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                    {config.connectionType === "mcp_url" ? (
                      <><LinkIcon className="h-3 w-3 mr-1" />MCP</>
                    ) : (
                      <><Key className="h-3 w-3 mr-1" />API Key</>
                    )}
                  </Badge>
                </div>
                {config.apiKeyMasked && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Key className="h-4 w-4" />
                    <span>Key: {config.apiKeyMasked}</span>
                  </div>
                )}
                {config.mcpUrl && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <LinkIcon className="h-4 w-4" />
                    <span className="truncate">{config.mcpUrl}</span>
                  </div>
                )}
                {config.lastSyncedAt && (
                  <p className="text-sm text-zinc-400">
                    Last synced: {new Date(config.lastSyncedAt).toLocaleString()}
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
                <Badge variant="outline" className="border-zinc-600 text-zinc-500">
                  Not Connected
                </Badge>

                <div className="flex items-center gap-1 p-1 bg-zinc-800 rounded-lg">
                  <button
                    onClick={() => { setInputMode("api_key"); setInputValue(""); setValidationStatus("idle"); }}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      inputMode === "api_key"
                        ? "bg-zinc-700 text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Key className="h-3.5 w-3.5" />
                    API Key
                  </button>
                  <button
                    onClick={() => { setInputMode("mcp_url"); setInputValue(""); setValidationStatus("idle"); }}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      inputMode === "mcp_url"
                        ? "bg-zinc-700 text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    MCP URL
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connection-input" className="text-zinc-300">
                    {inputMode === "api_key" ? "API Key" : "MCP Server URL"}
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="connection-input"
                        type={inputMode === "api_key" ? "password" : "text"}
                        placeholder={
                          inputMode === "api_key"
                            ? "os_live_xxxxxxxx"
                            : "https://mcp.omnisocials.com/"
                        }
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          setValidationStatus("idle");
                        }}
                        onBlur={() => {
                          if (inputValue) {
                            const { apiKey } = extractApiKey(inputValue);
                            validateKey(apiKey);
                          }
                        }}
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
                      disabled={connecting || !inputValue || validationStatus === "invalid"}
                      size="sm"
                    >
                      {connecting
                        ? "Validating..."
                        : validationStatus === "checking"
                          ? "Checking..."
                          : "Connect"}
                    </Button>
                  </div>
                  {validationStatus === "invalid" && (
                    <p className="text-xs text-red-400">
                      Invalid credentials. Check your OmniSocial dashboard.
                    </p>
                  )}
                  {inputMode === "mcp_url" && (
                    <p className="text-xs text-zinc-500">
                      Paste the MCP URL from your AI client config (Claude, Cursor, etc). We&apos;ll extract the API key automatically.
                    </p>
                  )}
                  <p className="text-xs text-zinc-500">
                    Get your credentials from{" "}
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
                        <p className="text-xs text-zinc-500">{account.username}</p>
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
              <p className="text-sm text-zinc-200">{userEmail ?? "Not signed in"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Name</p>
              <p className="text-sm text-zinc-200">{userName ?? "—"}</p>
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
