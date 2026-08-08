import { BarChart3, Eye } from "lucide-react";

import type { PublicationStatistics } from "@/types/publication.types";
import { formatNumber } from "./publications-helpers";

interface OverviewTabProps {
  statistics: PublicationStatistics | null;
}

export function OverviewTab({ statistics }: OverviewTabProps) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <div className="space-y-3">
            {statistics?.recentActivity.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.action} by {activity.author}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Total Views</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatNumber(statistics?.totalViews || 0)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-medium">Avg Engagement</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {statistics?.averageEngagementScore.toFixed(1) || 0}%
                </p>
              </div>
            </div>
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
                  <p className="text-xs text-muted-foreground">
                    {trend.publicationsCreated} created, {trend.publicationsPublished} published
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{formatNumber(trend.totalViews)}</p>
                  <p className="text-xs text-muted-foreground">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
