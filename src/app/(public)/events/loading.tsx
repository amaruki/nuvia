import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder for the public events list (UI-20). Mirrors the
 * EventListLayout header band and the EventCard grid.
 */
export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header band — matches EventListLayout */}
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 mr-3 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-72 max-w-[60vw]" />
            </div>
          </div>
        </div>
      </div>

      {/* Event card grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-9 w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
