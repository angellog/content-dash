"use client";

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LayoutGrid, Grid3X3, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Platform,
  Post,
  PostStatus,
  PLATFORMS,
} from "@/types/social";
;
import { useSocialMediaStore } from "@/hooks/useSocialMediaStore";
import { useLibraryQueue } from "@/lib/api/library-queries";
import { PlatformIconBar } from "@/components/social-manager/platform-icon-bar";
import { PostCard } from "@/components/social-manager/post-card";
import { NewPostDialog } from "@/components/social-manager/new-post-dialog";
import { PlatformStats } from "@/components/social-manager/platform-stats";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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
  const router = useRouter();
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
  const [followerCounts, setFollowerCounts] = useState<Record<Platform, number | null>>(
    {} as Record<Platform, number | null>
  );

  useEffect(() => {
    fetchPosts().catch(() => {
      toast.error("Failed to load posts.");
    });
  }, []);

  // Shares the library queue's React Query cache key with the Content
  // Library page — when an approve/queue/cancel action there invalidates
  // this key, this hook refetches too (same key, same cache), and we use
  // that as a live signal to refresh the Zustand store's own merged view.
  // fetchPosts() itself still owns the actual library fetch (it feeds
  // Dashboard and Calendar too, which also depend on library posts being in
  // the store) — this just re-triggers it so Social Manager doesn't need a
  // manual page reload to see a change made on the Library page.
  const libraryQueueQuery = useLibraryQueue();
  const isFirstQueueSync = useRef(true);
  useEffect(() => {
    if (isFirstQueueSync.current) {
      isFirstQueueSync.current = false;
      return;
    }
    fetchPosts().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryQueueQuery.dataUpdatedAt]);

  useEffect(() => {
    async function loadFollowerCounts() {
      try {
        const res = await fetch("/api/omnisocial/accounts");
        if (res.ok) {
          const data = await res.json();
          const accounts = data.accounts ?? data.data ?? [];
          const counts: Record<Platform, number | null> = {} as Record<Platform, number | null>;
          for (const acc of accounts) {
            if (acc.platform && acc.followersCount != null) {
              counts[acc.platform as Platform] = acc.followersCount;
            }
          }
          setFollowerCounts(counts);
        }
      } catch {
        setFollowerCounts({} as Record<Platform, number | null>);
      }
    }
    loadFollowerCounts();
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
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    router.replace(url);
  }, [activePlatform, viewMode, router]);

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
      const totalFollowers = Object.values(followerCounts).reduce(
        (sum: number, c: number | null) => sum + (c ?? 0),
        0
      );
      const hasAny = Object.values(followerCounts).some((c) => c != null);
      return {
        totalPosts: allPosts.length,
        scheduled,
        engagementRate,
        followerCount: hasAny ? totalFollowers : null,
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
    const count = followerCounts[activePlatform];
    return {
      totalPosts: platformPosts.length,
      scheduled,
      engagementRate,
      followerCount: count ?? null,
    };
  }, [activePlatform, posts, getAllPosts, followerCounts]);

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
      try {
        deletePost(platformKey, id);
      } catch {
        toast.error("Failed to delete post.");
      }
    },
    [activePlatform, deletePost, posts]
  );

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await syncFromOmniSocial();
    } catch {
      toast.error("Sync failed.");
    } finally {
      setIsSyncing(false);
    }
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
        <PlatformStats
          platform={activePlatform}
          stats={{
            ...stats,
            followerCount: stats.followerCount ?? "\u2014",
          }}
        />
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
