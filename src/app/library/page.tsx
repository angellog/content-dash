"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Search,
  ImageOff,
  Library as LibraryIcon,
  RefreshCw,
  Check,
  X,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LibraryPost } from "@/types/library";
import { mapPublishStatus, PublishStatus } from "@/lib/library-status";
import {
  useLibraryPosts,
  useLibraryQueue,
  useLibraryStats,
  useLibraryTargets,
  useApprovePost,
  useQueuePost,
  useCancelQueueItem,
} from "@/lib/api/library-queries";

// Primary tabs mirror Social Manager's kanban buckets exactly (draft/
// scheduled/published/backlog), since that's the whole point of this page
// syncing with what Social Manager says is true. "Needs Review" is the one
// bucket with no Social Manager equivalent — pending/approved/rejected posts
// haven't entered the publish pipeline yet, so they get their own tab rather
// than being force-fit into a kanban column that doesn't describe them.
const PRIMARY_TABS = ["all", "needs_review", "draft", "scheduled", "published", "backlog"] as const;
type PrimaryTab = (typeof PRIMARY_TABS)[number];

const PRIMARY_TAB_LABELS: Record<PrimaryTab, string> = {
  all: "All",
  needs_review: "Needs Review",
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  backlog: "Backlog",
};

// Colors are deliberately NOT shared with Social Manager's Scheduled/Drafts/
// Published/Backlog columns, except "queued" and "published" — those are the
// same real concepts (a post_queue row's eventual outcome) viewed from a
// different page, so they reuse Social Manager's exact colors via
// mapPublishStatus. Pending/Approved/Rejected are curation states with no
// Social Manager equivalent; giving them colors from that palette would
// imply a correspondence that doesn't exist.
const STATUS_BADGE: Record<string, string> = {
  pending: "bg-violet-500/20 text-violet-400",
  approved: "bg-cyan-500/20 text-cyan-400",
  queued: "bg-blue-500/20 text-blue-400",
  rejected: "bg-red-500/20 text-red-400",
  published: "bg-green-500/20 text-green-400",
};

