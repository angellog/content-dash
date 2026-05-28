"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, Grid3X3, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Platform,
  Post,
  PostStatus,
  PLATFORMS,
  PLATFORM_COLORS,
} from "@/types/social";
import { PLATFORM_CONFIG, CONNECTED_PLATFORMS } from "@/lib/omnisocial";
import { useSocialMediaStore } from "@/hooks/useSocialMediaStore";
import { PlatformIconBar } from "@/components/social-manager/platform-icon-bar";
import { PostCard } from "@/components/social-manager/post-card";
import { NewPostDialog } from "@/components/social-manager/new-post-dialog";
import { PlatformStats } from "@/components/social-manager/platform-stats";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_COLUMNS = [
  {
    status: "scheduled" as PostStatus,
    label: "Scheduled",
    dotColor: "bg-blue-500",
    mobileLabel: "SCHEDULED",
  },
  {
    status: "draft" as PostStatus,
    label: "Drafts",
    dotColor: "bg-yellow-500",
    mobileLabel: "DRAFTS",
  },
  {
    status: "published" as PostStatus,
    label: "Published",
    dotColor: "bg-green-500",
    mobileLabel: "PUBLISHED",
  },
  {
    status: "backlog" as PostStatus,
    label: "Backlog",
    dotColor: "bg-zinc-500",
    mobileLabel: "BACKLOG",
  },
];

