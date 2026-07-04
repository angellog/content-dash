// OmniSocial API Client - Brain Engine for Content Dashboard
// API Base: https://api.omnisocials.com/v1/
// Auth: Bearer token
// Rate Limit: 100 req/min per API key

export const OMNISOCIAL_API_BASE = "https://api.omnisocials.com/v1";

export type Platform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "threads"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "bluesky"
  | "mastodon"
  | "x";

export type PostStatus = "queued" | "published" | "failed" | "scheduled" | "draft";

export interface OmniSocialPost {
  id: string;
  text: string;
  media?: string[];
  platforms: Record<Platform, PostStatus>;
  status: PostStatus;
  scheduled_at?: string;
  created_at: string;
}

export interface CreatePostPayload {
  text: string;
  media?: string[];
  platforms: Platform[];
  scheduled_at?: string;
}

// Real shape of GET /v1/analytics/overview — an aggregate summary, not a
// time series. Per-post metrics require a separate call to
// GET /v1/analytics/posts?ids=<post ids from GET /v1/posts>.
export interface AnalyticsOverview {
  total_posts: number;
  total_platforms: number;
  total_engagement: number;
  total_impressions: number;
  average_engagement_rate: number;
  top_performing_platform: string | null;
  platform_breakdown: Record<
    string,
    { posts?: number; impressions?: number; engagement?: number; engagement_rate?: number }
  >;
}

export interface PostAnalytics {
  id: string;
  impressions?: number;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  engagement_rate?: number;
}

export interface WebhookEvent {
  event: "post.published" | "post.failed" | "post.engagement";
  data: OmniSocialPost & { errors?: Record<string, string> };
}

class OmniSocialClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_OMNISOCIAL_API_KEY || "";
    this.baseUrl = OMNISOCIAL_API_BASE;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new OmniSocialError(
        error.message || `API Error: ${response.status}`,
        response.status,
        error
      );
    }

    const json = await response.json();
    return json.data || json;
  }

  // Posts
  async createPost(payload: CreatePostPayload): Promise<OmniSocialPost> {
    return this.request<OmniSocialPost>("/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async createBulkPosts(posts: CreatePostPayload[]): Promise<OmniSocialPost[]> {
    return this.request<OmniSocialPost[]>("/posts", {
      method: "POST",
      body: JSON.stringify({ posts }),
    });
  }

  async getPost(id: string): Promise<OmniSocialPost> {
    return this.request<OmniSocialPost>(`/posts/${id}`);
  }

  async getPosts(params?: {
    status?: PostStatus;
    platform?: Platform;
    limit?: number;
    offset?: number;
  }): Promise<OmniSocialPost[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.platform) searchParams.set("platform", params.platform);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));
    const query = searchParams.toString();
    return this.request<OmniSocialPost[]>(`/posts${query ? `?${query}` : ""}`);
  }

  async deletePost(id: string): Promise<void> {
    await this.request(`/posts/${id}`, { method: "DELETE" });
  }

  async updatePost(
    id: string,
    payload: Partial<CreatePostPayload>
  ): Promise<OmniSocialPost> {
    return this.request<OmniSocialPost>(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  // Media
  async uploadMedia(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append("file", file);
    const url = `${this.baseUrl}/media/upload`;
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });
    if (!response.ok) throw new Error("Media upload failed");
    const json = await response.json();
    return json.data;
  }

  // Accounts
  async getAccounts(): Promise<
    { platform: Platform; username: string; status: string; id: string }[]
  > {
    return this.request("/accounts");
  }

  // Analytics
  async getAnalytics(params?: {
    platform?: Platform;
    start_date?: string;
    end_date?: string;
  }): Promise<AnalyticsOverview> {
    const searchParams = new URLSearchParams();
    if (params?.platform) searchParams.set("platform", params.platform);
    if (params?.start_date) searchParams.set("start_date", params.start_date);
    if (params?.end_date) searchParams.set("end_date", params.end_date);
    const query = searchParams.toString();
    return this.request<AnalyticsOverview>(
      `/analytics/overview${query ? `?${query}` : ""}`
    );
  }

  async getPostAnalytics(ids: string[]): Promise<PostAnalytics[]> {
    return this.request(`/analytics/posts?ids=${ids.join(",")}`);
  }

  // Configuration
  setApiKey(key: string) {
    this.apiKey = key;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }
}

