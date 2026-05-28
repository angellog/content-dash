"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type Platform,
  PLATFORM_CONFIG,
  CONNECTED_PLATFORMS,
} from "@/lib/omnisocial"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface NewPostDialogProps {
  activePlatform: Platform | "all"
  onPostCreated?: (post: any) => void
}

export function NewPostDialog({
  activePlatform,
  onPostCreated,
}: NewPostDialogProps) {
  const [open, setOpen] = useState(false)
  const [caption, setCaption] = useState("")
  const [postType, setPostType] = useState("Post")
  const [scheduledDate, setScheduledDate] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])

  const isSinglePlatform = activePlatform !== "all"
  const singleConfig = isSinglePlatform ? PLATFORM_CONFIG[activePlatform] : null

  const availablePostTypes = useMemo(() => {
    if (isSinglePlatform && singleConfig) return singleConfig.postTypes
    if (selectedPlatforms.length > 0) {
      const allTypes = selectedPlatforms.map(
        (p) => PLATFORM_CONFIG[p].postTypes
      )
      const common = allTypes.reduce((acc, types) =>
        acc.filter((t) => types.includes(t))
      )
      return common.length > 0 ? common : ["Post"]
    }
    return ["Post"]
  }, [isSinglePlatform, singleConfig, selectedPlatforms])

  const charLimit = useMemo(() => {
    if (isSinglePlatform && singleConfig) return singleConfig.charLimit
    if (selectedPlatforms.length > 0)
      return Math.min(
        ...selectedPlatforms.map((p) => PLATFORM_CONFIG[p].charLimit)
      )
    return 2200
  }, [isSinglePlatform, singleConfig, selectedPlatforms])

  const charCount = caption.length
  const isOverLimit = charCount > charLimit

  useEffect(() => {
    if (postType && !availablePostTypes.includes(postType)) {
      setPostType(availablePostTypes[0])
    }
  }, [availablePostTypes, postType])

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  const handleSubmit = () => {
    if (isOverLimit || !caption.trim()) return
    if (!isSinglePlatform && selectedPlatforms.length === 0) return

    const payload = {
      caption,
      type: postType || availablePostTypes[0],
      platforms: isSinglePlatform ? [activePlatform] : selectedPlatforms,
      scheduledAt: scheduledDate || undefined,
      media: [] as string[],
    }

    console.log("Post created:", payload)
    onPostCreated?.(payload)

    setCaption("")
    setPostType("Post")
    setScheduledDate("")
    setSelectedPlatforms([])
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="size-4" />
            New Post
          </Button>
        }
      />
      <DialogContent className="sm:max-w-xl bg-zinc-900 border border-zinc-800 ring-0 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {isSinglePlatform
              ? `New ${singleConfig?.name} Post`
              : "New Cross-Platform Post"}
          </DialogTitle>
        </DialogHeader>

        {isSinglePlatform && singleConfig && (
          <div
            className={cn(
              "h-1 w-full rounded-full bg-gradient-to-r",
              singleConfig.gradient
            )}
          />
        )}

        <div className="flex flex-col gap-4">
          {!isSinglePlatform && (
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-400">Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {CONNECTED_PLATFORMS.map((platform) => {
                  const config = PLATFORM_CONFIG[platform]
                  const isSelected = selectedPlatforms.includes(platform)
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                        isSelected
                          ? "text-white"
                          : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                      )}
                      style={
                        isSelected
                          ? {
                              backgroundColor: config.color + "20",
                              borderColor: config.color + "60",
                            }
                          : undefined
                      }
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      {config.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400">Caption</Label>
            <div className="relative">
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption..."
                className="min-h-24 resize-none border-zinc-700 bg-zinc-800/50 pr-16 text-zinc-100 placeholder:text-zinc-600"
                rows={4}
              />
              <span
                className={cn(
                  "absolute bottom-2 right-3 font-mono text-xs",
                  isOverLimit
                    ? "font-bold text-red-500"
                    : "text-zinc-500"
                )}
              >
                {charCount}/{charLimit}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400">Post Type</Label>
            <Select
              value={postType || availablePostTypes[0]}
              onValueChange={(v) => v !== null && setPostType(v)}
            >
              <SelectTrigger className="w-full border-zinc-700 bg-zinc-800/50 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-900">
                {availablePostTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400">Schedule</Label>
            <Input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="border-zinc-700 bg-zinc-800/50 text-zinc-100 [color-scheme:dark]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400">Media</Label>
            <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/30 px-4 py-8 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400">
              <ImageIcon className="size-5" />
              <span className="text-sm font-medium">Upload media</span>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              isOverLimit ||
              !caption.trim() ||
              (!isSinglePlatform && selectedPlatforms.length === 0)
            }
            className="w-full"
          >
            {scheduledDate ? "Schedule Post" : "Publish Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
