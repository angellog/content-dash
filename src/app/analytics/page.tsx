"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, TrendingDown, Eye, BarChart3, Heart, Wifi, WifiOff, Award } from "lucide-react";

import { cn } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PLATFORM_CONFIG, type Platform, type AnalyticsOverview, type PostAnalytics } from "@/lib/omnisocial";

const platformColors: Record<string, string> = {
  Instagram: "bg-pink-600",
  TikTok: "bg-cyan-400 text-zinc-900",
  LinkedIn: "bg-blue-600",
  Facebook: "bg-blue-500",
  X: "bg-zinc-500",
  Threads: "bg-white text-zinc-900",
};

function platformFill(name: string): string {
  const map: Record<string, string> = {
    Instagram: "#E1306C",
    TikTok: "#00F2EA",
    LinkedIn: "#0A66C2",
    Facebook: "#1877F2",
    X: "#A1A1AA",
    Threads: "#FFFFFF",
  };
  return map[name] ?? "#71717a";
}

function displayName(p: string): string {
  return PLATFORM_CONFIG[p as Platform]?.name ?? p;
}

interface PlatformRow {
  platform: string;
  engagement: number;
  fill: string;
}

interface TopPostRow {
  rank: number;
  preview: string;
  platform: string;
  impressions: number;
  likes: number;
  comments: number;
  engagementRate: number;
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  valueSuffix,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
  valueFormatter?: (v: number) => string;
  valueSuffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString());
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-zinc-300">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {fmt(entry.value)}
          {valueSuffix ?? ""}
        </p>
      ))}
    </div>
  );
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function thirtyDaysAgoISO() {
  return new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0];
}

