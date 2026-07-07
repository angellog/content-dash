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

export type PostStatus = "scheduled" | "draft" | "published" | "backlog";

export type OmniSocialSyncStatus = "synced" | "pending" | "error";

export type PostSource = "omnisocial" | "library";

export interface Post {
  id: string;
  caption: string;
  type: string;
  status: PostStatus;
  platform: Platform;
  scheduledDate?: string;
  scheduledTime?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  hashtags?: string[];
  link?: string;
  videoDuration?: string;
  isThread?: boolean;
  omnisocialStatus?: OmniSocialSyncStatus;
  source?: PostSource;
  libraryQueueId?: number;
  targetUsername?: string;
  mediaUrl?: string;
}

export const PLATFORMS: Platform[] = [
  "instagram",
  "facebook",
  "linkedin",
  "threads",
  "tiktok",
  "youtube",
  "pinterest",
  "bluesky",
  "mastodon",
  "x",
];

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  threads: "Threads",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
  x: "X",
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  threads: "#000000",
  tiktok: "#00F2EA",
  youtube: "#FF0000",
  pinterest: "#BD081C",
  bluesky: "#0085FF",
  mastodon: "#6364FF",
  x: "#1DA1F2",
};
