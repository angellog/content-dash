"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  BarChart3,
  PenLine,
  TrendingUp,
  Users,
  Layers,
  Wifi,
  WifiOff,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSocialMediaStore } from "@/hooks/useSocialMediaStore";
import Link from "next/link";

interface OmniStatus {
  connected: boolean;
  status: string;
  connectionType?: string | null;
  lastSyncedAt?: string | null;
}

interface DashboardStats {
  totalPosts: number;
  engagementRate: number;
  followerGrowth: number;
  connectedPlatforms: number;
}

export default function Home() {
  const [omniStatus, setOmniStatus] = useState<OmniStatus>({
    connected: false,
    status: "NOT_CONFIGURED",
  });
  const [dashStats, setDashStats] = useState<DashboardStats>({
    totalPosts: 0,
    engagementRate: 0,
    followerGrowth: 0,
    connectedPlatforms: 0,
  });
  const [recentActivity, setRecentActivity] = useState<
    { id: string; action: string; detail: string; time: string }[]
  >([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { fetchPosts, posts, syncState } = useSocialMediaStore();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email ?? null);

      const configRes = await fetch("/api/omnisocial/config");
      if (configRes.ok) {
        const data = await configRes.json();
        setOmniStatus(data);
      }

      await fetchPosts();

      const allPosts = Object.values(useSocialMediaStore.getState().posts).flat();
      const published = allPosts.filter((p) => p.status === "published");
      const totalLikes = published.reduce((s, p) => s + (p.likes ?? 0), 0);
      const totalComments = published.reduce((s, p) => s + (p.comments ?? 0), 0);
      const engagementRate =
        published.length > 0
          ? Math.round(((totalLikes + totalComments) / published.length / 100) * 10) / 10
          : 0;

      setDashStats({
        totalPosts: allPosts.length,
        engagementRate,
        followerGrowth: 1247,
        connectedPlatforms: 4,
      });

      const recent = published.slice(0, 5).map((p) => ({
        id: p.id,
        action: "Post published",
        detail: `"${p.caption.slice(0, 50)}${p.caption.length > 50 ? "..." : ""}" on ${p.platform}`,
        time: p.scheduledDate
          ? new Date(p.scheduledDate).toLocaleDateString()
          : "Recently",
      }));
      setRecentActivity(recent);
    }
    load();
  }, []);

  const stats = [
    {
      title: "Total Posts",
      value: String(dashStats.totalPosts),
      description: "Across all platforms",
      icon: CalendarDays,
      trend: "+12%",
    },
    {
      title: "Engagement Rate",
      value: `${dashStats.engagementRate}%`,
      description: "Across all platforms",
      icon: TrendingUp,
      trend: dashStats.engagementRate > 4 ? "+0.6%" : null,
    },
    {
      title: "Follower Growth",
      value: `+${dashStats.followerGrowth.toLocaleString()}`,
      description: "Last 30 days",
      icon: Users,
      trend: "+8.3%",
    },
    {
      title: "Connected Platforms",
      value: String(dashStats.connectedPlatforms),
      description: "Active integrations",
      icon: Layers,
      trend: null,
    },
  ];

  const quickActions = [
    {
      label: "Create Post",
      href: "/social-manager",
      icon: PenLine,
      color: "bg-violet-600/20 text-violet-400",
    },
    {
      label: "View Calendar",
      href: "/calendar",
      icon: CalendarDays,
      color: "bg-blue-600/20 text-blue-400",
    },
    {
      label: "Check Analytics",
      href: "/analytics",
      icon: BarChart3,
      color: "bg-emerald-600/20 text-emerald-400",
    },
  ];

  return (
    <>
      <Header title="Dashboard" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <section className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/30 p-6 lg:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Welcome back{userEmail ? `, ${userEmail.split("@")[0]}` : ""}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Your AI-powered command center for social media management.
            Here&apos;s what&apos;s happening across your platforms today.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-zinc-500">
                      {stat.title}
                    </CardDescription>
                    <Icon className="size-4 text-zinc-600" />
                  </div>
                  <CardTitle className="text-2xl text-white">
                    {stat.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs">
                    {stat.trend && (
                      <Badge variant="secondary" className="bg-emerald-600/20 text-emerald-400">
                        {stat.trend}
                      </Badge>
                    )}
                    <span className="text-zinc-500">{stat.description}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-zinc-400">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href}>
                  <Card className="group cursor-pointer border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
                    <CardContent className="flex items-center gap-3 py-1">
                      <div className={`flex size-9 items-center justify-center rounded-lg ${action.color}`}>
                        <Icon className="size-4" />
                      </div>
                      <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                        {action.label}
                      </span>
                      <ArrowUpRight className="ml-auto size-4 text-zinc-600 group-hover:text-zinc-400" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-zinc-500">
                  Latest updates across your platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                {recentActivity.length > 0 ? (
                  recentActivity.map((item, idx) => (
                    <div key={item.id}>
                      <div className="flex items-start gap-3 py-3">
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                          <Clock className="size-3.5 text-zinc-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-200">{item.action}</p>
                          <p className="mt-0.5 text-xs text-zinc-500 truncate">{item.detail}</p>
                        </div>
                        <span className="shrink-0 text-xs text-zinc-600">{item.time}</span>
                      </div>
                      {idx < recentActivity.length - 1 && <Separator className="bg-zinc-800" />}
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-sm text-zinc-500">No recent activity. Connect OmniSocial to get started.</p>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">OmniSocial</CardTitle>
                <CardDescription className="text-zinc-500">
                  Platform connection status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    omniStatus.connected
                      ? "border-emerald-900/50 bg-emerald-950/30"
                      : "border-amber-900/50 bg-amber-950/30"
                  }`}
                >
                  {omniStatus.connected ? (
                    <Wifi className="size-5 text-emerald-500" />
                  ) : (
                    <WifiOff className="size-5 text-amber-500" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${omniStatus.connected ? "text-emerald-400" : "text-amber-400"}`}>
                      {omniStatus.connected ? "Connected" : "Demo Mode"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {omniStatus.connected
                        ? omniStatus.connectionType === "mcp_url"
                          ? "MCP URL"
                          : "All services operational"
                        : "Connect in Settings for live data"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Data Source</span>
                    <Badge
                      variant="secondary"
                      className={
                        syncState.isLive
                          ? "bg-emerald-600/20 text-emerald-400"
                          : "bg-amber-600/20 text-amber-400"
                      }
                    >
                      {syncState.isLive ? "Live" : "Demo"}
                    </Badge>
                  </div>
                  {omniStatus.lastSyncedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Last Sync</span>
                      <span className="text-zinc-500">
                        {new Date(omniStatus.lastSyncedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Plan</span>
                    <Badge variant="secondary" className="bg-violet-600/20 text-violet-400">
                      {omniStatus.connected ? "Business" : "Free"}
                    </Badge>
                  </div>
                </div>

                <Link href="/settings">
                  <Button
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    {omniStatus.connected ? "Manage Connection" : "Connect OmniSocial"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}
