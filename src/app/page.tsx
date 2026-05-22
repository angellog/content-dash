"use client";

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
  ArrowUpRight,
  Clock,
} from "lucide-react";

const stats = [
  {
    title: "Total Posts",
    value: "42",
    description: "Scheduled this month",
    icon: CalendarDays,
    trend: "+12%",
  },
  {
    title: "Engagement Rate",
    value: "4.8%",
    description: "Across all platforms",
    icon: TrendingUp,
    trend: "+0.6%",
  },
  {
    title: "Follower Growth",
    value: "+1,247",
    description: "Last 30 days",
    icon: Users,
    trend: "+8.3%",
  },
  {
    title: "Connected Platforms",
    value: "4",
    description: "Active integrations",
    icon: Layers,
    trend: null,
  },
];

const quickActions = [
  {
    label: "Create Post",
    href: "/instagram",
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

const recentActivity = [
  {
    id: 1,
    action: "Post published",
    detail: '"Summer collection drop" went live on Instagram',
    time: "2 hours ago",
  },
  {
    id: 2,
    action: "Analytics milestone",
    detail: "Reached 10K impressions on last campaign",
    time: "5 hours ago",
  },
  {
    id: 3,
    action: "New follower spike",
    detail: "+312 followers from viral reel",
    time: "Yesterday",
  },
  {
    id: 4,
    action: "Competitor alert",
    detail: "BrandX launched a new campaign targeting your audience",
    time: "Yesterday",
  },
  {
    id: 5,
    action: "Scheduled post",
    detail: '"Weekend giveaway" queued for Saturday 10 AM',
    time: "2 days ago",
  },
];

export default function Home() {
  return (
    <>
      <Header title="Dashboard" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* Welcome hero */}
        <section className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/30 p-6 lg:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Welcome back to ContentDash
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Your AI-powered command center for social media management.
            Here&apos;s what&apos;s happening across your platforms today.
          </p>
        </section>

        {/* Stat cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="border-zinc-800 bg-zinc-900"
              >
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
                      <Badge
                        variant="secondary"
                        className="bg-emerald-600/20 text-emerald-400"
                      >
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

        {/* Quick actions */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-zinc-400">
            Quick Actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.label}
                  className="group cursor-pointer border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700"
                >
                  <CardContent className="flex items-center gap-3 py-1">
                    <div
                      className={`flex size-9 items-center justify-center rounded-lg ${action.color}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                      {action.label}
                    </span>
                    <ArrowUpRight className="ml-auto size-4 text-zinc-600 group-hover:text-zinc-400" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Recent activity feed */}
          <section className="lg:col-span-2">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-zinc-500">
                  Latest updates across your platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                {recentActivity.map((item, idx) => (
                  <div key={item.id}>
                    <div className="flex items-start gap-3 py-3">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                        <Clock className="size-3.5 text-zinc-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200">
                          {item.action}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 truncate">
                          {item.detail}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-zinc-600">
                        {item.time}
                      </span>
                    </div>
                    {idx < recentActivity.length - 1 && (
                      <Separator className="bg-zinc-800" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* OmniSocial connection status */}
          <section>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white">OmniSocial</CardTitle>
                <CardDescription className="text-zinc-500">
                  Platform connection status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3">
                  <Wifi className="size-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-emerald-400">
                      Connected
                    </p>
                    <p className="text-xs text-zinc-500">
                      All services operational
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">API Status</span>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-600/20 text-emerald-400"
                    >
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Last Sync</span>
                    <span className="text-zinc-500">2 min ago</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Plan</span>
                    <Badge
                      variant="secondary"
                      className="bg-violet-600/20 text-violet-400"
                    >
                      Business
                    </Badge>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  Manage Connection
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}
