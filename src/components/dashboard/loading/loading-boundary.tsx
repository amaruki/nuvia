"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { DashboardContentSkeleton } from "./dashboard-content-skeleton";
import { PageTransition } from "../transition/page-transition";

interface LoadingBoundaryProps {
  children: React.ReactNode;
  /**
   * Minimum loading time to prevent flickering
   * @default 300
   */
  minLoadingTime?: number;
  /**
   * Whether to show skeleton loading
   * @default true
   */
  showSkeleton?: boolean;
}

/**
 * Loading boundary component that provides smooth loading states
 * during navigation transitions
 */
export function LoadingBoundary({
  children,
  minLoadingTime = 300,
  showSkeleton = true,
}: LoadingBoundaryProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = React.useState(false);
  const [previousPathname, setPreviousPathname] = React.useState(pathname);
  const loadingStartTime = React.useRef<number | null>(null);

  React.useEffect(() => {
    // Detect route changes
    if (pathname !== previousPathname) {
      setIsLoading(true);
      loadingStartTime.current = Date.now();
      setPreviousPathname(pathname);

      // Calculate minimum loading time
      const timer = setTimeout(() => {
        // Ensure minimum loading time to prevent flickering
        const elapsed = loadingStartTime.current ? Date.now() - loadingStartTime.current : 0;
        const remainingTime = Math.max(0, minLoadingTime - elapsed);

        setTimeout(() => {
          setIsLoading(false);
          loadingStartTime.current = null;
        }, remainingTime);
      }, 50); // Small delay to catch quick navigations

      return () => clearTimeout(timer);
    }
  }, [pathname, previousPathname, minLoadingTime]);

  // Show skeleton during initial load or navigation
  if (isLoading && showSkeleton) {
    return (
      <PageTransition duration={200} fade={true}>
        <DashboardContentSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition duration={200} fade={true} slide={true} slideDirection="right">
      {children}
    </PageTransition>
  );
}