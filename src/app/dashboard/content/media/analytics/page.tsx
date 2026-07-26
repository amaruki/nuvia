"use client";

import React, { useState } from "react";
import { MediaAnalytics } from "@/components/content/media-analytics";
import { useMedia } from "@/lib/hooks/use-media";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function MediaAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y" | "all">("30d");
  const { statistics, loading, error } = useMedia();

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range as "7d" | "30d" | "90d" | "1y" | "all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/content/media">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Media Library
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Media Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your media performance and usage patterns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {statistics ? `${statistics.totalMedia} media items analyzed` : "Loading..."}
          </span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-red-900">Failed to load analytics</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Content */}
      <MediaAnalytics
        statistics={statistics}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        className={loading ? "opacity-50" : ""}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center gap-3 bg-white p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium">Loading analytics data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
