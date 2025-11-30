"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GatewayOverallStatistics } from "@/types/finance.types";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

interface GatewaysOverviewCardsProps {
  statistics: GatewayOverallStatistics;
}

export function GatewaysOverviewCards({ statistics }: GatewaysOverviewCardsProps) {
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

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return "text-emerald-600";
    if (rate >= 90) return "text-amber-600";
    return "text-rose-600";
  };

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 95) return { className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100", text: "Excellent" };
    if (rate >= 90) return { className: "bg-amber-100 text-amber-700 hover:bg-amber-100", text: "Good" };
    return { className: "bg-rose-100 text-rose-700 hover:bg-rose-100", text: "Attention" };
  };

  const successRateBadge = getSuccessRateBadge(statistics.averageSuccessRate);

  return (
    <div className="space-y-6">
      {/* Top Key Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Volume */}
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

        {/* Success Rate */}
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
                <span className={`text-2xl font-bold ${getSuccessRateColor(statistics.averageSuccessRate)}`}>
                  {formatPercentage(statistics.averageSuccessRate)}
                </span>
                <Badge variant="secondary" className={`text-[10px] px-2 h-5 ${successRateBadge.className}`}>
                  {successRateBadge.text}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                Average performance
              </span>
            </div>
          </CardContent>
        </Card>

         {/* Total Fees */}
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

        {/* Active Gateways */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Active Gateways</p>
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{statistics.activeGateways} <span className="text-sm font-normal text-muted-foreground">/ {statistics.totalGateways}</span></span>
              <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                 {statistics.inactiveGateways > 0 ? (
                   <span className="text-rose-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {statistics.inactiveGateways} Inactive</span>
                 ) : (
                   <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> All systems operational</span>
                 )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Gateway Status Breakdown */}
        <Card className="shadow-sm col-span-1 lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Gateway Health</CardTitle>
            <CardDescription>Real-time status distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center gap-4">
             {/* Status Item: Active */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Active</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                    {statistics.activeGateways}
                </Badge>
            </div>

            {/* Status Item: Testing */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <Clock className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Testing</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold bg-amber-50 text-amber-700 border-amber-200">
                    {statistics.testingGateways}
                </Badge>
            </div>

            {/* Status Item: Inactive */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <XCircle className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Inactive</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold bg-slate-50 text-slate-700 border-slate-200">
                    {statistics.inactiveGateways}
                </Badge>
            </div>

            {/* Status Item: Error */}
            <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                        <AlertTriangle className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Error</span>
                </div>
                <Badge variant="outline" className="text-sm font-bold bg-rose-50 text-rose-700 border-rose-200">
                    {statistics.errorGateways}
                </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Gateways */}
        <Card className="shadow-sm col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Top Performing Gateways
            </CardTitle>
            <CardDescription>By transaction volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {statistics.gatewayBreakdown
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 4)
                .map((gateway) => {
                  // Calculate percentage for the bar width (relative to max volume in set for visual)
                  const maxVol = Math.max(...statistics.gatewayBreakdown.map(g => g.volume));
                  const percentage = (gateway.volume / maxVol) * 100;
                  
                  return (
                  <div key={gateway.gatewayId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                          {gateway.gatewayName}
                        </span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                            {gateway.provider}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold block">{formatCurrency(gateway.volume)}</span>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                         <span>Success Rate: <span className={gateway.successRate > 90 ? "text-emerald-600 font-medium" : "text-amber-600"}>{formatPercentage(gateway.successRate)}</span></span>
                    </div>
                  </div>
                )})}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="shadow-sm col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Payment Methods</CardTitle>
            <CardDescription>Usage distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.paymentMethodUsage
                .sort((a, b) => b.count - a.count)
                .slice(0, 4)
                .map((method) => (
                  <div key={method.method} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {method.method.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {method.count} txns
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{formatPercentage(method.percentage)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}