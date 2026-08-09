import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { BudgetOverview } from "@/types/finance";

interface BudgetOverviewCardProps {
  overview: BudgetOverview;
}

export function BudgetOverviewCard({ overview }: BudgetOverviewCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) return { variant: "destructive" as const, text: "Critical" };
    if (percentage >= 75) return { variant: "secondary" as const, text: "Warning" };
    return { variant: "default" as const, text: "On Track" };
  };

  const statusBadge = getStatusBadge(overview.percentageUsed);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(overview.totalBudget)}</div>
          <p className="text-xs text-muted-foreground">Current period allocation</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(overview.totalSpent)}</div>
          <p className="text-xs text-muted-foreground">
            {overview.percentageUsed.toFixed(1)}% of budget used
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getStatusColor(overview.percentageUsed)}`}>
            {formatCurrency(overview.totalRemaining)}
          </div>
          <p className="text-xs text-muted-foreground">
            {overview.totalRemaining > 0 ? "Available to spend" : "Over budget"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
          </div>
          <Progress value={overview.percentageUsed} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {overview.periodComparison.changePercentage > 0 ? "+" : ""}
            {overview.periodComparison.changePercentage.toFixed(1)}% vs last period
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
