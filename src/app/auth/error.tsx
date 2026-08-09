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
 * Error boundary for the /auth routes (UI-20). Rendered inside the auth
 * layout, which already centers its children.
 */
export default function AuthError({ reset }: SegmentErrorProps) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="text-center space-y-4">
        <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          We couldn&apos;t load this page. Please try again — if it keeps failing, the problem is on
          our side.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Go to home page</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
