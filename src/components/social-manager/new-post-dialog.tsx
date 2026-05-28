"use client"

import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Platform, type Post, type PostStatus } from "@/types/social"
import { PLATFORM_CONFIG, CONNECTED_PLATFORMS } from "@/lib/omnisocial"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ALL_POST_TYPES = ["Post", "Reel", "Story", "Carousel", "Video", "Short", "Pin"]

const STATUS_OPTIONS: { value: PostStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "draft", label: "Draft" },
  { value: "backlog", label: "Backlog" },
  { value: "published", label: "Published" },
]

interface NewPostDialogProps {
  activePlatform: Platform | "all"
  onPostCreated?: (platform: Platform, post: Omit<Post, "id">) => void
}

export function NewPostDialog({ activePlatform, onPostCreated }: NewPostDialogProps) {
  const [open, setOpen] = useState(false)
  const [caption, setCaption] = useState("")
  const [postType, setPostType] = useState("Post")
  const [status, setStatus] = useState<PostStatus>("draft")
  const [postDate, setPostDate] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [threadMode, setThreadMode] = useState(false)
  const [videoDuration, setVideoDuration] = useState("")
  const [referenceLink, setReferenceLink] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])

  const isAll = activePlatform === "all"

  const targetPlatforms = useMemo<Platform[]>(() => {
    if (!isAll) return [activePlatform]
    return selectedPlatforms
  }, [isAll, activePlatform, selectedPlatforms])

  const charLimit = useMemo(() => {
    if (!isAll) return PLATFORM_CONFIG[activePlatform].charLimit
    if (selectedPlatforms.length > 0) {
      return Math.min(...selectedPlatforms.map((p) => PLATFORM_CONFIG[p].charLimit))
    }
    if (CONNECTED_PLATFORMS.length > 0) {
      return Math.min(...CONNECTED_PLATFORMS.map((p) => PLATFORM_CONFIG[p].charLimit))
    }
    return Infinity
  }, [isAll, activePlatform, selectedPlatforms])

  const showHashtags = targetPlatforms.some((p) => p === "instagram" || p === "tiktok")
  const showThreadMode = targetPlatforms.some((p) => p === "x")
  const showVideoDuration = targetPlatforms.some((p) => p === "youtube" || p === "tiktok")
  const showReferenceLink = targetPlatforms.some(
    (p) => p === "facebook" || p === "instagram" || p === "linkedin"
  )

  const postTypes = useMemo(() => {
    if (isAll) return ALL_POST_TYPES
    return PLATFORM_CONFIG[activePlatform].postTypes
  }, [isAll, activePlatform])

  const placeholder = !isAll && activePlatform === "x" ? "What's happening?" : "Write your caption..."
  const charCount = caption.length
  const isOverLimit = charCount > charLimit

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  const resetForm = () => {
    setCaption("")
    setPostType("Post")
    setStatus("draft")
    setPostDate("")
    setHashtags("")
    setThreadMode(false)
    setVideoDuration("")
    setReferenceLink("")
    setSelectedPlatforms([])
  }

  const handleSubmit = () => {
    if (!caption.trim()) return
    const platforms = isAll ? selectedPlatforms : [activePlatform]
    for (const platform of platforms) {
      onPostCreated?.(platform, {
        caption: caption.trim(),
        type: postType,
        status,
        platform,
        scheduledDate: postDate || undefined,
        ...(showHashtags && hashtags.trim()
          ? { hashtags: hashtags.split(",").map((h) => h.trim()).filter(Boolean) }
          : {}),
        ...(showThreadMode && threadMode ? { isThread: true } : {}),
        ...(showVideoDuration && videoDuration.trim() ? { videoDuration: videoDuration.trim() } : {}),
        ...(showReferenceLink && referenceLink.trim() ? { link: referenceLink.trim() } : {}),
      })
    }
    resetForm()
    setOpen(false)
  }

  const canSubmit = caption.trim().length > 0 && (isAll ? selectedPlatforms.length > 0 : true)

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="size-4" />
            Add Content
          </Button>
        }
      />
      <DialogContent className="h-[92dvh] sm:h-auto flex flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Post</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
          {isAll && (
            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="grid grid-cols-2 gap-2">
                {CONNECTED_PLATFORMS.map((platform) => {
                  const config = PLATFORM_CONFIG[platform]
                  const checked = selectedPlatforms.includes(platform)
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                        checked
                          ? "border-primary/50 bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input"
                        )}
                      >
                        {checked && (
                          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="font-medium">{config.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="caption">Caption</Label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={placeholder}
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className={cn("text-xs text-right text-muted-foreground", isOverLimit && "text-destructive")}>
              {charCount}/{charLimit === Infinity ? "∞" : charLimit}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Format</Label>
            <Select value={postType} onValueChange={(v) => v !== null && setPostType(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => v !== null && setStatus(v as PostStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-date">Post Date</Label>
            <Input id="post-date" type="date" value={postDate} onChange={(e) => setPostDate(e.target.value)} />
          </div>

          {showHashtags && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-1.5">
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input id="hashtags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="Add hashtags separated by commas" />
            </div>
          )}

          {showThreadMode && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="thread-mode">Thread Mode</Label>
                  <p className="text-xs text-muted-foreground">Enable to create a thread of connected posts</p>
                </div>
                <Switch id="thread-mode" checked={threadMode} onCheckedChange={setThreadMode} />
              </div>
            </div>
          )}

          {showVideoDuration && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-1.5">
              <Label htmlFor="video-duration">Video Duration</Label>
              <Input id="video-duration" value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)} placeholder="0:30" />
            </div>
          )}

          {showReferenceLink && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-1.5">
              <Label htmlFor="reference-link">Reference Link</Label>
              <Input id="reference-link" value={referenceLink} onChange={(e) => setReferenceLink(e.target.value)} placeholder="https://..." />
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSubmit} disabled={!canSubmit}>Add to Queue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
