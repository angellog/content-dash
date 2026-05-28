"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type Platform,
  PLATFORM_CONFIG,
} from "@/lib/omnisocial"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PlatformStats } from "@/components/social-manager/platform-stats"
import { PostCard } from "@/components/social-manager/post-card"
import { NewPostDialog } from "@/components/social-manager/new-post-dialog"

const MOCK_POSTS: Array<{
  id: string
  caption: string
  type: string
  status: "Scheduled" | "Draft" | "Published" | "Backlog"
  scheduledDate?: string
  scheduledTime?: string
  likes?: number
  comments?: number
  shares?: number
  platform: Platform
}> = [
  {
    id: "p1",
    caption:
      "3 tips to boost your productivity that nobody talks about",
    type: "Reel",
    status: "Scheduled" as const,
    scheduledDate: "2026-05-31",
    scheduledTime: "14:00",
    platform: "tiktok",
  },
  {
    id: "p2",
    caption:
      "Our community event is coming up this Saturday! RSVP now.",
    type: "Story",
    status: "Scheduled" as const,
    scheduledDate: "2026-05-30",
    scheduledTime: "10:00",
    platform: "facebook",
  },
  {
    id: "p3",
    caption:
      "We're going live tonight at 8 PM! Don't miss it",
    type: "Story",
    status: "Scheduled" as const,
    scheduledDate: "2026-05-29",
    scheduledTime: "20:00",
    platform: "instagram",
  },
  {
    id: "p4",
    caption:
      "Big announcement dropping tomorrow. You're not ready.",
    type: "Post",
    status: "Scheduled" as const,
    scheduledDate: "2026-05-29",
    scheduledTime: "09:00",
    platform: "x",
  },
  {
    id: "p5",
    caption:
      "Just shipped something incredible. Thread below",
    type: "Post",
    status: "Published" as const,
    scheduledDate: "2026-05-28",
    likes: 567,
    comments: 34,
    shares: 123,
    platform: "x",
  },
  {
    id: "p6",
    caption:
      "POV: When your code finally compiles on the first try",
    type: "Video",
    status: "Published" as const,
    scheduledDate: "2026-05-28",
    likes: 3421,
    comments: 234,
    shares: 567,
    platform: "tiktok",
  },
  {
    id: "p7",
    caption:
      "Excited to announce our new product launch! Stay tuned for something amazing. #newproduct #launch",
    type: "Post",
    status: "Published" as const,
    scheduledDate: "2026-05-27",
    likes: 245,
    comments: 18,
    shares: 32,
    platform: "instagram",
  },
  {
    id: "p8",
    caption:
      "Happy Monday! Start your week with purpose and determination. #mondaymotivation",
    type: "Post",
    status: "Published" as const,
    scheduledDate: "2026-05-27",
    likes: 156,
    comments: 23,
    shares: 45,
    platform: "facebook",
  },
  {
    id: "p9",
    caption:
      "Full breakdown of our new feature release. Everything you need to know in 60 seconds.",
    type: "Short",
    status: "Published" as const,
    scheduledDate: "2026-05-26",
    likes: 2134,
    comments: 156,
    shares: 89,
    platform: "youtube",
  },
  {
    id: "p10",
    caption:
      "Behind the scenes of our latest photoshoot",
    type: "Reel",
    status: "Published" as const,
    scheduledDate: "2026-05-25",
    likes: 1243,
    comments: 89,
    shares: 156,
    platform: "instagram",
  },
  {
    id: "p11",
    caption:
      "Thrilled to share our latest industry insights on emerging tech trends. Read the full article on our blog.",
    type: "Post",
    status: "Published" as const,
    scheduledDate: "2026-05-25",
    likes: 89,
    comments: 12,
    shares: 34,
    platform: "linkedin",
  },
  {
    id: "p12",
    caption:
      "Swipe to see the transformation! Before & after",
    type: "Carousel",
    status: "Draft" as const,
    scheduledDate: "2026-05-24",
    platform: "instagram",
  },
  {
    id: "p13",
    caption:
      "Day in the life at our startup - raw and unfiltered",
    type: "Short",
    status: "Draft" as const,
    scheduledDate: "2026-05-24",
    platform: "youtube",
  },
  {
    id: "p14",
    caption:
      "Key takeaways from this quarter's strategy meeting: innovation, growth, and collaboration.",
    type: "Post",
    status: "Draft" as const,
    scheduledDate: "2026-05-23",
    platform: "linkedin",
  },
]

