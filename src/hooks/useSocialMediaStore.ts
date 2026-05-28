import { create } from "zustand";
import { Platform, Post, PostStatus } from "@/types/social";
import { initialSocialPosts } from "@/lib/data/social";
import { CONNECTED_PLATFORMS } from "@/lib/omnisocial";

type ViewMode = "status" | "platform";

interface SocialMediaStore {
  posts: Record<Platform, Post[]>;
  activePlatform: Platform | "all";
  viewMode: ViewMode;

  setActivePlatform: (platform: Platform | "all") => void;
  setViewMode: (mode: ViewMode) => void;
  addPost: (platform: Platform, post: Omit<Post, "id">) => void;
  updatePost: (platform: Platform, id: string, updates: Partial<Post>) => void;
  deletePost: (platform: Platform, id: string) => void;
  getPostsByStatus: (platform: Platform | "all", status: PostStatus) => Post[];
  getAllPosts: () => Post[];
}

export const useSocialMediaStore = create<SocialMediaStore>((set, get) => ({
  posts: initialSocialPosts,
  activePlatform: CONNECTED_PLATFORMS[0] || "instagram",
  viewMode: "status" as ViewMode,

  setActivePlatform: (platform) => set({ activePlatform: platform }),

  setViewMode: (mode) => set({ viewMode: mode }),

  addPost: (platform, post) =>
    set((state) => ({
      posts: {
        ...state.posts,
        [platform]: [
          { ...post, id: `${platform.slice(0, 2)}-${Date.now()}` },
          ...state.posts[platform],
        ],
      },
    })),

  updatePost: (platform, id, updates) =>
    set((state) => ({
      posts: {
        ...state.posts,
        [platform]: state.posts[platform].map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      },
    })),

  deletePost: (platform, id) =>
    set((state) => ({
      posts: {
        ...state.posts,
        [platform]: state.posts[platform].filter((p) => p.id !== id),
      },
    })),

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
}));
