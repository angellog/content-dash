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

export async function fetchPostsFromApi(
  platform?: Platform | "all"
): Promise<{ posts: Record<Platform, Post[]>; isLive: boolean }> {
  try {
    const params = new URLSearchParams();
    if (platform && platform !== "all") params.set("platform", platform);
    if (platform === "all") params.set("limit", "100");

    const res = await fetch(`${API_BASE}/posts?${params.toString()}`, {
      credentials: "include",
    });

    if (!res.ok) {
      return { posts: emptyPosts, isLive: false };
    }

    const data = await res.json();
    const rawPosts = Array.isArray(data) ? data : data.posts ?? data.data ?? [];

    const mapped: Record<Platform, Post[]> = {
      instagram: [], facebook: [], linkedin: [], threads: [],
      tiktok: [], youtube: [], pinterest: [], bluesky: [],
      mastodon: [], x: [],
    };

    for (const raw of rawPosts) {
      const post = mapApiPostToPost(raw);
      if (mapped[post.platform]) {
        mapped[post.platform].push(post);
      }
    }

    return { posts: mapped, isLive: true };
  } catch {
    return { posts: emptyPosts, isLive: false };
  }
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
