"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Error boundary for the public forum pages. */
export default function ForumsError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t load the forums. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/forums">Back to forums</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
