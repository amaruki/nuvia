import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import type { Chapter } from "@/types/chapter.types";
import { formatPercentage } from "./helpers";

interface MetricsTabProps {
  chapter: Chapter;
}

export default function MetricsTab({ chapter }: MetricsTabProps) {
  return (
    <TabsContent value="metrics" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Engagement Score</span>
              <span className="text-sm font-bold">
                {chapter.metrics.engagementScore.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Event Attendance Rate</span>
              <span className="text-sm font-bold">
                {formatPercentage(chapter.metrics.eventAttendanceRate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Retention Rate</span>
              <span className="text-sm font-bold">
                {formatPercentage(chapter.metrics.retentionRate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">New Members (This Month)</span>
              <span className="text-sm font-bold">{chapter.metrics.newMembersThisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Members (This Month)</span>
              <span className="text-sm font-bold">{chapter.metrics.activeMembersThisMonth}</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chapter.metrics.monthlyTrend.map((trend, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{trend.month}</p>
                    <p className="text-sm text-muted-foreground">{trend.eventCount} events</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{trend.memberCount} members</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPercentage(trend.attendanceRate)} attendance
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
