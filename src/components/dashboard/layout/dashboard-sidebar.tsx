"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import { UserRole } from "@/types/dashboard.types";
import { useSession } from "@/hooks/use-session";

// Modular components
import { navigationConfig, NavigationItem } from "./navigation-config";
import { NavigationRenderer } from "./navigation-group";
import { SidebarHeaderComponent } from "./sidebar-header";
import { SidebarFooterComponent } from "./sidebar-footer";

interface DashboardSidebarProps {
  readonly className?: string;
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user } = useSession();

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

  // Filter navigation items based on user role
  const filteredNavigationItems = navigationConfig.filter((item) => {
    return !item.roles || item.roles.includes(user?.role as UserRole);
  });

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