const MOCK_ALL_STATS = {
  totalPosts: 156,
  scheduled: 23,
  engagementRate: 4.7,
  followerCount: 48732,
}

const UNIQUE_PLATFORMS = [...new Set(MOCK_POSTS.map((p) => p.platform))]

interface AllPlatformsViewProps {
  onPostCreated?: (post: any) => void
}

function PostGrid({
  posts,
  onEdit,
  onDelete,
  onReschedule,
}: {
  posts: typeof MOCK_POSTS
  onEdit: (post: any) => void
  onDelete: (post: any) => void
  onReschedule: (post: any) => void
}) {
  if (posts.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-16 text-zinc-600">
        <LayoutGrid className="mb-2 size-8" />
        <p className="text-sm">No posts found</p>
      </div>
    )
  }

  return (
    <>
      {posts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: i * 0.03 }}
        >
          <PostCard
            post={post}
            onEdit={onEdit}
            onDelete={onDelete}
            onReschedule={onReschedule}
          />
        </motion.div>
      ))}
    </>
  )
}

export function AllPlatformsView({ onPostCreated }: AllPlatformsViewProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [platformFilters, setPlatformFilters] = useState<Set<Platform>>(
    new Set(UNIQUE_PLATFORMS)
  )

  const platformFiltered = useMemo(() => {
    if (platformFilters.size === UNIQUE_PLATFORMS.length) return MOCK_POSTS
    return MOCK_POSTS.filter((p) => platformFilters.has(p.platform))
  }, [platformFilters])

  const tabPosts = useMemo(
    () => ({
      all: platformFiltered,
      scheduled: platformFiltered.filter((p) => p.status === "Scheduled"),
      drafts: platformFiltered.filter((p) => p.status === "Draft"),
      published: platformFiltered.filter((p) => p.status === "Published"),
    }),
    [platformFiltered]
  )

  const toggleFilter = (platform: Platform) => {
    setPlatformFilters((prev) => {
      const next = new Set(prev)
      if (next.has(platform)) next.delete(platform)
      else next.add(platform)
      return next
    })
  }

  const handleEdit = (id: string) => console.log("Edit post:", id)
  const handleDelete = (id: string) => console.log("Delete post:", id)
  const handleReschedule = (id: string) => console.log("Reschedule post:", id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">
            All Platforms
          </h2>
          <p className="text-sm text-zinc-500">
            Unified view across all connected accounts
          </p>
        </div>
        <NewPostDialog activePlatform="all" onPostCreated={onPostCreated} />
      </div>

      <PlatformStats platform="all" stats={MOCK_ALL_STATS} />

      <div className="flex flex-wrap gap-2">
        {UNIQUE_PLATFORMS.map((platform) => {
          const config = PLATFORM_CONFIG[platform]
          const isActive = platformFilters.has(platform)
          return (
            <button
              key={platform}
              onClick={() => toggleFilter(platform)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                isActive
                  ? "border-transparent text-white shadow-sm"
                  : "border-zinc-800 text-zinc-600 hover:text-zinc-400"
              )}
              style={isActive ? { backgroundColor: config.color + "25" } : undefined}
            >
              <span
                className={cn(
                  "size-2 rounded-full transition-opacity",
                  isActive ? "opacity-100" : "opacity-40"
                )}
                style={{ backgroundColor: config.color }}
              />
              {config.name}
            </button>
          )
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All Posts ({tabPosts.all.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({tabPosts.scheduled.length})
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts ({tabPosts.drafts.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({tabPosts.published.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PostGrid
              posts={tabPosts.all}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReschedule={handleReschedule}
            />
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PostGrid
              posts={tabPosts.scheduled}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReschedule={handleReschedule}
            />
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PostGrid
              posts={tabPosts.drafts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReschedule={handleReschedule}
            />
          </div>
        </TabsContent>

        <TabsContent value="published">
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PostGrid
              posts={tabPosts.published}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReschedule={handleReschedule}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
