import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LibraryPost, LibraryStats, LibraryTarget } from "@/types/library";

export interface LibraryQueueItem {
  id: number;
  rewritten_caption: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  publish_status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  error_message: string | null;
  posts: { id: number } | null;
  target: { ig_username: string } | null;
}

export const libraryKeys = {
  posts: (status: string, search: string) => ["library", "posts", status, search] as const,
  queue: () => ["library", "queue"] as const,
  stats: () => ["library", "stats"] as const,
  targets: () => ["library", "targets"] as const,
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request to content library failed");
  return data;
}

export function useLibraryPosts(status: string, search: string) {
  return useQuery({
    queryKey: libraryKeys.posts(status, search),
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "40" });
      if (status !== "all") params.set("status", status);
      if (search) params.set("search", search);
      const data = await fetchJson<{ posts: LibraryPost[] }>(
        `/api/library/posts?${params.toString()}`
      );
      return data.posts ?? [];
    },
  });
}

export function useLibraryQueue() {
  return useQuery({
    queryKey: libraryKeys.queue(),
    queryFn: async () => {
      const data = await fetchJson<{ queue: LibraryQueueItem[] }>(
        "/api/library/queue?limit=100"
      );
      return data.queue ?? [];
    },
  });
}

export function useLibraryStats() {
  return useQuery({
    queryKey: libraryKeys.stats(),
    queryFn: () => fetchJson<LibraryStats>("/api/library/stats"),
  });
}

export function useLibraryTargets() {
  return useQuery({
    queryKey: libraryKeys.targets(),
    queryFn: async () => {
      const data = await fetchJson<{ targets: LibraryTarget[] }>("/api/library/targets");
      return data.targets ?? [];
    },
  });
}

export function useApprovePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number; status: "approved" | "rejected" }) =>
      fetchJson("/api/library/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library", "posts"] });
      queryClient.invalidateQueries({ queryKey: libraryKeys.stats() });
    },
  });
}

export function useCancelQueueItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchJson("/api/library/queue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.queue() });
      queryClient.invalidateQueries({ queryKey: ["library", "posts"] });
      queryClient.invalidateQueries({ queryKey: libraryKeys.stats() });
    },
  });
}

export function useQueuePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      post_id: number;
      target_id: number;
      rewritten_caption: string | null;
      scheduled_at: string | null;
    }) =>
      fetchJson("/api/library/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      // Invalidating the queue key is what fixes the old bug where the
      // substatus badge didn't appear until a manual page reload — React
      // Query refetches automatically on invalidation, no manual re-fetch
      // call needed anywhere that queues a post.
      queryClient.invalidateQueries({ queryKey: libraryKeys.queue() });
      queryClient.invalidateQueries({ queryKey: ["library", "posts"] });
      queryClient.invalidateQueries({ queryKey: libraryKeys.stats() });
    },
  });
}
