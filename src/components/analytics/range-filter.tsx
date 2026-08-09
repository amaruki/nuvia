import Link from "next/link";

import { ANALYTICS_RANGE_DAYS, type AnalyticsRangeDays } from "@/lib/services/analytics-range";
import { cn } from "@/lib/utils";

const RANGE_LABELS: Record<number, string> = {
  30: "Last 30 days",
  90: "Last 90 days",
  365: "Last year",
};

export interface RangeFilterProps {
  /** Page the filter links back to, e.g. "/dashboard/analytics/custom". */
  basePath: string;
  /** Currently active window, so the matching pill can be marked current. */
  active: AnalyticsRangeDays;
}

/**
 * Server-rendered window switcher for the custom report. Plain links keep it
 * static and crawlable; the page re-reads ?range= from searchParams.
 */
export function RangeFilter({ basePath, active }: RangeFilterProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {ANALYTICS_RANGE_DAYS.map((days) => (
        <Link
          key={days}
          href={`${basePath}?range=${days}`}
          aria-current={days === active ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            days === active
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {RANGE_LABELS[days] ?? `${days} days`}
        </Link>
      ))}
    </div>
  );
}
