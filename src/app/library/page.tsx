"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Search, ImageOff, Library as LibraryIcon, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LibraryPost, LibraryStats } from "@/types/library";

const STATUS_FILTERS = ["all", "pending", "approved", "queued", "rejected"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  queued: "bg-blue-500/20 text-blue-400",
  rejected: "bg-red-500/20 text-red-400",
};

export default function LibraryPage() {
  const [posts, setPosts] = useState<LibraryPost[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (statusFilter: StatusFilter, searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "40" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchTerm) params.set("search", searchTerm);

      const [postsRes, statsRes] = await Promise.all([
        fetch(`/api/library/posts?${params.toString()}`),
        fetch("/api/library/stats"),
      ]);

      const postsJson = await postsRes.json();
      if (!postsRes.ok) throw new Error(postsJson.error || "Failed to load library posts");
      setPosts(postsJson.posts || []);

      const statsJson = await statsRes.json();
      if (statsRes.ok) setStats(statsJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach content library");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(status, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 bg-zinc-950 text-zinc-100 min-h-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-2">
          <LibraryIcon className="size-5 text-indigo-400" />
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">Content Library</h1>
            <p className="text-sm text-zinc-400">
              Approved and queued Instagram content from feetbit-content-library.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-800 text-zinc-300 hover:text-zinc-100"
          onClick={() => load(status, search)}
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">Total posts</p>
              <p className="text-xl font-semibold mt-1">{stats.posts}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">Pending review</p>
              <p className="text-xl font-semibold mt-1">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">Queued</p>
              <p className="text-xl font-semibold mt-1">{stats.queued}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">Published</p>
              <p className="text-xl font-semibold mt-1">{stats.published}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${
                status === s
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(status, search);
          }}
          className="relative w-full sm:w-64"
        >
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search caption, brand, model..."
            className="pl-8 bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500"
          />
        </form>
      </div>

      {error && (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardContent className="p-4 text-sm text-zinc-400">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <ImageOff className="size-8 mb-2" />
          <p className="text-sm">No posts match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => {
            const cover = post.post_media?.[0];
            return (
              <Card
                key={post.id}
                className="group relative overflow-hidden border border-zinc-800 bg-zinc-900 p-0 gap-0 hover:border-indigo-500/40 transition-colors"
              >
                <div className="relative aspect-square bg-zinc-800">
                  {cover?.public_url ? (
                    <Image
                      src={cover.public_url}
                      alt={post.caption.slice(0, 60)}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageOff className="size-6 text-zinc-600" />
                    </div>
                  )}
                  <Badge
                    className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 capitalize ${
                      STATUS_BADGE[post.status] || "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {post.status}
                  </Badge>
                  {post.is_carousel && (
                    <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-black/60 text-white">
                      {post.media_count}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3 space-y-1.5">
                  <p className="line-clamp-2 text-xs text-zinc-300">{post.caption || "—"}</p>
                  <div className="flex flex-wrap gap-1 text-[10px] text-zinc-500">
                    <span>@{post.owner_name}</span>
                    {post.brand && <span className="text-indigo-400">#{post.brand}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
