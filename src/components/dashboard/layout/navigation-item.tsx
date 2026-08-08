"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronRight } from "lucide-react";
import { NavigationItem } from "./navigation-config";
import { isModuleEnabled } from "../../../../config/features";

interface NavigationItemComponentProps {
  item: NavigationItem;
  isActive: (path: string) => boolean;
}

export function NavigationItemComponent({ item, isActive }: NavigationItemComponentProps) {
  // Module maturity gate (ADR-0008): a section whose module flag is off is
  // not silently clickable — it renders disabled and visibly marked. The
  // mock pages themselves stay reachable by URL, where ModulePreviewBanner
  // marks them.
  if (item.module && !isModuleEnabled(item.module)) {
    return <PreviewNavigationItem item={item} />;
  }

  const isItemActive = isActive(item.path);
  const hasSubItems = item.subItems && item.subItems.length > 0;

  if (hasSubItems) {
    return (
      <CollapsibleNavigationItem item={item} isActive={isActive} isItemActive={isItemActive} />
    );
  }

  return <RegularNavigationItem item={item} isItemActive={isItemActive} />;
}

interface CollapsibleNavigationItemProps {
  item: NavigationItem;
  isActive: (path: string) => boolean;
  isItemActive: boolean;
}

function CollapsibleSubItemsPopover({
  item,
  isActive,
  isItemActive,
}: CollapsibleNavigationItemProps) {
  const hasActiveSubItem = item.subItems?.some((subItem) => isActive(subItem.path));
  const totalBadgeCount =
    item.subItems?.reduce((sum, subItem) => {
      const count = parseInt(subItem.badge || "0");
      return sum + (isNaN(count) ? 0 : count);
    }, 0) || 0;

  return (
    <Popover key={item.id}>
      <PopoverTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isItemActive || hasActiveSubItem}
            className={cn(
              "relative h-15 w-15 p-0 mx-auto",
              "flex items-center justify-center",
              "transition-colors duration-200",
            )}
          >
            {item.icon}
            {totalBadgeCount > 0 && <NavigationBadge badge={totalBadgeCount.toString()} />}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-56 p-2"
        collisionPadding={20}
      >
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-sm font-medium text-foreground border-b">
            {item.title}
          </div>
          {item.subItems!.map((subItem) =>
            subItem.module && !isModuleEnabled(subItem.module) ? (
              <div
                key={subItem.id}
                aria-disabled="true"
                className="flex items-center justify-between gap-2 p-2 text-sm rounded-md opacity-50 cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  {subItem.icon}
                  {subItem.title}
                </span>
                <PreviewBadge className="h-4 px-1 text-xs" />
              </div>
            ) : (
              <Link
                key={subItem.id}
                href={subItem.path}
                className={cn(
                  "flex items-center justify-between gap-2 p-2 text-sm rounded-md",
                  "hover:bg-accent transition-colors",
                  isActive(subItem.path) && "bg-accent text-accent-foreground",
                )}
              >
                <span className="flex items-center gap-2">
                  {subItem.icon}
                  {subItem.title}
                </span>
                {subItem.badge && (
                  <Badge variant="secondary" className="h-4 min-w-4 p-1 text-xs shrink-0">
                    {subItem.badge}
                  </Badge>
                )}
              </Link>
            ),
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CollapsibleNavigationItem({
  item,
  isActive,
  isItemActive,
}: CollapsibleNavigationItemProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const hasActiveSubItem = item.subItems?.some((subItem) => isActive(subItem.path));

  if (isCollapsed) {
    return (
      <CollapsibleSubItemsPopover item={item} isActive={isActive} isItemActive={isItemActive} />
    );
  }

  return (
    <Collapsible key={item.id} asChild defaultOpen={isItemActive || hasActiveSubItem}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isItemActive || hasActiveSubItem}
            className="group/item"
          >
            {item.icon}
            <span>{item.title}</span>
            <div className="ml-auto flex items-center gap-1.5">
              {item.badge && (
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                  {item.badge}
                </Badge>
              )}
              <ChevronRight className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subItems!.map((subItem) => (
              <SubNavigationItem key={subItem.id} subItem={subItem} isActive={isActive} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

interface RegularNavigationItemProps {
  item: NavigationItem;
  isItemActive: boolean;
}

function RegularNavigationItem({ item, isItemActive }: RegularNavigationItemProps) {
  const tooltipString = `${item.title}${item.category ? ` (${item.category})` : ""}${item.badge ? ` - ${item.badge} new` : ""}`;

  return (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton tooltip={tooltipString} isActive={isItemActive} asChild>
        <Link href={item.path} prefetch={false}>
          {item.icon}
          <span>{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
              {item.badge}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/**
 * Nav row for a section whose module flag is off (ADR-0008). aria-disabled
 * activates the sidebar primitives' pointer-events-none + opacity treatment,
 * so the row is visibly present but not clickable; the "Preview" badge marks
 * it as mock-tier.
 */
function PreviewNavigationItem({ item }: { item: NavigationItem }) {
  return (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton aria-disabled="true" className="cursor-not-allowed">
        {item.icon}
        <span>{item.title}</span>
        <PreviewBadge className="ml-auto h-5 px-1.5 text-xs" />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** The one shared "Preview" mark for mock-tier nav rows (ADR-0008). */
function PreviewBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn("shrink-0 text-muted-foreground", className)}>
      Preview
    </Badge>
  );
}

interface SubNavigationItemProps {
  subItem: NavigationItem;
  isActive: (path: string) => boolean;
}

function SubNavigationItem({ subItem, isActive }: SubNavigationItemProps) {
  // Gated sub-entries (e.g. the organization section's chapters/committees/
  // workspaces/committee-budgets rows) render disabled + marked, same as
  // whole gated sections.
  if (subItem.module && !isModuleEnabled(subItem.module)) {
    return (
      <SidebarMenuSubItem key={subItem.id}>
        <SidebarMenuSubButton
          aria-disabled="true"
          className="cursor-not-allowed justify-between gap-2"
        >
          <span>{subItem.title}</span>
          <PreviewBadge className="h-4 px-1 text-[10px]" />
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  const isSubActive = isActive(subItem.path);

  return (
    <SidebarMenuSubItem key={subItem.id}>
      <SidebarMenuSubButton asChild isActive={isSubActive}>
        <Link href={subItem.path} className="flex items-center justify-between gap-2">
          <span>{subItem.title}</span>
          {subItem.badge && (
            <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] shrink-0">
              {subItem.badge}
            </Badge>
          )}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

interface NavigationBadgeProps {
  badge: string;
}

function NavigationBadge({ badge }: NavigationBadgeProps) {
  return (
    <div className="absolute -top-1 -right-1 h-4 min-w-4 p-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-medium border border-background">
      {badge}
    </div>
  );
}