// A raw post as returned by GET /api/omnisocial/posts (see src/lib/api/social.ts
// mapApiPostToPost for the same field assumptions used elsewhere in the app).
interface RawPost {
  id: string;
  text?: string;
  platform?: string;
  platforms?: Record<string, string>;
}

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState(thirtyDaysAgoISO);
  const [endDate, setEndDate] = useState(todayISO);
  const [isLive, setIsLive] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [platformData, setPlatformData] = useState<PlatformRow[]>([]);
  const [topPosts, setTopPosts] = useState<TopPostRow[]>([]);

  useEffect(() => {
    async function fetchAnalytics() {
      setIsFetching(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/omnisocial/analytics?start_date=${startDate}&end_date=${endDate}`,
        );
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }
        const raw = await res.json();
        const data: AnalyticsOverview = raw.data ?? raw;
        setOverview(data);

        const breakdown = data.platform_breakdown ?? {};
        const pRows: PlatformRow[] = Object.entries(breakdown).map(([platform, stats]) => {
          const name = displayName(platform);
          const engagement = stats.engagement_rate ?? stats.engagement ?? 0;
          return { platform: name, engagement: +engagement.toFixed(1), fill: platformFill(name) };
        });
        pRows.sort((a, b) => b.engagement - a.engagement);
        setPlatformData(pRows);

        setIsLive(true);

        // Top posts aren't part of the overview endpoint — compose them from
        // the most recent published posts plus their per-post analytics.
        if (data.total_posts > 0) {
          const postsRes = await fetch("/api/omnisocial/posts?status=published&limit=10");
          if (postsRes.ok) {
            const postsRaw = await postsRes.json();
            const posts: RawPost[] = postsRaw.posts ?? postsRaw.data ?? [];

            if (posts.length > 0) {
              const ids = posts.map((p) => p.id).join(",");
              const analyticsRes = await fetch(
                `/api/omnisocial/analytics/posts?ids=${encodeURIComponent(ids)}`,
              );
              const perPost: PostAnalytics[] = analyticsRes.ok
                ? (await analyticsRes.json()).data ?? []
                : [];
              const metricsById = new Map(perPost.map((m) => [m.id, m]));

              const rows: TopPostRow[] = posts
                .map((post) => {
                  const metrics = metricsById.get(post.id);
                  const platform =
                    post.platform ?? Object.keys(post.platforms ?? {})[0] ?? "instagram";
                  return {
                    preview: (post.text ?? "").slice(0, 60) || `Post ${post.id.slice(0, 8)}`,
                    platform: displayName(platform),
                    impressions: metrics?.impressions ?? metrics?.views ?? 0,
                    likes: metrics?.likes ?? 0,
                    comments: metrics?.comments ?? 0,
                    engagementRate: metrics?.engagement_rate ?? 0,
                  };
                })
                .sort((a, b) => b.impressions - a.impressions)
                .slice(0, 5)
                .map((row, i) => ({ ...row, rank: i + 1 }));
              setTopPosts(rows);
            } else {
              setTopPosts([]);
            }
          } else {
            setTopPosts([]);
          }
        } else {
          setTopPosts([]);
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLive(false);
        setOverview(null);
        setPlatformData([]);
        setTopPosts([]);
      } finally {
        setIsFetching(false);
      }
    }
    fetchAnalytics();
  }, [startDate, endDate]);

  const stats = useMemo(() => {
    const totalImpressions = overview?.total_impressions ?? 0;
    const totalEngagement = overview?.total_engagement ?? 0;
    const avgEngagementRate = overview?.average_engagement_rate ?? 0;
    const totalPosts = overview?.total_posts ?? 0;

    return [
      {
        title: "Total Impressions",
        value: totalImpressions > 0 ? totalImpressions.toLocaleString() : "—",
        change: isLive ? "this period" : "—",
        positive: totalImpressions > 0,
        icon: Eye,
      },
      {
        title: "Total Engagement",
        value: totalEngagement > 0 ? totalEngagement.toLocaleString() : "—",
        change: isLive ? "this period" : "—",
        positive: totalEngagement > 0,
        icon: Heart,
      },
      {
        title: "Avg Engagement Rate",
        value: avgEngagementRate > 0 ? `${avgEngagementRate.toFixed(1)}%` : "—",
        change: isLive ? "this period" : "—",
        positive: avgEngagementRate > 0,
        icon: TrendingUp,
      },
      {
        title: "Total Posts",
        value: totalPosts > 0 ? String(totalPosts) : "—",
        change: isLive ? "this period" : "—",
        positive: totalPosts > 0,
        icon: BarChart3,
      },
    ];
  }, [overview, isLive]);

  if (isFetching) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Analytics
          </h1>
          {overview?.top_performing_platform && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
              <Award className="size-3.5 text-amber-400" />
              Top platform: {displayName(overview.top_performing_platform)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-36 border-zinc-700 bg-zinc-900 text-zinc-300 [color-scheme:dark]"
          />
          <span className="text-zinc-500">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36 border-zinc-700 bg-zinc-900 text-zinc-300 [color-scheme:dark]"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          <WifiOff className="size-4" />
          <span>Failed to load analytics: {error}</span>
        </div>
      )}

      {!isLive && !isFetching && !error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-400">
          <Wifi className="size-4" />
          <span>No analytics data available for this period.</span>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    {stat.title}
                  </CardTitle>
                  <Icon className="size-4 text-zinc-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {stat.positive ? (
                    <TrendingUp className="size-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="size-3 text-red-500" />
                  )}
                  <span className={cn(stat.positive ? "text-emerald-500" : "text-red-500")}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mb-8">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">
              Platform Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {platformData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#3f3f46"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={{ stroke: "#3f3f46" }}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="platform"
                      tick={{ fill: "#71717a", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip valueFormatter={(v) => v.toFixed(1)} valueSuffix="%" />
                      }
                    />
                    <Bar dataKey="engagement" name="Engagement %" radius={[0, 4, 4, 0]} barSize={20}>
                      {platformData.map((entry) => (
                        <rect key={entry.platform} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  No data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">
            Top Performing Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPosts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableHead className="text-zinc-400">Rank</TableHead>
                  <TableHead className="text-zinc-400">Post</TableHead>
                  <TableHead className="text-zinc-400">Platform</TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Impressions
                  </TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Likes
                  </TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Comments
                  </TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Engagement
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPosts.map((post) => (
                  <TableRow
                    key={post.rank}
                    className="border-zinc-800 hover:bg-zinc-800/50"
                  >
                    <TableCell className="font-medium text-zinc-300">
                      #{post.rank}
                    </TableCell>
                    <TableCell
                      className="max-w-[260px] truncate text-zinc-300"
                      title={post.preview}
                    >
                      {post.preview}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-xs",
                          platformColors[post.platform] ?? "bg-zinc-700",
                        )}
                      >
                        {post.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {post.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {post.likes.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {post.comments.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-500">
                      {post.engagementRate}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
              No data
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/*
 * ARCHIVED — pre-rebuild implementation, kept for reference.
 *
 * This version assumed GET /v1/analytics returned a daily time series
 * (impressions/engagement_rate arrays, a followers object, and a top_posts
 * array). The real OmniSocial API has no such endpoint or shape — see
 * GET /v1/analytics/overview (aggregate summary) and
 * GET /v1/analytics/posts?ids=... (per-post metrics) used in the active
 * component above. Left here in case the assumed shape becomes real later
 * (e.g. if OmniSocial adds a time-series endpoint) or for reference when
 * reconciling behavior differences.
 *
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Users, Eye, BarChart3, Heart, Wifi, WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PLATFORM_CONFIG, type Platform, type AnalyticsData } from "@/lib/omnisocial";

const platformColors: Record<string, string> = {
  Instagram: "bg-pink-600",
  TikTok: "bg-cyan-400 text-zinc-900",
  LinkedIn: "bg-blue-600",
  Facebook: "bg-blue-500",
  X: "bg-zinc-500",
  Threads: "bg-white text-zinc-900",
};

function platformFill(name: string): string {
  const map: Record<string, string> = {
    Instagram: "#E1306C",
    TikTok: "#00F2EA",
    LinkedIn: "#0A66C2",
    Facebook: "#1877F2",
    X: "#A1A1AA",
    Threads: "#FFFFFF",
  };
  return map[name] ?? "#71717a";
}

function displayName(p: string): string {
  return PLATFORM_CONFIG[p as Platform]?.name ?? p;
}

interface DailyRow {
  date: string;
  impressions: number;
  engagementRate: number;
  followers: number;
}

interface PlatformRow {
  platform: string;
  engagement: number;
  fill: string;
}

interface TopPostRow {
  rank: number;
  preview: string;
  platform: string;
  impressions: number;
  likes: number;
  comments: number;
  engagementRate: number;
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  valueSuffix,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
  valueFormatter?: (v: number) => string;
  valueSuffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString());
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-zinc-300">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {fmt(entry.value)}
          {valueSuffix ?? ""}
        </p>
      ))}
    </div>
  );
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function thirtyDaysAgoISO() {
  return new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0];
}

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState(thirtyDaysAgoISO);
  const [endDate, setEndDate] = useState(todayISO);
  const [isLive, setIsLive] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<DailyRow[]>([]);
  const [platformData, setPlatformData] = useState<PlatformRow[]>([]);
  const [topPosts, setTopPosts] = useState<TopPostRow[]>([]);
  const [followerGrowth, setFollowerGrowth] = useState<number | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setIsFetching(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/omnisocial/analytics?start_date=${startDate}&end_date=${endDate}`,
        );
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }
        const raw = await res.json();
        const data: AnalyticsData = raw.data ?? raw;

        const engagementMap = new Map<string, number>();
        if (Array.isArray(data.engagement_rate)) {
          for (const e of data.engagement_rate) {
            engagementMap.set(e.date, e.value);
          }
        }

        if (Array.isArray(data.impressions) && data.impressions.length > 0) {
          setDailyData(
            data.impressions.map((imp) => {
              const d = new Date(imp.date + "T00:00:00");
              return {
                date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                impressions: imp.value,
                engagementRate: engagementMap.get(imp.date) ?? 0,
                followers: 0,
              };
            }),
          );
        } else {
          setDailyData([]);
        }

        if (Array.isArray(data.top_posts) && data.top_posts.length > 0) {
          const byPlatform = new Map<string, number[]>();
          for (const post of data.top_posts) {
            const name = displayName(post.platform);
            if (!byPlatform.has(name)) byPlatform.set(name, []);
            byPlatform.get(name)!.push(post.engagement_rate);
          }
          const pRows: PlatformRow[] = [];
          for (const [name, rates] of byPlatform) {
            const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
            pRows.push({ platform: name, engagement: +avg.toFixed(1), fill: platformFill(name) });
          }
          pRows.sort((a, b) => b.engagement - a.engagement);
          setPlatformData(pRows);

          const postRows: TopPostRow[] = [...data.top_posts]
            .sort((a, b) => b.impressions - a.impressions)
            .map((post, i) => ({
              rank: i + 1,
              preview: `Post ${post.id.substring(0, 8)}`,
              platform: displayName(post.platform),
              impressions: post.impressions,
              likes: post.likes,
              comments: post.comments,
              engagementRate: post.engagement_rate,
            }));
          setTopPosts(postRows);
        } else {
          setPlatformData([]);
          setTopPosts([]);
        }

        if (data.followers && typeof data.followers === "object") {
          const growth = Object.values(data.followers).reduce(
            (s, f) => s + (f.change ?? 0),
            0,
          );
          setFollowerGrowth(growth);
        } else {
          setFollowerGrowth(null);
        }

        const hasData =
          (Array.isArray(data.impressions) && data.impressions.length > 0) ||
          (Array.isArray(data.engagement_rate) && data.engagement_rate.length > 0) ||
          (Array.isArray(data.top_posts) && data.top_posts.length > 0) ||
          (data.followers && Object.keys(data.followers).length > 0);
        setIsLive(hasData);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLive(false);
      } finally {
        setIsFetching(false);
      }
    }
    fetchAnalytics();
  }, [startDate, endDate]);

  const stats = useMemo(() => {
    const totalImpressions = dailyData.reduce((s, d) => s + d.impressions, 0);
    const avgEngagement =
      dailyData.length > 0
        ? dailyData.reduce((s, d) => s + d.engagementRate, 0) / dailyData.length
        : 0;

    return [
      {
        title: "Total Impressions",
        value: totalImpressions > 0 ? totalImpressions.toLocaleString() : "—",
        change: isLive ? "this period" : "—",
        changeLabel: "",
        positive: totalImpressions > 0,
        icon: Eye,
      },
      {
        title: "Engagement Rate",
        value: avgEngagement > 0 ? `${avgEngagement.toFixed(1)}%` : "—",
        change: isLive ? "avg" : "—",
        changeLabel: "",
        positive: avgEngagement > 0,
        icon: Heart,
      },
      {
        title: "Follower Growth",
        value:
          followerGrowth !== null
            ? `${followerGrowth > 0 ? "+" : ""}${followerGrowth.toLocaleString()}`
            : "—",
        change: "this period",
        changeLabel: "",
        positive: (followerGrowth ?? 0) > 0,
        icon: Users,
      },
      {
        title: "Top Posts",
        value: topPosts.length > 0 ? String(topPosts.length) : "—",
        change: "returned",
        changeLabel: "",
        positive: topPosts.length > 0,
        icon: BarChart3,
      },
    ];
  }, [dailyData, followerGrowth, topPosts, isLive]);

  if (isFetching) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Analytics
        </h1>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-36 border-zinc-700 bg-zinc-900 text-zinc-300 [color-scheme:dark]"
          />
          <span className="text-zinc-500">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36 border-zinc-700 bg-zinc-900 text-zinc-300 [color-scheme:dark]"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          <WifiOff className="size-4" />
          <span>Failed to load analytics: {error}</span>
        </div>
      )}

      {!isLive && !isFetching && !error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-400">
          <Wifi className="size-4" />
          <span>No analytics data available for this period.</span>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    {stat.title}
                  </CardTitle>
                  <Icon className="size-4 text-zinc-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {stat.positive ? (
                    <TrendingUp className="size-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="size-3 text-red-500" />
                  )}
                  <span className={cn(stat.positive ? "text-emerald-500" : "text-red-500")}>
                    {stat.change}
                  </span>
                  {stat.changeLabel && (
                    <span className="text-zinc-500">{stat.changeLabel}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">
              Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={{ stroke: "#3f3f46" }}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                      }
                    />
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => v.toLocaleString()} />} />
                    <Legend wrapperStyle={{ color: "#71717a", fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="impressions"
                      name="Impressions"
                      stroke="#818cf8"
                      strokeWidth={2}
                      fill="url(#impressionsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  No data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={{ stroke: "#3f3f46" }}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={["dataMin - 0.5", "dataMax + 0.5"]}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip valueFormatter={(v) => v.toFixed(2)} valueSuffix="%" />
                      }
                    />
                    <Legend wrapperStyle={{ color: "#71717a", fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="engagementRate"
                      name="Engagement Rate"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#22c55e" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  No data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">
              Platform Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {platformData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#3f3f46"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={{ stroke: "#3f3f46" }}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="platform"
                      tick={{ fill: "#71717a", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip valueFormatter={(v) => v.toFixed(1)} valueSuffix="%" />
                      }
                    />
                    <Bar dataKey="engagement" name="Engagement %" radius={[0, 4, 4, 0]} barSize={20}>
                      {platformData.map((entry) => (
                        <rect key={entry.platform} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  No data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">
              Follower Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                No data
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">
            Top Performing Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPosts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableHead className="text-zinc-400">Rank</TableHead>
                  <TableHead className="text-zinc-400">Post</TableHead>
                  <TableHead className="text-zinc-400">Platform</TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Impressions
                  </TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Likes
                  </TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Comments
                  </TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Engagement
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPosts.map((post) => (
                  <TableRow
                    key={post.rank}
                    className="border-zinc-800 hover:bg-zinc-800/50"
                  >
                    <TableCell className="font-medium text-zinc-300">
                      #{post.rank}
                    </TableCell>
                    <TableCell
                      className="max-w-[260px] truncate text-zinc-300"
                      title={post.preview}
                    >
                      {post.preview}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-xs",
                          platformColors[post.platform] ?? "bg-zinc-700",
                        )}
                      >
                        {post.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {post.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {post.likes.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {post.comments.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-500">
                      {post.engagementRate}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
              No data
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
 */
