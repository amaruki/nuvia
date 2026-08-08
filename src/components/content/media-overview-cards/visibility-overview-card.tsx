"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MediaStatisticsCardProps } from "./types";
import { getVisibilityIcon } from "./helpers";

export function VisibilityOverviewCard({ statistics }: MediaStatisticsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Visibility Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {statistics.mediaByVisibility.map((visibility) => (
          <div
            key={visibility.visibility}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div>{getVisibilityIcon(visibility.visibility)}</div>
              <div>
                <p className="font-medium capitalize">{visibility.visibility}</p>
                <p className="text-sm text-muted-foreground">
                  {visibility.count} items • {visibility.percentage}% of total
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{visibility.count}</p>
              <p className="text-xs text-muted-foreground">files</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
