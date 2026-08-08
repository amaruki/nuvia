import type { ChapterOverallStatistics } from "@/types/chapter.types";

interface AnalyticsTabProps {
  statistics: ChapterOverallStatistics | null;
}

export function AnalyticsTab({ statistics }: AnalyticsTabProps) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chapter Performance */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Chapter Performance</h3>
          <div className="space-y-3">
            {statistics?.topPerformingChapters.map((chapter) => (
              <div
                key={chapter.chapterId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium">{chapter.chapterName}</p>
                  <p className="text-sm text-muted-foreground">
                    {chapter.memberCount} members • {chapter.eventCount} events
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{chapter.engagementScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">engagement score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Analytics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Regional Analytics</h3>
          <div className="space-y-3">
            {statistics?.regionalBreakdown.map((region) => (
              <div
                key={region.region}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium">{region.region}</p>
                  <p className="text-sm text-muted-foreground">{region.chapterCount} chapters</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{region.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">total revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      {statistics?.monthlyTrend && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Monthly Trends</h3>
          <div className="space-y-3">
            {statistics.monthlyTrend.slice(0, 6).map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium">{trend.month}</p>
                  <p className="text-sm text-muted-foreground">
                    {trend.eventCount} events • {trend.memberCount} members
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">${trend.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {trend.attendanceRate.toFixed(1)}% attendance
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
