"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import type { GatewayStatisticsCardProps } from "./types";
import { formatCurrency, formatPercentage } from "./helpers";

export function TopPerformingGatewaysCard({ statistics }: GatewayStatisticsCardProps) {
  return (
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
              const maxVol = Math.max(...statistics.gatewayBreakdown.map((g) => g.volume));
              const percentage = (gateway.volume / maxVol) * 100;

              return (
                <div key={gateway.gatewayId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                        {gateway.gatewayName}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
                      >
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
                    <span>
                      Success Rate:{" "}
                      <span
                        className={
                          gateway.successRate > 90
                            ? "text-emerald-700 dark:text-emerald-400 font-medium"
                            : "text-amber-700 dark:text-amber-400"
                        }
                      >
                        {formatPercentage(gateway.successRate)}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
