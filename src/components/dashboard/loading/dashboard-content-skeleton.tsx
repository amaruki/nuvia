"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardContentSkeletonProps {
  className?: string;
}

/**
 * Skeleton component for dashboard content area during route transitions.
 * Built entirely on the Skeleton primitive (bg-accent), so the loading
 * chrome follows the active theme tokens instead of a hardcoded palette.
 */
export function DashboardContentSkeleton({ className }: DashboardContentSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className,
      )}
    >
      {/* User Profile Skeleton */}
      <div className="xl:col-span-1">
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-3" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        </div>
      </div>

      {/* Notifications Skeleton */}
      <div className="xl:col-span-1">
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="w-2 h-2 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-2 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Large Widget Skeleton */}
      <div className="xl:col-span-2">
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medium Widget Skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="xl:col-span-2">
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-6 w-12" />
            </div>
            <div className="space-y-3">
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center space-x-3">
                  <Skeleton className="w-3 h-3" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-2 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Small Widget Skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="xl:col-span-1">
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <Skeleton className="h-5 w-1/2 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
