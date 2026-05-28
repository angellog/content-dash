"use client";

import { useState, useMemo, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSocialMediaStore } from "@/hooks/useSocialMediaStore";
import { Platform as SocialPlatform, PostStatus } from "@/types/social";

type Platform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "x"
  | "threads"
  | "pinterest"
  | "bluesky"
  | "mastodon";

type ContentStatus = "scheduled" | "published" | "draft" | "backlog";
type ContentType = "post" | "reel" | "story" | "carousel" | "video" | "short" | "pin";

interface ContentItem {
  id: string;
  title: string;
  platform: Platform;
  date: Date;
  status: ContentStatus;
  type: ContentType;
}

// ---------------------------------------------------------------------------
// Platform config
// ---------------------------------------------------------------------------

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  tiktok: "#000000",
  x: "#1DA1F2",
  threads: "#000000",
  pinterest: "#BD081C",
  bluesky: "#0085FF",
  mastodon: "#6364FF",
};

interface PlatformFilterConfig {
  key: Platform | "all";
  label: string;
  color: string; // tailwind ring / dot color fallback
  dot: string; // hex for the dot
}

const PLATFORM_FILTERS: PlatformFilterConfig[] = [
  { key: "all", label: "All", color: "bg-zinc-400", dot: "#a1a1aa" },
  { key: "instagram", label: "Instagram", color: "bg-pink-500", dot: "#E4405F" },
  { key: "facebook", label: "Facebook", color: "bg-blue-500", dot: "#1877F2" },
  { key: "linkedin", label: "LinkedIn", color: "bg-blue-600", dot: "#0A66C2" },
  { key: "youtube", label: "YouTube", color: "bg-red-500", dot: "#FF0000" },
  { key: "tiktok", label: "TikTok", color: "bg-zinc-300", dot: "#000000" },
  { key: "x", label: "X", color: "bg-sky-400", dot: "#1DA1F2" },
  { key: "threads", label: "Threads", color: "bg-zinc-400", dot: "#000000" },
];

// ---------------------------------------------------------------------------
// Mock data – helpers to build dates relative to *now*
// ---------------------------------------------------------------------------

