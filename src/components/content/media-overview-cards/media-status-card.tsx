"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MediaStatisticsCardProps } from "./types";

export function MediaStatusCard({ statistics }: MediaStatisticsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Media Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {statistics.mediaByStatus.map((status) => (
          <div
            key={status.status}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Badge
                variant={status.status === "ready" ? "default" : "secondary"}
                className="text-xs"
              >
                {status.status}
              </Badge>
              <div>
                <p className="font-medium capitalize">{status.status}</p>
                <p className="text-sm text-muted-foreground">
                  {status.count} items • {status.percentage}% of total
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{status.count}</p>
              <p className="text-xs text-muted-foreground">files</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
