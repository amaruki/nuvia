import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Users, TrendingUp, AlertTriangle, Calendar, CreditCard } from "lucide-react";
import { DueStatistics } from "@/types/finance";

interface DuesOverviewCardsProps {
  statistics: DueStatistics;
}

export function DuesOverviewCards({ statistics }: DuesOverviewCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getCollectionRateBadge = (rate: number) => {
    if (rate >= 80) return { variant: "default" as const, text: "Excellent" };
    if (rate >= 60) return { variant: "secondary" as const, text: "Good" };
    return { variant: "destructive" as const, text: "Needs Attention" };
  };

  const collectionRateBadge = getCollectionRateBadge(statistics.collectionRate);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Dues</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.totalDues}</div>
          <p className="text-xs text-muted-foreground">
            {statistics.upcomingDues} upcoming this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(statistics.totalAmount)}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(statistics.collectedAmount)} collected
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${getCollectionRateColor(statistics.collectionRate)}`}
          >
            {statistics.collectionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            <Badge variant={collectionRateBadge.variant} className="text-xs">
              {collectionRateBadge.text}
            </Badge>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{statistics.overdueCount}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(statistics.overdueAmount)} outstanding
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
