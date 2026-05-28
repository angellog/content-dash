"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { LayoutGrid } from "lucide-react"
import { type Platform, PLATFORM_CONFIG } from "@/lib/omnisocial"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PlatformStats } from "@/components/social-manager/platform-stats"
import { PostCard } from "@/components/social-manager/post-card"
import { NewPostDialog } from "@/components/social-manager/new-post-dialog"

const MOCK_PLATFORM_STATS: Record<
  Platform,
  { totalPosts: number; scheduled: number; engagementRate: number; followerCount: number }
> = {
  instagram: { totalPosts: 42, scheduled: 18, engagementRate: 4.8, followerCount: 10400 },
  facebook: { totalPosts: 35, scheduled: 12, engagementRate: 3.2, followerCount: 8100 },
  linkedin: { totalPosts: 28, scheduled: 8, engagementRate: 5.1, followerCount: 3200 },
  threads: { totalPosts: 15, scheduled: 3, engagementRate: 2.8, followerCount: 1800 },
  tiktok: { totalPosts: 120, scheduled: 5, engagementRate: 2.1, followerCount: 5200 },
  youtube: { totalPosts: 22, scheduled: 4, engagementRate: 6.3, followerCount: 8900 },
  pinterest: { totalPosts: 56, scheduled: 9, engagementRate: 1.4, followerCount: 2400 },
  bluesky: { totalPosts: 8, scheduled: 2, engagementRate: 3.9, followerCount: 620 },
  mastodon: { totalPosts: 11, scheduled: 1, engagementRate: 4.2, followerCount: 380 },
  x: { totalPosts: 120, scheduled: 5, engagementRate: 2.1, followerCount: 5200 },
}

type MockPost = {
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
}

