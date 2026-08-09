import { Users } from "lucide-react";

import { AnalyticsGateNotice, BreakdownChart, StatCard, TrendChart } from "@/components/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getMemberAnalytics } from "@/lib/services/analytics-members";
import { requireAnalyticsAccess } from "../_lib/access";

const PAGE_PATH = "/dashboard/analytics/members";

// Aggregates are computed from the database at request time.
export const dynamic = "force-dynamic";

export default async function AnalyticsMembersPage() {
  const access = await requireAnalyticsAccess(PAGE_PATH);
  if ("state" in access) {
    return <AnalyticsGateNotice state={access.state} allowedRoles={access.allowedRoles} />;
  }

  const stats = await getMemberAnalytics();

  if (stats.totalMembers === 0) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<Users aria-hidden className="h-10 w-10 text-muted-foreground" />}
              title="No members yet"
              description="The member directory is empty, so there are no growth, role, or activity figures to show. Once the first account exists these charts fill in with real data."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total members" value={stats.totalMembers.toLocaleString()} />
        <StatCard label="Signups (12 months)" value={stats.signupsInWindow.toLocaleString()} />
        <StatCard
          label="Login attempts (12 months)"
          value={stats.loginActivity.total.toLocaleString()}
          hint={`${stats.loginActivity.successful.toLocaleString()} successful, ${stats.loginActivity.failed.toLocaleString()} failed`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Signups by month</CardTitle>
            <CardDescription>
              New accounts by creation month. Empty months are real zeros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.signupsInWindow > 0 ? (
              <TrendChart
                valueLabel="Signups"
                data={stats.signupsByMonth.map((point) => ({
                  label: point.label,
                  value: point.signups,
                }))}
              />
            ) : (
              <EmptyState
                title="No signups in this window"
                description="No new accounts were created in the last 12 months."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role distribution</CardTitle>
            <CardDescription>Aggregate counts per role — never individual members.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownChart
              data={stats.roleDistribution.map((entry) => ({
                key: entry.role,
                label: formatEnumLabel(entry.role),
                value: entry.count,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Login activity by month</CardTitle>
          <CardDescription>
            Recorded login attempts per month — the deployment's closest proxy for member activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.loginActivity.total > 0 ? (
            <TrendChart
              color="var(--chart-4)"
              valueLabel="Login attempts"
              data={stats.loginActivity.byMonth.map((point) => ({
                label: point.label,
                value: point.logins,
              }))}
            />
          ) : (
            <EmptyState
              title="No login activity recorded"
              description="No login attempts were recorded in the last 12 months, so there is no activity curve to draw."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Member Analytics</h1>
      <p className="text-sm text-muted-foreground">
        Growth, role mix, and a login-activity proxy — aggregates only, no member-level detail.
      </p>
    </div>
  );
}

/** "CHAPTER_ADMIN" -> "Chapter admin" for chart labels. */
function formatEnumLabel(value: string): string {
  const lower = value.replaceAll("_", " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
