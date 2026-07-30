"use client"

import { useState, useEffect } from "react"
import {
  Rss,
  Flame,
  BookOpen,
  Sparkles,
  Calendar,
  Clock,
  ExternalLink,
  Search,
  Check,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type Topic = "All" | "Tools" | "AI Research" | "Business" | "Growth" | "Strategy"

interface NewsArticle {
  id: string
  title: string
  source: string
  date: string
  summary: string
  readTime: string
  category: Topic
  url: string
  suggestedPrompt: string
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [featuredArticle, setFeaturedArticle] = useState<NewsArticle | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<Topic>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [generatedDraft, setGeneratedDraft] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "threads"])
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news")
        if (res.ok) {
          const data = await res.json()
          setArticles(data.articles ?? [])
          if (data.articles && data.articles.length > 0) {
            setFeaturedArticle(data.articles[0])
          }
          if (data.isLive) {
            setIsLive(true)
          }
        } else {
          setError("Failed to load news feed.")
        }
      } catch {
        setError("Failed to load news feed. Check your network.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchNews()
  }, [])

  const filteredArticles = articles
    .filter((article) => {
      const matchesTopic = selectedTopic === "All" || article.category === selectedTopic
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.source.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesTopic && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy === "oldest") return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortBy === "title") return a.title.localeCompare(b.title)
      return 0
    })

  const handleOpenSynthesize = async (article: NewsArticle) => {
    setSelectedArticle(article)
    setIsDialogOpen(true)
    setIsGenerating(true)
    setSendSuccess(false)
    setGeneratedDraft("")

    try {
      const res = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a social media post based on this article:\nTitle: ${article.title}\nSource: ${article.source}\nSummary: ${article.summary}\nCategory: ${article.category}\nSuggested prompt: ${article.suggestedPrompt}`,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedDraft(data.result ?? data.message ?? data.output ?? "")
      } else {
        setGeneratedDraft("Failed to generate draft. Please try again.")
      }
    } catch {
      setGeneratedDraft("Failed to generate draft. Check your network.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendToPipeline = async () => {
    setIsSending(true)
    try {
      const res = await fetch("/api/omnisocial/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: generatedDraft,
          platforms: selectedPlatforms,
        }),
      })
      if (res.ok) {
        setIsSending(false)
        setSendSuccess(true)
        toast.success("Post sent to OmniSocial pipeline!")
        setTimeout(() => {
          setIsDialogOpen(false)
        }, 1500)
      } else {
        setIsSending(false)
        toast.error("Failed to send post. Check OmniSocial connection.")
      }
    } catch {
      setIsSending(false)
      toast.error("Failed to send post. Check your network.")
    }
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Rss className="h-6 w-6 text-orange-500" />
            <h1 className="text-3xl font-bold tracking-tight text-white">News Consolidator</h1>
            {isLive && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase tracking-wider">
                Live Feed
              </Badge>
            )}
          </div>
          <p className="text-sm text-zinc-400">
            Monitor real-time creator economy trends, tools, and AI developments to synthesize custom OmniSocial content pipelines.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search feed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-zinc-700"
            />
          </div>
          <Select value={sortBy} onValueChange={(val) => setSortBy(val || "newest")}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-8">
        <Tabs value={selectedTopic} onValueChange={(v) => setSelectedTopic(v as Topic)}>
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 flex flex-wrap h-auto gap-1">
            {(["All", "Tools", "AI Research", "Business", "Growth", "Strategy"] as Topic[]).map((topic) => (
              <TabsTrigger
                key={topic}
                value={topic}
                className={cn(
                  "px-4 py-2 text-xs font-medium rounded-md transition-all text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                )}
              >
                {topic}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{error}</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => { setError(null); setIsLoading(true); window.location.reload() }}
            className="ml-auto text-red-400 hover:text-red-300 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs text-zinc-400">Loading news feed...</p>
        </div>
      )}

      {!isLoading && !error && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center p-16 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <BookOpen className="h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-zinc-400 mb-1 text-lg font-medium">No articles found</p>
          <p className="text-xs text-zinc-500">Check back later for the latest creator economy news.</p>
        </div>
      )}

      {!isLoading && !error && articles.length > 0 && (
        <>
          {selectedTopic === "All" && !searchQuery && featuredArticle && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
                <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
                  Featured Industry Shift
                </h2>
              </div>
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 via-pink-500 to-purple-600" />
                <CardHeader className="md:pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        {featuredArticle.category}
                      </Badge>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-xs text-zinc-400 font-medium">{featuredArticle.source}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {featuredArticle.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {featuredArticle.readTime}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-xl md:text-2xl font-bold text-white group-hover:text-orange-400 transition-colors">
                    {featuredArticle.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-4xl">
                    {featuredArticle.summary}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3 border-t border-zinc-800/50 pt-4">
                  <Button
                    variant="default"
                    onClick={() => handleOpenSynthesize(featuredArticle)}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Post with OmniSocial
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(featuredArticle.url, "_blank", "noopener,noreferrer")}
                    className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1" />
                    Read Full Article
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              Consolidated News Stream ({filteredArticles.length})
            </h2>

            {filteredArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
                <p className="text-zinc-400 mb-2">No articles matching your filters or search.</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSelectedTopic("All")
                    setSearchQuery("")
                  }}
                  className="text-orange-400 hover:text-orange-300"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <Card key={article.id} className="bg-zinc-900 border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {article.category}
                        </Badge>
                        <span className="text-xs text-zinc-500 font-medium">{article.source}</span>
                      </div>
                      <CardTitle className="text-base font-bold text-white line-clamp-2 leading-snug">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3 pt-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {article.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.readTime}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                    </CardContent>
                    <CardFooter className="flex gap-2 border-t border-zinc-800/60 pt-3 mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSynthesize(article)}
                        className="flex-1 bg-zinc-800/40 border-zinc-800 hover:bg-zinc-800 text-orange-400 hover:text-orange-300 text-xs gap-1 cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3" />
                        Synthesize Idea
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(article.url, "_blank", "noopener,noreferrer")}
                        className="border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs px-2 cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-orange-500" />
              OmniSocial Post Pipeline
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Directly synthesize this trend into your queue. Review or modify the drafted copy before scheduling.
            </DialogDescription>
          </DialogHeader>

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-xs text-zinc-400">Synthesizing content hook & formatting...</p>
            </div>
          ) : (
            <div className="space-y-4 my-2">
              <div>
                <Label className="text-xs text-zinc-400 block mb-1.5">Source Trend</Label>
                <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded text-xs">
                  <span className="text-orange-400 font-semibold">{selectedArticle?.source}</span>
                  <p className="text-zinc-300 font-medium mt-0.5 line-clamp-1">{selectedArticle?.title}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="draft" className="text-xs text-zinc-400 block mb-1.5">Generated Draft Post</Label>
                <Textarea
                  id="draft"
                  value={generatedDraft}
                  onChange={(e) => setGeneratedDraft(e.target.value)}
                  className="min-h-[160px] bg-zinc-900 border-zinc-800 text-zinc-200 text-xs focus-visible:ring-zinc-700"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-400 block mb-1.5">Publish Target Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {["instagram", "threads", "linkedin", "x"].map((platform) => {
                    const isSelected = selectedPlatforms.includes(platform)
                    return (
                      <Button
                        key={platform}
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => togglePlatform(platform)}
                        className={cn(
                          "text-xs capitalize rounded cursor-pointer",
                          isSelected
                            ? "bg-orange-600 hover:bg-orange-500 text-white"
                            : "border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-1" />}
                        {platform === "x" ? "X (Twitter)" : platform}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 border-t border-zinc-900 pt-3 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendToPipeline}
              disabled={isSending || sendSuccess}
              className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Queuing...
                </>
              ) : sendSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Successfully Added!
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send to Pipeline Queue
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
