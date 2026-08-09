import { AnalyticsGateNotice, RangeFilter, StatCard, TrendChart } from "@/components/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getContentAnalytics } from "@/lib/services/analytics-content";
import { getEventAnalytics } from "@/lib/services/analytics-events";
import { getFinancialAnalytics } from "@/lib/services/analytics-financial";
import { getMemberAnalytics } from "@/lib/services/analytics-members";
import {
  monthsCoveredBy,
  parseAnalyticsRange,
  rangeSince,
  utcMonthLabel,
} from "@/lib/services/analytics-range";
import { formatCurrency, getOrganization } from "@/lib/services/organization.service";
import { requireAnalyticsAccess } from "../_lib/access";

const PAGE_PATH = "/dashboard/analytics/custom";

// Aggregates are computed from the database at request time.
export const dynamic = "force-dynamic";

const RANGE_CAPTIONS: Record<number, string> = {
  30: "last 30 days",
  90: "last 90 days",
  365: "last 365 days",
};

export default async function AnalyticsCustomPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireAnalyticsAccess(PAGE_PATH);
  if ("state" in access) {
    return <AnalyticsGateNotice state={access.state} allowedRoles={access.allowedRoles} />;
  }

  const sp = await searchParams;
  const days = parseAnalyticsRange(sp.range);
  const now = new Date();
  const since = rangeSince(days, now);
  const caption = RANGE_CAPTIONS[days] ?? `last ${days} days`;

  const [contentStats, eventStats, memberStats, financialStats, organization] = await Promise.all([
    getContentAnalytics({ since, now }),
    getEventAnalytics({ since, now }),
    getMemberAnalytics({ since, now }),
    getFinancialAnalytics({ months: monthsCoveredBy(days), now }),
    getOrganization(),
  ]);

  const publishedInWindow = contentStats.cadence.reduce((sum, point) => sum + point.published, 0);
  const revenueInWindow = financialStats.revenueByPeriod.reduce(
    (sum, row) => sum + Number(row.revenue),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Custom Reports</h1>
          <p className="text-sm text-muted-foreground">
            Every analytics aggregate recomputed over the {caption}.
          </p>
        </div>
        <RangeFilter basePath={PAGE_PATH} active={days} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Published content" value={publishedInWindow.toLocaleString()} />
        <StatCard label="Events" value={eventStats.eventsInWindow.toLocaleString()} />
        <StatCard label="New members" value={memberStats.signupsInWindow.toLocaleString()} />
        <StatCard
          label="Dues collected"
          value={formatCurrency(Number(financialStats.split.dues), organization)}
          hint={`${financialStats.split.duesTransactionCount} completed transactions`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Publication cadence</CardTitle>
            <CardDescription>
              Published items per {contentStats.cadenceBucket === "week" ? "week" : "month"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {publishedInWindow > 0 ? (
              <TrendChart
                valueLabel="Published"
                data={contentStats.cadence.map((point) => ({
                  label: point.label,
                  value: point.published,
                }))}
              />
            ) : (
              <WindowEmpty caption={caption} subject="published content" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events by month</CardTitle>
            <CardDescription>Non-draft events starting in the window, by month.</CardDescription>
          </CardHeader>
          <CardContent>
            {eventStats.eventsInWindow > 0 ? (
              <TrendChart
                valueLabel="Events"
                data={eventStats.byMonth.map((point) => ({
                  label: point.label,
                  value: point.events,
                }))}
              />
            ) : (
              <WindowEmpty caption={caption} subject="scheduled events" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member signups by month</CardTitle>
            <CardDescription>New accounts created in the window, by month.</CardDescription>
          </CardHeader>
          <CardContent>
            {memberStats.signupsInWindow > 0 ? (
              <TrendChart
                color="var(--chart-4)"
                valueLabel="Signups"
                data={memberStats.signupsByMonth.map((point) => ({
                  label: point.label,
                  value: point.signups,
                }))}
              />
            ) : (
              <WindowEmpty caption={caption} subject="member signups" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by month</CardTitle>
            <CardDescription>
              Completed transactions over the month-aligned window covering the {caption}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueInWindow > 0 ? (
              <TrendChart
                color="var(--chart-3)"
                valueLabel="Revenue"
                data={financialStats.revenueByPeriod.map((row) => ({
                  label: utcMonthLabel(row.period),
                  value: Number(row.revenue),
                }))}
              />
            ) : (
              <WindowEmpty caption={caption} subject="completed revenue" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WindowEmpty({ caption, subject }: { caption: string; subject: string }) {
  return (
    <EmptyState
      title={`No ${subject} in this window`}
      description={`Nothing counted as ${subject} in the ${caption}, so this chart has no data points to draw.`}
    />
  );
}
