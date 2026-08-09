import { Building2, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Chapter, ChapterOverallStatistics } from "@/types/chapter.types";

interface OverviewTabProps {
  chapters: Chapter[];
  statistics: ChapterOverallStatistics | null;
}

export function OverviewTab({ chapters, statistics }: OverviewTabProps) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chapter Status Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Chapter Status Summary</h3>
          <div className="space-y-3">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{chapter.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {chapter.location.city}, {chapter.location.state}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      chapter.status === "active"
                        ? "default"
                        : chapter.status === "inactive"
                          ? "secondary"
                          : chapter.status === "pending"
                            ? "outline"
                            : "destructive"
                    }
                  >
                    {chapter.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Regional Distribution</h3>
          <div className="space-y-3">
            {statistics?.regionalBreakdown.map((region) => (
              <div
                key={region.region}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{region.region}</p>
                    <p className="text-sm text-muted-foreground">{region.chapterCount} chapters</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{region.memberCount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">members</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {statistics && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Top Performing Chapters</h3>
            <div className="space-y-3">
              {statistics.topPerformingChapters.slice(0, 3).map((chapter) => (
                <div
                  key={chapter.chapterId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="font-medium">{chapter.chapterName}</p>
                    <p className="text-sm text-muted-foreground">
                      {chapter.location} • {chapter.memberCount} members
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-lg font-bold ${
                        chapter.growthRate >= 0
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {chapter.growthRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Member Growth</h3>
            <div className="space-y-3">
              {statistics.monthlyTrend.slice(0, 3).map((trend, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="font-medium">{trend.month}</p>
                    <p className="text-sm text-muted-foreground">{trend.eventCount} events</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">{trend.memberCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {trend.attendanceRate.toFixed(1)}% attendance
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
