"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoleStatisticsSectionProps } from "./types";

export function RoleDistributionCard({ data }: RoleStatisticsSectionProps) {
  const barChartData = data.roleBreakdown.map((item) => ({
    role: item.displayName,
    count: item.count,
    percentage: item.percentage,
    category: item.category,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Distribution</CardTitle>
        <CardDescription>Number of users per role</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {barChartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded">
              <span className="font-medium">{item.role}</span>
              <div className="text-right">
                <div className="font-bold">{item.count}</div>
                <div className="text-sm text-muted-foreground">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
