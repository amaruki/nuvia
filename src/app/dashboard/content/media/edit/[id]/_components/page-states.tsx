"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";

/** Centered spinner shown while the media item is being loaded. */
export function EditMediaLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="md" />
    </div>
  );
}
