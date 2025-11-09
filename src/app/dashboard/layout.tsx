"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header";
import { DashboardFooter } from "@/components/dashboard/layout/dashboard-footer";
import { DashboardSidebar } from "@/components/dashboard/layout/dashboard-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { UserRole } from "@/types/dashboard.types";

/**
 * Props for the DashboardLayout component
 */
interface DashboardLayoutProps {
  /** Child components to be rendered within the layout */
  children: React.ReactNode;
  /** User information for display in the header */
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  /** User role for role-based features */
  role?: UserRole;
  /** Additional CSS classes for styling */
  className?: string;
  /** Header configuration options */
  headerProps?: {
    /** Title displayed in the header */
    title?: string;
    /** Description displayed in the header */
    description?: string;
    /** Action buttons or elements in the header */
    actions?: React.ReactNode;
  };
}

/**
 * Dashboard layout component that provides a consistent structure for dashboard pages.
 * Includes sidebar, header, main content area, and footer with proper responsive design.
 *
 * @param props - DashboardLayoutProps
 * @returns JSX.Element
 */
function DashboardLayout({
  children,
  user,
  role = "member",
  className,
  headerProps,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardSidebar user={user} role={role} />
      <SidebarInset className={cn("flex-1", className)}>
        {/* Main content */}
        <div className="flex flex-col h-full">
          <DashboardHeader
            title={headerProps?.title}
            description={headerProps?.description}
            user={user}
            actions={headerProps?.actions}
          />

          <main className="flex-1">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>

          <DashboardFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default DashboardLayout;
