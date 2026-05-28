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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface OmniSocialConfig {
  connected: boolean;
  lastSync?: string;
  maskedKey?: string;
}

interface ConnectedAccount {
  platform: string;
  username: string;
  status: string;
}

interface NFCSummary {
  activeCards: number;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<OmniSocialConfig>({ connected: false });
  const [apiKey, setApiKey] = useState("");
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [nfcSummary, setNfcSummary] = useState<NFCSummary>({ activeCards: 0 });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [configRes, accountsRes, nfcRes] = await Promise.all([
          fetch("/api/omnisocial/config"),
          fetch("/api/omnisocial/accounts"),
          fetch("/api/nfc/summary"),
        ]);

        if (configRes.ok) {
          const data = await configRes.json();
          setConfig(data);
        }
        if (accountsRes.ok) {
          const data = await accountsRes.json();
          setAccounts(data.accounts ?? []);
        }
        if (nfcRes.ok) {
          const data = await nfcRes.json();
          setNfcSummary(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/omnisocial/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setApiKey("");
        const accRes = await fetch("/api/omnisocial/accounts");
        if (accRes.ok) {
          const accData = await accRes.json();
          setAccounts(accData.accounts ?? []);
        }
      }
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/omnisocial/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: null }),
      });
      if (res.ok) {
        setConfig({ connected: false });
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
                  <Badge variant="outline" className="border-emerald-600 text-emerald-400">
                    Connected
                  </Badge>
                </div>
                {config.lastSync && (
                  <p className="text-sm text-zinc-400">
                    Last synced: {new Date(config.lastSync).toLocaleString()}
                  </p>
                )}
                {config.maskedKey && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Key className="h-4 w-4" />
                    <span>API Key: ****{config.maskedKey}</span>
                  </div>
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
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-zinc-300">
                    API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter your OmniSocial API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
                    />
                    <Button
                      onClick={handleConnect}
                      disabled={connecting || !apiKey}
                      size="sm"
                    >
                      <Key className="mr-2 h-4 w-4" />
                      {connecting ? "Connecting..." : "Connect"}
                    </Button>
                  </div>
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
                Connect OmniSocial to see your accounts
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
              <p className="text-sm text-zinc-200" id="user-email">
                —
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Name</p>
              <p className="text-sm text-zinc-200" id="user-name">
                —
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
            <p className="text-sm text-zinc-400">
              Active cards: <span className="font-semibold text-zinc-200">{nfcSummary.activeCards}</span>
            </p>
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
