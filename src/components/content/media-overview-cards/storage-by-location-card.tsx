"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MediaStatisticsCardProps } from "./types";
import { formatNumber, getLocationIcon, getLocationName } from "./helpers";

export function StorageByLocationCard({ statistics }: MediaStatisticsCardProps) {
  const totalStorage = Object.values(statistics.storageUsage).reduce((sum, val) => sum + val, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Storage by Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(statistics.storageUsage).map(([location, size]) => {
          const percentage = Math.round((size / totalStorage) * 100);

          return (
            <div key={location} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div>{getLocationIcon(location)}</div>
                <div>
                  <p className="font-medium">{getLocationName(location)}</p>
                  <p className="text-sm text-muted-foreground">{formatNumber(size)} bytes</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{percentage}%</p>
                <p className="text-xs text-muted-foreground">of total</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
