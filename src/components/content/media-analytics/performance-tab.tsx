import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Activity, Globe, Share2, TrendingDown, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsMetric, PerformanceTabProps } from "./types";
import { formatNumber, getChangeColor, getChangeIcon } from "./helpers";

export function PerformanceTab({ analytics }: PerformanceTabProps) {
  const performanceMetrics: AnalyticsMetric[] = [
    {
      label: "Load Time",
      value: `${Math.round(analytics.reduce((sum, a) => sum + a.loadTime, 0) / analytics.length)}ms`,
      change: -12.3,
      changeType: "increase",
      icon: <Activity className="h-5 w-5" />,
      color: "text-indigo-600",
    },
    {
      label: "Error Rate",
      value: `${(analytics.reduce((sum, a) => sum + a.errorRate, 0) / analytics.length).toFixed(1)}%`,
      change: -25.0,
      changeType: "increase",
      icon: <TrendingDown className="h-5 w-5" />,
      color: "text-red-600",
    },
    {
      label: "Unique Views",
      value: formatNumber(analytics.reduce((sum, a) => sum + a.uniqueViews, 0)),
      change: 18.9,
      changeType: "increase",
      icon: <Users className="h-5 w-5" />,
      color: "text-teal-600",
    },
    {
      label: "Shares",
      value: formatNumber(analytics.reduce((sum, a) => sum + a.shares, 0)),
      change: 22.1,
      changeType: "increase",
      icon: <Share2 className="h-5 w-5" />,
      color: "text-pink-600",
    },
  ];

  return (
    <TabsContent value="performance" className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
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
                <div className={cn("text-blue-600", metric.color)}>{metric.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Top Countries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics[0]?.topCountries.map((country) => (
              <div key={country.country} className="flex items-center justify-between">
                <span className="text-sm font-medium">{country.country}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{country.views} views</span>
                  <Badge variant="outline">{country.percentage}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referrers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics[0]?.topReferrers.map((referrer) => (
              <div key={referrer.source} className="flex items-center justify-between">
                <span className="text-sm font-medium">{referrer.source}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{referrer.views} views</span>
                  <Badge variant="outline">{referrer.percentage}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
