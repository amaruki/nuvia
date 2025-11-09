"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header";
import { DashboardFooter } from "@/components/dashboard/layout/dashboard-footer";
import { DashboardSidebar } from "@/components/dashboard/layout/dashboard-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSidebar } from "@/lib/hooks/use-sidebar";
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
  const {
    isCollapsed,
    isMobile,
    toggleSidebar,
    expandSidebar,
    collapseSidebar,
  } = useSidebar({
    defaultCollapsed: false,
    storageKey: "nuvia-sidebar-state",
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Handle mobile menu toggle
  const handleMobileMenuToggle = React.useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Close mobile menu when resizing to desktop
  React.useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

  // Close mobile menu when navigating to a new page
  React.useEffect(() => {
    const handleRouteChange = () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    // Listen for route changes
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [isMobileMenuOpen]);

  // Listen for custom event to close mobile menu
  React.useEffect(() => {
    const handleCloseMobileMenu = () => {
      setIsMobileMenuOpen(false);
    };

    window.addEventListener("close-mobile-menu", handleCloseMobileMenu);

    return () => {
      window.removeEventListener("close-mobile-menu", handleCloseMobileMenu);
    };
  }, []);

  return (
    <SidebarProvider>
      <div className={cn("min-h-screen bg-background flex", className)}>
        {/* Desktop Sidebar */}
        <DashboardSidebar
          user={user}
          role={role}
          className={cn("hidden md:flex", isMobile && "hidden")}
        />

        {/* Mobile Sidebar Overlay */}
        <>
          <div
            className={cn(
              "fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity",
              isMobileMenuOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none",
            )}
            onClick={handleMobileMenuToggle}
          />
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-64 bg-card md:hidden transition-transform",
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
            )}
            data-mobile-menu="true"
          >
            <DashboardSidebar user={user} role={role} />
          </div>
        </>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader
            title={headerProps?.title}
            description={headerProps?.description}
            user={user}
            actions={headerProps?.actions}
            onMenuClick={handleMobileMenuToggle}
            showMenuButton={isMobile}
          />

          <main className="flex-1">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>

          <DashboardFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}

export default DashboardLayout;
