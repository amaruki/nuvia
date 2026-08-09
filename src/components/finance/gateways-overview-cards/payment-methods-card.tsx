"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import type { GatewayStatisticsCardProps } from "./types";
import { formatPercentage } from "./helpers";

export function PaymentMethodsCard({ statistics }: GatewayStatisticsCardProps) {
  return (
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
              <div
                key={method.method}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {method.method.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">{method.count} txns</p>
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
  );
}
