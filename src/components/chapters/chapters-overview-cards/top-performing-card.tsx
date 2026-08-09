"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import type { ChapterStatisticsCardProps } from "./types";

export function TopPerformingChaptersCard({ statistics }: ChapterStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Top Performing Chapters
        </CardTitle>
        <CardDescription>By member engagement and growth</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {statistics.topPerformingChapters.slice(0, 4).map((chapter) => {
            // Calculate percentage for the bar width (relative to max engagement score in set for visual)
            const maxScore = Math.max(
              ...statistics.topPerformingChapters.map((c) => c.engagementScore),
            );
            const percentage = (chapter.engagementScore / maxScore) * 100;

            return (
              <div key={chapter.chapterId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                      {chapter.chapterName}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
                    >
                      {chapter.location}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold block">{chapter.memberCount} members</span>
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
                    Growth:{" "}
                    <span
                      className={
                        chapter.growthRate > 0 ? "text-emerald-600 font-medium" : "text-amber-600"
                      }
                    >
                      {chapter.growthRate.toFixed(1)}%
                    </span>
                  </span>
                  <span>
                    Engagement:{" "}
                    <span className="font-medium">{chapter.engagementScore.toFixed(1)}</span>
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
