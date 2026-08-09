"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import { useSession } from "@/hooks/use-session";

// Modular components
import { navigationConfig, NavigationItem } from "./navigation-config";
import { NavigationRenderer } from "./navigation-group";
import { SidebarHeaderComponent } from "./sidebar-header";
import { SidebarFooterComponent } from "./sidebar-footer";

interface DashboardSidebarProps {
  readonly className?: string;
}

/**
 * Role filter that answers the same question the server gate answers.
 * dashboard-access.ts flattens every nav level and matches longest path
 * first, so it decides reachability per URL, not per top-level section.
 * Filtering only the top level used to hide whole sections whose children
 * a role could still reach: a member can load /dashboard/events/calendar
 * (the calendar child names member roles) even though /dashboard/events
 * itself is staff-only, yet the Events section never rendered for them.
 * Instead of re-deriving that logic, ask the gate's own predicate for
 * every item: a section stays visible when the role can reach its own URL
 * or any descendant URL, and children the role cannot reach are dropped.
 * A parent kept only for its children's sake renders as a collapsible
 * trigger (never a link — see navigation-item.tsx), so showing it does
 * not advertise the parent URL the gate denies.
 */
export function filterNavigationByRole(
  items: readonly NavigationItem[],
  role: string | null | undefined,
): NavigationItem[] {
  return items.flatMap((item) => {
    const visibleChildren = item.subItems ? filterNavigationByRole(item.subItems, role) : undefined;
    const selfReachable = isRoleAllowedForPath(item.path, role);
    if (!selfReachable && (!visibleChildren || visibleChildren.length === 0)) {
      return [];
    }
    return [
      {
        ...item,
        // An empty child list collapses back to a plain row: the parent
        // URL itself is reachable, so the link form is the honest one.
        subItems: visibleChildren && visibleChildren.length > 0 ? visibleChildren : undefined,
      },
    ];
  });
}

/** Row count of the pending-session placeholder; cosmetic only. */
const SKELETON_ROW_COUNT = 8;

/**
 * Placeholder shell while the session is still resolving. Rendering the
 * real nav with an unknown role filtered every role-gated item out (the
 * old `user?.role as UserRole` cast), flashing an empty sidebar for a
 * moment before the session landed. Skeleton rows hold the space instead
 * (UI-22).
 */
export function DashboardSidebarSkeleton({ className }: DashboardSidebarProps) {
  return (
    <Sidebar collapsible="icon" className={className}>
      <SidebarHeaderComponent />
      <SidebarContent role="status" aria-label="Loading navigation">
        <SidebarGroup>
          <SidebarGroupLabel>
            <Skeleton className="h-3 w-24" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuSkeleton showIcon className="h-12" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user } = useSession();

  // Session still resolving (or no user yet): render the skeleton instead
  // of role-filtering against an unknown role (UI-22).
  if (!user) {
    return <DashboardSidebarSkeleton className={className} />;
  }

  // Active path detection
  const isPathActive = (path: string): boolean => {
    // Exact match
    if (pathname === path) return true;

    // For root dashboard, only match exactly, not subpaths
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }

    // For other paths, check if it starts with the path + "/"
    // But ensure we don't match if there's a more specific path that also matches
    if (pathname.startsWith(path + "/")) {
      // Check if there's a more specific navigation item that also matches
      // This prevents parent paths from being active when a child path is active
      const hasMoreSpecificMatch = filteredNavigationItems.some((item) => {
        // Skip current path being checked
        if (item.path === path) return false;

        // Only check items that are children of the current path
        if (item.path.startsWith(path + "/")) {
          // Check if this child path matches the current pathname exactly or as a prefix
          return pathname === item.path || pathname.startsWith(item.path + "/");
        }
        return false;
      });

      // Only mark as active if there's no more specific match
      return !hasMoreSpecificMatch;
    }

    return false;
  };

  // Role filter mirroring the server gate; see filterNavigationByRole.
  const filteredNavigationItems = filterNavigationByRole(navigationConfig, user.role);

  // Group items by category
  const navigationGroups = filteredNavigationItems.reduce(
    (groups, item) => {
      const category = item.category || "other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    },
    {} as Record<string, NavigationItem[]>,
  );

  return (
    <Sidebar collapsible="icon" className={className}>
      <SidebarHeaderComponent />
      <NavigationRenderer navigationGroups={navigationGroups} isActive={isPathActive} />
      <SidebarRail />
      <SidebarFooterComponent />
    </Sidebar>
  );
}
