"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  TrendingUp,
  BarChart3,
  Search,
  Plus,
  ThumbsUp,
  MessageSquare,
  Megaphone,
  ArrowUpDown,
  Sparkles,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4 text-pink-500"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4 text-red-500"
  >
    <path d="M2.5 12a9 9 0 0 1 9-9h1a9 9 0 0 1 9 9v0a9 9 0 0 1-9 9h-1a9 9 0 0 1-9-9z" />
    <polygon points="10 15 15 12 10 9" fill="currentColor" />
  </svg>
);

const LinkedinIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4 text-blue-500"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4 text-zinc-300"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-zinc-800", className)}>
      <div
        className="h-full bg-indigo-500 transition-all duration-300 ease-in-out dark:bg-indigo-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

interface Competitor {
  id: string;
  name: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  x: string;
  linkedin: string;
  followers: number;
  postFrequency: number;
  engagementRate: number;
  growthRate?: number;
  audienceHealth: "Excellent" | "Good" | "Fair" | "At Risk";
  demographics?: {
    ageGroups: { label: string; percentage: number }[];
    topLocations: { label: string; percentage: number }[];
  };
  promotedPostAnalysis?: {
    totalPromoted: number;
    estimatedSpend: string;
    avgEngagementPromoted?: number;
    adCopyKeywords?: string[];
  };
  mostLikedPosts?: {
    id: string;
    title: string;
    platform: "instagram" | "youtube" | "tiktok" | "x" | "linkedin";
    likes: string;
    engagement: string;
  }[];
  commentsSentiment?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  followerActivity?: {
    activeDaily: number;
    activeWeekly: number;
    inactive: number;
  };
}

function mapApiCompetitor(c: Record<string, unknown>): Competitor {
  const sentiment = (c.audienceSentiment as string | null)?.toUpperCase();
  const audienceHealth: Competitor["audienceHealth"] =
    sentiment === "POSITIVE"
      ? "Excellent"
      : sentiment === "NEUTRAL"
        ? "Good"
        : "Fair";

  const spend = c.estimatedAdSpendMonthly as number | null;

  return {
    id: c.id as string,
    name: (c.brandName as string) ?? "Unknown",
    instagram: (c.handleInstagram as string) ?? "N/A",
    youtube: (c.handleYoutube as string) ?? "N/A",
    tiktok: (c.handleTiktok as string) ?? "N/A",
    x: (c.handleX as string) ?? "N/A",
    linkedin: (c.handleLinkedin as string) ?? "N/A",
    followers: (c.followersCount as number) ?? 0,
    postFrequency: (c.postingFrequencyWeekly as number) ?? 0,
    engagementRate: (c.avgEngagementRate as number) ?? 0,
    audienceHealth,
    promotedPostAnalysis: {
      totalPromoted: (c.activeAdCampaignsCount as number) ?? 0,
      estimatedSpend: spend != null ? `$${spend.toLocaleString()}` : "\u2014",
    },
  };
}

