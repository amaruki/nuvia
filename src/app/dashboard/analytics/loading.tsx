import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder for the analytics section (UI-23). Mirrors the page
 * header, the KPI stat-card grid, and the chart cards every analytics page
 * renders while its aggregates are being computed.
 */
export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-[50vw]" />
      </div>

      {/* KPI stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-6 shadow-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Chart cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-6 shadow-sm">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-64 max-w-full" />
            <Skeleton className="mt-4 h-[260px] w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
