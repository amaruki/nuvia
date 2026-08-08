"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CATEGORY_STATUS_DISPLAY } from "@/types/category.types";
import { cn } from "@/lib/utils";
import type { CategoriesStatusBreakdownProps } from "./types";
import { formatNumber, getStatusColor, getStatusIcon } from "./helpers";

export function CategoriesStatusBreakdown({ statistics }: CategoriesStatusBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status Overview</CardTitle>
        <CardDescription>Current status distribution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statistics.categoriesByStatus.map((statusStat) => {
          const StatusIcon = getStatusIcon(statusStat.status);
          const statusDisplay = CATEGORY_STATUS_DISPLAY[statusStat.status];
          const percentage = (statusStat.count / statistics.totalCategories) * 100;

          return (
            <div key={statusStat.status} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn("h-4 w-4", getStatusColor(statusStat.status))} />
                  <span className="font-medium">{statusDisplay.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatNumber(statusStat.count)}</span>
                  <Badge variant="outline" className="text-xs">
                    {percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
