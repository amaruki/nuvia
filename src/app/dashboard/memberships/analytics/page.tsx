/**
 * Membership analytics (UI-23), read-only.
 *
 * Aggregates come from src/lib/services/membership-analytics-read.ts:
 * derived member status (never stored, ADR-0014 derivation shared with the
 * member directory), new-account growth by UTC month, and ACTIVE
 * subscriptions per tier. The charts are client islands that only render the
 * server-fetched data.
 */

import { redirect } from "next/navigation";
import { ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import { getCurrentUser } from "@/lib/rbac";
import { getMembershipAnalytics } from "@/lib/services/membership-analytics-read";
import type { MemberStatus } from "@/lib/services/membership-status.service";
import { formatNumber } from "./_components/helpers";
import { GrowthChart } from "./_components/growth-chart";
import { StatusChart } from "./_components/status-chart";
import { TierDistributionChart } from "./_components/tier-chart";

export const dynamic = "force-dynamic";

const PATH = "/dashboard/memberships/analytics";

const STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Active",
  trialing: "Trialing",
  in_grace: "In grace",
  paused: "Paused",
  expired: "Expired",
  none: "No subscription",
};

export default async function MembershipsAnalyticsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  if (!isRoleAllowedForPath(PATH, currentUser.role)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Membership Analytics" />
        <Card>
          <EmptyState
            icon={<ShieldCheck className="size-8 text-muted-foreground" aria-hidden="true" />}
            title="You don't have access to this page"
            description="Your current role isn't permitted to view membership analytics. Contact an administrator if you believe this is a mistake."
          />
        </Card>
      </div>
    );
  }

  const analytics = await getMembershipAnalytics();
  const statusData = (Object.keys(STATUS_LABELS) as MemberStatus[]).map((status) => ({
    label: STATUS_LABELS[status],
    count: analytics.statusCounts[status],
  }));
  const tiersWithMembers = analytics.tierDistribution.filter(
    (tier) => tier.activeSubscriptions > 0,
  );

  const stats = [
    { label: "Total accounts", value: analytics.totalAccounts },
    { label: "Active members", value: analytics.statusCounts.active },
    { label: "Trialing", value: analytics.statusCounts.trialing },
    { label: "Active subscriptions", value: analytics.totalActiveSubscriptions },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership Analytics"
        description="Member status is derived from each account's latest subscription — the same derivation the member directory uses."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{formatNumber(stat.value)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {analytics.totalAccounts === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="size-8 text-muted-foreground" aria-hidden="true" />}
            title="No member accounts yet"
            description="Analytics appear here once accounts exist. Growth, status breakdown and tier distribution are computed from live data."
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New member accounts</CardTitle>
              <CardDescription>Accounts created per month (UTC), last 12 months.</CardDescription>
            </CardHeader>
            <CardContent>
              <GrowthChart data={analytics.monthlyGrowth} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Members by status</CardTitle>
              <CardDescription>
                Derived status across {formatNumber(analytics.totalAccounts)} non-deleted accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusChart data={statusData} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Active subscriptions by tier</CardTitle>
              <CardDescription>
                Subscriptions currently in the ACTIVE state, grouped by membership tier.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tiersWithMembers.length === 0 ? (
                <EmptyState
                  title="No active subscriptions"
                  description="Tier distribution appears here once subscriptions enter the ACTIVE state."
                />
              ) : (
                <TierDistributionChart
                  data={tiersWithMembers.map((tier) => ({
                    label: tier.tierLabel,
                    count: tier.activeSubscriptions,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
