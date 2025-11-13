"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BadgeCheck,
  CreditCard,
  Settings,
  Bell,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth.actions";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarFooterComponentProps {
  className?: string;
}

export function SidebarFooterComponent({ className }: SidebarFooterComponentProps) {
  const router = useRouter();
  const { user, isPending: status } = useSession();
  const { isMobile } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logoutAction();
      if (result.success) {
        router.push("/auth/login");
        router.refresh();
      } else {
        console.error("Logout failed:", result.message);
        alert(result.message || "Failed to logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("An error occurred during logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SidebarFooter className={cn("p-2", className)}>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={cn(
                  "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                  "group-data-[collapsible=icon]:px-2",
                  "transition-all duration-200",
                  "hover:bg-sidebar-accent/50"
                )}
              >
                <Avatar className={cn(
                  "size-8 rounded-lg",
                  "group-data-[collapsible=icon]:size-8",
                  "transition-all duration-200"
                )}>
                  <AvatarImage src={user?.image || ""} alt={user?.displayName || ""} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user?.displayName || "")}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "grid flex-1 text-left text-sm leading-tight",
                  "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-200 overflow-hidden"
                )}>
                  <span className="truncate font-semibold">{user?.displayName}</span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
                <ChevronsUpDown className={cn(
                  "ml-auto size-4 transition-transform duration-200",
                  "group-data-[collapsible=icon]:hidden"
                )} />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src={user?.image || ""} alt={user?.displayName || ""} />
                    <AvatarFallback className="rounded-lg">
                      {getInitials(user?.displayName || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.displayName}
                    </span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/dashboard/profile/settings" className="flex items-center">
                  <BadgeCheck className="mr-2 size-4" />
                  Account
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2 size-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 size-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                <LogOut className="mr-2 size-4" />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}