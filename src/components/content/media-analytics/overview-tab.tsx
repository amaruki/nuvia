import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { BarChart3, Clock, Download, Eye, PieChart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsMetric, OverviewTabProps } from "./types";
import {
  formatDuration,
  formatNumber,
  getChangeColor,
  getChangeIcon,
  getMediaIcon,
} from "./helpers";

export function OverviewTab({ stats, analytics }: OverviewTabProps) {
  const overviewMetrics: AnalyticsMetric[] = [
    {
      label: "Total Views",
      value: formatNumber(analytics.reduce((sum, a) => sum + a.views, 0)),
      change: 12.5,
      changeType: "increase",
      icon: <Eye className="h-5 w-5" />,
      color: "text-info",
    },
    {
      label: "Total Downloads",
      value: formatNumber(analytics.reduce((sum, a) => sum + a.downloads, 0)),
      change: 8.3,
      changeType: "increase",
      icon: <Download className="h-5 w-5" />,
      color: "text-success",
    },
    {
      label: "Avg. View Duration",
      value: formatDuration(
        Math.round(analytics.reduce((sum, a) => sum + a.avgViewDuration, 0) / analytics.length),
      ),
      change: -5.2,
      changeType: "decrease",
      icon: <Clock className="h-5 w-5" />,
      color: "text-accent-foreground",
    },
    {
      label: "Usage Count",
      value: formatNumber(analytics.reduce((sum, a) => sum + a.usageCount, 0)),
      change: 15.7,
      changeType: "increase",
      icon: <Share2 className="h-5 w-5" />,
      color: "text-warning",
    },
  ];

  return (
    <TabsContent value="overview" className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  {metric.change !== undefined && (
                    <div className="flex items-center gap-1 mt-1">
                      {getChangeIcon(metric.change)}
                      <span className={cn("text-sm", getChangeColor(metric.change))}>
                        {Math.abs(metric.change)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className={cn("text-foreground", metric.color)}>{metric.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Media Type Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Media by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.mediaByType.map((type) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getMediaIcon(type.type)}
                    <span className="capitalize">{type.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{type.count} files</span>
                    <Badge variant="secondary">{type.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Storage</span>
                <span className="text-sm font-bold">{stats.totalSizeFormatted}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(stats.storageUsage).map(([location, size]) => (
                  <div key={location} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{location}</span>
                    <span className="text-sm">{formatNumber(size)} bytes</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
