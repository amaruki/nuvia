"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header";
import { DashboardFooter } from "@/components/dashboard/layout/dashboard-footer";
import { DashboardSidebar } from "@/components/dashboard/layout/dashboard-sidebar";
import { DashboardProvider, useHeader } from "@/contexts/dashboard-context";
import { Skeleton } from "@/components/ui/skeleton";
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
 * Dashboard Header Wrapper - uses header context for dynamic headers
 */
function DashboardHeaderWrapper({ user }: { user?: DashboardLayoutProps["user"] }) {
  const { title, description, actions } = useHeader();
  const [isHeaderLoaded, setIsHeaderLoaded] = useState(false);

  // Track if header has been set by a page
  useEffect(() => {
    if (title || description) {
      setIsHeaderLoaded(true);
    } else {
      // Small delay to show skeleton on fast loads for better UX
      const timer = setTimeout(() => {
        setIsHeaderLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [title, description]);

  // Show skeleton while header is loading
  if (!isHeaderLoaded) {
    return (
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardHeader
      title={title || "Dashboard"}
      description={description}
      user={user}
      actions={actions}
    />
  );
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
}: Omit<DashboardLayoutProps, 'headerProps'>) {
  return (
    <SidebarProvider>
      <DashboardProvider>
        <DashboardSidebar />
        <SidebarInset className={cn("flex-1", className)}>
          {/* Main content */}
          <div className="flex flex-col h-full">
            <DashboardHeaderWrapper user={user} />

            <main className="flex-1">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </div>
            </main>

            <DashboardFooter />
          </div>
        </SidebarInset>
      </DashboardProvider>
    </SidebarProvider>
  );
}

export default DashboardLayout;
