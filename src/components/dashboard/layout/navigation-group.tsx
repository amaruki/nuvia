"use client";

import React from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { navigationCategories, NavigationItem } from "./navigation-config";
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
      <SidebarGroupLabel
        className={cn(
          "group-data-[collapsible=icon]:opacity-0 transition-opacity duration-200",
          "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
        )}
      >
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <NavigationItemComponent key={item.id} item={item} isActive={isActive} />
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

/**
 * Render order for known categories. Everything present in the data
 * renders: this list used to hardcode `main` and `admin`, which silently
 * discarded the whole `personal` category (profile, preferences) from the
 * sidebar (UI-22). Unknown keys still render after the known ones so new
 * categories in navigation-data land in the nav instead of vanishing.
 */
const CATEGORY_ORDER: readonly string[] = ["main", "personal", "admin"];

export function NavigationRenderer({ navigationGroups, isActive }: NavigationRendererProps) {
  const categoryKeys = [
    ...CATEGORY_ORDER.filter((key) => navigationGroups[key]),
    ...Object.keys(navigationGroups)
      .filter((key) => !CATEGORY_ORDER.includes(key))
      .sort(),
  ];

  return (
    <SidebarContent>
      {categoryKeys.map((categoryKey) => (
        <NavigationGroup
          key={categoryKey}
          category={categoryKey}
          title={
            navigationCategories[categoryKey as keyof typeof navigationCategories] ?? categoryKey
          }
          items={navigationGroups[categoryKey] ?? []}
          isActive={isActive}
        />
      ))}
    </SidebarContent>
  );
}
