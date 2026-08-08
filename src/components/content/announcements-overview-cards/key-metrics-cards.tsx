"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, CheckCircle2, TrendingUp } from "lucide-react";
import type { AnnouncementStatisticsCardProps } from "./types";
import { formatNumber, formatPercentage, getEngagementBadge, getEngagementColor } from "./helpers";

export function KeyMetricsCards({ statistics }: AnnouncementStatisticsCardProps) {
  const engagementBadge = getEngagementBadge(statistics.averageAcknowledgmentRate);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Announcements */}
      <Card className="shadow-sm border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Announcements</p>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-2xl font-bold">
              {formatNumber(statistics.totalAnnouncements)}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {statistics.activeAnnouncements} published,{" "}
              {statistics.totalAnnouncements - statistics.activeAnnouncements} drafts
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Published Announcements */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Published</p>
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {formatNumber(statistics.publishedArticles)}
              </span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-2 h-5 ${engagementBadge.className}`}
              >
                {engagementBadge.text}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {formatPercentage((statistics.publishedArticles / statistics.totalArticles) * 100)}{" "}
              publish rate
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Total Acknowledgments */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Acknowledgments</p>
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-2xl font-bold">
              {formatNumber(statistics.totalAcknowledgments)}
            </span>
            <span className="text-xs text-muted-foreground mt-1">Across all announcements</span>
          </div>
        </CardContent>
      </Card>

      {/* Acknowledgment Rate */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Acknowledgment Rate</p>
            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-bold ${getEngagementColor(statistics.averageAcknowledgmentRate)}`}
              >
                {formatPercentage(statistics.averageAcknowledgmentRate)}
              </span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-2 h-5 ${engagementBadge.className}`}
              >
                {engagementBadge.text}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground mt-1">Average acknowledgment rate</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
