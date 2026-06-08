"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSocialMediaStore } from "@/hooks/useSocialMediaStore";
import {
  Home,
  Share2,
  BarChart3,
  CalendarDays,
  Swords,
  Newspaper,
  MessageCircle,
  CreditCard,
  Sparkles,
  BookOpen,
  Compass,
  Settings,
  Menu,
  Wifi,
  WifiOff,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Social Manager", href: "/social-manager", icon: Share2 },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Content Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Competitors", href: "/competitors", icon: Swords },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "WhatsApp Billboard", href: "/whatsapp", icon: MessageCircle },
  { label: "NFC Cards", href: "/nfc", icon: CreditCard },
  { label: "OpenClaw", href: "/openclaw", icon: Sparkles, pro: true },
  { label: "Docs", href: "/docs", icon: BookOpen },
  { label: "Guide", href: "/guide", icon: Compass },
];

function SidebarBrand() {
  return (
    <div className="px-4 py-5">
      <h1 className="text-lg font-bold tracking-tight text-white">
        ContentDash
      </h1>
      <p className="text-xs text-zinc-500">Powered by OmniSocial</p>
    </div>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
      {item.pro && (
        <Badge
          variant="secondary"
          className="ml-auto bg-violet-600/20 text-violet-400 text-[10px] px-1.5"
        >
          Pro
        </Badge>
      )}
    </Link>
  );
}

function ConnectionStatus() {
  const isConnected = useSocialMediaStore((s) => s.syncState.isLive);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 text-xs">
        {isConnected ? (
          <>
            <Wifi className="size-3.5 text-emerald-500" />
            <span className="text-emerald-500">OmniSocial Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="size-3.5 text-red-500" />
            <span className="text-red-500">Not Connected</span>
          </>
        )}
      </div>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col justify-between">
      <nav className="flex flex-col gap-1 px-3 py-2">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <NavLink
              key={item.href}
              item={item}
              active={active}
              onClick={onNavigate}
            />
          );
        })}
      </nav>

      <div className="mt-auto">
        <Separator className="bg-zinc-800" />
        <ConnectionStatus />
        <Separator className="bg-zinc-800" />
        <div className="px-3 py-3">
          <Link
            href="/settings"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            )}
          >
            <Settings className="size-4 shrink-0" />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MobileMenuTrigger({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden text-zinc-400 hover:text-white"
      onClick={onClick}
    >
      <Menu className="size-5" />
      <span className="sr-only">Toggle menu</span>
    </Button>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-zinc-950 border-r border-zinc-800">
        <SidebarBrand />
        <Separator className="bg-zinc-800" />
        <SidebarNav />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 border-zinc-800 bg-zinc-950 p-0"
          showCloseButton
        >
          <SheetHeader className="p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
          </SheetHeader>
          <SidebarBrand />
          <Separator className="bg-zinc-800" />
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex size-12 items-center justify-center rounded-full bg-zinc-800 text-white shadow-lg lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>
    </>
  );
}

export default Sidebar;
