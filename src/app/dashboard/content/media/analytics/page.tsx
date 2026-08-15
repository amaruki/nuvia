"use client";

import React, { useState } from "react";
import { MediaAnalytics } from "@/components/content/media-analytics";
import { useMedia } from "@/lib/hooks/use-media";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageErrorState } from "@/components/dashboard/page-states";
import Link from "next/link";

export default function MediaAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y" | "all">("30d");
  const { statistics, loading, error } = useMedia();

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range as "7d" | "30d" | "90d" | "1y" | "all");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Analytics"
        description="Comprehensive insights into your media performance and usage patterns"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/content/media">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Media Library
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {statistics ? `${statistics.totalMedia} media items analyzed` : "Loading..."}
          </span>
        </div>
      </div>

      {error && <PageErrorState error={error} />}

      {/* Analytics Content */}
      <MediaAnalytics
        statistics={statistics}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        className={loading ? "opacity-50" : ""}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center gap-3 bg-card p-6 rounded-lg shadow-lg">
            <LoadingSpinner size="sm" className="h-6 w-6 border-info" />
            <span className="text-sm font-medium">Loading analytics data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
