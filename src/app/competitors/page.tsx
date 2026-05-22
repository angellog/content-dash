"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  TrendingUp,
  BarChart3,
  Search,
  Plus,
  ThumbsUp,
  MessageSquare,
  Megaphone,
  Heart,
  ExternalLink,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
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

// ---------------------------------------------------------------------------
// Social SVG Components (Ensures no missing exports from lucide-react)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Local Custom Progress Bar
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Types & Types Interfaces
// ---------------------------------------------------------------------------
interface Competitor {
  id: string;
  name: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  x: string;
  linkedin: string;
  followers: number;
  postFrequency: number; // posts/week
  engagementRate: number; // in %
  growthRate: number; // in %
  audienceHealth: "Excellent" | "Good" | "Fair" | "At Risk";
  demographics: {
    ageGroups: { label: string; percentage: number }[];
    topLocations: { label: string; percentage: number }[];
  };
  promotedPostAnalysis: {
    totalPromoted: number;
    estimatedSpend: string;
    avgEngagementPromoted: number;
    adCopyKeywords: string[];
  };
  mostLikedPosts: {
    id: string;
    title: string;
    platform: "instagram" | "youtube" | "tiktok" | "x" | "linkedin";
    likes: string;
    engagement: string;
  }[];
  commentsSentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  followerActivity: {
    activeDaily: number; // %
    activeWeekly: number; // %
    inactive: number; // %
  };
}

// ---------------------------------------------------------------------------
// Initial Mock Data
// ---------------------------------------------------------------------------
const initialCompetitors: Competitor[] = [
  {
    id: "1",
    name: "Acme Tech",
    instagram: "@acmetech",
    youtube: "AcmeTechYT",
    tiktok: "@acmetech",
    x: "@acmetech",
    linkedin: "acme-technology",
    followers: 245000,
    postFrequency: 14,
    engagementRate: 4.8,
    growthRate: 12.4,
    audienceHealth: "Excellent",
    demographics: {
      ageGroups: [
        { label: "18-24", percentage: 22 },
        { label: "25-34", percentage: 55 },
        { label: "35-44", percentage: 18 },
        { label: "45+", percentage: 5 },
      ],
      topLocations: [
        { label: "United States", percentage: 48 },
        { label: "United Kingdom", percentage: 15 },
        { label: "Canada", percentage: 12 },
        { label: "Germany", percentage: 8 },
      ],
    },
    promotedPostAnalysis: {
      totalPromoted: 8,
      estimatedSpend: "$2,400",
      avgEngagementPromoted: 5.2,
      adCopyKeywords: ["Launch", "Exclusive", "AI-Powered", "Free Trial"],
    },
    mostLikedPosts: [
      {
        id: "m1",
        title: "Introducing Acme Flow v2.0 - Revolutionize your content workflow today!",
        platform: "linkedin",
        likes: "12.4K",
        engagement: "6.2%",
      },
      {
        id: "m2",
        title: "A day in the life of a SaaS developer working from Bali 🌴💻",
        platform: "instagram",
        likes: "9.8K",
        engagement: "5.5%",
      },
      {
        id: "m3",
        title: "How we scaled to $10M ARR using zero ads (Shorts)",
        platform: "youtube",
        likes: "8.2K",
        engagement: "4.1%",
      },
    ],
    commentsSentiment: {
      positive: 74,
      neutral: 20,
      negative: 6,
    },
    followerActivity: {
      activeDaily: 62,
      activeWeekly: 28,
      inactive: 10,
    },
  },
  {
    id: "2",
    name: "InnovateInc",
    instagram: "@innovate.inc",
    youtube: "InnovateChannel",
    tiktok: "@innovate_inc",
    x: "@innovateinc",
    linkedin: "innovate-inc",
    followers: 189000,
    postFrequency: 8,
    engagementRate: 3.2,
    growthRate: 15.6,
    audienceHealth: "Good",
    demographics: {
      ageGroups: [
        { label: "18-24", percentage: 35 },
        { label: "25-34", percentage: 42 },
        { label: "35-44", percentage: 15 },
        { label: "45+", percentage: 8 },
      ],
      topLocations: [
        { label: "United States", percentage: 38 },
        { label: "India", percentage: 22 },
        { label: "United Kingdom", percentage: 10 },
        { label: "Australia", percentage: 7 },
      ],
    },
    promotedPostAnalysis: {
      totalPromoted: 12,
      estimatedSpend: "$4,500",
      avgEngagementPromoted: 3.8,
      adCopyKeywords: ["Scale", "Webinar", "Register", "Succeed"],
    },
    mostLikedPosts: [
      {
        id: "m4",
        title: "Our CEO's top 5 predictions for the future of digital workplaces",
        platform: "x",
        likes: "15.1K",
        engagement: "4.8%",
      },
      {
        id: "m5",
        title: "Stop making these 3 massive branding mistakes in 2026",
        platform: "tiktok",
        likes: "11.2K",
        engagement: "3.9%",
      },
    ],
    commentsSentiment: {
      positive: 65,
      neutral: 28,
      negative: 7,
    },
    followerActivity: {
      activeDaily: 54,
      activeWeekly: 34,
      inactive: 12,
    },
  },
  {
    id: "3",
    name: "DevFlow",
    instagram: "@devflow_io",
    youtube: "DevFlowHQ",
    tiktok: "@devflow",
    x: "@devflow_io",
    linkedin: "devflow-io",
    followers: 312000,
    postFrequency: 19,
    engagementRate: 5.1,
    growthRate: 8.2,
    audienceHealth: "Excellent",
    demographics: {
      ageGroups: [
        { label: "18-24", percentage: 15 },
        { label: "25-34", percentage: 60 },
        { label: "35-44", percentage: 20 },
        { label: "45+", percentage: 5 },
      ],
      topLocations: [
        { label: "United States", percentage: 52 },
        { label: "Canada", percentage: 14 },
        { label: "United Kingdom", percentage: 11 },
        { label: "Brazil", percentage: 6 },
      ],
    },
    promotedPostAnalysis: {
      totalPromoted: 3,
      estimatedSpend: "$900",
      avgEngagementPromoted: 5.8,
      adCopyKeywords: ["Open Source", "Code", "Developers", "Speed"],
    },
    mostLikedPosts: [
      {
        id: "m6",
        title: "Why we chose to open-source our entire core codebase",
        platform: "linkedin",
        likes: "24.2K",
        engagement: "7.1%",
      },
      {
        id: "m7",
        title: "Designing the ultimate developer office layout 🎧⌨️",
        platform: "instagram",
        likes: "18.5K",
        engagement: "6.0%",
      },
    ],
    commentsSentiment: {
      positive: 82,
      neutral: 14,
      negative: 4,
    },
    followerActivity: {
      activeDaily: 71,
      activeWeekly: 22,
      inactive: 7,
    },
  },
  {
    id: "4",
    name: "PeakGrowth",
    instagram: "@peakgrowth",
    youtube: "PeakGrowthCo",
    tiktok: "@peakgrowth",
    x: "@peakgrowth",
    linkedin: "peakgrowth-co",
    followers: 95000,
    postFrequency: 5,
    engagementRate: 2.1,
    growthRate: 3.5,
    audienceHealth: "At Risk",
    demographics: {
      ageGroups: [
        { label: "18-24", percentage: 10 },
        { label: "25-34", percentage: 48 },
        { label: "35-44", percentage: 30 },
        { label: "45+", percentage: 12 },
      ],
      topLocations: [
        { label: "United States", percentage: 60 },
        { label: "Canada", percentage: 10 },
        { label: "Germany", percentage: 8 },
        { label: "France", percentage: 5 },
      ],
    },
    promotedPostAnalysis: {
      totalPromoted: 18,
      estimatedSpend: "$8,200",
      avgEngagementPromoted: 1.8,
      adCopyKeywords: ["Consulting", "Enterprise", "ROI", "Audit"],
    },
    mostLikedPosts: [
      {
        id: "m8",
        title: "How to reduce churn by 40% with this simple onboarding flow",
        platform: "linkedin",
        likes: "3.1K",
        engagement: "2.4%",
      },
    ],
    commentsSentiment: {
      positive: 41,
      neutral: 45,
      negative: 14,
    },
    followerActivity: {
      activeDaily: 28,
      activeWeekly: 42,
      inactive: 30,
    },
  },
];

