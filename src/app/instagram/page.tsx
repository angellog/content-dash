"use client"

import { useState } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Image,
} from "lucide-react"

// Custom Instagram SVG icon because of library compatibility
const Instagram = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)
import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PostType = "Post" | "Reel" | "Story" | "Carousel"
type PostStatus = "Scheduled" | "Draft" | "Published" | "Backlog"

interface InstagramPost {
  id: string
  caption: string
  type: PostType
  status: PostStatus
  scheduledDate?: string
  scheduledTime?: string
  likes?: number
  comments?: number
  shares?: number
  gradient: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusColors: Record<PostStatus, string> = {
  Scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Draft: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Published: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Backlog: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
}

const typeColors: Record<PostType, string> = {
  Post: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  Reel: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Story: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  Carousel: "bg-orange-500/20 text-orange-400 border-orange-500/30",
}

const gradients = [
  "from-purple-600 via-pink-500 to-orange-400",
  "from-blue-500 via-cyan-400 to-teal-400",
  "from-pink-500 via-rose-400 to-red-400",
  "from-indigo-600 via-purple-500 to-pink-400",
  "from-amber-400 via-orange-500 to-red-500",
  "from-emerald-500 via-teal-400 to-cyan-400",
  "from-violet-600 via-fuchsia-500 to-pink-400",
  "from-sky-500 via-blue-500 to-indigo-500",
]

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const scheduledPosts: InstagramPost[] = [
  {
    id: "s1",
    caption:
      "Excited to share our latest product launch! Stay tuned for something amazing dropping this Friday. #NewProduct #ComingSoon #Innovation",
    type: "Reel",
    status: "Scheduled",
    scheduledDate: "2026-05-25",
    scheduledTime: "10:00 AM",
    gradient: gradients[0],
  },
  {
    id: "s2",
    caption:
      "Behind the scenes of our team retreat. Nothing beats fresh mountain air and great conversations. #TeamBuilding #BTS #CompanyCulture",
    type: "Carousel",
    status: "Scheduled",
    scheduledDate: "2026-05-26",
    scheduledTime: "2:30 PM",
    gradient: gradients[1],
  },
  {
    id: "s3",
    caption:
      "Monday motivation: Every expert was once a beginner. Keep pushing forward! #MondayMotivation #GrowthMindset",
    type: "Post",
    status: "Scheduled",
    scheduledDate: "2026-05-27",
    scheduledTime: "8:00 AM",
    gradient: gradients[2],
  },
  {
    id: "s4",
    caption:
      "Quick tutorial: How to create the perfect morning routine in just 5 steps. Swipe to learn more. #LifeHacks #MorningRoutine #Productivity",
    type: "Carousel",
    status: "Scheduled",
    scheduledDate: "2026-05-28",
    scheduledTime: "12:00 PM",
    gradient: gradients[3],
  },
  {
    id: "s5",
    caption:
      "Summer collection preview! These pieces are going to be your new favorites. #SummerVibes #Fashion #NewCollection",
    type: "Story",
    status: "Scheduled",
    scheduledDate: "2026-05-29",
    scheduledTime: "6:00 PM",
    gradient: gradients[4],
  },
]

const draftPosts: InstagramPost[] = [
  {
    id: "d1",
    caption:
      "Working on something big... Can't wait to share it with you all! #StayTuned #ComingSoon",
    type: "Post",
    status: "Draft",
    gradient: gradients[5],
  },
  {
    id: "d2",
    caption:
      "Recipe time! Our signature smoothie bowl that keeps you energized all day. Full recipe in the caption. #HealthyEating #Recipes",
    type: "Reel",
    status: "Draft",
    gradient: gradients[6],
  },
  {
    id: "d3",
    caption:
      "5 tips for better sleep that actually work. Your future self will thank you. #Wellness #SleepBetter #HealthTips",
    type: "Carousel",
    status: "Draft",
    gradient: gradients[7],
  },
  {
    id: "d4",
    caption:
      "Meet the team behind the magic. Introducing our newest member who brings incredible energy to everything we do! #TeamGrowth #Welcome",
    type: "Story",
    status: "Draft",
    gradient: gradients[0],
  },
]

const publishedPosts: InstagramPost[] = [
  {
    id: "p1",
    caption:
      "Just launched our new website! Link in bio. Thank you for all the incredible support on this journey. #WebDesign #Launch #Milestone",
    type: "Post",
    status: "Published",
    likes: 1243,
    comments: 87,
    shares: 156,
    gradient: gradients[3],
  },
  {
    id: "p2",
    caption:
      "Throwback to our first office space vs. where we are now. Growth is beautiful when you look back at where you started. #GlowUp #Growth",
    type: "Carousel",
    status: "Published",
    likes: 2891,
    comments: 203,
    shares: 412,
    gradient: gradients[1],
  },
  {
    id: "p3",
    caption:
      "Day in the life of a startup founder. It's not always glamorous but it's always worth it. #StartupLife #Entrepreneurship #BTS",
    type: "Reel",
    status: "Published",
    likes: 5672,
    comments: 341,
    shares: 789,
    gradient: gradients[6],
  },
  {
    id: "p4",
    caption:
      "Thank you for 10K followers! You all are the reason we keep creating. Here's to the next milestone together! #10K #Community",
    type: "Story",
    status: "Published",
    likes: 3456,
    comments: 298,
    shares: 167,
    gradient: gradients[4],
  },
  {
    id: "p5",
    caption:
      "Our Q2 results are in and we're thrilled! Read the full breakdown on our blog. #Growth #BusinessUpdate #Q2Results",
    type: "Post",
    status: "Published",
    likes: 987,
    comments: 64,
    shares: 231,
    gradient: gradients[2],
  },
]

const backlogPosts: InstagramPost[] = [
  {
    id: "b1",
    caption:
      "Idea: Partner spotlight series featuring our amazing collaborators and the incredible work they do. #Collaboration #PartnerSpotlight",
    type: "Post",
    status: "Backlog",
    gradient: gradients[7],
  },
  {
    id: "b2",
    caption:
      "Concept: Time-lapse of our product being made from scratch, showing every step of the process. #BehindTheScenes #Manufacturing",
    type: "Reel",
    status: "Backlog",
    gradient: gradients[5],
  },
  {
    id: "b3",
    caption:
      "Draft: User testimonials compilation with before/after results. Real stories from real customers. #SocialProof #Testimonials",
    type: "Carousel",
    status: "Backlog",
    gradient: gradients[0],
  },
  {
    id: "b4",
    caption:
      "Idea: Weekly Q&A sessions with the founder. Let your audience ask anything and build deeper connections. #AskMeAnything #Community",
    type: "Story",
    status: "Backlog",
    gradient: gradients[3],
  },
]

const allPlatforms = ["Instagram", "Facebook", "X / Twitter", "TikTok"]

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PostCard({ post }: { post: InstagramPost }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900 ring-zinc-800">
      {/* Image placeholder */}
      <div
        className={cn(
          "relative flex h-44 items-center justify-center bg-gradient-to-br",
          post.gradient
        )}
      >
        <Instagram className="size-10 text-white/60" />
        <div className="absolute top-2 right-2 flex gap-1.5">
          <Badge className={cn("border", typeColors[post.type])}>
            {post.type}
          </Badge>
        </div>
      </div>

      {/* Caption */}
      <CardContent className="pt-3">
        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-300">
          {post.caption}
        </p>
      </CardContent>

      {/* Meta info */}
      <CardContent className="flex flex-wrap items-center gap-2 pt-0">
        <Badge className={cn("border", statusColors[post.status])}>
          {post.status}
        </Badge>

        {post.scheduledDate && (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
            <Clock className="size-3" />
            {post.scheduledDate} {post.scheduledTime}
          </span>
        )}
      </CardContent>

      {/* Engagement metrics (published only) */}
      {post.status === "Published" && (
        <CardContent className="flex items-center gap-4 pt-0 text-zinc-400">
          <span className="inline-flex items-center gap-1 text-xs">
            <Heart className="size-3.5 text-rose-400" />
            {formatNumber(post.likes!)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs">
            <MessageCircle className="size-3.5 text-sky-400" />
            {formatNumber(post.comments!)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs">
            <Share2 className="size-3.5 text-emerald-400" />
            {formatNumber(post.shares!)}
          </span>
        </CardContent>
      )}

      {/* Actions */}
      <CardFooter className="gap-2 border-zinc-800 bg-zinc-900/60">
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
          <Edit className="size-3.5" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
          <Trash2 className="size-3.5" />
          Delete
        </Button>
        {post.status !== "Published" && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-zinc-400 hover:text-white"
          >
            <Calendar className="size-3.5" />
            Reschedule
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function PostGrid({ posts }: { posts: InstagramPost[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-900 ring-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-400">{label}</p>
          <Icon className="size-4 text-zinc-500" />
        </div>
        <CardTitle className="text-2xl font-bold text-white">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function InstagramPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "Instagram",
  ])

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  const totalPosts =
    scheduledPosts.length +
    draftPosts.length +
    publishedPosts.length +
    backlogPosts.length

  return (
    <div className="min-h-screen bg-zinc-950 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* Page Header                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
              <Instagram className="size-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Instagram Manager
            </h1>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" />
              New Post
            </DialogTrigger>

            {/* -------------------------------------------------------------- */}
            {/* New Post Dialog                                                 */}
            {/* -------------------------------------------------------------- */}
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Caption */}
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="Write your caption here..."
                    className="min-h-24 border-zinc-800 bg-zinc-900"
                  />
                </div>

                {/* Post type */}
                <div className="space-y-2">
                  <Label>Post Type</Label>
                  <Select defaultValue="Post">
                    <SelectTrigger className="w-full border-zinc-800 bg-zinc-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Post">Post</SelectItem>
                      <SelectItem value="Reel">Reel</SelectItem>
                      <SelectItem value="Story">Story</SelectItem>
                      <SelectItem value="Carousel">Carousel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Schedule date / time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-date">Date</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      className="border-zinc-800 bg-zinc-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-time">Time</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      className="border-zinc-800 bg-zinc-900"
                    />
                  </div>
                </div>

                {/* Platforms */}
                <div className="space-y-2">
                  <Label>Platforms</Label>
                  <div className="flex flex-wrap gap-2">
                    {allPlatforms.map((platform) => {
                      const isSelected = selectedPlatforms.includes(platform)
                      return (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => togglePlatform(platform)}
                          className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
                            isSelected
                              ? "border-purple-500/50 bg-purple-500/20 text-purple-300"
                              : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                          )}
                        >
                          {platform}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Media upload area */}
                <div className="space-y-2">
                  <Label>Media</Label>
                  <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400">
                    <Image className="size-8" />
                    <span className="text-sm">
                      Drag & drop or click to upload
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <Button className="w-full" onClick={() => setDialogOpen(false)}>
                  <Calendar className="size-4" />
                  Schedule Post
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Stats Bar                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Posts" value={totalPosts} icon={Instagram} />
          <StatCard
            label="Scheduled"
            value={scheduledPosts.length}
            icon={Clock}
          />
          <StatCard label="Drafts" value={draftPosts.length} icon={Edit} />
          <StatCard
            label="Published This Month"
            value={publishedPosts.length}
            icon={Heart}
          />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Tabs                                                             */}
        {/* ---------------------------------------------------------------- */}
        <Tabs defaultValue="scheduled">
          <TabsList className="bg-zinc-900">
            <TabsTrigger value="scheduled">
              <Clock className="size-4" />
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="drafts">
              <Edit className="size-4" />
              Drafts
            </TabsTrigger>
            <TabsTrigger value="published">
              <Heart className="size-4" />
              Published
            </TabsTrigger>
            <TabsTrigger value="backlog">
              <Calendar className="size-4" />
              Backlog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="pt-4">
            <PostGrid posts={scheduledPosts} />
          </TabsContent>

          <TabsContent value="drafts" className="pt-4">
            <PostGrid posts={draftPosts} />
          </TabsContent>

          <TabsContent value="published" className="pt-4">
            <PostGrid posts={publishedPosts} />
          </TabsContent>

          <TabsContent value="backlog" className="pt-4">
            <PostGrid posts={backlogPosts} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
