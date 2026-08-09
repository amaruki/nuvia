"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import type { MediaOverviewCardsProps } from "./types";
import { StorageUsedCard, TotalDownloadsCard, TotalMediaCard, TotalViewsCard } from "./stat-cards";
import { MediaByTypeCard } from "./media-by-type-card";
import { StorageByLocationCard } from "./storage-by-location-card";
import { RecentUploadsCard } from "./recent-uploads-card";
import { TopPerformingCard } from "./top-performing-card";
import { MediaStatusCard } from "./media-status-card";
import { VisibilityOverviewCard } from "./visibility-overview-card";

export function MediaOverviewCards({ statistics, loading = false }: MediaOverviewCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 rounded mb-2" />
              <Skeleton className="h-3 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">No statistics available</p>
        <p className="text-sm">Media statistics will appear here once data is loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TotalMediaCard statistics={statistics} />
        <TotalViewsCard statistics={statistics} />
        <TotalDownloadsCard statistics={statistics} />
        <StorageUsedCard statistics={statistics} />
      </div>

      {/* Media by Type */}
      <div className="grid gap-6 md:grid-cols-2">
        <MediaByTypeCard statistics={statistics} />

        {/* Storage by Location */}
        <StorageByLocationCard statistics={statistics} />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentUploadsCard statistics={statistics} />

        <TopPerformingCard statistics={statistics} />
      </div>

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <MediaStatusCard statistics={statistics} />

        <VisibilityOverviewCard statistics={statistics} />
      </div>
    </div>
  );
}