export default function CompetitorTrackerPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>(initialCompetitors);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>("1");
  const [sortField, setSortField] = useState<keyof Competitor>("followers");
  const [sortAsc, setSortAsc] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form State for Add Competitor
  const [newBrandName, setNewBrandName] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [newYoutube, setNewYoutube] = useState("");
  const [newTiktok, setNewTiktok] = useState("");
  const [newX, setNewX] = useState("");
  const [newLinkedin, setNewLinkedin] = useState("");

  // Select the active competitor
  const selectedCompetitor = useMemo(() => {
    return (
      competitors.find((c) => c.id === selectedCompetitorId) || competitors[0]
    );
  }, [competitors, selectedCompetitorId]);

  // Handle Sort
  const handleSort = (field: keyof Competitor) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Filter and Sort Competitors
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

  // Aggregate Metrics
  const avgEngagement = useMemo(() => {
    const sum = competitors.reduce((acc, curr) => acc + curr.engagementRate, 0);
    return (sum / competitors.length).toFixed(1);
  }, [competitors]);

  const fastestGrowing = useMemo(() => {
    return [...competitors].sort((a, b) => b.growthRate - a.growthRate)[0];
  }, [competitors]);

  const avgFrequency = useMemo(() => {
    const sum = competitors.reduce((acc, curr) => acc + curr.postFrequency, 0);
    return (sum / competitors.length).toFixed(1);
  }, [competitors]);

  // Handle Add Competitor Submit
  const handleAddCompetitorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    const newComp: Competitor = {
      id: String(Date.now()),
      name: newBrandName,
      instagram: newInstagram ? (newInstagram.startsWith("@") ? newInstagram : `@${newInstagram}`) : "N/A",
      youtube: newYoutube || "N/A",
      tiktok: newTiktok ? (newTiktok.startsWith("@") ? newTiktok : `@${newTiktok}`) : "N/A",
      x: newX ? (newX.startsWith("@") ? newX : `@${newX}`) : "N/A",
      linkedin: newLinkedin || "N/A",
      followers: Math.round(50000 + Math.random() * 250000),
      postFrequency: Math.round(4 + Math.random() * 16),
      engagementRate: +(2.0 + Math.random() * 4.0).toFixed(1),
      growthRate: +(3.0 + Math.random() * 15.0).toFixed(1),
      audienceHealth: Math.random() > 0.6 ? "Excellent" : Math.random() > 0.3 ? "Good" : "Fair",
      demographics: {
        ageGroups: [
          { label: "18-24", percentage: 25 },
          { label: "25-34", percentage: 50 },
          { label: "35-44", percentage: 20 },
          { label: "45+", percentage: 5 },
        ],
        topLocations: [
          { label: "United States", percentage: 45 },
          { label: "United Kingdom", percentage: 15 },
          { label: "Canada", percentage: 10 },
          { label: "Germany", percentage: 7 },
        ],
      },
      promotedPostAnalysis: {
        totalPromoted: Math.round(Math.random() * 10),
        estimatedSpend: `$${(Math.round(10 + Math.random() * 40) * 100).toLocaleString()}`,
        avgEngagementPromoted: +(2.0 + Math.random() * 3.5).toFixed(1),
        adCopyKeywords: ["Growth", "Best Tool", "Special Offer", "Get Started"],
      },
      mostLikedPosts: [
        {
          id: `m-new-1`,
          title: `How ${newBrandName} is transforming visual marketing in 2026`,
          platform: "linkedin",
          likes: "4.5K",
          engagement: "4.2%",
        },
      ],
      commentsSentiment: {
        positive: Math.round(55 + Math.random() * 25),
        neutral: Math.round(15 + Math.random() * 15),
        negative: Math.round(2 + Math.random() * 10),
      },
      followerActivity: {
        activeDaily: Math.round(40 + Math.random() * 30),
        activeWeekly: Math.round(20 + Math.random() * 20),
        inactive: Math.round(5 + Math.random() * 15),
      },
    };

    setCompetitors((prev) => [...prev, newComp]);
    setSelectedCompetitorId(newComp.id);

    // Reset fields
    setNewBrandName("");
    setNewInstagram("");
    setNewYoutube("");
    setNewTiktok("");
    setNewX("");
    setNewLinkedin("");
    setDialogOpen(false);
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
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Competitor Tracker</h1>
          <p className="text-sm text-zinc-400">
            Monitor competitors' growth, publishing cadence, engagement benchmarks, and promoted campaigns.
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

      {/* Key Competitor Metric Cards */}
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
              {fastestGrowing ? fastestGrowing.name : "N/A"}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              +{fastestGrowing ? fastestGrowing.growthRate : 0}% follower growth MoM
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

      {/* Main Grid: Left side Table, Right side Detail analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Competitor Table */}
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
                          No competitor profiles match your search filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Audience Demographics & Promoted Post Analysis */}
        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader className="pb-3 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 uppercase text-[10px] tracking-wider">
                    Competitor Highlight
                  </Badge>
                  <CardTitle className="text-xl font-bold font-heading mt-1">{selectedCompetitor.name}</CardTitle>
                </div>
                {getHealthBadge(selectedCompetitor.audienceHealth)}
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

                {/* TAB 1: Demographics & Spend */}
                <TabsContent value="demographics" className="space-y-5 mt-4">
                  {/* Followers & Activity */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <Users className="size-3.5 text-indigo-400" /> Followers & Activity Status
                    </h4>
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
                  </div>

                  {/* Promoted Posts & Estimated Spend */}
                  <div className="space-y-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                    <h4 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <Megaphone className="size-3.5 text-orange-400" /> Promoted Posts Campaign
                    </h4>
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
                  </div>

                  {/* Demographics Age Groups */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                      Audience Demographics (Age)
                    </h4>
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
                  </div>
                </TabsContent>

                {/* TAB 2: Content & Sentiment */}
                <TabsContent value="engagement" className="space-y-5 mt-4">
                  {/* Comments Sentiment Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="size-3.5 text-indigo-400" /> Comments Sentiment Analysis
                    </h4>
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
                  </div>

                  {/* Most Liked Posts */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <ThumbsUp className="size-3.5 text-indigo-400" /> Most Liked Posts
                    </h4>
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
                            <span className="flex items-center gap-1">
                              <Heart className="size-3 text-red-500" /> {post.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="size-3 text-emerald-400" /> ER: {post.engagement}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
