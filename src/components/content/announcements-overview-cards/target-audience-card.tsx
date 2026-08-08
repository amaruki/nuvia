"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { AnnouncementStatisticsCardProps } from "./types";
import { formatNumber } from "./helpers";

export function TargetAudienceCard({ statistics }: AnnouncementStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Target Audience</CardTitle>
        <CardDescription>Distribution by target audience</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statistics.announcementsByTargetAudience
            .sort((a, b) => b.count - a.count)
            .slice(0, 4)
            .map((audience) => (
              <div
                key={audience.targetAudience}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {audience.targetAudience.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">{audience.count} announcements</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">{formatNumber(audience.count)}</span>
                  <p className="text-xs text-muted-foreground">announcements</p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
