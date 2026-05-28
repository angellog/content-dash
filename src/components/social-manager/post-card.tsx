"use client"

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Platform, PLATFORM_CONFIG } from "@/lib/omnisocial"
import {
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Pencil,
  Trash2,
  CalendarClock,
} from "lucide-react"
import { motion } from "framer-motion"
import { PostTypeBadge } from "./post-type-badge"

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Scheduled: { bg: "#3b82f633", color: "#3b82f6" },
  Draft: { bg: "#a1a1aa33", color: "#a1a1aa" },
  Published: { bg: "#10b98133", color: "#10b981" },
  Backlog: { bg: "#f59e0b33", color: "#f59e0b" },
}

function PlatformIcon({ platform }: { platform: Platform }) {
  const cls = "w-6 h-6 text-white/90"

  switch (platform) {
    case "instagram":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      )
    case "facebook":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      )
    case "linkedin":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      )
    case "youtube":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#09090b" />
        </svg>
      )
    case "pinterest":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.425 1.808-2.425.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.134-4.515 4.34 0 .859.331 1.781.745 2.282a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
        </svg>
      )
    case "tiktok":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.51a8.27 8.27 0 0 0 4.76 1.5V6.57a4.85 4.85 0 0 1-1-.12z" />
        </svg>
      )
    case "x":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    default:
      return <div className="w-5 h-5 rounded-full bg-white/20" />
  }
}

interface PostCardProps {
  post: {
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
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onReschedule?: (id: string) => void
}

export function PostCard({ post, onEdit, onDelete, onReschedule }: PostCardProps) {
  const config = PLATFORM_CONFIG[post.platform]
  const statusStyle = STATUS_STYLES[post.status]

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <CardHeader className="p-0">
          <div
            className="h-20 flex items-center justify-center"
            style={{ background: config.gradient }}
          >
            <PlatformIcon platform={post.platform} />
          </div>
        </CardHeader>

        <CardContent className="p-3 space-y-2">
          <p className="text-sm text-zinc-300 line-clamp-2 leading-snug">
            {post.caption}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            <PostTypeBadge type={post.type} platform={post.platform} />
            <Badge
              className="text-[10px] px-1.5 py-0 border-0 font-medium"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
            >
              {post.status}
            </Badge>
          </div>

          {post.status === "Published" && (
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {post.likes ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {post.comments ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="w-3 h-3" />
                {post.shares ?? 0}
              </span>
            </div>
          )}

          {post.status === "Scheduled" && post.scheduledDate && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Clock className="w-3 h-3" />
              <span>
                {post.scheduledDate}
                {post.scheduledTime ? ` \u00B7 ${post.scheduledTime}` : ""}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-3 pt-0 flex items-center gap-1">
          <button
            onClick={() => onEdit?.(post.id)}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete?.(post.id)}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onReschedule?.(post.id)}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <CalendarClock className="w-3.5 h-3.5" />
          </button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
