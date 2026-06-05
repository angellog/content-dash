"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Platform, PLATFORM_CONFIG } from "@/lib/omnisocial"
import { FileText, Clock, Heart, Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlatformStatsProps {
  platform: Platform | "all"
  stats: {
    totalPosts: number
    scheduled: number
    engagementRate: number
    followerCount: number | string
  }
}

const METRICS = [
  { key: "totalPosts" as const, label: "Total Posts", icon: FileText, trend: "+12%", format: (v: number | string) => typeof v === "string" ? v : v.toLocaleString() },
  { key: "scheduled" as const, label: "Scheduled", icon: Clock, trend: "+8%", format: (v: number | string) => typeof v === "string" ? v : v.toLocaleString() },
  { key: "engagementRate" as const, label: "Engagement Rate", icon: Heart, trend: "+5.2%", format: (v: number | string) => typeof v === "string" ? v : `${v}%` },
  { key: "followerCount" as const, label: "Followers", icon: Users, trend: "+3.1%", format: (v: number | string) => typeof v === "string" ? v : v.toLocaleString() },
]

export function PlatformStats({ platform, stats }: PlatformStatsProps) {
  const accent = platform !== "all" ? PLATFORM_CONFIG[platform as Platform].color : null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {METRICS.map((metric, i) => {
        const Icon = metric.icon
        const value = stats[metric.key]

        return (
          <Card
            key={metric.key}
            className="bg-zinc-900 border-zinc-800 overflow-hidden relative animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className="p-1.5 rounded-md"
                  style={
                    accent
                      ? { backgroundColor: `${accent}20` }
                      : { backgroundColor: "rgba(161,161,170,0.15)" }
                  }
                >
                  <Icon
                    className="w-4 h-4"
                    style={accent ? { color: accent } : { color: "#a1a1aa" }}
                  />
                </div>
                <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  {metric.trend}
                </span>
              </div>
              <div>
                <p
                  className="text-xl font-semibold tabular-nums"
                  style={accent ? { color: accent } : { color: "#fafafa" }}
                >
                  {metric.format(value)}
                </p>
                <p className="text-[11px] text-zinc-500">{metric.label}</p>
              </div>
              {accent && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-md"
                  style={{ backgroundColor: accent }}
                />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
