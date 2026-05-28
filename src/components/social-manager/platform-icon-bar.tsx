"use client";

import { Globe } from "lucide-react";
import {
  Platform,
  PLATFORMS,
  PLATFORM_LABELS,
  PLATFORM_COLORS,
} from "@/types/social";
import { PLATFORM_CONFIG } from "@/lib/omnisocial";
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
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48" fill="currentColor" />
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
  return (
    <>
      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      <div className="flex items-center gap-1.5 p-1.5 bg-accent/30 rounded-2xl border border-border/50 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => onSelect("all")}
          title="All platforms"
          className={cn(
            "min-w-[44px] min-h-[44px] rounded-xl transition-all duration-200 flex items-center justify-center relative",
            activePlatform === "all"
              ? "bg-background shadow-md scale-110 ring-1 ring-border text-foreground"
              : "text-muted-foreground opacity-60 hover:opacity-100 hover:bg-white/5"
          )}
        >
          <Globe className="w-5 h-5" />
        </button>

        {PLATFORMS.map((platform) => {
          const Icon = PLATFORM_ICONS[platform];
          const active = activePlatform === platform;
          const connected = PLATFORM_CONFIG[platform].connected;

          return (
            <button
              key={platform}
              onClick={() => onSelect(platform)}
              title={PLATFORM_LABELS[platform]}
              style={
                { "--hover-bg": `${PLATFORM_COLORS[platform]}1a` } as React.CSSProperties
              }
              className={cn(
                "min-w-[44px] min-h-[44px] rounded-xl transition-all duration-200 flex items-center justify-center relative",
                active
                  ? "bg-background shadow-md scale-110 ring-1 ring-border"
                  : "text-muted-foreground opacity-60 hover:opacity-100 hover:bg-[var(--hover-bg)]"
              )}
            >
              <span
                className="w-5 h-5 transition-colors duration-200 flex items-center justify-center"
                style={active ? { color: PLATFORM_COLORS[platform] } : undefined}
              >
                <Icon className="w-5 h-5" />
              </span>
              {connected && (
                <span className="absolute bottom-1 right-1 w-[5px] h-[5px] rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