export default function CompetitorTrackerPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>("");
  const [sortField, setSortField] = useState<keyof Competitor>("followers");
  const [sortAsc, setSortAsc] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/competitors", { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error())))
      .then((data) => {
        if (ctrl.signal.aborted) return;
        const mapped: Competitor[] = (data.competitors || []).map(
          mapApiCompetitor
        );
        setCompetitors(mapped);
        setSelectedCompetitorId(mapped[0]?.id ?? "");
        setError(null);
        setIsLoading(false);
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        setError("Failed to load competitors");
        setIsLoading(false);
      });
    return () => {
      ctrl.abort();
    };
  }, []);

  const refreshCompetitors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/competitors");
      if (res.ok) {
        const data = await res.json();
        const mapped: Competitor[] = (data.competitors || []).map(
          mapApiCompetitor
        );
        setCompetitors(mapped);
        if (mapped.length > 0) {
          setSelectedCompetitorId((prev) =>
            mapped.some((c) => c.id === prev) ? prev : mapped[0].id
          );
        }
        setError(null);
      } else {
        setError("Failed to load competitors");
      }
    } catch {
      setError("Failed to load competitors");
    } finally {
      setIsLoading(false);
    }
  };

  const [newBrandName, setNewBrandName] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [newYoutube, setNewYoutube] = useState("");
  const [newTiktok, setNewTiktok] = useState("");
  const [newX, setNewX] = useState("");
  const [newLinkedin, setNewLinkedin] = useState("");

  const selectedCompetitor = useMemo(() => {
    return (
      competitors.find((c) => c.id === selectedCompetitorId) ??
      competitors[0] ??
      null
    );
  }, [competitors, selectedCompetitorId]);

  const handleSort = (field: keyof Competitor) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredCompetitors = useMemo(() => {
    const list = competitors.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...list].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === "string" && typeof valB === "string") {
        return sortAsc
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }

      return 0;
    });
  }, [competitors, searchTerm, sortField, sortAsc]);

  const avgEngagement = useMemo(() => {
    if (competitors.length === 0) return "\u2014";
    const sum = competitors.reduce((acc, curr) => acc + curr.engagementRate, 0);
    return (sum / competitors.length).toFixed(1);
  }, [competitors]);

  const fastestGrowing = useMemo(() => {
    const withGrowth = competitors.filter((c) => c.growthRate != null);
    if (withGrowth.length === 0) return null;
    return [...withGrowth].sort(
      (a, b) => b.growthRate! - a.growthRate!
    )[0];
  }, [competitors]);

  const avgFrequency = useMemo(() => {
    if (competitors.length === 0) return "\u2014";
    const sum = competitors.reduce((acc, curr) => acc + curr.postFrequency, 0);
    return (sum / competitors.length).toFixed(1);
  }, [competitors]);

  const handleAddCompetitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    const payload = {
      brandName: newBrandName,
      handleInstagram: newInstagram || undefined,
      handleYoutube: newYoutube || undefined,
      handleTiktok: newTiktok || undefined,
      handleX: newX || undefined,
      handleLinkedin: newLinkedin || undefined,
    };

    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`Competitor "${newBrandName}" added successfully!`);
        setNewBrandName("");
        setNewInstagram("");
        setNewYoutube("");
        setNewTiktok("");
        setNewX("");
        setNewLinkedin("");
        setDialogOpen(false);
        await refreshCompetitors();
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to add competitor");
        toast.error("Failed to add competitor.");
      }
    } catch {
      setError("Failed to add competitor");
      toast.error("Failed to save competitor to database.");
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    try {
      const res = await fetch(`/api/competitors/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Competitor removed.");
        setCompetitors((prev) => prev.filter((c) => c.id !== id));
        if (selectedCompetitorId === id) {
          const remaining = competitors.filter((c) => c.id !== id);
          setSelectedCompetitorId(remaining[0]?.id ?? "");
        }
      } else {
        setError("Failed to remove competitor");
        toast.error("Failed to remove competitor from database.");
      }
    } catch {
      setError("Failed to remove competitor");
      toast.error("Failed to remove competitor from database.");
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return <InstagramIcon />;
      case "youtube":
        return <YoutubeIcon />;
      case "linkedin":
        return <LinkedinIcon />;
      case "x":
      case "twitter":
        return <TwitterIcon />;
      default:
        return <Sparkles className="size-4 text-purple-400" />;
    }
  };

  const getHealthBadge = (health: Competitor["audienceHealth"]) => {
    switch (health) {
      case "Excellent":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Excellent</Badge>;
      case "Good":
        return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/25">Good</Badge>;
      case "Fair":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/25">Fair</Badge>;
      case "At Risk":
        return <Badge className="bg-destructive/10 text-destructive border border-destructive/25">At Risk</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 bg-zinc-950 text-zinc-100 min-h-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Competitor Tracker</h1>
          <p className="text-sm text-zinc-400">
            Monitor competitors&apos; growth, publishing cadence, engagement benchmarks, and promoted campaigns.
          </p>
        </div>
        <div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium gap-2">
                  <Plus className="size-4" /> Add Competitor
                </Button>
              }
            />
            <DialogContent className="max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100">
              <form onSubmit={handleAddCompetitorSubmit}>
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-lg font-semibold text-zinc-100">Add Competitor Profile</DialogTitle>
                  <DialogDescription className="text-sm text-zinc-400">
                    Input social handles to add a brand competitor and monitor their engagement metrics.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="brand-name" className="text-zinc-300 text-xs font-medium">Brand Name *</Label>
                    <Input
                      id="brand-name"
                      required
                      placeholder="e.g. Acme Tech"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="instagram" className="text-zinc-300 text-xs font-medium">Instagram Handle</Label>
                      <Input
                        id="instagram"
                        placeholder="@acme"
                        value={newInstagram}
                        onChange={(e) => setNewInstagram(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="youtube" className="text-zinc-300 text-xs font-medium">YouTube Channel</Label>
                      <Input
                        id="youtube"
                        placeholder="AcmeChannel"
                        value={newYoutube}
                        onChange={(e) => setNewYoutube(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="tiktok" className="text-zinc-300 text-xs font-medium">TikTok Handle</Label>
                      <Input
                        id="tiktok"
                        placeholder="@acme_tok"
                        value={newTiktok}
                        onChange={(e) => setNewTiktok(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="x-handle" className="text-zinc-300 text-xs font-medium">X (Twitter) Handle</Label>
                      <Input
                        id="x-handle"
                        placeholder="@acme"
                        value={newX}
                        onChange={(e) => setNewX(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="linkedin" className="text-zinc-300 text-xs font-medium">LinkedIn Company ID</Label>
                    <Input
                      id="linkedin"
                      placeholder="acme-corporation"
                      value={newLinkedin}
                      onChange={(e) => setNewLinkedin(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>

                <DialogFooter className="mt-6 flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDialogOpen(false)}
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Save Competitor
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Average Competitor Engagement</CardTitle>
            <BarChart3 className="size-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{avgEngagement}%</div>
            <p className="text-xs text-zinc-500 mt-1">benchmark industry rate: ~3.5%</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Fastest-Growing Competitor</CardTitle>
            <TrendingUp className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-emerald-400">
              {fastestGrowing ? fastestGrowing.name : "\u2014"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {fastestGrowing
                ? `+${fastestGrowing.growthRate}% follower growth MoM`
                : "No growth data available"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Average Posting Frequency</CardTitle>
            <Users className="size-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{avgFrequency} posts</div>
            <p className="text-xs text-zinc-500 mt-1">per competitor / week average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-heading">Tracked Competitors</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Sort, filter, and compare core performance statistics across channels.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-zinc-500" />
                  <Input
                    placeholder="Search competitors..."
                    className="pl-8 bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900/50 border-b border-zinc-800">
                    <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                      <TableHead
                        onClick={() => handleSort("name")}
                        className="text-zinc-400 font-medium cursor-pointer hover:text-zinc-200"
                      >
                        <div className="flex items-center gap-1">
                          Brand
                          <ArrowUpDown className="size-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-zinc-400 font-medium">Handles / Channels</TableHead>
                      <TableHead
                        onClick={() => handleSort("followers")}
                        className="text-zinc-400 font-medium cursor-pointer hover:text-zinc-200 text-right"
                      >
                        <div className="flex items-center justify-end gap-1">
                          Followers
                          <ArrowUpDown className="size-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort("postFrequency")}
                        className="text-zinc-400 font-medium cursor-pointer hover:text-zinc-200 text-center"
                      >
                        <div className="flex items-center justify-center gap-1">
                          Weekly Posts
                          <ArrowUpDown className="size-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort("engagementRate")}
                        className="text-zinc-400 font-medium cursor-pointer hover:text-zinc-200 text-right"
                      >
                        <div className="flex items-center justify-end gap-1">
                          Engagement
                          <ArrowUpDown className="size-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-zinc-400 font-medium text-center">Health</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompetitors.length > 0 ? (
                      filteredCompetitors.map((comp) => (
                        <TableRow
                          key={comp.id}
                          onClick={() => setSelectedCompetitorId(comp.id)}
                          className={cn(
                            "border-b border-zinc-800/60 cursor-pointer hover:bg-zinc-800/30 transition-colors",
                            selectedCompetitorId === comp.id && "bg-indigo-500/5 hover:bg-indigo-500/10 border-l-2 border-l-indigo-500"
                          )}
                        >
                          <TableCell className="font-semibold text-zinc-200 py-3">{comp.name}</TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              {comp.instagram !== "N/A" && (
                                <span title={`Instagram: ${comp.instagram}`}>
                                  {getPlatformIcon("instagram")}
                                </span>
                              )}
                              {comp.youtube !== "N/A" && (
                                <span title={`YouTube: ${comp.youtube}`}>
                                  {getPlatformIcon("youtube")}
                                </span>
                              )}
                              {comp.linkedin !== "N/A" && (
                                <span title={`LinkedIn: ${comp.linkedin}`}>
                                  {getPlatformIcon("linkedin")}
                                </span>
                              )}
                              {comp.x !== "N/A" && (
                                <span title={`X: ${comp.x}`}>
                                  {getPlatformIcon("x")}
                                </span>
                              )}
                              {comp.tiktok !== "N/A" && (
                                <span title={`TikTok: ${comp.tiktok}`}>
                                  <Sparkles className="size-4 text-teal-400" />
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-zinc-300 py-3">
                            {comp.followers.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center font-medium text-zinc-300 py-3">
                            {comp.postFrequency}
                          </TableCell>
                          <TableCell className="text-right font-bold text-zinc-200 py-3">
                            {comp.engagementRate}%
                          </TableCell>
                          <TableCell className="text-center py-3">
                            {getHealthBadge(comp.audienceHealth)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                          {isLoading ? "Loading competitors..." : "No competitor profiles match your search filters."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {selectedCompetitor && (
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
              <CardHeader className="pb-3 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 uppercase text-[10px] tracking-wider">
                      Competitor Highlight
                    </Badge>
                    <CardTitle className="text-xl font-bold font-heading mt-1">{selectedCompetitor.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {getHealthBadge(selectedCompetitor.audienceHealth)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2"
                      onClick={() => handleDeleteCompetitor(selectedCompetitor.id)}
                    >
                      <Trash2 className="size-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-zinc-400 mt-1">
                  Detailed demographics, sentiment analysis, and campaign intelligence.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                <Tabs defaultValue="demographics" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    <TabsTrigger value="demographics" className="text-xs">
                      Demographics & Spend
                    </TabsTrigger>
                    <TabsTrigger value="engagement" className="text-xs">
                      Content & Sentiment
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="demographics" className="space-y-5 mt-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                        <Users className="size-3.5 text-indigo-400" /> Followers & Activity Status
                      </h4>
                      {selectedCompetitor.followerActivity ? (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
                            <div className="text-sm font-bold text-zinc-200">{selectedCompetitor.followerActivity.activeDaily}%</div>
                            <div className="text-[10px] text-zinc-500">Daily Active</div>
                          </div>
                          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
                            <div className="text-sm font-bold text-zinc-200">{selectedCompetitor.followerActivity.activeWeekly}%</div>
                            <div className="text-[10px] text-zinc-500">Weekly Active</div>
                          </div>
                          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
                            <div className="text-sm font-bold text-zinc-300">{selectedCompetitor.followerActivity.inactive}%</div>
                            <div className="text-[10px] text-zinc-500">Inactive</div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">No activity data available</p>
                      )}
                    </div>

                    <div className="space-y-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                      <h4 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                        <Megaphone className="size-3.5 text-orange-400" /> Promoted Posts Campaign
                      </h4>
                      {selectedCompetitor.promotedPostAnalysis ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[11px] text-zinc-500">Active Ad Campaigns</span>
                              <div className="text-lg font-bold text-zinc-200 flex items-center gap-1.5 mt-0.5">
                                {selectedCompetitor.promotedPostAnalysis.totalPromoted}
                                <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px]">PROMOTED</Badge>
                              </div>
                            </div>
                            <div>
                              <span className="text-[11px] text-zinc-500">Est. Monthly Spend</span>
                              <div className="text-lg font-bold text-zinc-200 mt-0.5">
                                {selectedCompetitor.promotedPostAnalysis.estimatedSpend}
                              </div>
                            </div>
                          </div>
                          {selectedCompetitor.promotedPostAnalysis.adCopyKeywords && selectedCompetitor.promotedPostAnalysis.adCopyKeywords.length > 0 ? (
                            <div className="pt-2 border-t border-zinc-800/80">
                              <span className="text-[11px] text-zinc-500">Top Ad Copy Keywords</span>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {selectedCompetitor.promotedPostAnalysis.adCopyKeywords.map((kw, i) => (
                                  <Badge key={i} variant="outline" className="bg-zinc-900 border-zinc-800 text-[10px] text-zinc-300">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">No campaign data available</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                        Audience Demographics (Age)
                      </h4>
                      {selectedCompetitor.demographics ? (
                        <div className="space-y-2">
                          {selectedCompetitor.demographics.ageGroups.map((age, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-medium">
                                <span className="text-zinc-400">{age.label}</span>
                                <span className="text-zinc-300">{age.percentage}%</span>
                              </div>
                              <Progress value={age.percentage} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">No demographic data available</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="engagement" className="space-y-5 mt-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="size-3.5 text-indigo-400" /> Comments Sentiment Analysis
                      </h4>
                      {selectedCompetitor.commentsSentiment ? (
                        <>
                          <div className="flex items-center gap-1.5 h-6 w-full rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-bold text-zinc-950"
                              style={{ width: `${selectedCompetitor.commentsSentiment.positive}%` }}
                              title={`Positive: ${selectedCompetitor.commentsSentiment.positive}%`}
                            >
                              {selectedCompetitor.commentsSentiment.positive > 20 && `${selectedCompetitor.commentsSentiment.positive}%`}
                            </div>
                            <div
                              className="bg-zinc-500 h-full flex items-center justify-center text-[10px] font-bold text-zinc-950"
                              style={{ width: `${selectedCompetitor.commentsSentiment.neutral}%` }}
                              title={`Neutral: ${selectedCompetitor.commentsSentiment.neutral}%`}
                            >
                              {selectedCompetitor.commentsSentiment.neutral > 20 && `${selectedCompetitor.commentsSentiment.neutral}%`}
                            </div>
                            <div
                              className="bg-destructive h-full flex items-center justify-center text-[10px] font-bold text-zinc-950"
                              style={{ width: `${selectedCompetitor.commentsSentiment.negative}%` }}
                              title={`Negative: ${selectedCompetitor.commentsSentiment.negative}%`}
                            >
                              {selectedCompetitor.commentsSentiment.negative > 20 && `${selectedCompetitor.commentsSentiment.negative}%`}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                            <span className="flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-emerald-500" /> Positive
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-zinc-500" /> Neutral
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-destructive" /> Negative
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">No sentiment data available</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                        <ThumbsUp className="size-3.5 text-indigo-400" /> Most Liked Posts
                      </h4>
                      {selectedCompetitor.mostLikedPosts && selectedCompetitor.mostLikedPosts.length > 0 ? (
                        <div className="space-y-2.5">
                          {selectedCompetitor.mostLikedPosts.map((post) => (
                            <div
                              key={post.id}
                              className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 space-y-2 hover:border-zinc-700 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-medium text-zinc-200 line-clamp-2">{post.title}</span>
                                <span className="shrink-0">{getPlatformIcon(post.platform)}</span>
                              </div>
                              <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                                <span>{post.likes} likes</span>
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="size-3 text-emerald-400" /> ER: {post.engagement}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">No post data available</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
