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

export interface AnalyticsData {
  followers: Record<Platform, { count: number; change: number }>;
  impressions: { date: string; value: number }[];
  engagement_rate: { date: string; value: number }[];
  top_posts: {
    id: string;
    platform: Platform;
    impressions: number;
    likes: number;
    comments: number;
    engagement_rate: number;
  }[];
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
  }): Promise<AnalyticsData> {
    const searchParams = new URLSearchParams();
    if (params?.platform) searchParams.set("platform", params.platform);
    if (params?.start_date) searchParams.set("start_date", params.start_date);
    if (params?.end_date) searchParams.set("end_date", params.end_date);
    const query = searchParams.toString();
    return this.request<AnalyticsData>(
      `/analytics${query ? `?${query}` : ""}`
    );
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

// Platform metadata
export const PLATFORM_CONFIG: Record<
  Platform,
  { name: string; color: string; icon: string; charLimit: number }
> = {
  instagram: { name: "Instagram", color: "#E4405F", icon: "instagram", charLimit: 2200 },
  facebook: { name: "Facebook", color: "#1877F2", icon: "facebook", charLimit: 63206 },
  linkedin: { name: "LinkedIn", color: "#0A66C2", icon: "linkedin", charLimit: 3000 },
  threads: { name: "Threads", color: "#000000", icon: "at-sign", charLimit: 500 },
  tiktok: { name: "TikTok", color: "#000000", icon: "music", charLimit: 2200 },
  youtube: { name: "YouTube", color: "#FF0000", icon: "youtube", charLimit: 5000 },
  pinterest: { name: "Pinterest", color: "#BD081C", icon: "pin", charLimit: 500 },
  bluesky: { name: "Bluesky", color: "#0085FF", icon: "cloud", charLimit: 300 },
  mastodon: { name: "Mastodon", color: "#6364FF", icon: "hash", charLimit: 500 },
  x: { name: "X (Twitter)", color: "#000000", icon: "twitter", charLimit: 280 },
};

export default OmniSocialClient;