function buildContentFromStore(
  storePosts: Record<string, import("@/types/social").Post[]>
): ContentItem[] {
  const items: ContentItem[] = [];
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  let dayIdx = 2;

  for (const [platform, posts] of Object.entries(storePosts)) {
    for (const post of posts) {
      let date: Date;
      if (post.scheduledDate) {
        const parts = post.scheduledDate.split("-");
        date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        date = new Date(y, m, dayIdx);
        dayIdx = ((dayIdx - 1 + 3) % 28) + 1;
      }

      items.push({
        id: post.id,
        title: post.caption.slice(0, 40) + (post.caption.length > 40 ? "..." : ""),
        platform: platform as Platform,
        date,
        status: post.status as ContentStatus,
        type: (post.type.toLowerCase() === "reel"
          ? "reel"
          : post.type.toLowerCase() === "story"
            ? "story"
            : post.type.toLowerCase() === "carousel"
              ? "carousel"
              : post.type.toLowerCase() === "video"
                ? "video"
                : post.type.toLowerCase() === "short"
                  ? "short"
                  : post.type.toLowerCase() === "pin"
                    ? "pin"
                    : "post") as ContentType,
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Status badge styling
// ---------------------------------------------------------------------------

function statusClasses(status: ContentStatus): string {
  switch (status) {
    case "published":
      return "bg-emerald-500/20 text-emerald-400";
    case "scheduled":
      return "bg-sky-500/20 text-sky-400";
    case "draft":
      return "bg-zinc-500/20 text-zinc-400";
    default:
      return "bg-zinc-500/20 text-zinc-400";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeFilters, setActiveFilters] = useState<Set<Platform | "all">>(
    new Set(["all"])
  );
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const { posts, fetchPosts } = useSocialMediaStore();

  useEffect(() => {
    fetchPosts();
  }, []);

  const allContent = useMemo(() => buildContentFromStore(posts), [posts]);

  // ---- filter logic ----
  const toggleFilter = (key: Platform | "all") => {
    setActiveFilters((prev) => {
      const next = new Set<Platform | "all">(prev);
      if (key === "all") {
        return new Set<Platform | "all">(["all"]);
      }
      next.delete("all");
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      if (next.size === 0) return new Set<Platform | "all">(["all"]);
      return next;
    });
  };

  const filteredContent = useMemo(() => {
    if (activeFilters.has("all")) return allContent;
    return allContent.filter((item) =>
      activeFilters.has(item.platform)
    );
  }, [allContent, activeFilters]);

  // ---- calendar grid dates ----
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  // ---- items keyed by date string for fast lookup ----
  const itemsByDate = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const item of filteredContent) {
      const key = format(item.date, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return map;
  }, [filteredContent]);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      {/* ----------------------------------------------------------------- */}
      {/* Page Header                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Content Calendar
          </h1>

          {/* Month navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <span className="min-w-[140px] text-center text-sm font-medium text-zinc-300">
              {format(currentMonth, "MMMM yyyy")}
            </span>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="text-zinc-400 hover:text-white"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <Button size="default" className="gap-1.5">
          <Plus className="size-4" />
          Add Content
        </Button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Platform Filters                                                   */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-zinc-500" />
        {PLATFORM_FILTERS.map((pf) => {
          const isActive =
            pf.key === "all"
              ? activeFilters.has("all")
              : activeFilters.has(pf.key);

          return (
            <button
              key={pf.key}
              onClick={() => toggleFilter(pf.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-zinc-600 bg-zinc-800 text-white"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              )}
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: pf.dot }}
              />
              {pf.label}
            </button>
          );
        })}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Calendar Grid                                                      */}
      {/* ----------------------------------------------------------------- */}
      <Card className="border-zinc-800 bg-zinc-900 ring-zinc-800">
        <CardHeader className="border-b border-zinc-800 pb-0">
          <CardTitle className="sr-only">Monthly calendar</CardTitle>
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7">
            {dayNames.map((name) => (
              <div
                key={name}
                className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                {name}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const items = itemsByDate.get(dateKey) ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "relative min-h-[110px] border-b border-r border-zinc-800 p-1.5 transition-colors last:border-r-0 [&:nth-child(7n)]:border-r-0",
                    !inMonth && "bg-zinc-950/60",
                    today && "ring-1 ring-inset ring-sky-500/60"
                  )}
                >
                  {/* Day number */}
                  <span
                    className={cn(
                      "mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                      !inMonth && "text-zinc-600",
                      inMonth && !today && "text-zinc-300",
                      today && "bg-sky-500 text-white"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Content chips */}
                  <div className="flex flex-col gap-0.5">
                    {items.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() =>
                          setSelectedItem(
                            selectedItem?.id === item.id ? null : item
                          )
                        }
                        className={cn(
                          "group flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight transition-colors",
                          "hover:bg-zinc-700/50",
                          selectedItem?.id === item.id && "bg-zinc-700/70"
                        )}
                      >
                        <span
                          className="inline-block size-1.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: PLATFORM_COLORS[item.platform],
                          }}
                        />
                        <span className="truncate text-zinc-300 group-hover:text-white">
                          {item.title}
                        </span>
                      </button>
                    ))}
                    {items.length > 3 && (
                      <span className="px-1 text-[10px] text-zinc-500">
                        +{items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Selected item detail panel                                         */}
      {/* ----------------------------------------------------------------- */}
      {selectedItem && (
        <Card className="mt-4 border-zinc-800 bg-zinc-900 ring-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <span
                className="inline-block size-3 rounded-full"
                style={{
                  backgroundColor: PLATFORM_COLORS[selectedItem.platform],
                }}
              />
              {selectedItem.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="secondary" className="capitalize">
                {selectedItem.platform}
              </Badge>
              <Badge
                variant="outline"
                className={cn("capitalize", statusClasses(selectedItem.status))}
              >
                {selectedItem.status}
              </Badge>
              <Badge variant="outline" className="capitalize text-zinc-400">
                {selectedItem.type}
              </Badge>
              <span className="text-zinc-500">
                {format(selectedItem.date, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
