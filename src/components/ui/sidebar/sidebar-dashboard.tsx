"use client";

import * as React from "react";
import { ChevronDown, Search, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useSidebar } from "./use-sidebar";

// Dashboard-specific components
export function SidebarSearch({ className, ...props }: React.ComponentProps<typeof Input>) {
  const { state } = useSidebar();

  return (
    <div className={cn("relative px-3 py-2", className)}>
      <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/50" />
      <Input
        data-slot="sidebar-search"
        data-sidebar="search"
        placeholder="Search..."
        className={cn(
          "h-8 w-full bg-sidebar-accent text-sidebar-accent-foreground shadow-none",
          "pl-9",
          state === "collapsed" && "hidden",
        )}
        {...props}
      />
    </div>
  );
}

export function SidebarUser({
  user,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}) {
  const { state } = useSidebar();

  if (state === "collapsed") {
    return (
      <div className={cn("flex justify-center p-3", className)} {...props}>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 p-3", className)} {...props}>
      {/* The Avatar primitive handles the missing/failed-image fallback, so
          the OAuth avatar URL (e.g. lh3.googleusercontent.com) never renders
          as a broken raw image element. */}
      <Avatar>
        <AvatarImage src={user?.avatar} alt={user?.name ?? "User"} />
        <AvatarFallback>
          <User className="h-4 w-4 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user?.name || "Guest User"}</p>
        <p className="text-xs text-sidebar-foreground/50 truncate">
          {user?.email || "guest@example.com"}
        </p>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6">
        <ChevronDown className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function SidebarNotificationBadge({
  count,
  className,
  ...props
}: React.ComponentProps<typeof Badge> & {
  count?: number;
}) {
  if (!count || count === 0) return null;

  return (
    <Badge
      data-slot="sidebar-notification-badge"
      data-sidebar="notification-badge"
      variant="destructive"
      className={cn(
        "absolute top-1 right-1 h-5 w-5 flex items-center justify-center p-0 text-xs",
        className,
      )}
      {...props}
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}
