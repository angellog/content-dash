"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Globe } from "lucide-react";
import { motion } from "framer-motion";
import {
  Platform,
  PLATFORM_CONFIG,
  PLATFORM_ORDER,
  CONNECTED_PLATFORMS,
} from "@/lib/omnisocial";
import { cn } from "@/lib/utils";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 13.5c-.83.83-2.17 1.25-3.5 1.25s-2.67-.42-3.5-1.25c-1.17-1.17-1.17-3.02 0-4.18.83-.83 2.17-1.25 3.5-1.25s2.67.42 3.5 1.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" fill="none" stroke="currentColor" strokeWidth="2" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.25 2.67 7.9 6.44 9.34-.09-.78-.17-1.98.03-2.83.18-.78 1.17-4.97 1.17-4.97s-.3-.6-.3-1.47c0-1.38.8-2.41 1.8-2.41.85 0 1.26.64 1.26 1.4 0 .85-.54 2.13-.82 3.31-.24.99.49 1.79 1.46 1.79 1.75 0 3.1-1.85 3.1-4.52 0-2.36-1.7-4.01-4.12-4.01-2.81 0-4.46 2.1-4.46 4.28 0 .85.33 1.76.73 2.25.08.1.09.18.07.28-.07.31-.25.99-.28 1.13-.05.19-.15.23-.35.14-1.3-.61-2.12-2.51-2.12-4.05 0-3.3 2.4-6.33 6.9-6.33 3.62 0 6.44 2.58 6.44 6.03 0 3.6-2.27 6.5-5.42 6.5-1.06 0-2.05-.55-2.39-1.2l-.65 2.48c-.24.91-.88 2.05-1.31 2.75A10 10 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
  );
}

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 10.8c-1.09-3.12-4.08-5.3-6.17-5.3-.88 0-1.63.32-2.12.9-.78.93-.73 2.3.14 3.75C5.26 12.32 8.1 14.66 12 16.2c3.9-1.54 6.74-3.88 8.15-6.05.87-1.45.92-2.82.14-3.75-.49-.58-1.24-.9-2.12-.9-2.09 0-5.08 2.18-6.17 5.3z" />
    </svg>
  );
}

function MastodonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21.93 8.5c-.27-2.09-1.98-3.72-4.08-4.01C16.16 4.24 14.39 4 12.37 4h-.18c-2.02 0-3.79.24-5.48.49-2.1.29-3.81 1.92-4.08 4.01-.15 1.18-.29 2.52-.29 3.5 0 .98.14 2.32.29 3.5.27 2.09 1.98 3.72 4.08 4.01 1.69.25 3.46.49 5.48.49h.18c2.02 0 3.79-.24 5.48-.49 2.1-.29 3.81-1.92 4.08-4.01.15-1.18.29-2.52.29-3.5 0-.98-.14-2.32-.29-3.5zM9.5 14.5V9.5l5 2.5-5 2.5z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<Platform, React.FC<{ className?: string }>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  threads: ThreadsIcon,
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
  pinterest: PinterestIcon,
  bluesky: BlueskyIcon,
  mastodon: MastodonIcon,
  x: XIcon,
};

interface PlatformIconBarProps {
  activePlatform: Platform | "all";
  onSelect: (platform: Platform | "all") => void;
}

export function PlatformIconBar({ activePlatform, onSelect }: PlatformIconBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 8);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    checkOverflow();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkOverflow, { passive: true });
    window.addEventListener("resize", checkOverflow);
    return () => {
      el.removeEventListener("scroll", checkOverflow);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [checkOverflow]);

  const handleSelect = useCallback(
    (platform: Platform | "all") => {
      onSelect(platform);
    },
    [onSelect]
  );

  const scrollIntoView = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, []);

  const isConnected = useCallback(
    (p: Platform) => CONNECTED_PLATFORMS.includes(p),
    []
  );

  return (
    <div className="relative bg-zinc-950 rounded-xl border border-zinc-800 px-2 py-3">
      <div
        ref={scrollRef}
        className="flex items-start gap-1 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex items-start gap-1 min-w-max px-4">
          <div className="flex flex-col items-center gap-1.5" ref={activePlatform === "all" ? scrollIntoView : undefined}>
            <motion.button
              whileHover={{ filter: "brightness(1.15)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect("all")}
              className={cn(
                "relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors",
                activePlatform === "all"
                  ? "bg-zinc-900 border-white ring-2 ring-zinc-400 scale-110"
                  : "bg-zinc-800 border-zinc-500 hover:border-zinc-400"
              )}
            >
              <Globe className="w-5 h-5 text-zinc-300" />
            </motion.button>
            <span className="text-[10px] text-zinc-500 font-medium">All</span>
          </div>

          {PLATFORM_ORDER.map((platform) => {
            const config = PLATFORM_CONFIG[platform];
            const Icon = PLATFORM_ICONS[platform];
            const active = activePlatform === platform;

            return (
              <div
                key={platform}
                className="flex flex-col items-center gap-1.5"
                ref={active ? scrollIntoView : undefined}
              >
                <motion.button
                  whileHover={{ filter: "brightness(1.15)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(platform)}
                  title={config.name}
                  className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                    active
                      ? "bg-zinc-900 scale-110"
                      : "bg-zinc-800 border-zinc-500 hover:border-zinc-400"
                  )}
                  style={{
                    borderColor: active ? config.color : undefined,
                    boxShadow: active ? `0 0 0 2px ${config.color}40` : undefined,
                  }}
                >
                  <span style={active ? { color: config.color } : { color: "#a1a1aa" }}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-950",
                      isConnected(platform) ? "bg-emerald-500" : "bg-zinc-600"
                    )}
                  />
                </motion.button>
                <span className={cn("text-[10px] font-medium", active ? "text-zinc-300" : "text-zinc-500")}>
                  {config.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none rounded-l-xl" />
      )}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none rounded-r-xl" />
      )}
    </div>
  );
}
