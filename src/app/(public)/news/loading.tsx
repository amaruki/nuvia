import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder for the public news feed (UI-20). Mirrors the hero,
 * type filter chips and the stacked news cards.
 */
export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Hero + type chips */}
        <div className="text-center py-12">
          <Skeleton className="h-10 w-40 mx-auto mb-4" />
          <Skeleton className="h-5 w-80 max-w-full mx-auto mb-8" />
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-28 rounded-full" />
            ))}
          </div>
        </div>

        {/* Results count */}
        <Skeleton className="h-4 w-24 mb-6" />

        {/* News cards */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
