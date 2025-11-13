"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { TrendingUp } from "lucide-react";

interface SidebarHeaderComponentProps {
  className?: string;
}

export function SidebarHeaderComponent({ className }: SidebarHeaderComponentProps) {
  return (
    <SidebarHeader className={cn("p-2", className)}>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className={cn(
              "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
              "group-data-[collapsible=icon]:px-2",
              "transition-all duration-200",
              "hover:bg-sidebar-accent/50"
            )}
          >
            <div className={cn(
              "flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground",
              "transition-all duration-200",
              "group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg",
              "group-hover:scale-105"
            )}>
              <TrendingUp className="size-4" />
            </div>
            <div className={cn(
              "grid flex-1 text-left text-sm leading-tight",
              "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-200 overflow-hidden"
            )}>
              <span className="truncate font-semibold">Nuvia</span>
              <span className="truncate text-xs">AMS Platform</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}