"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  FileText,
  TrendingUp,
  AlertTriangle,
  Calendar,
  CreditCard,
} from "lucide-react";
import { InvoiceStatistics } from "@/types/finance.types";

interface InvoicesOverviewCardsProps {
  statistics: InvoiceStatistics;
}

export function InvoicesOverviewCards({ statistics }: InvoicesOverviewCardsProps) {
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
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Total Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{statistics.totalInvoices}</div>
          <p className="text-xs text-muted-foreground">
            {statistics.upcomingInvoices} due this month
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Total Amount</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">
            {formatCurrency(statistics.totalAmount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(statistics.paidAmount)} collected
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Collection Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-xl sm:text-2xl font-bold ${getCollectionRateColor(statistics.collectionRate)}`}
          >
            {statistics.collectionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            <Badge variant={collectionRateBadge.variant} className="text-xs">
              {collectionRateBadge.text}
            </Badge>
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-red-600">
            {statistics.overdueCount}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(statistics.overdueAmount)} outstanding
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
