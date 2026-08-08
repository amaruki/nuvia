"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Megaphone } from "lucide-react";
import type { AnnouncementStatisticsCardProps } from "./types";
import { formatNumber } from "./helpers";

export function TypeDistributionCard({ statistics }: AnnouncementStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Announcement Types</CardTitle>
        <CardDescription>Distribution by announcement type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statistics.announcementsByType
            .sort((a, b) => b.count - a.count)
            .slice(0, 4)
            .map((type) => (
              <div
                key={type.type}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Megaphone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{type.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{type.count} announcements</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">{formatNumber(type.count)}</span>
                  <p className="text-xs text-muted-foreground">announcements</p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
