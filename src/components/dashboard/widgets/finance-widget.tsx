"use client";

import * as React from "react";
import { WidgetContainer } from "../../ui/widget-container";
import { EmptyState } from "../../ui/empty-state";
import { Card, CardContent } from "../../ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "../../ui/badge";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Users } from "lucide-react";

interface FinanceWidgetProps {
  /** All-time completed revenue as an ADR-0015 amount string (e.g. "12345.67"). */
  totalRevenue?: string;
  /** Completed revenue for the current month, amount string. */
  monthlyRevenue?: string;
  /** Completed revenue for the previous month, amount string. */
  previousMonthRevenue?: string;
  /** Month-over-month revenue change, one decimal; null when the previous month had no revenue. */
  monthlyRevenueChangePercent?: number | null;
  /** Outstanding balance of ISSUED invoices, amount string. */
  pendingPayments?: string;
  /** Portion of pendingPayments past its due date, amount string. */
  overduePayments?: string;
  activeSubscriptions?: number;
  newSubscriptionsThisMonth?: number;
  onViewAllTransactions?: () => void;
}

/** Display formatting only — all money arithmetic stays in the service (ADR-0015). */
const formatAmount = (amount: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount));

export function FinanceWidget({
  totalRevenue,
  monthlyRevenue,
  previousMonthRevenue,
  monthlyRevenueChangePercent,
  pendingPayments,
  overduePayments,
  activeSubscriptions,
  newSubscriptionsThisMonth,
  onViewAllTransactions,
}: FinanceWidgetProps) {
  // No real data yet (or the caller lacks finance:read) — show the honest
  // empty state instead of placeholder numbers.
  if (!totalRevenue || !monthlyRevenue) {
    return (
      <WidgetContainer
        type="finance"
        title="Financial Overview"
        description="Revenue and subscription metrics"
        size="medium"
      >
        <EmptyState
          icon={<DollarSign className="h-8 w-8 text-muted-foreground" />}
          title="No financial data yet"
          description="Revenue, outstanding invoices and subscription counts appear here once your organization has membership activity."
        />
      </WidgetContainer>
    );
  }

  const hasOverdue = overduePayments != null && Number(overduePayments) > 0;

  return (
    <WidgetContainer
      type="finance"
      title="Financial Overview"
      description="Revenue and subscription metrics"
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-foreground/50" />
                <span className="text-sm font-medium text-foreground/70">
                  {formatAmount(totalRevenue)} total revenue
                </span>
              </div>
              {onViewAllTransactions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewAllTransactions}
                  className="text-xs"
                >
                  View all
                </Button>
              )}
            </div>

            {/* Finance cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Revenue */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-chart-3" />
                    <span className="text-sm font-medium text-foreground/70">Total Revenue</span>
                  </div>
                  <Badge className="bg-chart-3/20 text-chart-3">All Time</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatAmount(totalRevenue)}
                </div>
                <div className="text-xs text-foreground/50 mt-1">Completed transactions</div>
              </div>

              {/* Monthly Revenue */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-chart-1" />
                    <span className="text-sm font-medium text-foreground/70">Monthly Revenue</span>
                  </div>
                  <Badge className="bg-chart-1/20 text-chart-1">This Month</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatAmount(monthlyRevenue)}
                </div>
                {monthlyRevenueChangePercent != null ? (
                  <div
                    className={`flex items-center text-xs mt-1 ${
                      monthlyRevenueChangePercent >= 0 ? "text-chart-3" : "text-destructive"
                    }`}
                  >
                    {monthlyRevenueChangePercent >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    <span>
                      {monthlyRevenueChangePercent > 0 ? "+" : ""}
                      {monthlyRevenueChangePercent}% vs last month
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-foreground/50 mt-1">
                    {previousMonthRevenue != null && Number(previousMonthRevenue) > 0
                      ? "No change vs last month"
                      : "No revenue last month"}
                  </div>
                )}
              </div>

              {/* Pending Payments */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-chart-4" />
                    <span className="text-sm font-medium text-foreground/70">Outstanding</span>
                  </div>
                  <Badge className="bg-chart-4/20 text-chart-4">Invoices</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {pendingPayments != null ? formatAmount(pendingPayments) : "—"}
                </div>
                <div
                  className={`text-xs mt-1 ${hasOverdue ? "text-destructive" : "text-foreground/50"}`}
                >
                  {hasOverdue ? `${formatAmount(overduePayments!)} overdue` : "Nothing overdue"}
                </div>
              </div>

              {/* Active Subscriptions */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-chart-2" />
                    <span className="text-sm font-medium text-foreground/70">Subscriptions</span>
                  </div>
                  <Badge className="bg-chart-2/20 text-chart-2">Active</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {activeSubscriptions != null
                    ? new Intl.NumberFormat("en-US").format(activeSubscriptions)
                    : "—"}
                </div>
                <div className="text-xs text-foreground/50 mt-1">
                  {newSubscriptionsThisMonth != null
                    ? `${new Intl.NumberFormat("en-US").format(newSubscriptionsThisMonth)} new this month`
                    : "No new-subscription data"}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="text-xs text-foreground/50 text-center pt-2">
              Live totals from completed transactions and issued invoices.
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  );
}
