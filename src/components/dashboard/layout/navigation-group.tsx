"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { NavigationItem } from "./navigation-config";
import { NavigationItemComponent } from "./navigation-item";
import { cn } from "@/lib/utils";

interface NavigationGroupProps {
  category: string;
  title: string;
  items: NavigationItem[];
  isActive: (path: string) => boolean;
}

export function NavigationGroup({ category, title, items, isActive }: NavigationGroupProps) {
  if (!items || items.length === 0) return null;

  return (
    <SidebarGroup key={category}>
      <SidebarGroupLabel className={cn(
        "group-data-[collapsible=icon]:opacity-0 transition-opacity duration-200",
        "text-xs font-semibold text-muted-foreground uppercase tracking-wider"
      )}>
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <NavigationItemComponent
              key={item.id}
              item={item}
              isActive={isActive}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

interface NavigationRendererProps {
  navigationGroups: Record<string, NavigationItem[]>;
  isActive: (path: string) => boolean;
}

export function NavigationRenderer({ navigationGroups, isActive }: NavigationRendererProps) {
  const categories = [
    { key: "main", title: "Main Navigation" },
    { key: "admin", title: "Administration" },
  ] as const;

  return (
    <SidebarContent>
      {categories.map(({ key, title }) => (
        <NavigationGroup
          key={key}
          category={key}
          title={title}
          items={navigationGroups[key] || []}
          isActive={isActive}
        />
      ))}
    </SidebarContent>
  );
}