import { Calendar, Clock, HandHeart, Users } from "lucide-react";

import { DonationStatistics } from "@/types/finance";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DonationsOverviewCardsProps {
  statistics: DonationStatistics;
}

/**
 * Four money cards computed from the aggregate window rows via
 * buildDonationStatistics — "raised" figures count completed donations
 * only; outstanding sums pending and pledged gifts.
 */
export function DonationsOverviewCards({ statistics }: DonationsOverviewCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const outstandingAmount = statistics.pendingAmount + statistics.pledgedAmount;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Total Raised</CardTitle>
          <HandHeart className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">
            {formatCurrency(statistics.totalAmount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {statistics.totalDonations} donations recorded
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">
            {formatCurrency(statistics.thisMonthAmount)}
          </div>
          <p className="text-xs text-muted-foreground">completed donations this month</p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Outstanding</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{formatCurrency(outstandingAmount)}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(statistics.pendingAmount)} pending,{" "}
            {formatCurrency(statistics.pledgedAmount)} pledged
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">Donors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{statistics.donorCount}</div>
          <p className="text-xs text-muted-foreground">
            {statistics.recurringDonorCount} recurring
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
