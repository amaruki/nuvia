"use client";

import * as React from "react";
import { WidgetContainer } from "../../ui/widget-container";
import { Card, CardContent } from "../../ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "../../ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";

interface AnalyticsWidgetProps {
  totalVisitors?: number;
  pageViews?: number;
  avgSessionDuration?: number;
  bounceRate?: number;
  onExportData?: () => void;
  onViewFullReport?: () => void;
}

// Mock analytics data - in a real app, this would come from an API
const mockAnalyticsData = {
  totalVisitors: 12450,
  pageViews: 34560,
  avgSessionDuration: 245, // in seconds
  bounceRate: 32, // in percentage
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export function AnalyticsWidget({
  totalVisitors = mockAnalyticsData.totalVisitors,
  pageViews = mockAnalyticsData.pageViews,
  avgSessionDuration = mockAnalyticsData.avgSessionDuration,
  bounceRate = mockAnalyticsData.bounceRate,
  onExportData,
  onViewFullReport,
}: AnalyticsWidgetProps) {
  const pagesPerSession = pageViews / totalVisitors;

  return (
    <WidgetContainer
      type="analytics"
      title="Website Analytics"
      description="Visitor engagement and behavior metrics"
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-foreground/50" />
                <span className="text-sm font-medium text-foreground/70">
                  {formatNumber(totalVisitors)} total visitors
                </span>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={onExportData} className="text-xs">
                  Export
                </Button>
                <Button variant="ghost" size="sm" onClick={onViewFullReport} className="text-xs">
                  Full Report
                </Button>
              </div>
            </div>

            {/* Analytics cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Visitors */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-foreground/70">Visitors</span>
                  </div>
                  <Badge variant="secondary">Total</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatNumber(totalVisitors)}
                </div>
                <div className="flex items-center text-xs text-chart-1 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+12% from last month</span>
                </div>
              </div>

              {/* Page Views */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-chart-2" />
                    <span className="text-sm font-medium text-foreground/70">Page Views</span>
                  </div>
                  <Badge variant="secondary">Total</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatNumber(pageViews)}
                </div>
                <div className="flex items-center text-xs text-chart-1 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+8% from last month</span>
                </div>
              </div>

              {/* Avg. Session Duration */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-chart-3" />
                    <span className="text-sm font-medium text-foreground/70">Session</span>
                  </div>
                  <Badge variant="secondary">Average</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatDuration(avgSessionDuration)}
                </div>
                <div className="flex items-center text-xs text-chart-1 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+15s from last month</span>
                </div>
              </div>

              {/* Bounce Rate */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MousePointer className="h-5 w-5 text-chart-4" />
                    <span className="text-sm font-medium text-foreground/70">Bounce Rate</span>
                  </div>
                  <Badge variant="secondary">Percentage</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">{bounceRate}%</div>
                <div className="flex items-center text-xs text-chart-1 mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>-3% from last month</span>
                </div>
              </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-foreground/50 mb-1">
                  <span>Visitor Growth</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-chart-1 h-2 rounded-full" style={{ width: `78%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-foreground/50 mb-1">
                  <span>Engagement Rate</span>
                  <span>65%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-chart-3 h-2 rounded-full" style={{ width: `65%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-foreground/50 mb-1">
                  <span>Pages per Session</span>
                  <span>{pagesPerSession.toFixed(1)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-chart-2 h-2 rounded-full"
                    style={{ width: `${Math.min(pagesPerSession * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="text-xs text-foreground/50 text-center pt-2">
              Analytics data updated daily. Last updated: Today at 9:00 AM
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  );
}
