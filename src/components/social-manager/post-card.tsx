"use client";

import { Post, Platform, PLATFORM_COLORS } from "@/types/social";
import { Card, CardContent } from "@/components/ui/card";
import { PostTypeBadge } from "@/components/social-manager/post-type-badge";
import { cn } from "@/lib/utils";
import {
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Plus,
  Image as ImageIcon,
  Link2,
  RefreshCw,
  AlertCircle,
  Library as LibraryIcon,
} from "lucide-react";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "\u2014";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function truncateUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.length > 25 ? url.slice(0, 25) + "\u2026" : url;
  }
}

function formatNumber(n?: number): string {
  if (n == null) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border border-border/50 ring-0 p-0 gap-0 hover:border-primary/20 transition-colors"
      )}
    >
      <div
        className="h-1 w-full absolute top-0 left-0 rounded-t-lg z-10"
        style={{ backgroundColor: PLATFORM_COLORS[post.platform] }}
      />

      <CardContent className="relative p-3 space-y-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <PostTypeBadge platform={post.platform} type={post.type} />

          {post.source === "library" && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-medium">
              <LibraryIcon className="w-3 h-3" />
              Library{post.targetUsername ? ` → @${post.targetUsername}` : ""}
            </span>
          )}

          {post.source !== "library" && post.omnisocialStatus === "synced" && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
              <RefreshCw className="w-3 h-3" />
              Synced
            </span>
          )}
          {post.omnisocialStatus === "pending" && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          )}
          {post.omnisocialStatus === "error" && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
              <AlertCircle className="w-3 h-3" />
              Error
            </span>
          )}

          {post.source !== "library" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(post.id);
              }}
              className="ml-auto p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Plus className="w-3.5 h-3.5 rotate-45" />
            </button>
          )}
        </div>

        <div className="h-[112px] bg-accent/50 rounded-lg flex items-center justify-center relative hover:bg-accent/70 transition-colors">
          <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
          {post.videoDuration && (
            <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              {post.videoDuration}
            </span>
          )}
        </div>

        <p className="line-clamp-3 leading-relaxed text-sm text-card-foreground">
          {post.caption}
        </p>

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.hashtags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-primary/80 hover:text-primary text-xs transition-colors cursor-default"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {post.link && (
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 hover:bg-blue-500/20 transition-colors w-fit max-w-full truncate"
          >
            <Link2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{truncateUrl(post.link)}</span>
          </a>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>
            {post.status === "scheduled"
              ? "Scheduled:"
              : post.status === "published"
                ? "Published:"
                : "Draft:"}
          </span>
          <span>{formatDate(post.scheduledDate)}</span>
        </div>

        {post.status === "published" && (
          <div className="border-t border-border pt-2 mt-2 flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1 hover:text-pink-400 transition-colors cursor-default">
              <Heart className="w-3 h-3" />
              {formatNumber(post.likes)}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1 hover:text-blue-400 transition-colors cursor-default">
              <MessageCircle className="w-3 h-3" />
              {formatNumber(post.comments)}
            </span>
            {post.platform !== "instagram" && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 hover:text-green-400 transition-colors cursor-default">
                <Share2 className="w-3 h-3" />
                {formatNumber(post.shares)}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