export default function LibraryPage() {
  const [tab, setTab] = useState<PrimaryTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [queuePost, setQueuePost] = useState<LibraryPost | null>(null);
  const [queueTarget, setQueueTarget] = useState("");
  const [queueCaption, setQueueCaption] = useState("");
  const [queueDate, setQueueDate] = useState("");
  const [queueTime, setQueueTime] = useState("");

  // Each posts.status value is fetched in its own top-N-by-recency slice so
  // tab-switching (client-side, over already-fetched data) can't accidentally
  // hide older posts of a less-common status behind a global recency cutoff —
  // the old single-status-param fetch had this problem for anything but the
  // active filter.
  const pendingQuery = useLibraryPosts("pending", search);
  const approvedQuery = useLibraryPosts("approved", search);
  const rejectedQuery = useLibraryPosts("rejected", search);
  const queuedQuery = useLibraryPosts("queued", search);
  const publishedQuery = useLibraryPosts("published", search);
  const queueQuery = useLibraryQueue();
  const statsQuery = useLibraryStats();
  const targetsQuery = useLibraryTargets();
  const approveMutation = useApprovePost();
  const queueMutation = useQueuePost();
  const cancelMutation = useCancelQueueItem();

  const allPostQueries = [pendingQuery, approvedQuery, rejectedQuery, queuedQuery, publishedQuery];
  const posts = useMemo(
    () => allPostQueries.flatMap((q) => q.data ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingQuery.data, approvedQuery.data, rejectedQuery.data, queuedQuery.data, publishedQuery.data]
  );
  const stats = statsQuery.data ?? null;
  const targets = targetsQuery.data ?? [];
  const loading = allPostQueries.some((q) => q.isLoading);
  const firstError = allPostQueries.find((q) => q.isError)?.error;
  const error = firstError
    ? firstError instanceof Error
      ? firstError.message
      : "Failed to reach content library"
    : null;

  const queueByPostId = useMemo(() => {
    const byPost: Record<
      number,
      { id: number; publish_status: PublishStatus; scheduled_at: string | null }
    > = {};
    for (const item of queueQuery.data ?? []) {
      const postId = item.posts?.id;
      // A post can be queued to multiple targets — most recent wins for display.
      if (postId && !byPost[postId]) {
        byPost[postId] = { id: item.id, publish_status: item.publish_status, scheduled_at: item.scheduled_at };
      }
    }
    return byPost;
  }, [queueQuery.data]);

  const handleCancelQueueItem = (queueItemId: number) => {
    cancelMutation.mutate(queueItemId, {
      onSuccess: () => toast.success("Removed from queue"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to cancel"),
    });
  };

  const filteredPosts = useMemo(() => {
    if (tab === "all") return posts;
    if (tab === "needs_review") {
      return posts.filter(
        (p) => p.status === "pending" || p.status === "approved" || p.status === "rejected"
      );
    }
    return posts.filter((p) => {
      const entry = queueByPostId[p.id];
      if (!entry) return false;
      return mapPublishStatus(entry.publish_status).kanbanStatus === tab;
    });
  }, [posts, tab, queueByPostId]);

  const refreshAll = () => {
    for (const q of allPostQueries) q.refetch();
    queueQuery.refetch();
    statsQuery.refetch();
    targetsQuery.refetch();
  };

  const handleApprove = (post: LibraryPost, newStatus: "approved" | "rejected") => {
    setBusyId(post.id);
    approveMutation.mutate(
      { id: post.id, status: newStatus },
      {
        onSuccess: () => toast.success(newStatus === "approved" ? "Post approved" : "Post rejected"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update post"),
        onSettled: () => setBusyId(null),
      }
    );
  };

  const openQueueDialog = (post: LibraryPost) => {
    setQueuePost(post);
    setQueueTarget("");
    setQueueCaption(post.caption);
    setQueueDate("");
    setQueueTime("");
  };

  const handleQueueSubmit = () => {
    if (!queuePost || !queueTarget) return;
    const scheduledAt =
      queueDate && queueTime ? new Date(`${queueDate}T${queueTime}`).toISOString() : null;

    queueMutation.mutate(
      {
        post_id: queuePost.id,
        target_id: Number(queueTarget),
        rewritten_caption: queueCaption !== queuePost.caption ? queueCaption : null,
        scheduled_at: scheduledAt,
      },
      {
        onSuccess: () => {
          toast.success(
            scheduledAt
              ? "Queued — will publish via feetbit-library's scheduled cron"
              : "Saved as a draft in the queue (no publish time set yet)"
          );
          setQueuePost(null);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to queue post"),
      }
    );
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 bg-zinc-950 text-zinc-100 min-h-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-2">
          <LibraryIcon className="size-5 text-indigo-400" />
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">Content Library</h1>
            <p className="text-sm text-zinc-400">
              Approve and queue Instagram content from feetbit-content-library. Publishing still
              runs on its scheduled cron, not instantly from here.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-800 text-zinc-300 hover:text-zinc-100"
          onClick={refreshAll}
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
          {PRIMARY_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                tab === t
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {PRIMARY_TAB_LABELS[t]}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
          }}
          className="relative w-full sm:w-64"
        >
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
      ) : filteredPosts.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <ImageOff className="size-8 mb-2" />
          <p className="text-sm">No posts match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredPosts.map((post) => {
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
                  <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                    <Badge
                      className={`text-[10px] px-1.5 py-0.5 capitalize ${
                        STATUS_BADGE[post.status] || "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {post.status}
                    </Badge>
                    {queueByPostId[post.id] && (
                      <Badge
                        className={`text-[10px] px-1.5 py-0.5 ${
                          mapPublishStatus(queueByPostId[post.id].publish_status).badgeClassName
                        }`}
                        title="Same status Social Manager shows for this post"
                      >
                        {mapPublishStatus(queueByPostId[post.id].publish_status).label}
                      </Badge>
                    )}
                  </div>
                  {post.is_carousel && (
                    <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-black/60 text-white">
                      {post.media_count}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3 space-y-2">
                  <p className="line-clamp-2 text-xs text-zinc-300">{post.caption || "—"}</p>
                  <div className="flex flex-wrap gap-1 text-[10px] text-zinc-500">
                    <span>@{post.owner_name}</span>
                    {post.brand && <span className="text-indigo-400">#{post.brand}</span>}
                  </div>

                  {post.status === "pending" && (
                    <div className="flex gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === post.id}
                        className="h-7 flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        onClick={() => handleApprove(post, "approved")}
                      >
                        <Check className="size-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === post.id}
                        className="h-7 flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => handleApprove(post, "rejected")}
                      >
                        <X className="size-3" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {queueByPostId[post.id] &&
                    (queueByPostId[post.id].publish_status === "draft" ||
                      queueByPostId[post.id].publish_status === "scheduled") && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cancelMutation.isPending}
                        className="h-7 w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => handleCancelQueueItem(queueByPostId[post.id].id)}
                      >
                        <X className="size-3" />
                        Cancel
                      </Button>
                    )}

                  {post.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-full border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
                      onClick={() => openQueueDialog(post)}
                    >
                      <Send className="size-3" />
                      Queue to account
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!queuePost} onOpenChange={(open) => !open && setQueuePost(null)}>
        <DialogContent className="max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-zinc-100">Queue post</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              This adds the post to feetbit-library&apos;s publish queue. It goes live when the
              scheduled cron runs — not immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-xs font-medium">Target account *</Label>
              <Select value={queueTarget} onValueChange={(v) => setQueueTarget(v ?? "")}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100 w-full">
                  <SelectValue placeholder="Select an Instagram account" />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      @{t.ig_username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targets.length === 0 && (
                <p className="text-xs text-zinc-500">
                  No target accounts found — add one in feetbit-library&apos;s Settings first.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-xs font-medium">Caption</Label>
              <Textarea
                value={queueCaption}
                onChange={(e) => setQueueCaption(e.target.value)}
                rows={4}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs font-medium">Publish date</Label>
                <Input
                  type="date"
                  value={queueDate}
                  onChange={(e) => setQueueDate(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs font-medium">Publish time</Label>
                <Input
                  type="time"
                  value={queueTime}
                  onChange={(e) => setQueueTime(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Leave date/time blank to save as a draft without scheduling it yet.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-200"
              onClick={() => setQueuePost(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={!queueTarget || queueMutation.isPending}
              onClick={handleQueueSubmit}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {queueMutation.isPending ? "Saving..." : "Add to queue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
