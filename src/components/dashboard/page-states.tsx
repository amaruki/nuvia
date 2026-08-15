"use client";

/**
 * Shared loading/error states for dashboard pages.
 *
 * Dashboard layout convention:
 * - The dashboard shell owns the single centered container and the sticky
 *   header (DashboardHeader fed by useHeader). Pages render bare content —
 *   no `container`/`mx-auto` wrappers and no page-level h1.
 * - A page root is typically `<div className="space-y-6">`.
 *
 * Use these states instead of hand-rolled skeletons or inline error divs so
 * every dashboard page loads and fails the same way.
 */

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageLoadingStateProps {
  /** Number of stat-card skeleton blocks. Defaults to 4. */
  cards?: number;
  /** Override the grid (e.g. `"lg:grid-cols-3"`); merged via cn. */
  className?: string;
}

/** Full-page skeleton shown while a dashboard page's initial data loads. */
export function PageLoadingState({ cards = 4, className }: PageLoadingStateProps) {
  return (
    <div
      className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: cards }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-8 w-32" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface PageErrorStateProps {
  /** User-facing error message. */
  error: string;
  /** Re-run the failed fetch. Omit when no retry is possible. */
  onRetry?: () => void;
  className?: string;
}

/** Standard inline error block for failed dashboard data fetches. */
export function PageErrorState({ error, onRetry, className }: PageErrorStateProps) {
  return (
    <div className={cn("space-y-4", className)} role="alert">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