export class OmniSocialError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "OmniSocialError";
    this.status = status;
    this.details = details;
  }
}

// Singleton instance
export const omnisocial = new OmniSocialClient();

export interface PlatformFeatures {
  stories: boolean;
  reels: boolean;
  carousel: boolean;
  video: boolean;
  linkPreviews: boolean;
}

export interface PlatformConfig {
  name: string;
  color: string;
  charLimit: number;
  postTypes: string[];
  features: PlatformFeatures;
  connected: boolean;
  gradient: string;
  order: number;
}

export const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  instagram: {
    name: "Instagram", color: "#E4405F", charLimit: 2200,
    postTypes: ["Post", "Reel", "Story", "Carousel"],
    features: { stories: true, reels: true, carousel: true, video: true, linkPreviews: false },
    connected: true,
    gradient: "from-pink-500 via-red-500 to-yellow-500",
    order: 0,
  },
  facebook: {
    name: "Facebook", color: "#1877F2", charLimit: 63206,
    postTypes: ["Post", "Story", "Reel"],
    features: { stories: true, reels: true, carousel: true, video: true, linkPreviews: true },
    connected: true,
    gradient: "from-blue-600 to-blue-500",
    order: 1,
  },
  linkedin: {
    name: "LinkedIn", color: "#0A66C2", charLimit: 3000,
    postTypes: ["Post"],
    features: { stories: false, reels: false, carousel: false, video: true, linkPreviews: true },
    connected: true,
    gradient: "from-blue-700 to-blue-600",
    order: 2,
  },
  threads: {
    name: "Threads", color: "#000000", charLimit: 500,
    postTypes: ["Post", "Carousel"],
    features: { stories: false, reels: false, carousel: true, video: true, linkPreviews: false },
    connected: false,
    gradient: "from-zinc-800 to-zinc-700",
    order: 3,
  },
  tiktok: {
    name: "TikTok", color: "#000000", charLimit: 2200,
    postTypes: ["Video", "Reel"],
    features: { stories: false, reels: true, carousel: false, video: true, linkPreviews: false },
    connected: false,
    gradient: "from-zinc-900 via-red-600 to-zinc-900",
    order: 4,
  },
  youtube: {
    name: "YouTube", color: "#FF0000", charLimit: 5000,
    postTypes: ["Short"],
    features: { stories: false, reels: false, carousel: false, video: true, linkPreviews: true },
    connected: false,
    gradient: "from-red-600 to-red-500",
    order: 5,
  },
  pinterest: {
    name: "Pinterest", color: "#BD081C", charLimit: 500,
    postTypes: ["Pin"],
    features: { stories: false, reels: false, carousel: false, video: true, linkPreviews: true },
    connected: false,
    gradient: "from-red-700 to-red-600",
    order: 6,
  },
  bluesky: {
    name: "Bluesky", color: "#0085FF", charLimit: 300,
    postTypes: ["Post"],
    features: { stories: false, reels: false, carousel: false, video: true, linkPreviews: false },
    connected: false,
    gradient: "from-sky-500 to-blue-500",
    order: 7,
  },
  mastodon: {
    name: "Mastodon", color: "#6364FF", charLimit: 500,
    postTypes: ["Post"],
    features: { stories: false, reels: false, carousel: false, video: true, linkPreviews: true },
    connected: false,
    gradient: "from-indigo-600 to-purple-600",
    order: 8,
  },
  x: {
    name: "X (Twitter)", color: "#1DA1F2", charLimit: 280,
    postTypes: ["Post"],
    features: { stories: false, reels: false, carousel: false, video: true, linkPreviews: true },
    connected: false,
    gradient: "from-sky-400 to-zinc-800",
    order: 9,
  },
};

export const PLATFORM_ORDER: Platform[] = Object.entries(PLATFORM_CONFIG)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([key]) => key as Platform);

export const CONNECTED_PLATFORMS: Platform[] = PLATFORM_ORDER.filter(
  (p) => PLATFORM_CONFIG[p].connected
);

export default OmniSocialClient;
