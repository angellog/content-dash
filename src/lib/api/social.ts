import { Platform, Post, PostStatus } from "@/types/social";

const API_BASE = "/api/omnisocial";

export interface SyncState {
  isLive: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
}

function mapApiPostToPost(raw: Record<string, unknown>): Post {
  const platforms = raw.platforms as Record<string, string> | undefined;
  const platform = (raw.platform as Platform)
    ?? (platforms ? (Object.keys(platforms)[0] as Platform) : "instagram");
  const apiStatus = (raw.status as string) ?? "draft";
  const statusMap: Record<string, PostStatus> = {
    queued: "scheduled",
    scheduled: "scheduled",
    published: "published",
    failed: "backlog",
    draft: "draft",
  };
  return {
    id: raw.id as string,
    caption: (raw.text as string) ?? "",
    type: (raw.type as string) ?? "Post",
    status: statusMap[apiStatus] ?? "draft",
    platform,
    scheduledDate: (raw.scheduled_at as string)?.split("T")[0],
    scheduledTime: (raw.scheduled_at as string)?.split("T")[1]?.slice(0, 5),
    likes: (raw.likes as number) ?? undefined,
    comments: (raw.comments as number) ?? undefined,
    shares: (raw.shares as number) ?? undefined,
    hashtags: (raw.hashtags as string[]) ?? undefined,
    link: (raw.link as string) ?? undefined,
    videoDuration: (raw.video_duration as string) ?? undefined,
    isThread: (raw.is_thread as boolean) ?? undefined,
    omnisocialStatus: "synced",
  };
}

const emptyPosts: Record<Platform, Post[]> = {
  instagram: [], facebook: [], linkedin: [], threads: [],
  tiktok: [], youtube: [], pinterest: [], bluesky: [],
  mastodon: [], x: [],
};

interface LibraryQueueItem {
  id: number;
  rewritten_caption: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  publish_status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  posts: { id: number; caption: string; is_carousel: boolean; media_count: number } | null;
  target: { ig_username: string } | null;
}

// Library queue items only ever target Instagram (feetbit-library publishes
// via the Meta/Composio paths), so they all land on the instagram lane.
function mapLibraryQueueItemToPost(item: LibraryQueueItem): Post {
  const statusMap: Record<LibraryQueueItem["publish_status"], PostStatus> = {
    draft: "draft",
    scheduled: "scheduled",
    publishing: "scheduled",
    published: "published",
    failed: "backlog",
  };
  const when = item.publish_status === "published" ? item.published_at : item.scheduled_at;
  return {
    id: `lib-${item.id}`,
    caption: item.rewritten_caption || item.posts?.caption || "",
    type: item.posts?.is_carousel ? "Carousel" : "Post",
    status: statusMap[item.publish_status],
    platform: "instagram",
    scheduledDate: when?.split("T")[0],
    scheduledTime: when?.split("T")[1]?.slice(0, 5),
    source: "library",
    libraryQueueId: item.id,
    targetUsername: item.target?.ig_username,
  };
}

async function fetchLibraryQueuePosts(): Promise<Post[]> {
  try {
    const res = await fetch("/api/library/queue?limit=100", { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    return ((data.queue ?? []) as LibraryQueueItem[]).map(mapLibraryQueueItemToPost);
  } catch {
    return [];
  }
}

export async function fetchPostsFromApi(
  platform?: Platform | "all"
): Promise<{ posts: Record<Platform, Post[]>; isLive: boolean }> {
  // Library queue is fetched alongside OmniSocial so Social Manager, Calendar,
  // and the Dashboard all see the same combined truth from one place. Either
  // source failing must not blank out the other.
  const includeLibrary = !platform || platform === "all" || platform === "instagram";

  const [omni, libraryPosts] = await Promise.all([
    (async () => {
      try {
        const params = new URLSearchParams();
        if (platform && platform !== "all") params.set("platform", platform);
        if (platform === "all") params.set("limit", "100");

        const res = await fetch(`${API_BASE}/posts?${params.toString()}`, {
          credentials: "include",
        });
        if (!res.ok) return { rawPosts: [] as Record<string, unknown>[], isLive: false };

        const data = await res.json();
        const rawPosts = Array.isArray(data) ? data : data.posts ?? data.data ?? [];
        return { rawPosts, isLive: true };
      } catch {
        return { rawPosts: [] as Record<string, unknown>[], isLive: false };
      }
    })(),
    includeLibrary ? fetchLibraryQueuePosts() : Promise.resolve([]),
  ]);

  const mapped: Record<Platform, Post[]> = {
    instagram: [], facebook: [], linkedin: [], threads: [],
    tiktok: [], youtube: [], pinterest: [], bluesky: [],
    mastodon: [], x: [],
  };

  for (const raw of omni.rawPosts) {
    const post = mapApiPostToPost(raw);
    if (mapped[post.platform]) {
      mapped[post.platform].push(post);
    }
  }

  mapped.instagram.push(...libraryPosts);

  return { posts: mapped, isLive: omni.isLive || libraryPosts.length > 0 };
}

export async function createPostViaApi(payload: {
  text: string;
  platforms: Platform[];
  scheduled_at?: string;
  media?: string[];
}): Promise<{ success: boolean; post?: Post }> {
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return { success: false };

    const data = await res.json();
    const raw = data.post ?? data.data ?? data;
    return { success: true, post: mapApiPostToPost(raw) };
  } catch {
    return { success: false };
  }
}

export async function deletePostViaApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function updatePostViaApi(
  id: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
