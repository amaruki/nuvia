import { FileText } from "lucide-react";

import { AnalyticsGateNotice, BarListChart, StatCard, TrendChart } from "@/components/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getContentAnalytics } from "@/lib/services/analytics-content";
import { requireAnalyticsAccess } from "../_lib/access";

const PAGE_PATH = "/dashboard/analytics/content";

// Aggregates are computed from the database at request time.
export const dynamic = "force-dynamic";

export default async function AnalyticsContentPage() {
  const access = await requireAnalyticsAccess(PAGE_PATH);
  if ("state" in access) {
    return <AnalyticsGateNotice state={access.state} allowedRoles={access.allowedRoles} />;
  }

  const stats = await getContentAnalytics();
  const cadenceTotal = stats.cadence.reduce((sum, point) => sum + point.published, 0);

  if (stats.total === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Content Analytics"
          description="Volume, cadence, and category usage across the content library."
        />
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<FileText aria-hidden className="h-10 w-10 text-muted-foreground" />}
              title="No content yet"
              description="Nothing has been created in the content library, so there is nothing to chart. Create a first article or page and these analytics will fill in with real data."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Analytics"
        description="Volume, cadence, and category usage across the content library."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total items" value={stats.total.toLocaleString()} />
        <StatCard label="Published" value={stats.published.toLocaleString()} />
        <StatCard label="Drafts" value={stats.drafts.toLocaleString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content by type</CardTitle>
            <CardDescription>Non-deleted items, grouped by content type.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.byType.length > 0 ? (
              <BarListChart
                valueLabel="Items"
                data={stats.byType.map((entry) => ({
                  label: formatEnumLabel(entry.type),
                  value: entry.count,
                }))}
              />
            ) : (
              <EmptyState title="No typed content" description="No content rows exist yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top categories</CardTitle>
            <CardDescription>
              Up to eight categories by item count; uncategorized items are counted separately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topCategories.length > 0 ? (
              <BarListChart
                color="var(--chart-3)"
                valueLabel="Items"
                data={stats.topCategories.map((entry) => ({
                  label: entry.name,
                  value: entry.count,
                }))}
              />
            ) : (
              <EmptyState
                title="No categories in use"
                description="Content exists but nothing is categorized yet."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publication cadence (last 90 days)</CardTitle>
          <CardDescription>
            Published items per {stats.cadenceBucket === "week" ? "week" : "month"}. Empty buckets
            are real zeros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cadenceTotal > 0 ? (
            <TrendChart
              valueLabel="Published"
              data={stats.cadence.map((point) => ({ label: point.label, value: point.published }))}
            />
          ) : (
            <EmptyState
              title="Nothing published in this window"
              description="No content was published in the last 90 days, so the cadence chart has no data points to draw."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** "BLOG_POST" -> "Blog post" for chart ticks. */
function formatEnumLabel(value: string): string {
  const lower = value.replaceAll("_", " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
