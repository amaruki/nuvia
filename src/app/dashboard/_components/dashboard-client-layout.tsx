"use client";

import * as React from "react";
import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header";
import { DashboardFooter } from "@/components/dashboard/layout/dashboard-footer";
import { DashboardSidebar } from "@/components/dashboard/layout/dashboard-sidebar";
import { DashboardProvider, useHeader } from "@/contexts/dashboard-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AnnouncementBanner } from "@/components/content/announcement-banner";

/**
 * Props for the DashboardClientLayout component
 */
interface DashboardClientLayoutProps {
  /** Child components to be rendered within the layout */
  children: React.ReactNode;
}

/**
 * Dashboard Header Wrapper - uses header context for dynamic headers.
 * Renders immediately: as soon as a page sets a header through useHeader()
 * it is shown, and routes that never set one get the fallback title without
 * an artificial skeleton delay (UI-20).
 */
function DashboardHeaderWrapper() {
  const { title, description, actions } = useHeader();

  return (
    <DashboardHeader title={title || "Dashboard"} description={description} actions={actions} />
  );
}

/**
 * Client half of the dashboard shell (extracted from layout.tsx by UI-39 so
 * the root layout can stay a server component and render the demo-mode
 * banner above the client tree). Provides sidebar, header, main content area
 * and footer with proper responsive design.
 */
export function DashboardClientLayout({ children }: DashboardClientLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardProvider>
        <DashboardSidebar />
        <SidebarInset className="flex-1">
          {/* Main content */}
          <div className="flex flex-col h-full">
            <DashboardHeaderWrapper />

            {/* UI-11: skip-to-content link target (see src/app/layout.tsx).
                tabIndex={-1} lets activation of the skip link move focus
                here without adding an extra tab stop. */}
            <main id="main-content" tabIndex={-1} className="flex-1 pb-20">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
            </main>

            <DashboardFooter />
          </div>

          {/* Announcement Banner - Fixed at bottom */}
          <AnnouncementBanner />
        </SidebarInset>
      </DashboardProvider>
    </SidebarProvider>
  );
}

export default DashboardClientLayout;
