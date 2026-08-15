import { CalendarDays } from "lucide-react";

import { AnalyticsGateNotice, BreakdownChart, StatCard, TrendChart } from "@/components/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getEventAnalytics } from "@/lib/services/analytics-events";
import { requireAnalyticsAccess } from "../_lib/access";

const PAGE_PATH = "/dashboard/analytics/events";

// Aggregates are computed from the database at request time.
export const dynamic = "force-dynamic";

export default async function AnalyticsEventsPage() {
  const access = await requireAnalyticsAccess(PAGE_PATH);
  if ("state" in access) {
    return <AnalyticsGateNotice state={access.state} allowedRoles={access.allowedRoles} />;
  }

  const stats = await getEventAnalytics();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Analytics"
        description="Scheduled events over the last 12 months; registration and check-in figures cover the full registrations ledger."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Events (12 months)"
          value={stats.eventsInWindow.toLocaleString()}
          hint="Drafts excluded"
        />
        <StatCard label="Registrations" value={stats.totalRegistrations.toLocaleString()} />
        <StatCard
          label="Check-in rate"
          value={stats.checkIn.ratePercent === null ? "—" : `${stats.checkIn.ratePercent}%`}
          hint={
            stats.checkIn.ratePercent === null
              ? "No expected registrations yet"
              : `${stats.checkIn.checkedIn.toLocaleString()} of ${stats.checkIn.expected.toLocaleString()} expected`
          }
        />
        <StatCard
          label="Capacity utilization"
          value={
            stats.capacity?.utilizationPercent == null
              ? "—"
              : `${stats.capacity.utilizationPercent}%`
          }
          hint={
            stats.capacity === null
              ? "No capacity-declaring events in window"
              : `${stats.capacity.totalRegistered.toLocaleString()} registered of ${stats.capacity.totalCapacity.toLocaleString()} seats`
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events by month</CardTitle>
          <CardDescription>
            Non-draft events by start month. Empty months are real zeros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.eventsInWindow > 0 ? (
            <TrendChart
              valueLabel="Events"
              data={stats.byMonth.map((point) => ({ label: point.label, value: point.events }))}
            />
          ) : (
            <EmptyState
              icon={<CalendarDays aria-hidden className="h-10 w-10 text-muted-foreground" />}
              title="No events in this window"
              description="No non-draft events start in the last 12 months, so there is nothing to chart. Publish an event and it will appear here."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrations by status</CardTitle>
          <CardDescription>All registrations ever recorded, grouped by status.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.totalRegistrations > 0 ? (
            <BreakdownChart
              data={stats.registrationsByStatus.map((entry) => ({
                key: entry.status.toLowerCase(),
                label: formatEnumLabel(entry.status),
                value: entry.count,
              }))}
            />
          ) : (
            <EmptyState
              title="No registrations yet"
              description="Nobody has registered for any event, so there is no status breakdown to show."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** "NO_SHOW" -> "No show" for chart labels. */
function formatEnumLabel(value: string): string {
  const lower = value.replaceAll("_", " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
