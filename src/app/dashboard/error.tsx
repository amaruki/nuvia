"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SegmentErrorProps {
  /**
   * The thrown error. Deliberately not rendered: error messages can carry
   * internal details, and recovery happens through reset().
   */
  error: Error & { digest?: string };
  /** Re-attempts rendering the current segment. */
  reset: () => void;
}

/**
 * Error boundary for the dashboard routes (UI-20). Rendered inside the
 * dashboard shell, so it brings no full-screen chrome of its own.
 */
export default function DashboardError({ reset }: SegmentErrorProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardContent className="text-center space-y-4">
          <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">
            We couldn&apos;t load this part of the dashboard. Please try again.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to overview</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