function SocialManagerContent() {
  const searchParams = useSearchParams();
  const {
    activePlatform,
    viewMode,
    setActivePlatform,
    setViewMode,
    addPost,
    deletePost,
    getPostsByStatus,
    getAllPosts,
    posts,
    syncState,
    isLoading,
    fetchPosts,
    syncFromOmniSocial,
  } = useSocialMediaStore();

  const [activeColumnTab, setActiveColumnTab] =
    useState<PostStatus>("scheduled");
  const [platformStatusTab, setPlatformStatusTab] =
    useState<PostStatus>("scheduled");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const p = searchParams.get("platform");
    const v = searchParams.get("view");
    if (p && (PLATFORMS as readonly string[]).includes(p)) {
      setActivePlatform(p as Platform);
    }
    if (p === "all") {
      setActivePlatform("all");
    }
    if (v === "status" || v === "platform") {
      setViewMode(v);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activePlatform !== "all") params.set("platform", activePlatform);
    if (viewMode !== "status") params.set("view", viewMode);
    const qs = params.toString();
    const url = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [activePlatform, viewMode]);

  const stats = useMemo(() => {
    if (activePlatform === "all") {
      const allPosts = getAllPosts();
      const scheduled = allPosts.filter((p: Post) => p.status === "scheduled").length;
      const published = allPosts.filter((p: Post) => p.status === "published");
      const totalLikes = published.reduce((s: number, p: Post) => s + (p.likes ?? 0), 0);
      const totalComments = published.reduce((s: number, p: Post) => s + (p.comments ?? 0), 0);
      const engagementRate = published.length > 0
        ? Math.round(((totalLikes + totalComments) / published.length / 100) * 10) / 10
        : 0;
      return {
        totalPosts: allPosts.length,
        scheduled,
        engagementRate,
        followerCount: 24800,
      };
    }
    const platformPosts = posts[activePlatform] ?? [];
    const scheduled = platformPosts.filter((p: Post) => p.status === "scheduled").length;
    const published = platformPosts.filter((p: Post) => p.status === "published");
    const totalLikes = published.reduce((s: number, p: Post) => s + (p.likes ?? 0), 0);
    const totalComments = published.reduce((s: number, p: Post) => s + (p.comments ?? 0), 0);
    const engagementRate = published.length > 0
      ? Math.round(((totalLikes + totalComments) / published.length / 100) * 10) / 10
      : 0;
    const followerMap: Record<Platform, number> = {
      instagram: 10465, facebook: 2624, linkedin: 216, threads: 423,
      tiktok: 2624, youtube: 1200, pinterest: 890, bluesky: 340,
      mastodon: 156, x: 5200,
    };
    return {
      totalPosts: platformPosts.length,
      scheduled,
      engagementRate,
      followerCount: followerMap[activePlatform] ?? 0,
    };
  }, [activePlatform, posts, getAllPosts]);

  const handlePostCreated = useCallback(
    (platform: Platform, post: Omit<Post, "id">) => {
      addPost(platform, post);
    },
    [addPost]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const platformKey =
        activePlatform === "all"
          ? (PLATFORMS.find((p: Platform) =>
              (posts[p] ?? []).some((post: Post) => post.id === id)
            ) ?? PLATFORMS[0])
          : activePlatform;
      deletePost(platformKey, id);
    },
    [activePlatform, deletePost, posts]
  );

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    await syncFromOmniSocial();
    setIsSyncing(false);
  }, [syncFromOmniSocial]);

  const platformViewPosts = useMemo(() => {
    const source =
      activePlatform === "all"
        ? getAllPosts()
        : posts[activePlatform] ?? [];
    return source.filter((p: Post) => p.status === platformStatusTab);
  }, [activePlatform, posts, platformStatusTab, getAllPosts]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Social Manager
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">
              Manage content across all your social platforms
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                syncState.isLive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-amber-500/10 text-amber-500"
              )}
            >
              {syncState.isLive ? (
                <><Wifi className="h-3 w-3" /> Live</>
              ) : (
                <><WifiOff className="h-3 w-3" /> Demo</>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-accent/50 rounded-lg p-1 flex items-center gap-1">
            <button
              onClick={() => setViewMode("status")}
              className={cn(
                "inline-flex items-center justify-center rounded-md p-2 transition-colors",
                viewMode === "status"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Status view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("platform")}
              className={cn(
                "inline-flex items-center justify-center rounded-md p-2 transition-colors",
                viewMode === "platform"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Platform view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleSync}
            disabled={isLoading || isSyncing}
            className={cn(
              "inline-flex items-center justify-center rounded-md border border-border bg-background p-2 text-muted-foreground hover:text-foreground transition-colors",
              (isLoading || isSyncing) && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Sync with OmniSocial"
            title={syncState.isLive ? "Sync with OmniSocial" : "Sync (demo mode)"}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 transition-transform duration-500",
                (isLoading || isSyncing) && "animate-spin"
              )}
            />
          </button>

          <NewPostDialog
            activePlatform={activePlatform}
            onPostCreated={handlePostCreated}
          />
        </div>
      </div>

      {syncState.error && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-500">
          {syncState.error}
        </div>
      )}

      {syncState.lastSyncedAt && (
        <div className="mb-2 text-xs text-muted-foreground">
          Last synced: {syncState.lastSyncedAt.toLocaleTimeString()}
        </div>
      )}

      <div className="mb-4">
        <PlatformIconBar
          activePlatform={activePlatform}
          onSelect={setActivePlatform}
        />
      </div>

      <div className="mb-6">
        <PlatformStats platform={activePlatform} stats={stats} />
      </div>

      {viewMode === "status" ? (
        <>
          <div className="flex md:hidden sticky top-0 z-10 backdrop-blur-sm bg-background/80 -mx-4 px-4 py-2 gap-1 mb-4">
            {STATUS_COLUMNS.map((col) => (
              <button
                key={col.status}
                onClick={() => setActiveColumnTab(col.status)}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors",
                  activeColumnTab === col.status
                    ? "bg-card shadow-sm ring-1 ring-border text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {col.mobileLabel}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATUS_COLUMNS.map((col) => {
              const columnPosts = getPostsByStatus(activePlatform, col.status);
              const isActiveOnMobile = activeColumnTab === col.status;

              return (
                <div
                  key={col.status}
                  className={cn(
                    isActiveOnMobile
                      ? "flex flex-col"
                      : "hidden md:flex flex-col"
                  )}
                >
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div
                      className={cn("h-2.5 w-2.5 rounded-full", col.dotColor)}
                    />
                    <span className="font-medium text-sm">{col.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground bg-accent rounded-full px-2 py-0.5">
                      {columnPosts.length}
                    </span>
                  </div>

                  <ScrollArea
                    className={cn(
                      "h-[calc(100vh-320px)] md:h-[calc(100vh-280px)]"
                    )}
                  >
                    <div className="flex flex-col gap-3 pr-3">
                      {columnPosts.length > 0 ? (
                        columnPosts.map((post: Post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onDelete={handleDelete}
                          />
                        ))
                      ) : (
                        <div className="border border-dashed border-border rounded-lg p-8 flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">
                            No {col.label.toLowerCase()} posts
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <Tabs
          value={platformStatusTab}
          onValueChange={(v) => setPlatformStatusTab(v as PostStatus)}
        >
          <TabsList className="mb-4">
            {STATUS_COLUMNS.map((col) => (
              <TabsTrigger key={col.status} value={col.status}>
                {col.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformViewPosts.length > 0 ? (
              platformViewPosts.map((post: Post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="col-span-full border border-dashed border-border rounded-lg p-12 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No posts found</p>
              </div>
            )}
          </div>
        </Tabs>
      )}
    </div>
  );
}

export default function SocialManagerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground animate-pulse">
            Loading...
          </div>
        </div>
      }
    >
      <SocialManagerContent />
    </Suspense>
  );
}
