import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Receipt, TrendingUp, Wallet } from "lucide-react";

import type { BudgetOverviewSummary } from "@/lib/hooks/use-finance-budgets/types";

interface BudgetOverviewCardsProps {
  overview: BudgetOverviewSummary;
}

/**
 * Budget overview cards, mirroring the invoices overview layout: allocated,
 * spent, remaining, and the used percentage with a progress bar. Figures
 * come from buildBudgetOverview; nothing here fetches or invents data.
 */
export function BudgetOverviewCards({ overview }: BudgetOverviewCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage <= 80) return "text-green-600";
    if (percentage <= 100) return "text-yellow-600";
    return "text-red-600";
  };

  const getUsageBadge = (percentage: number) => {
    if (percentage <= 80) return { variant: "default" as const, text: "On Track" };
    if (percentage <= 100) return { variant: "secondary" as const, text: "Warning" };
    return { variant: "destructive" as const, text: "Over Budget" };
  };

  const usageBadge = getUsageBadge(overview.percentageUsed);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Total Budget</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">
            {formatCurrency(overview.totalBudget)}
          </div>
          <p className="text-xs text-muted-foreground">
            {overview.categoryCount} {overview.categoryCount === 1 ? "category" : "categories"}
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Spent</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{formatCurrency(overview.totalSpent)}</div>
          <p className="text-xs text-muted-foreground">
            {overview.approvedExpenseCount} approved{" "}
            {overview.approvedExpenseCount === 1 ? "expense" : "expenses"}
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Remaining</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-xl sm:text-2xl font-bold ${
              overview.totalRemaining < 0 ? "text-red-600" : ""
            }`}
          >
            {formatCurrency(overview.totalRemaining)}
          </div>
          <p className="text-xs text-muted-foreground">
            of {formatCurrency(overview.totalBudget)} allocated
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Budget Used</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-xl sm:text-2xl font-bold ${getUsageColor(overview.percentageUsed)}`}
          >
            {overview.percentageUsed.toFixed(1)}%
          </div>
          <Progress
            value={Math.min(100, overview.percentageUsed)}
            className="mt-2 h-2"
            aria-label="Percentage of the total budget used"
          />
          <p className="text-xs text-muted-foreground mt-2">
            <Badge variant={usageBadge.variant} className="text-xs">
              {usageBadge.text}
            </Badge>
            {overview.overBudgetCount > 0 && (
              <span className="ml-2">{overview.overBudgetCount} over budget</span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
