"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MediaStatisticsCardProps } from "./types";
import { formatNumber, getMediaTypeIcon } from "./helpers";

export function TopPerformingCard({ statistics }: MediaStatisticsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top Performing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {statistics.topPerforming.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-blue-600">{getMediaTypeIcon(item.type)}</div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatNumber(item.views)} views • {formatNumber(item.downloads)} downloads
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold">{item.usage}</p>
              <p className="text-xs text-muted-foreground">usage</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
