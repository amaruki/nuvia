"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Wallet,
} from "lucide-react";
import type { GatewayStatisticsCardProps } from "./types";
import {
  formatCurrency,
  formatPercentage,
  getSuccessRateBadge,
  getSuccessRateColor,
} from "./helpers";

export function TotalVolumeCard({ statistics }: GatewayStatisticsCardProps) {
  return (
    <Card className="shadow-sm border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{formatCurrency(statistics.totalVolume)}</span>
          <span className="text-xs text-muted-foreground mt-1">
            Across {statistics.totalTransactions.toLocaleString()} transactions
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function SuccessRateCard({ statistics }: GatewayStatisticsCardProps) {
  const successRateBadge = getSuccessRateBadge(statistics.averageSuccessRate);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
          <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${getSuccessRateColor(statistics.averageSuccessRate)}`}
            >
              {formatPercentage(statistics.averageSuccessRate)}
            </span>
            <Badge
              variant="secondary"
              className={`text-[10px] px-2 h-5 ${successRateBadge.className}`}
            >
              {successRateBadge.text}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground mt-1">Average performance</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function TotalFeesCard({ statistics }: GatewayStatisticsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Fees</p>
          <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-purple-600" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{formatCurrency(statistics.totalFees)}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {formatPercentage((statistics.totalFees / statistics.totalVolume) * 100)} effective rate
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActiveGatewaysCard({ statistics }: GatewayStatisticsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Active Gateways</p>
          <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-indigo-600" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">
            {statistics.activeGateways}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              / {statistics.totalGateways}
            </span>
          </span>
          <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {statistics.inactiveGateways > 0 ? (
              <span className="text-rose-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {statistics.inactiveGateways} Inactive
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> All systems operational
              </span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
