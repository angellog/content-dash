"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  Sparkles,
  Wifi,
  Eye,
  Link,
  Send,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  scheduledTime: string;
  text: string;
  mediaType: string;
  mediaUrl: string;
  status: string;
  views: number;
  clicks: number;
  replies: number;
}

export default function WhatsAppBillboard() {
  const [isBillboardActive, setIsBillboardActive] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/campaigns");
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.campaigns ?? []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: (c.campaignName as string) ?? "",
          scheduledTime: c.scheduledAt ? new Date(c.scheduledAt as string).toLocaleString() : "TBD",
          text: (c.caption as string) ?? "",
          mediaType: "image",
          mediaUrl: (c.mediaUrl as string) ?? "",
          status:
            (c.status as string) === "PUBLISHED"
              ? "Active"
              : (c.status as string) === "QUEUED"
                ? "Scheduled"
                : (c.status as string) === "FAILED"
                  ? "Failed"
                  : "Scheduled",
          views: (c.viewsCount as number) ?? 0,
          clicks: (c.clicksCount as number) ?? 0,
          replies: (c.repliesCount as number) ?? 0,
        }));
        setCampaigns(mapped);
      } else {
        setError("Failed to load campaigns.");
      }
    } catch {
      setError("Failed to load campaigns. Check your network.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // fetchCampaigns awaits before it touches state, so this cannot cascade
    // renders; the rule can't see past the callback boundary to prove that.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCampaigns();
  }, [fetchCampaigns]);

  const totalViews = campaigns.reduce((sum, c) => sum + c.views, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0);
  const avgCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) + "%" : "—";
  const estBilling = totalViews > 0 ? "$" + (totalViews * 0.01).toFixed(2) : "—";

  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignText, setNewCampaignText] = useState(
    "🔥 EXCLUSIVE DEALS: Tap the link to check our new collection! contentdash.ai/shop-now"
  );
  const [newCampaignMediaType, setNewCampaignMediaType] = useState("image");
  const [newCampaignMediaUrl, setNewCampaignMediaUrl] = useState(
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"
  );
  const [newCampaignTime, setNewCampaignTime] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim() || !newCampaignTime) return;

    const mediaUrl =
      newCampaignMediaType === "color"
        ? "from-purple-900 to-emerald-950"
        : newCampaignMediaUrl;

    setIsCreating(true);
    try {
      const res = await fetch("/api/whatsapp/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: newCampaignName,
          caption: newCampaignText,
          mediaType: newCampaignMediaType.toUpperCase(),
          mediaUrl,
          scheduledAt: new Date(newCampaignTime).toISOString(),
          status: "QUEUED",
        }),
      });
      if (res.ok) {
        toast.success("Campaign created and queued for publishing!");
        setNewCampaignName("");
        setNewCampaignTime("");
        await fetchCampaigns();
      } else {
        toast.error("Failed to create campaign.");
      }
    } catch {
      toast.error("Failed to create campaign. Check your network.");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCampaignStatus = async (id: string) => {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return;

    const newStatus = campaign.status === "Active" ? "PAUSED" : "PUBLISHED";
    setTogglingId(id);

    try {
      const res = await fetch(`/api/whatsapp/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, status: newStatus === "PUBLISHED" ? "Active" : "Paused" }
              : c
          )
        );
      } else {
        toast.error("Failed to update campaign status.");
      }
    } catch {
      toast.error("Failed to update campaign status. Check your network.");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return c.status === "Active";
    if (activeTab === "scheduled") return c.status === "Scheduled";
    return true;
  });

  return (
    <>
      <Header title="WhatsApp Status Billboard" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <section className="relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/20 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Wifi className="size-3 mr-1 inline-block animate-pulse" />
                  Live Sync
                </Badge>
                <Badge variant="outline" className="border-zinc-800 text-zinc-400">
                  Billboard v1.2
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                WhatsApp Status Billboard
              </h1>
              <p className="max-w-2xl text-sm text-zinc-400">
                Transform your WhatsApp Status updates into high-converting billboard campaigns. 
                Schedule image, video, or rich text statuses, and automatically drive organic leads 
                to your checkout, custom forms, or chatbot sequences on autopilot.
              </p>
            </div>
            
            <div className="flex flex-col items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-4 md:items-end">
              <div className="flex items-center gap-3">
                <Label htmlFor="billboard-toggle" className="text-sm font-semibold text-zinc-200">
                  {isBillboardActive ? "BILLBOARD PROGRAM ACTIVE" : "BILLBOARD PROGRAM PAUSED"}
                </Label>
                <Switch
                  id="billboard-toggle"
                  checked={isBillboardActive}
                  onCheckedChange={setIsBillboardActive}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
              <span className="text-xs text-zinc-500">
                {isBillboardActive
                  ? "Auto-broadcasting scheduled updates"
                  : "Campaigns paused. Safe status mode."}
              </span>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <p className="text-sm">{error}</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => { setError(null); setIsLoading(true); fetchCampaigns() }}
              className="ml-auto text-red-400 hover:text-red-300 text-xs"
            >
              Retry
            </Button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-zinc-400">Total Status Views</span>
              <Eye className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {campaigns.length === 0 ? "—" : totalViews.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-emerald-400">
                <TrendingUp className="size-3" />
                <span>Across {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-zinc-400">Avg. Click Rate (CTR)</span>
              <Link className="size-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{avgCtr}</div>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                <span>{totalClicks.toLocaleString()} total clicks tracked</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-zinc-400">Direct Chat Replies</span>
              <Send className="size-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {campaigns.length === 0 ? "—" : totalReplies.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-violet-400">
                <Sparkles className="size-3" />
                <span>Across all campaigns</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-zinc-400">Est. Program Billing</span>
              <CreditCard className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{estBilling}</div>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                <span>Pay-as-you-go ($0.01 per view)</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          
          <Card className="border-zinc-800 bg-zinc-900 lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-emerald-400" />
                <CardTitle className="text-white text-lg">Schedule New Billboard Update</CardTitle>
              </div>
              <CardDescription className="text-zinc-500">
                Compose status card updates that automatically queue onto your synchronized WhatsApp accounts.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleCreateCampaign}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name" className="text-zinc-300">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g. Black Friday Sneak Peek"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    required
                    className="border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 focus-visible:ring-emerald-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="media-type" className="text-zinc-300">Background/Media Type</Label>
                    <Select
                      value={newCampaignMediaType}
                      onValueChange={(val) => {
                        if (val) setNewCampaignMediaType(val);
                      }}
                    >
                      <SelectTrigger className="border-zinc-800 bg-zinc-950 text-white focus:ring-emerald-500">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-800 bg-zinc-900 text-white">
                        <SelectItem value="image">Image Background</SelectItem>
                        <SelectItem value="color">Rich Solid/Gradient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduled-time" className="text-zinc-300">Schedule Broadcast</Label>
                    <Input
                      id="scheduled-time"
                      type="datetime-local"
                      value={newCampaignTime}
                      onChange={(e) => setNewCampaignTime(e.target.value)}
                      required
                      className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                {newCampaignMediaType === "image" && (
                  <div className="space-y-2">
                    <Label htmlFor="media-url" className="text-zinc-300">Image URL</Label>
                    <Input
                      id="media-url"
                      placeholder="https://example.com/status.jpg"
                      value={newCampaignMediaUrl}
                      onChange={(e) => setNewCampaignMediaUrl(e.target.value)}
                      className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-emerald-500 text-xs"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="campaign-text" className="text-zinc-300">Status Caption & Interactive Link</Label>
                  <Textarea
                    id="campaign-text"
                    rows={4}
                    value={newCampaignText}
                    onChange={(e) => setNewCampaignText(e.target.value)}
                    placeholder="Type status message here... make sure to include high converting links!"
                    className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-emerald-500"
                  />
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Sparkles className="size-3 text-emerald-400" />
                    <span>Include links like <b>contentdash.ai/...</b> to auto-track click analytics.</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t border-zinc-800/50 pt-4 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Anti-spam safe pacing active.</span>
                <Button type="submit" disabled={isCreating} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                  {isCreating ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Queuing...
                    </>
                  ) : (
                    "Queue Billboard Campaign"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className="lg:col-span-2 flex flex-col justify-between">
            <Card className="border-zinc-800 bg-zinc-900 h-full flex flex-col justify-between overflow-hidden">
              <CardHeader className="pb-3 border-b border-zinc-800/50">
                <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                  Live Preview (Phone Mockup)
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Real-time preview of your active status broadcast.
                </CardDescription>
              </CardHeader>

              <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950/30">
                <div className="relative w-full max-w-[260px] aspect-[9/18] rounded-[36px] border-4 border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden flex flex-col justify-between select-none">
                  
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 rounded-full bg-zinc-800 z-30 flex items-center justify-between px-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                    <div className="w-12 h-1 rounded-full bg-zinc-900"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                  </div>

                  <div 
                    className={cn(
                      "flex-1 w-full relative flex flex-col justify-between p-3 pt-8 pb-12 transition-all duration-300",
                      newCampaignMediaType === "color" 
                        ? "bg-gradient-to-br from-purple-900 to-indigo-950" 
                        : "bg-cover bg-center"
                    )}
                    style={
                      newCampaignMediaType === "image"
                        ? { backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.65) 100%), url(${newCampaignMediaUrl})` }
                        : {}
                    }
                  >
                    <div className="flex items-center gap-2 z-10">
                      <div className="size-7 rounded-full border border-emerald-500 bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                        WA
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xxs font-semibold text-white leading-none">ContentDash Billboard</p>
                        <p className="text-[9px] text-zinc-300">Just now</p>
                      </div>
                      <div className="flex gap-0.5">
                        <div className="size-1 rounded-full bg-white"></div>
                        <div className="size-1 rounded-full bg-white"></div>
                        <div className="size-1 rounded-full bg-white"></div>
                      </div>
                    </div>

                    <div className="z-10 flex flex-col items-center justify-center flex-1 text-center py-4 px-2">
                      <p className={cn(
                        "text-white leading-relaxed font-sans",
                        newCampaignMediaType === "color" ? "text-sm font-semibold" : "text-xs"
                      )}>
                        {newCampaignText || "Type in the left form to see preview..."}
                      </p>
                    </div>

                    <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-1 z-10">
                      <div className="animate-bounce">
                        <span className="text-[10px] text-emerald-400 font-semibold">▲</span>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full flex items-center gap-1.5 max-w-[85%]">
                        <Link className="size-2.5 text-emerald-400 shrink-0" />
                        <span className="text-[9px] text-white font-medium truncate">
                          contentdash.ai/shop-now
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Campaign Status & Analytics</h2>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="bg-zinc-900 border border-zinc-800 text-zinc-400">
                <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">All</TabsTrigger>
                <TabsTrigger value="active" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400">Active</TabsTrigger>
                <TabsTrigger value="scheduled" className="data-[state=active]:bg-sky-600/20 data-[state=active]:text-sky-400">Scheduled</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card className="border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-950 border-b border-zinc-800">
                  <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                    <TableHead className="text-zinc-400 font-semibold">Campaign Name</TableHead>
                    <TableHead className="text-zinc-400 font-semibold">Broadcast Date</TableHead>
                    <TableHead className="text-zinc-400 font-semibold text-center">Status</TableHead>
                    <TableHead className="text-zinc-400 font-semibold text-right">Views</TableHead>
                    <TableHead className="text-zinc-400 font-semibold text-right">Clicks (CTR)</TableHead>
                    <TableHead className="text-zinc-400 font-semibold text-right">Replies</TableHead>
                    <TableHead className="text-zinc-400 font-semibold text-right">Spend</TableHead>
                    <TableHead className="text-zinc-400 font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                        <Loader2 className="size-5 animate-spin mx-auto mb-2 text-emerald-500" />
                        Loading campaigns...
                      </TableCell>
                    </TableRow>
                  ) : filteredCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                        No campaigns found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCampaigns.map((c) => {
                      const ctr = c.views > 0 ? ((c.clicks / c.views) * 100).toFixed(1) + "%" : "0%";
                      return (
                        <TableRow key={c.id} className="border-zinc-800 hover:bg-zinc-800/30">
                          <TableCell className="font-medium text-white max-w-[200px] truncate">
                            {c.name}
                          </TableCell>
                          <TableCell className="text-zinc-400 text-xs">
                            {c.scheduledTime}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={cn(
                                "border",
                                c.status === "Active"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : c.status === "Scheduled"
                                  ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                                  : c.status === "Paused"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-zinc-500/10 text-zinc-400 border-zinc-800"
                              )}
                            >
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-zinc-300 font-mono text-xs">
                            {c.views.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-zinc-300 font-mono text-xs">
                            {c.clicks > 0 ? `${c.clicks} (${ctr})` : "—"}
                          </TableCell>
                          <TableCell className="text-right text-zinc-300 font-mono text-xs">
                            {c.replies > 0 ? c.replies : "—"}
                          </TableCell>
                          <TableCell className="text-right text-zinc-300 font-mono text-xs font-semibold">
                            {c.views > 0 ? `$${(c.views * 0.01).toFixed(2)}` : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={togglingId === c.id}
                                onClick={() => toggleCampaignStatus(c.id)}
                                className="border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-white h-7 text-xs"
                              >
                                {togglingId === c.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : c.status === "Active" ? "Pause" : "Activate"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </section>
      </main>
    </>
  );
}