const MOCK_POSTS_BY_PLATFORM: Record<Platform, MockPost[]> = {
  instagram: [
    {
      id: "ig-1",
      caption: "Excited to announce our new product launch! Stay tuned for something amazing. #newproduct #launch",
      type: "Post",
      status: "Published",
      scheduledDate: "2026-05-27",
      likes: 245,
      comments: 18,
      shares: 32,
      platform: "instagram",
    },
    {
      id: "ig-2",
      caption: "Behind the scenes of our latest photoshoot",
      type: "Reel",
      status: "Published",
      scheduledDate: "2026-05-25",
      likes: 1243,
      comments: 89,
      shares: 156,
      platform: "instagram",
    },
    {
      id: "ig-3",
      caption: "We're going live tonight at 8 PM! Don't miss it",
      type: "Story",
      status: "Scheduled",
      scheduledDate: "2026-05-29",
      scheduledTime: "20:00",
      platform: "instagram",
    },
    {
      id: "ig-4",
      caption: "Swipe to see the transformation! Before & after",
      type: "Carousel",
      status: "Draft",
      platform: "instagram",
    },
    {
      id: "ig-5",
      caption: "Morning coffee and new ideas brewing. What's your creative routine? #creators",
      type: "Post",
      status: "Backlog",
      platform: "instagram",
    },
    {
      id: "ig-6",
      caption: "Quick tutorial: How to style your workspace for maximum productivity",
      type: "Reel",
      status: "Scheduled",
      scheduledDate: "2026-05-31",
      scheduledTime: "11:00",
      platform: "instagram",
    },
  ],
  facebook: [
    {
      id: "fb-1",
      caption: "Our community event is coming up this Saturday! RSVP now.",
      type: "Story",
      status: "Scheduled",
      scheduledDate: "2026-05-30",
      scheduledTime: "10:00",
      platform: "facebook",
    },
    {
      id: "fb-2",
      caption: "Happy Monday! Start your week with purpose and determination. #mondaymotivation",
      type: "Post",
      status: "Published",
      scheduledDate: "2026-05-27",
      likes: 156,
      comments: 23,
      shares: 45,
      platform: "facebook",
    },
    {
      id: "fb-3",
      caption: "Thank you to everyone who joined our webinar yesterday. The recording is now available!",
      type: "Post",
      status: "Published",
      scheduledDate: "2026-05-26",
      likes: 89,
      comments: 31,
      shares: 67,
      platform: "facebook",
    },
    {
      id: "fb-4",
      caption: "Throwback to our team retreat last month. Best crew ever.",
      type: "Reel",
      status: "Draft",
      platform: "facebook",
    },
    {
      id: "fb-5",
      caption: "Weekend vibes at the office. Who else works Saturdays? #startuplife",
      type: "Story",
      status: "Backlog",
      platform: "facebook",
    },
  ],
  linkedin: [
    {
      id: "li-1",
      caption: "Thrilled to share our latest industry insights on emerging tech trends. Read the full article on our blog.",
      type: "Post",
      status: "Published",
      scheduledDate: "2026-05-25",
      likes: 89,
      comments: 12,
      shares: 34,
      platform: "linkedin",
    },
    {
      id: "li-2",
      caption: "Key takeaways from this quarter's strategy meeting: innovation, growth, and collaboration.",
      type: "Post",
      status: "Draft",
      scheduledDate: "2026-05-23",
      platform: "linkedin",
    },
    {
      id: "li-3",
      caption: "Proud to announce our Series B funding round. Grateful for the incredible team that made this possible.",
      type: "Post",
      status: "Published",
      scheduledDate: "2026-05-22",
      likes: 234,
      comments: 45,
      shares: 89,
      platform: "linkedin",
    },
    {
      id: "li-4",
      caption: "Hiring alert: We're looking for a Senior Frontend Engineer. Apply now!",
      type: "Post",
      status: "Scheduled",
      scheduledDate: "2026-06-01",
      scheduledTime: "09:00",
      platform: "linkedin",
    },
    {
      id: "li-5",
      caption: "The future of remote work: 5 predictions for 2027",
      type: "Post",
      status: "Backlog",
      platform: "linkedin",
    },
  ],
  threads: [
    {
      id: "th-1",
      caption: "What's everyone building this week? Drop your projects below",
      type: "Post",
      status: "Published",
      scheduledDate: "2026-05-27",
      likes: 45,
      comments: 28,
      shares: 8,
      platform: "threads",
    },
    {
      id: "th-2",
      caption: "Hot take: AI won't replace creators, it'll amplify them",
      type: "Post",
      status: "Scheduled",
      scheduledDate: "2026-05-30",
      scheduledTime: "12:00",
      platform: "threads",
    },
    {
      id: "th-3",
      caption: "Building in public: Day 14 of our startup journey",
      type: "Post",
      status: "Draft",
      platform: "threads",
    },
    {
      id: "th-4",
      caption: "Top 5 tools we use daily as a remote team",
      type: "Carousel",
      status: "Backlog",
      platform: "threads",
    },
  ],
  tiktok: [
    {
      id: "tt-1",
      caption: "3 tips to boost your productivity that nobody talks about",
      type: "Video",
      status: "Scheduled",
      scheduledDate: "2026-05-31",
      scheduledTime: "14:00",
      platform: "tiktok",
    },
    {
      id: "tt-2",
      caption: "POV: When your code finally compiles on the first try",
      type: "Video",
      status: "Published",
      scheduledDate: "2026-05-28",
      likes: 3421,
      comments: 234,
      shares: 567,
      platform: "tiktok",
    },
    {
      id: "tt-3",
      caption: "Day in the life of a startup founder - unfiltered",
      type: "Reel",
      status: "Published",
      scheduledDate: "2026-05-26",
      likes: 5678,
      comments: 412,
      shares: 891,
      platform: "tiktok",
    },
    {
      id: "tt-4",
      caption: "How we grew from 0 to 10K followers in 30 days",
      type: "Video",
      status: "Draft",
      platform: "tiktok",
    },
    {
      id: "tt-5",
      caption: "React vs Vue in 60 seconds - which one wins?",
      type: "Reel",
      status: "Backlog",
      platform: "tiktok",
    },
  ],
  youtube: [
    {
      id: "yt-1",
      caption: "Full breakdown of our new feature release. Everything you need to know in 60 seconds.",
      type: "Short",
      status: "Published",
      scheduledDate: "2026-05-26",
      likes: 2134,
      comments: 156,
      shares: 89,
      platform: "youtube",
    },
    {
      id: "yt-2",
      caption: "Day in the life at our startup - raw and unfiltered",
      type: "Short",
      status: "Draft",
      scheduledDate: "2026-05-24",
      platform: "youtube",
    },
    {
      id: "yt-3",
      caption: "Behind the scenes of our latest product photoshoot",
      type: "Short",
      status: "Scheduled",
      scheduledDate: "2026-06-02",
      scheduledTime: "15:00",
      platform: "youtube",
    },
    {
      id: "yt-4",
      caption: "Q&A: Answering your most asked questions about our platform",
      type: "Short",
      status: "Backlog",
      platform: "youtube",
    },
  ],
  pinterest: [
    {
      id: "pt-1",
      caption: "Minimalist workspace setup for maximum focus",
      type: "Pin",
      status: "Published",
      scheduledDate: "2026-05-25",
      likes: 892,
      comments: 23,
      shares: 456,
      platform: "pinterest",
    },
    {
      id: "pt-2",
      caption: "Color palette inspiration: Earth tones edition",
      type: "Pin",
      status: "Published",
      scheduledDate: "2026-05-23",
      likes: 1243,
      comments: 67,
      shares: 789,
      platform: "pinterest",
    },
    {
      id: "pt-3",
      caption: "Step-by-step guide to creating branded templates",
      type: "Pin",
      status: "Scheduled",
      scheduledDate: "2026-05-30",
      scheduledTime: "16:00",
      platform: "pinterest",
    },
    {
      id: "pt-4",
      caption: "Infographic: Social media stats you need to know in 2026",
      type: "Pin",
      status: "Draft",
      platform: "pinterest",
    },
    {
      id: "pt-5",
      caption: "Product photography tips for small businesses",
      type: "Pin",
      status: "Backlog",
      platform: "pinterest",
    },
  ],
  bluesky: [
    {
      id: "bs-1",
      caption: "Just shipped v2.0 of our dashboard. The speed improvements are wild.",
      type: "Post",
      status: "Published",
      scheduledDate: "2026-05-27",
      likes: 34,
      comments: 8,
      shares: 12,
      platform: "bluesky",
    },
    {
      id: "bs-2",
      caption: "Decentralized social is the future. Here's why we're all in on Bluesky.",
      type: "Post",
      status: "Scheduled",
      scheduledDate: "2026-05-29",
      scheduledTime: "13:00",
      platform: "bluesky",
    },
    {
      id: "bs-3",
      caption: "Open source highlight of the week: AT Protocol",
      type: "Post",
      status: "Draft",
      platform: "bluesky",
    },
    {
      id: "bs-4",
      caption: "What features would you build with the Bluesky API?",
      type: "Post",
      status: "Backlog",
      platform: "bluesky",
    },
  ],
  mastodon: [
    {
      id: "ma-1",
      caption: "Our fediverse integration is live! Connect your Mastodon account today.",
      type: "Post",
      status: "Published",
      scheduledDate: "2026-05-26",
      likes: 56,
      comments: 14,
      shares: 23,
      platform: "mastodon",
    },
    {
      id: "ma-2",
      caption: "Tech ethics discussion: Building responsibly in the age of AI",
      type: "Post",
      status: "Scheduled",
      scheduledDate: "2026-05-31",
      scheduledTime: "17:00",
      platform: "mastodon",
    },
    {
      id: "ma-3",
      caption: "Community spotlight: Amazing projects built on the fediverse",
      type: "Post",
      status: "Draft",
      platform: "mastodon",
    },
    {
      id: "ma-4",
      caption: "Why we chose open source for our core infrastructure",
      type: "Post",
      status: "Backlog",
      platform: "mastodon",
    },
  ],
  x: [
    {
      id: "x-1",
      caption: "Big announcement dropping tomorrow. You're not ready.",
      type: "Post",
      status: "Scheduled",
      scheduledDate: "2026-05-29",
      scheduledTime: "09:00",
      platform: "x",
    },
    {
      id: "x-2",
      caption: "Just shipped something incredible. Thread below",
      type: "Post",
      status: "Published",
      scheduledDate: "2026-05-28",
      likes: 567,
      comments: 34,
      shares: 123,
      platform: "x",
    },
    {
      id: "x-3",
      caption: "Hot take: The best programming language is the one that ships your product.",
      type: "Post",
      status: "Published",
      scheduledDate: "2026-05-25",
      likes: 892,
      comments: 156,
      shares: 234,
      platform: "x",
    },
    {
      id: "x-4",
      caption: "Building in public: Week 3 update. MRR crossed $5K!",
      type: "Post",
      status: "Draft",
      platform: "x",
    },
    {
      id: "x-5",
      caption: "What's one tool you can't live without as a developer?",
      type: "Post",
      status: "Backlog",
      platform: "x",
    },
    {
      id: "x-6",
      caption: "Shipping our AI-powered scheduling feature next week. Sneak peek soon.",
      type: "Post",
      status: "Scheduled",
      scheduledDate: "2026-06-01",
      scheduledTime: "10:00",
      platform: "x",
    },
  ],
}

