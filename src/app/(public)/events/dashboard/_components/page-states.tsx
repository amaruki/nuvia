"use client";

/**
 * Loading and error states for the event dashboard page.
 */

import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DashboardErrorStateProps {
  message: string | null;
}

export function DashboardLoadingState() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
}

export function DashboardErrorState({ message }: DashboardErrorStateProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-foreground/90 mb-2">Dashboard Error</h1>
        <p className="text-foreground/60">
          {message || "Failed to load dashboard data. Please try again later."}
        </p>
      </div>
    </div>
  );
}
