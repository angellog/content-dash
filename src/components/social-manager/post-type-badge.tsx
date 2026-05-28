"use client"

import { Badge } from "@/components/ui/badge"
import { Platform, PLATFORM_CONFIG } from "@/lib/omnisocial"

interface PostTypeBadgeProps {
  type: string
  platform: Platform
}

export function PostTypeBadge({ type, platform }: PostTypeBadgeProps) {
  const { color } = PLATFORM_CONFIG[platform]

  return (
    <Badge
      className="text-[10px] px-1.5 py-0 border-0 font-medium"
      style={{ backgroundColor: `${color}33`, color }}
    >
      {type}
    </Badge>
  )
}
