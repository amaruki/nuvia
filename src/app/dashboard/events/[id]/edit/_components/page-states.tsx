"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/** Full-width spinner shown while the event is being fetched. */
export function EditEventLoadingState() {
  return (
    <div className="flex justify-center items-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );
}

interface EventNotFoundStateProps {
  onGoBack: () => void;
}

/** Shown when the fetch resolves without an event (missing or removed). */
export function EventNotFoundState({ onGoBack }: EventNotFoundStateProps) {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold text-foreground/90 mb-2">Event Not Found</h1>
      <p className="text-foreground/60 mb-6">
        The event you're trying to edit doesn't exist or has been removed.
      </p>
      <Button onClick={onGoBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>
    </div>
  );
}
