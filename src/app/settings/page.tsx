"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Wifi,
  WifiOff,
  Key,
  CreditCard,
  ExternalLink,
  LogOut,
  Check,
  AlertCircle,
  Link as LinkIcon,
  Cpu,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useAgentConfigStore } from "@/hooks/useAgentConfigStore";

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
  const router = useRouter();
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

  const [llmProvider, setLlmProvider] = useState<string>("openai");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [agentFramework, setAgentFramework] = useState<string>("openclaw");
  const [hermesEndpointUrl, setHermesEndpointUrl] = useState("");
  const [hermesApiKey, setHermesApiKey] = useState("");
  const [higgsfieldApiKey, setHiggsfieldApiKey] = useState("");
  const [agentActive, setAgentActive] = useState(false);
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioNumber, setTwilioNumber] = useState("");
  const [savingAgent, setSavingAgent] = useState(false);
  const [twilioTokenDirty, setTwilioTokenDirty] = useState(false);

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
        const [configRes, accountsRes, agentRes] = await Promise.all([
          fetch("/api/omnisocial/config"),
          fetch("/api/omnisocial/accounts"),
          fetch("/api/agent/config"),
        ]);

        if (configRes.ok) {
          const data = await configRes.json();
          setConfig(data);
        }
        if (accountsRes.ok) {
          const data = await accountsRes.json();
          setAccounts(data.accounts ?? data.data ?? []);
        }
        if (agentRes.ok) {
          const data = await agentRes.json();
          setLlmProvider(data.llmProvider ?? "openai");
          setAgentActive(data.isActive ?? false);
          setAgentFramework(data.agentFramework ?? "openclaw");
          useAgentConfigStore.getState().setAgentFramework(data.agentFramework ?? "openclaw");
          setHermesEndpointUrl(data.hermesEndpointUrl ?? "");
          setHermesApiKey(data.hermesApiKeyMasked ?? "");
          setHiggsfieldApiKey(data.higgsfieldApiKeyMasked ?? "");
          setTwilioSid(data.twilioAccountSid ?? "");
          setTwilioAuthToken(data.twilioAuthTokenMasked ?? "");
          setTwilioNumber(data.twilioWhatsappNumber ?? "");
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
      const res = await fetch("/api/omnisocial/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      setValidationStatus(res.ok && data.valid ? "valid" : "invalid");
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
      const validateRes = await fetch("/api/omnisocial/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const validateData = await validateRes.json();

      if (!validateRes.ok || !validateData.valid) {
        setValidationStatus("invalid");
        setConnecting(false);
        return;
      }

      setValidationStatus("valid");
      const fetchedAccounts = validateData.accounts ?? [];

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
        toast.success("OmniSocial connected successfully!");
      }
    } catch {
      setValidationStatus("invalid");
      toast.error("Connection failed. Check your API key.");
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
        toast.success("OmniSocial disconnected.");
      } else {
        toast.error("Failed to disconnect.");
      }
    } catch {
      toast.error("Failed to disconnect.");
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleSaveAgent() {
    setSavingAgent(true);
    try {
      const body: Record<string, unknown> = {
        agentFramework,
        llmProvider: agentFramework === "openclaw" ? llmProvider : undefined,
        llmApiKey: agentFramework === "openclaw" && llmApiKey ? llmApiKey : undefined,
        hermesEndpointUrl: agentFramework === "hermes" ? hermesEndpointUrl : undefined,
        hermesApiKey: agentFramework === "hermes" && hermesApiKey && !hermesApiKey.startsWith("****") ? hermesApiKey : undefined,
        higgsfieldApiKey: higgsfieldApiKey && !higgsfieldApiKey.startsWith("****") ? higgsfieldApiKey : undefined,
        twilioAccountSid: twilioSid || undefined,
        twilioWhatsappNumber: twilioNumber || undefined,
        isActive: true,
      };
      if (twilioTokenDirty && twilioAuthToken) {
        body.twilioAuthToken = twilioAuthToken;
      }
      const res = await fetch("/api/agent/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("AI Agent configuration saved!");
        setAgentActive(true);
        setTwilioTokenDirty(false);
        useAgentConfigStore.getState().setAgentFramework(agentFramework);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to save agent configuration.");
      }
    } catch {
      toast.error("Failed to save agent configuration.");
    } finally {
      setSavingAgent(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      toast.error("Failed to sign out.");
    }
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
                      rel="noopener noreferrer"
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
              <Cpu className="h-5 w-5 text-purple-400" />
              AI Agent Configuration
              {agentActive && <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase tracking-wider">Active</Badge>}
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${
                agentFramework === "hermes"
                  ? "border-amber-600 text-amber-400"
                  : "border-purple-600 text-purple-400"
              }`}>
                {agentFramework === "hermes" ? "Hermes" : "OpenClaw"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Agent Framework</Label>
              <Select value={agentFramework} onValueChange={(v) => v && setAgentFramework(v)}>
                <SelectTrigger className="w-full border-zinc-700 bg-zinc-800 text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openclaw">OpenClaw (Cloud LLM APIs)</SelectItem>
                  <SelectItem value="hermes">Hermes (Self-Hosted LLM)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500">
                {agentFramework === "openclaw"
                  ? "Uses OpenAI, Anthropic, or Gemini cloud APIs with your own API key."
                  : "Connect to a self-hosted Hermes model via vLLM, Ollama, or LM Studio."}
              </p>
            </div>

            {agentFramework === "openclaw" ? (
              <>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">LLM Provider</Label>
                  <Select value={llmProvider} onValueChange={(v) => v && setLlmProvider(v)}>
                    <SelectTrigger className="w-full border-zinc-700 bg-zinc-800 text-zinc-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude Sonnet)</SelectItem>
                      <SelectItem value="gemini">Google (Gemini 2.0 Flash)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-500">Choose your preferred AI model. You bring your own API key.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">LLM API Key</Label>
                  <Input
                    type="password"
                    placeholder="sk-... / sk-ant-... / AIza..."
                    value={llmApiKey}
                    onChange={(e) => setLlmApiKey(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                  />
                  <p className="text-xs text-zinc-500">Encrypted at rest. Used to power the OpenClaw agent and WhatsApp commands.</p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Hermes Endpoint URL</Label>
                  <Input
                    type="text"
                    placeholder="http://localhost:11434/v1"
                    value={hermesEndpointUrl}
                    onChange={(e) => setHermesEndpointUrl(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                  />
                  <p className="text-xs text-zinc-500">
                    Your self-hosted Hermes model endpoint (vLLM, Ollama, LM Studio). Must expose OpenAI-compatible /v1/chat/completions.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Hermes API Key <span className="text-zinc-600">(optional)</span></Label>
                  <Input
                    type="password"
                    placeholder="Leave empty if your endpoint has no auth"
                    value={hermesApiKey}
                    onChange={(e) => setHermesApiKey(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                  />
                  <p className="text-xs text-zinc-500">Encrypted at rest. Only needed if your Hermes endpoint requires authentication.</p>
                </div>
              </>
            )}

            <Separator className="bg-zinc-800" />

            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-fuchsia-400" />
              <span className="text-sm font-medium text-zinc-300">Higgsfield Media Generation</span>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Higgsfield API Key <span className="text-zinc-600">(optional)</span></Label>
              <Input
                type="password"
                placeholder="KEY_ID:KEY_SECRET"
                value={higgsfieldApiKey}
                onChange={(e) => setHiggsfieldApiKey(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
              />
              <p className="text-xs text-zinc-500">
                Encrypted at rest. Enables the agent&apos;s <span className="text-zinc-400">generate_image</span> tool to create images &amp; videos from prompts. Paste your <span className="text-zinc-400">KEY_ID:KEY_SECRET</span> from{" "}
                <a
                  href="https://platform.higgsfield.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-zinc-300"
                >
                  platform.higgsfield.ai
                </a>.
              </p>
            </div>

            <Separator className="bg-zinc-800" />

            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium text-zinc-300">Twilio WhatsApp Integration</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Account SID</Label>
                <Input
                  type="text"
                  placeholder="ACxxxxxxxxxxxx"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Auth Token</Label>
                <Input
                  type="password"
                  placeholder="Your Twilio auth token"
                  value={twilioAuthToken}
                  onChange={(e) => {
                    setTwilioAuthToken(e.target.value);
                    setTwilioTokenDirty(true);
                  }}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">WhatsApp Number</Label>
              <Input
                type="text"
                placeholder="+1234567890"
                value={twilioNumber}
                onChange={(e) => setTwilioNumber(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
              />
              <p className="text-xs text-zinc-500">Your Twilio WhatsApp Business number. Users text this to command the agent.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSaveAgent}
                disabled={savingAgent}
                className="bg-purple-600 hover:bg-purple-500 text-white"
              >
                {savingAgent ? "Saving..." : "Save Agent Config"}
              </Button>
              {agentActive && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/agent/config", { method: "DELETE" });
                      if (res.ok) {
                        setAgentActive(false);
                        toast.success("Agent deactivated.");
                      } else {
                        toast.error("Failed to deactivate agent.");
                      }
                    } catch {
                      toast.error("Failed to deactivate agent.");
                    }
                  }}
                  className="border-zinc-700 text-zinc-400 hover:text-red-400"
                >
                  Deactivate
                </Button>
              )}
            </div>
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
