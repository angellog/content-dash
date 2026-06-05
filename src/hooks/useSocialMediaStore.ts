import { create } from "zustand";
import { Platform, Post, PostStatus } from "@/types/social";
import { initialSocialPosts } from "@/lib/data/social";
import { CONNECTED_PLATFORMS } from "@/lib/omnisocial";
import {
  fetchPostsFromApi,
  createPostViaApi,
  deletePostViaApi,
  SyncState,
} from "@/lib/api/social";

type ViewMode = "status" | "platform";

interface SocialMediaStore {
  posts: Record<Platform, Post[]>;
  activePlatform: Platform | "all";
  viewMode: ViewMode;
  syncState: SyncState;
  isLoading: boolean;

  setActivePlatform: (platform: Platform | "all") => void;
  setViewMode: (mode: ViewMode) => void;
  addPost: (platform: Platform, post: Omit<Post, "id">) => void;
  updatePost: (platform: Platform, id: string, updates: Partial<Post>) => void;
  deletePost: (platform: Platform, id: string) => void;
  getPostsByStatus: (platform: Platform | "all", status: PostStatus) => Post[];
  getAllPosts: () => Post[];
  fetchPosts: (platform?: Platform | "all") => Promise<void>;
  syncFromOmniSocial: () => Promise<void>;
}

export const useSocialMediaStore = create<SocialMediaStore>((set, get) => ({
  posts: process.env.NODE_ENV === "development" ? initialSocialPosts : ({} as Record<Platform, Post[]>),
  activePlatform: CONNECTED_PLATFORMS[0] || "instagram",
  viewMode: "status" as ViewMode,
  syncState: { isLive: false, lastSyncedAt: null, error: null },
  isLoading: false,

  setActivePlatform: (platform) => set({ activePlatform: platform }),

  setViewMode: (mode) => set({ viewMode: mode }),

  addPost: async (platform, post) => {
    try {
      const { success, post: created } = await createPostViaApi({
        text: post.caption,
        platforms: [platform],
        scheduled_at: post.scheduledDate ? `${post.scheduledDate}T${post.scheduledTime || "12:00"}` : undefined,
      });
      set((state) => ({
        posts: {
          ...state.posts,
          [platform]: [
            success && created ? created : { ...post, id: `${platform.slice(0, 2)}-${Date.now()}` },
            ...state.posts[platform],
          ],
        },
      }));
    } catch {
      set((state) => ({
        posts: {
          ...state.posts,
          [platform]: [
            { ...post, id: `${platform.slice(0, 2)}-${Date.now()}` },
            ...state.posts[platform],
          ],
        },
      }));
    }
  },

  updatePost: (platform, id, updates) =>
    set((state) => ({
      posts: {
        ...state.posts,
        [platform]: state.posts[platform].map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      },
    })),

  deletePost: async (platform, id) => {
    try {
      await deletePostViaApi(id);
    } catch {}
    set((state) => ({
      posts: {
        ...state.posts,
        [platform]: state.posts[platform].filter((p) => p.id !== id),
      },
    }));
  },

  getPostsByStatus: (platform, status) => {
    const state = get();
    if (platform === "all") {
      return Object.values(state.posts).flat().filter((p) => p.status === status);
    }
    return state.posts[platform]?.filter((p) => p.status === status) || [];
  },

  getAllPosts: () => {
    const state = get();
    return Object.values(state.posts).flat();
  },

  fetchPosts: async (platform) => {
    set({ isLoading: true });
    const { posts, isLive } = await fetchPostsFromApi(platform);
    set({
      posts,
      syncState: { isLive, lastSyncedAt: isLive ? new Date() : null, error: null },
      isLoading: false,
    });
  },

  syncFromOmniSocial: async () => {
    set((state) => ({ isLoading: true, syncState: { ...state.syncState, error: null } }));
    const { posts, isLive } = await fetchPostsFromApi();
    set({
      posts,
      syncState: { isLive, lastSyncedAt: isLive ? new Date() : null, error: isLive ? null : "Using demo data — connect OmniSocial in Settings" },
      isLoading: false,
    });
  },
}));
