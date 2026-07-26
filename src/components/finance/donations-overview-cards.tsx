"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DonationStatistics } from "@/types/finance.types";
import {
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  CreditCard,
  Target,
  Gift,
  Repeat,
} from "lucide-react";

interface DonationsOverviewCardsProps {
  statistics: DonationStatistics;
}

export function DonationsOverviewCards({ statistics }: DonationsOverviewCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const cards = [
    {
      title: "Total Donations",
      value: formatCurrency(statistics.totalAmount),
      change: "+12.5%",
      changeType: "positive" as const,
      icon: DollarSign,
      description: `${statistics.totalDonations} donations`,
    },
    {
      title: "Completed Amount",
      value: formatCurrency(statistics.completedAmount),
      change: "+8.2%",
      changeType: "positive" as const,
      icon: CreditCard,
      description: `${formatPercentage((statistics.completedAmount / statistics.totalAmount) * 100)} of total`,
    },
    {
      title: "Total Donors",
      value: statistics.donorCount.toString(),
      change: "+15.3%",
      changeType: "positive" as const,
      icon: Users,
      description: `${statistics.recurringDonorCount} recurring donors`,
    },
    {
      title: "Average Donation",
      value: formatCurrency(statistics.averageDonation),
      change: "+5.7%",
      changeType: "positive" as const,
      icon: Gift,
      description: "Per donation average",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{card.description}</span>
            </div>
            <div className="mt-2 flex items-center">
              <Badge
                variant={card.changeType === "positive" ? "default" : "destructive"}
                className="text-xs"
              >
                {card.change}
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Additional Stats Cards */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Campaign Performance</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statistics.campaignBreakdown.slice(0, 3).map((campaign, index) => (
              <div key={campaign.campaignId} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {campaign.campaignName}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(campaign.amount)}</div>
                  <div className="text-xs text-muted-foreground">{campaign.count} donations</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Donor Types</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statistics.donorTypeBreakdown.map((donorType, index) => (
              <div key={donorType.donorType} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {donorType.donorType === "individual" && (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  )}
                  {donorType.donorType === "organization" && (
                    <Target className="h-4 w-4 text-muted-foreground" />
                  )}
                  {donorType.donorType === "anonymous" && (
                    <Gift className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium capitalize">{donorType.donorType}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(donorType.amount)}</div>
                  <div className="text-xs text-muted-foreground">{donorType.count} donors</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
