"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaAnalyticsProps } from "./types";
import { createMockAnalytics, createMockStatistics } from "./mock-data";
import { OverviewTab } from "./overview-tab";
import { PerformanceTab } from "./performance-tab";
import { UsageTab } from "./usage-tab";
import { TrendsTab } from "./trends-tab";

export function MediaAnalytics({
  media,
  statistics,
  timeRange = "30d",
  onTimeRangeChange,
  className,
}: MediaAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  const mockAnalytics = createMockAnalytics(media?.id || "");
  const mockStatistics = createMockStatistics();

  const currentStats = statistics || mockStatistics;
  const currentAnalytics = mockAnalytics;

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Media Analytics</h2>
          <p className="text-gray-600">
            {media ? `Analytics for "${media.title}"` : "Overall media statistics and performance"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <OverviewTab stats={currentStats} analytics={currentAnalytics} />

        {/* Performance Tab */}
        <PerformanceTab analytics={currentAnalytics} />

        {/* Usage Tab */}
        <UsageTab stats={currentStats} />

        {/* Trends Tab */}
        <TrendsTab stats={currentStats} />
      </Tabs>
    </div>
  );
}
