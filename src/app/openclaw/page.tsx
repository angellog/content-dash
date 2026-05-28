"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Cpu,
  Lock,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Send,
  Eye,
  Wifi,
  Phone,
  QrCode,
  MapPin,
  Link,
  CheckCircle,
  Play,
  Pause,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AgentLog {
  timestamp: string;
  type: "info" | "success" | "warning";
  message: string;
}

export default function OpenClawAgent() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [unlockPlan, setUnlockPlan] = useState("pro-monthly");
  
  // Dashboard states (interactive after unlock)
  const [inboxAutopilot, setInboxAutopilot] = useState(true);
  const [competitorScraper, setCompetitorScraper] = useState(true);
  const [smartPosting, setSmartPosting] = useState(false);
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState(["BrandX", "MegaRetail"]);
  
  // Mock live running logs
  const [logs, setLogs] = useState<AgentLog[]>([
    { timestamp: "12:04:12", type: "info", message: "OpenClaw agent core initialized successfully." },
    { timestamp: "12:04:15", type: "success", message: "OmniSocial API handshake successful." },
    { timestamp: "12:05:01", type: "info", message: "Scanning social inboxes for unresolved leads..." },
    { timestamp: "12:05:08", type: "success", message: "Drafted reply to customer query 'Are you open weekends?' on Instagram" },
  ]);

  useEffect(() => {
    async function checkConnection() {
      const res = await fetch("/api/omnisocial/config");
      if (res.ok) {
        const data = await res.json();
        if (data.connected) setIsUnlocked(true);
      }
    }
    checkConnection();
  }, []);

  // Log simulation after unlock
  useEffect(() => {
    if (!isUnlocked) return;

    const timer = setInterval(() => {
      const logTemplates: Omit<AgentLog, "timestamp">[] = [
        { type: "info", message: "Scraping competitor pricing sheets for updates..." },
        { type: "success", message: "Analyzed competitor BrandX post. Recommended trend: 'Sustainable packaging highlights'" },
        { type: "info", message: "Measuring active status billboard views and conversion trends..." },
        { type: "success", message: "Autopilot posted Scheduled Story: 'Check out our new smart NFC configurations!'" },
        { type: "warning", message: "Rate limit threshold reached on Twitter API. Backing off for 120s..." },
        { type: "info", message: "Refreshing OmniSocial integration status. Latency: 22ms." },
      ];

      const chosen = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      
      setLogs((prev) => [...prev.slice(-8), { timestamp: timeStr, ...chosen }]);
    }, 5000);

    return () => clearInterval(timer);
  }, [isUnlocked]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("Please enter your OmniSocial API key to establish agent handshake.");
      return;
    }

    try {
      const res = await fetch("https://api.omnisocials.com/v1/accounts", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const configRes = await fetch("/api/omnisocial/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey }),
        });
        if (configRes.ok) {
          setIsUnlocked(true);
          toast.success("OpenClaw agent unlocked — OmniSocial handshake established.");
        } else {
          toast.error("Failed to save API key. Please try again.");
        }
      } else {
        toast.error("Invalid API key. Check your OmniSocial dashboard.");
      }
    } catch {
      toast.error("Connection failed. Check your network.");
    }
  };

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorInput.trim()) return;
    setCompetitors([...competitors, competitorInput.trim()]);
    setCompetitorInput("");
    
    // Add custom log entry
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setLogs((prev) => [...prev, {
      timestamp: timeStr,
      type: "info",
      message: `Added new target '${competitorInput.trim()}' to Competitor Watchlist.`
    }]);
  };

  return (
    <>
      <Header title="OpenClaw Autonomous Agent" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 relative">
        
        {/* Banner */}
        <section className="relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/20 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Cpu className="size-3 mr-1 inline-block" />
                  Autonomous AI
                </Badge>
                <Badge variant="outline" className="border-zinc-800 text-zinc-400">
                  Agent Core v4.9
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                OpenClaw AI Command Center
              </h1>
              <p className="max-w-2xl text-sm text-zinc-400">
                Meet the ultimate autonomous agent for social growth. OpenClaw scans your customer inboxes 
                to auto-respond, generates high-performing status billboard updates, sequences follow-ups, 
                and continuously crawls competitor pages to optimize your messaging on complete autopilot.
              </p>
            </div>
          </div>
        </section>

        {/* Outer container holding the dashboard and the overlay */}
        <div className="relative min-h-[500px]">
          
          {/* MOCK BACKSTAGE DASHBOARD (Blurred when locked) */}
          <div className={cn(
            "grid gap-6 lg:grid-cols-5 transition-all duration-500",
            !isUnlocked ? "blur-md select-none pointer-events-none opacity-50" : ""
          )}>
            
            {/* Left Hand Toggles (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-white text-base">Agent Core Directives</CardTitle>
                  <CardDescription className="text-zinc-500">Enable or disable autonomous modules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
                    <div className="space-y-0.5">
                      <Label className="text-zinc-200 text-sm font-semibold">Inbox Autopilot replies</Label>
                      <p className="text-xxs text-zinc-500">Draft responses & automatically reply to basic FAQs.</p>
                    </div>
                    <Switch checked={inboxAutopilot} onCheckedChange={setInboxAutopilot} className="data-[state=checked]:bg-violet-600" />
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
                    <div className="space-y-0.5">
                      <Label className="text-zinc-200 text-sm font-semibold">Competitor Tracker Scraper</Label>
                      <p className="text-xxs text-zinc-500">Monitor rival pricing, posts, and campaign starts.</p>
                    </div>
                    <Switch checked={competitorScraper} onCheckedChange={setCompetitorScraper} className="data-[state=checked]:bg-violet-600" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-zinc-200 text-sm font-semibold">Autonomous Dynamic Posting</Label>
                      <p className="text-xxs text-zinc-500">Draft and publish statuses & social posts based on logs.</p>
                    </div>
                    <Switch checked={smartPosting} onCheckedChange={setSmartPosting} className="data-[state=checked]:bg-violet-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Competitor Scraper Watchlist */}
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-white text-base">Competitor Watchlist</CardTitle>
                  <CardDescription className="text-zinc-500">Websites or handles analyzed daily by OpenClaw.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleAddCompetitor} className="flex gap-2">
                    <Input
                      placeholder="e.g. competitorbrand.com"
                      value={competitorInput}
                      onChange={(e) => setCompetitorInput(e.target.value)}
                      className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-violet-600 text-xs"
                    />
                    <Button type="submit" size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-white">Add</Button>
                  </form>

                  <div className="space-y-2">
                    {competitors.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/40 text-xs">
                        <span className="text-zinc-300 font-medium">{comp}</span>
                        <Badge className="bg-violet-500/10 text-violet-400 border border-violet-500/20">Scraping Live</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Hand Agent Logs & Console (3 Cols) */}
            <Card className="border-zinc-800 bg-zinc-900 lg:col-span-3 flex flex-col h-full min-h-[420px]">
              <CardHeader className="border-b border-zinc-800/50 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Terminal className="size-4 text-violet-400" /> Autonomous Agent Live Terminal
                  </CardTitle>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Running Autopilot
                  </Badge>
                </div>
                <CardDescription className="text-zinc-500">Live background actions completed by the agent model.</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 bg-zinc-950 p-4 font-mono text-xs overflow-y-auto space-y-2.5 min-h-[300px]">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={cn(
                      "font-semibold shrink-0 uppercase text-[9px] px-1 rounded",
                      log.type === "success" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : log.type === "warning"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-zinc-800 text-zinc-400"
                    )}>
                      {log.type}
                    </span>
                    <span className="text-zinc-300 leading-normal">{log.message}</span>
                  </div>
                ))}
              </CardContent>

              <CardFooter className="border-t border-zinc-800/60 p-4 flex justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Wifi className="size-3 text-emerald-400" /> Synchronized with OmniSocial Cloud
                </span>
                <span>Press Ctrl+C to abort processes.</span>
              </CardFooter>
            </Card>

          </div>

          {/* BEAUTIFUL BLURRED GLASS COVER / PRO GATEWAY */}
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 backdrop-blur-md rounded-xl border border-zinc-800/80 z-25 p-4 sm:p-6 lg:p-8">
              
              <Card className="w-full max-w-xl border-zinc-800/80 bg-zinc-900/90 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <CardHeader className="text-center pb-4 border-b border-zinc-800/50">
                  <div className="size-12 rounded-2xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <Lock className="size-6 text-violet-400" />
                  </div>
                  <CardTitle className="text-white text-xl flex items-center justify-center gap-2">
                    <Sparkles className="size-4 text-violet-400" />
                    Unlock OpenClaw Pro Command
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto">
                    Activate the complete suite of autonomous social automations, auto-replies, and intelligent competitor trackers.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleUnlock}>
                  <CardContent className="p-6 space-y-5">
                    
                    {/* Choose Plan option */}
                    <div className="space-y-2">
                      <Label className="text-zinc-300 font-semibold text-xs uppercase tracking-wider">Select Unlock Option</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setUnlockPlan("pro-monthly")}
                          className={cn(
                            "p-3 rounded-lg border text-left flex flex-col justify-between transition",
                            unlockPlan === "pro-monthly" 
                              ? "bg-zinc-850 border-violet-500 text-white" 
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          )}
                        >
                          <span className="text-sm font-semibold">OpenClaw Standalone Pro</span>
                          <span className="text-xs text-violet-400 font-semibold mt-1">$29.00 / month</span>
                          <span className="text-[10px] text-zinc-500 mt-0.5">Renews automatically, cancel anytime.</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUnlockPlan("pro-bundle")}
                          className={cn(
                            "p-3 rounded-lg border text-left flex flex-col justify-between transition",
                            unlockPlan === "pro-bundle" 
                              ? "bg-zinc-850 border-violet-500 text-white" 
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-semibold">NFC Card + Pro Bundle</span>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px]">BEST VALUE</Badge>
                          </div>
                          <span className="text-xs text-emerald-400 font-semibold mt-1">$49.00 One-time</span>
                          <span className="text-[10px] text-zinc-500 mt-0.5">Includes 1 physical metal NFC card + 3 mo Pro.</span>
                        </button>
                      </div>
                    </div>

                    {/* API Key Connection */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="api-key" className="text-zinc-300 font-semibold text-xs uppercase tracking-wider">OmniSocial API Key</Label>
                        <span className="text-[10px] text-zinc-500">Requires connection</span>
                      </div>
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="OS-••••••••••••••••••••••••"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        required
                        className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-violet-500 font-mono text-xs"
                      />
                      <p className="text-[10px] text-zinc-500">
                        🔑 Enter your integration key. You can mock it with <b>OS-demo123</b> to try the dashboard out!
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg border border-zinc-850 bg-zinc-950/40 text-[11px] flex gap-2 items-start">
                      <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-zinc-400">
                        <p className="font-semibold text-zinc-300">Bank-grade API Integration</p>
                        <p>Credentials are encrypted locally inside your dashboard environment. No external logs stored.</p>
                      </div>
                    </div>

                  </CardContent>

                  <CardFooter className="border-t border-zinc-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950/20">
                    <div className="flex items-center gap-2 text-xxs text-zinc-500">
                      <CreditCard className="size-4 text-zinc-600" /> Secure checkout verified by Stripe.
                    </div>
                    <Button type="submit" className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white">
                      Unlock Autonomous Autopilot
                    </Button>
                  </CardFooter>
                </form>
              </Card>

            </div>
          )}

        </div>
      </main>
    </>
  );
}
