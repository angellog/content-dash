"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Bell, Menu, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

export function Header({ title, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [notificationCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) {
      router.push(`/social-manager?q=${encodeURIComponent(q)}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-md lg:px-6">
      {onMobileMenuToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-zinc-400 hover:text-white"
          onClick={onMobileMenuToggle}
        >
          <Menu className="size-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      )}

      <h2 className="text-base font-semibold text-white truncate">
        {title}
      </h2>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="w-48 pl-8 bg-zinc-900 border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus-visible:border-zinc-700 focus-visible:ring-zinc-700/50 lg:w-64"
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="relative text-zinc-400 hover:text-white"
      >
        <Bell className="size-4" />
        {notificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {notificationCount}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
        >
          <Avatar size="sm">
            <AvatarImage src="/avatar-placeholder.png" alt="User" />
            <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
              CD
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-48 bg-zinc-900 border-zinc-800 text-zinc-300"
        >
          <DropdownMenuItem
            className="focus:bg-zinc-800 focus:text-white cursor-pointer"
            onClick={() => router.push("/settings")}
          >
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="focus:bg-zinc-800 focus:text-white cursor-pointer"
            onClick={() => router.push("/settings")}
          >
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem
            className="focus:bg-zinc-800 focus:text-white cursor-pointer"
            onClick={handleSignOut}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export default Header;
