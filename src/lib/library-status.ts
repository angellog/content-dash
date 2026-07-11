import type { PostStatus } from "@/types/social";

export type PublishStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

export interface EffectivePublishStatus {
  /** Social Manager's 4-value kanban bucket this publish_status collapses into. */
  kanbanStatus: PostStatus;
  /** Precise, non-lossy label for badges — distinct from kanbanStatus where it
   *  matters (e.g. "Publishing…" and "Failed" both exist even though both
   *  bucket into scheduled/backlog for kanban placement). */
  label: string;
  badgeClassName: string;
  isFailed: boolean;
}

const PUBLISH_STATUS_MAP: Record<PublishStatus, EffectivePublishStatus> = {
  draft: {
    kanbanStatus: "draft",
    label: "Draft",
    badgeClassName: "bg-yellow-500/20 text-yellow-400",
    isFailed: false,
  },
  scheduled: {
    kanbanStatus: "scheduled",
    label: "Scheduled",
    badgeClassName: "bg-blue-500/20 text-blue-400",
    isFailed: false,
  },
  publishing: {
    kanbanStatus: "scheduled",
    label: "Publishing…",
    badgeClassName: "bg-indigo-500/20 text-indigo-400",
    isFailed: false,
  },
  published: {
    kanbanStatus: "published",
    label: "Published",
    badgeClassName: "bg-green-500/20 text-green-400",
    isFailed: false,
  },
  failed: {
    kanbanStatus: "backlog",
    label: "Failed",
    badgeClassName: "bg-red-500/20 text-red-400",
    isFailed: true,
  },
};

// Single source of truth for translating feetbit-content-library's
// post_queue.publish_status into what content-dash shows — used by both
// Social Manager (kanban bucket) and the Library page (substatus badge) so
// the two pages can never independently drift on what a given publish_status
// means.
export function mapPublishStatus(publishStatus: PublishStatus): EffectivePublishStatus {
  return PUBLISH_STATUS_MAP[publishStatus];
}