function PostGrid({ posts }: { posts: MockPost[] }) {
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
          <PostCard post={post} />
        </motion.div>
      ))}
    </>
  )
}

interface PlatformContentProps {
  platform: Platform
  onPostCreated?: (post: any) => void
}

export function PlatformContent({ platform, onPostCreated }: PlatformContentProps) {
  const [activeTab, setActiveTab] = useState("scheduled")
  const config = PLATFORM_CONFIG[platform]
  const stats = MOCK_PLATFORM_STATS[platform]
  const allPosts = MOCK_POSTS_BY_PLATFORM[platform]

  const tabPosts = useMemo(
    () => ({
      scheduled: allPosts.filter((p) => p.status === "Scheduled"),
      drafts: allPosts.filter((p) => p.status === "Draft"),
      published: allPosts.filter((p) => p.status === "Published"),
      backlog: allPosts.filter((p) => p.status === "Backlog"),
    }),
    [allPosts]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-1.5 w-10 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">
              {config.name}
            </h2>
            <p className="text-sm text-zinc-500">
              Manage your {config.name} content
            </p>
          </div>
        </div>
        <NewPostDialog activePlatform={platform} onPostCreated={onPostCreated} />
      </div>

      <PlatformStats platform={platform} stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="scheduled">
            Scheduled ({tabPosts.scheduled.length})
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts ({tabPosts.drafts.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({tabPosts.published.length})
          </TabsTrigger>
          <TabsTrigger value="backlog">
            Backlog ({tabPosts.backlog.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled">
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PostGrid posts={tabPosts.scheduled} />
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PostGrid posts={tabPosts.drafts} />
          </div>
        </TabsContent>

        <TabsContent value="published">
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PostGrid posts={tabPosts.published} />
          </div>
        </TabsContent>

        <TabsContent value="backlog">
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PostGrid posts={tabPosts.backlog} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
