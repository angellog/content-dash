export type LibraryPostStatus = "pending" | "approved" | "rejected" | "queued";

export interface LibraryPostMedia {
  id: number;
  post_id: number;
  position: number;
  storage_path: string;
  public_url: string | null;
  is_video: boolean;
}

export interface LibraryPost {
  id: number;
  instagram_id: string | null;
  caption: string;
  owner_name: string;
  is_carousel: boolean;
  media_count: number;
  status: LibraryPostStatus;
  brand: string | null;
  model: string | null;
  post_media: LibraryPostMedia[];
}

export interface LibraryStats {
  posts: number;
  media: number;
  pending: number;
  approved: number;
  queue_draft: number;
  queue_scheduled: number;
  queued: number;
  published: number;
}
