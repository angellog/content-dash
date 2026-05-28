"use client";

import { useState, useEffect } from "react";
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

// ---------------------------------------------------------------------------
// Mock data generators
// ---------------------------------------------------------------------------

function generateDailyData(days: number) {
  const data: {
    date: string;
    impressions: number;
    engagementRate: number;
    followers: number;
  }[] = [];

  const baseImpressions = 6500;
  const baseEngagement = 4.2;
  const baseFollowers = 48200;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const dayOfWeek = d.getDay();
    const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.15 : 1;
    const trendMultiplier = 1 + ((days - i) / days) * 0.25;
    const noise = 0.85 + Math.random() * 0.35;

    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      impressions: Math.round(
        baseImpressions * weekendBoost * trendMultiplier * noise
      ),
      engagementRate: +(
        baseEngagement * (1 + ((days - i) / days) * 0.15) +
        (Math.random() - 0.4) * 0.8
      ).toFixed(2),
      followers: Math.round(
        baseFollowers + ((days - i) / days) * 1247 + Math.random() * 60
      ),
    });
  }

  return data;
}

const dailyData = generateDailyData(30);

const platformData = [
  { platform: "Instagram", engagement: 6.2, fill: "#E1306C" },
  { platform: "TikTok", engagement: 5.8, fill: "#00F2EA" },
  { platform: "LinkedIn", engagement: 3.9, fill: "#0A66C2" },
  { platform: "Facebook", engagement: 3.1, fill: "#1877F2" },
  { platform: "X", engagement: 2.4, fill: "#A1A1AA" },
  { platform: "Threads", engagement: 1.7, fill: "#FFFFFF" },
];

const platformColors: Record<string, string> = {
  Instagram: "bg-pink-600",
  TikTok: "bg-cyan-400 text-zinc-900",
  LinkedIn: "bg-blue-600",
  Facebook: "bg-blue-500",
  X: "bg-zinc-500",
  Threads: "bg-white text-zinc-900",
};

const topPosts = [
  {
    rank: 1,
    preview: "Behind the scenes of our latest product launch event...",
    platform: "Instagram",
    impressions: 42_310,
    likes: 3_842,
    comments: 287,
    engagementRate: 9.8,
  },
  {
    rank: 2,
    preview: "5 productivity tips that actually work in 2026 (thread)",
    platform: "X",
    impressions: 38_920,
    likes: 2_115,
    comments: 194,
    engagementRate: 5.9,
  },
  {
    rank: 3,
    preview: "Announcing our Series B funding — here's what it means",
    platform: "LinkedIn",
    impressions: 35_640,
    likes: 4_201,
    comments: 312,
    engagementRate: 12.7,
  },
  {
    rank: 4,
    preview: "Day in the life at our new HQ office tour",
    platform: "TikTok",
    impressions: 31_780,
    likes: 5_680,
    comments: 423,
    engagementRate: 19.2,
  },
  {
    rank: 5,
    preview: "Customer spotlight: How @acmecorp grew 300% with us",
    platform: "Facebook",
    impressions: 28_450,
    likes: 1_230,
    comments: 89,
    engagementRate: 4.6,
  },
  {
    rank: 6,
    preview: "The remote work debate is missing this one key point...",
    platform: "Threads",
    impressions: 24_190,
    likes: 1_870,
    comments: 156,
    engagementRate: 8.4,
  },
  {
    rank: 7,
    preview: "New feature drop: real-time collaboration is here",
    platform: "Instagram",
    impressions: 21_600,
    likes: 2_340,
    comments: 201,
    engagementRate: 11.8,
  },
  {
    rank: 8,
    preview: "Our CEO's keynote at TechSummit 2026 full recap",
    platform: "LinkedIn",
    impressions: 18_940,
    likes: 1_980,
    comments: 147,
    engagementRate: 11.2,
  },
];

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/omnisocial/analytics?start_date=${startDate}&end_date=${endDate}`);
        if (res.ok) {
          const data = await res.json();
          if (data.impressions || data.engagement_rate || data.followers) {
            setIsLive(true);
          }
        }
      } catch {}
    }
    fetchAnalytics();
  }, [startDate, endDate]);

  const stats = [
    {
      title: "Total Impressions",
      value: "245,832",
      change: "+12.5%",
      changeLabel: "vs last period",
      positive: true,
      icon: Eye,
    },
    {
      title: "Engagement Rate",
      value: "4.8%",
      change: "+0.3%",
      changeLabel: "vs last period",
      positive: true,
      icon: Heart,
    },
    {
      title: "Follower Growth",
      value: "+1,247",
      change: "this month",
      changeLabel: "",
      positive: true,
      icon: Users,
    },
    {
      title: "Total Posts",
      value: "48",
      change: "this month",
      changeLabel: "",
      positive: true,
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
      {/* ----------------------------------------------------------------- */}
      {/* Page Header                                                       */}
      {/* ----------------------------------------------------------------- */}
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

      {/* ----------------------------------------------------------------- */}
      {/* Stats Row                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-zinc-800 bg-zinc-900"
            >
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
                  <span
                    className={cn(
                      stat.positive ? "text-emerald-500" : "text-red-500"
                    )}
                  >
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

      {/* ----------------------------------------------------------------- */}
      {/* Charts Row 1: Impressions + Engagement Rate                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Impressions Area Chart */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">
              Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient
                      id="impressionsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop
                        offset="100%"
                        stopColor="#3b82f6"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#3f3f46"
                    vertical={false}
                  />
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
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueFormatter={(v) => v.toLocaleString()}
                      />
                    }
                  />
                  <Legend
                    wrapperStyle={{ color: "#71717a", fontSize: 12 }}
                  />
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
            </div>
          </CardContent>
        </Card>

        {/* Engagement Rate Line Chart */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#3f3f46"
                    vertical={false}
                  />
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
                      <ChartTooltip
                        valueFormatter={(v) => v.toFixed(2)}
                        valueSuffix="%"
                      />
                    }
                  />
                  <Legend
                    wrapperStyle={{ color: "#71717a", fontSize: 12 }}
                  />
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Charts Row 2: Platform Breakdown + Follower Growth                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Platform Breakdown Bar Chart */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">
              Platform Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={platformData}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
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
                      <ChartTooltip
                        valueFormatter={(v) => v.toFixed(1)}
                        valueSuffix="%"
                      />
                    }
                  />
                  <Bar
                    dataKey="engagement"
                    name="Engagement %"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  >
                    {platformData.map((entry) => (
                      <rect key={entry.platform} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Follower Growth Area Chart */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">
              Follower Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient
                      id="followersGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                      <stop
                        offset="100%"
                        stopColor="#7c3aed"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#3f3f46"
                    vertical={false}
                  />
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
                    domain={["dataMin - 100", "dataMax + 100"]}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                    }
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueFormatter={(v) => v.toLocaleString()}
                      />
                    }
                  />
                  <Legend
                    wrapperStyle={{ color: "#71717a", fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="followers"
                    name="Followers"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    fill="url(#followersGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Top Performing Posts Table                                         */}
      {/* ----------------------------------------------------------------- */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">
            Top Performing Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-400">Rank</TableHead>
                <TableHead className="text-zinc-400">Post Preview</TableHead>
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
                        platformColors[post.platform] ?? "bg-zinc-700"
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
        </CardContent>
      </Card>
    </div>
  );
}
