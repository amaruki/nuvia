"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { HeaderSearch } from "./header-search";
import { NotificationsMenu } from "./notifications-menu";
import { QuickSettingsMenu } from "./quick-settings-menu";
import type { DashboardHeaderProps } from "./types";

export function DashboardHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
  notificationCount = 0,
  showSearch = true,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onViewAllNotifications,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200",
        className,
      )}
    >
      <div className="flex w-full items-center gap-2 px-4">
        {/* Sidebar Trigger */}
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        {/* Breadcrumbs or Title */}
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem className="hidden md:block">
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="font-semibold">{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={item.href || "#"}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {item.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className="hidden md:block" />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          ) : title ? (
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
              {description && (
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          {showSearch && <HeaderSearch />}

          <NotificationsMenu
            notificationCount={notificationCount}
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onDismiss={onDismiss}
            onViewAllNotifications={onViewAllNotifications}
          />

          <QuickSettingsMenu />

          {/* Additional actions */}
          {actions}
        </div>
      </div>
    </header>
  );
}
