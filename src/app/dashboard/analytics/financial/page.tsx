import Link from "next/link";
import { HandCoins } from "lucide-react";

import { AnalyticsGateNotice, BreakdownChart, StatCard, TrendChart } from "@/components/analytics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getFinancialAnalytics } from "@/lib/services/analytics-financial";
import { utcMonthLabel } from "@/lib/services/analytics-range";
import { formatCurrency, getOrganization } from "@/lib/services/organization.service";
import { requireAnalyticsAccess } from "../_lib/access";

const PAGE_PATH = "/dashboard/analytics/financial";

// Aggregates are computed from the database at request time.
export const dynamic = "force-dynamic";

export default async function AnalyticsFinancialPage() {
  const access = await requireAnalyticsAccess(PAGE_PATH);
  if ("state" in access) {
    return <AnalyticsGateNotice state={access.state} allowedRoles={access.allowedRoles} />;
  }

  const [stats, organization] = await Promise.all([getFinancialAnalytics(), getOrganization()]);

  const money = (amount: string) => formatCurrency(Number(amount), organization);
  const currentMonth = stats.revenueByPeriod[stats.revenueByPeriod.length - 1];
  const totalRevenue = stats.revenueByPeriod.reduce((sum, row) => sum + Number(row.revenue), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financial Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Revenue, receivables, and invoice health. Money totals reuse the finance-report
          aggregates, so this page and the finance reports always agree.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue this month"
          value={currentMonth ? money(currentMonth.revenue) : money("0.00")}
          hint={
            currentMonth ? `${currentMonth.transactionCount} completed transactions` : undefined
          }
        />
        <StatCard label="Revenue (12 months)" value={money(totalRevenue.toFixed(2))} />
        <StatCard
          label="Outstanding"
          value={money(stats.outstanding.outstandingAmount)}
          hint={`${stats.outstanding.invoiceCount} open invoices`}
        />
        <StatCard
          label="Overdue"
          value={money(stats.outstanding.overdueAmount)}
          hint={`${stats.outstanding.overdueCount} overdue invoices`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by month</CardTitle>
          <CardDescription>
            Completed membership transactions per month. Empty months are real zeros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalRevenue > 0 ? (
            <TrendChart
              valueLabel="Revenue"
              data={stats.revenueByPeriod.map((row) => ({
                label: utcMonthLabel(row.period),
                value: Number(row.revenue),
              }))}
            />
          ) : (
            <EmptyState
              title="No completed revenue yet"
              description="No completed transactions exist in the last 12 months, so the revenue chart has nothing to draw."
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoices by status</CardTitle>
            <CardDescription>Every invoice in the ledger, grouped by status.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.invoiceStatuses.length > 0 ? (
              <BreakdownChart
                data={stats.invoiceStatuses.map((entry) => ({
                  key: entry.status.toLowerCase(),
                  label: entry.status.charAt(0) + entry.status.slice(1).toLowerCase(),
                  value: entry.count,
                }))}
              />
            ) : (
              <EmptyState
                title="No invoices issued"
                description="The invoice ledger is empty, so there is no status breakdown to show."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dues vs donations</CardTitle>
            <CardDescription>The honest split — no invented donation totals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <HandCoins aria-hidden className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold tabular-nums">{money(stats.split.dues)}</p>
                <p className="text-xs text-muted-foreground">
                  Dues collected (12 months, {stats.split.duesTransactionCount} completed
                  transactions)
                </p>
              </div>
            </div>
            <Alert>
              <AlertTitle>Donations are not tracked yet</AlertTitle>
              <AlertDescription>
                {stats.split.donations.reason}
                {stats.split.donations.alternatives.length > 0 ? (
                  <span className="mt-1 block">
                    Alternatives:{" "}
                    {stats.split.donations.alternatives.map((alternative, index) => (
                      <span key={alternative.href}>
                        {index > 0 ? ", " : ""}
                        <Link href={alternative.href} className="underline underline-offset-2">
                          {alternative.label}
                        </Link>
                      </span>
                    ))}
                  </span>
                ) : null}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
