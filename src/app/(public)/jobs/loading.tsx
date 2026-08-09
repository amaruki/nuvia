import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder for the public job board (UI-20). Mirrors the hero,
 * search form, type chips, JobCard grid and the closing CTA band.
 */
export default function JobsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero + search */}
        <div className="text-center py-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 max-w-full mx-auto mb-8" />
          <div className="max-w-2xl mx-auto flex gap-2 mb-6">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-28" />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>

        {/* Results count */}
        <Skeleton className="h-4 w-28 mb-6" />

        {/* Job cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-3 pt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full mt-4" />
              <Skeleton className="h-4 w-5/6 mt-2" />
              <Skeleton className="h-9 w-full mt-6" />
            </div>
          ))}
        </div>

        {/* CTA band */}
        <Skeleton className="h-40 w-full mt-16 rounded-xl" />
      </div>
    </div>
  );
}
