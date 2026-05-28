"use client"

import { useState, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Share2 } from "lucide-react"
import { type Platform, PLATFORM_ORDER, CONNECTED_PLATFORMS } from "@/lib/omnisocial"
import { PlatformIconBar } from "@/components/social-manager/platform-icon-bar"
import { PlatformView } from "@/components/social-manager/platform-view"
import { PlatformContent } from "@/components/social-manager/platform-content"
import { AllPlatformsView } from "@/components/social-manager/all-platforms-view"

function SocialManagerContent() {
  const searchParams = useSearchParams()
  const platformParam = searchParams.get("platform") as Platform | null

  const isValidPlatform = (val: string | null): val is Platform =>
    val !== null && PLATFORM_ORDER.includes(val as Platform)

  const [activePlatform, setActivePlatform] = useState<Platform | "all">(
    isValidPlatform(platformParam) ? platformParam : CONNECTED_PLATFORMS[0]
  )
  const [direction, setDirection] = useState(0)

  const handlePlatformSelect = useCallback(
    (platform: Platform | "all") => {
      const prevIndex =
        activePlatform === "all" ? -1 : PLATFORM_ORDER.indexOf(activePlatform as Platform)
      const nextIndex =
        platform === "all" ? -1 : PLATFORM_ORDER.indexOf(platform as Platform)

      setDirection(nextIndex > prevIndex ? 1 : -1)
      setActivePlatform(platform)

      const url =
        platform === "all"
          ? "/social-manager"
          : `/social-manager?platform=${platform}`
      window.history.replaceState(null, "", url)
    },
    [activePlatform]
  )

  return (
    <div className="min-h-screen bg-zinc-950 py-6 px-4 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <Share2 className="size-6 text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Social Manager</h1>
        </div>

        <div className="sticky top-0 z-10 -mx-4 px-4 py-2 lg:-mx-8 lg:px-8 bg-zinc-950/80 backdrop-blur-md">
          <PlatformIconBar
            activePlatform={activePlatform}
            onSelect={handlePlatformSelect}
          />
        </div>

        <div>
          {activePlatform === "all" ? (
            <AllPlatformsView />
          ) : (
            <PlatformView
              platform={activePlatform as Platform}
              direction={direction}
            >
              <PlatformContent platform={activePlatform as Platform} />
            </PlatformView>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SocialManagerPage() {
  return (
    <Suspense>
      <SocialManagerContent />
    </Suspense>
  )
}
