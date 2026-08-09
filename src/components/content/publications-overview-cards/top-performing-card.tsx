"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import type { PublicationStatisticsCardProps } from "./types";
import { formatNumber, formatPercentage } from "./helpers";

export function TopPerformingPublicationsCard({ statistics }: PublicationStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Top Performing Publications
        </CardTitle>
        <CardDescription>By engagement score and views</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {statistics.topPerformingPublications.slice(0, 4).map((publication) => {
            // Calculate percentage for the bar width (relative to max engagement in set for visual)
            const maxEngagement = Math.max(
              ...statistics.topPerformingPublications.map((p) => p.engagementScore),
            );
            const percentage = (publication.engagementScore / maxEngagement) * 100;

            return (
              <div key={publication.publicationId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                      {publication.title}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
                    >
                      {publication.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold block">{formatNumber(publication.views)}</span>
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
                    Engagement:{" "}
                    <span
                      className={
                        publication.engagementScore > 80
                          ? "text-emerald-600 font-medium"
                          : "text-amber-600"
                      }
                    >
                      {formatPercentage(publication.engagementScore)}
                    </span>
                  </span>
                  <span>
                    Author: <span className="font-medium">{publication.author}</span>
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
