"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Eye, FileText, TrendingUp } from "lucide-react";
import type { PublicationStatisticsCardProps } from "./types";
import { formatNumber, formatPercentage, getEngagementBadge, getEngagementColor } from "./helpers";

export function TotalPublicationsCard({ statistics }: PublicationStatisticsCardProps) {
  return (
    <Card className="shadow-sm border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Publications</p>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{formatNumber(statistics.totalPublications)}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {statistics.publishedPublications} published, {statistics.draftPublications} drafts
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function PublishedPublicationsCard({ statistics }: PublicationStatisticsCardProps) {
  const engagementBadge = getEngagementBadge(statistics.averageEngagementScore);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Published</p>
          <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              {formatNumber(statistics.publishedPublications)}
            </span>
            <Badge
              variant="secondary"
              className={`text-[10px] px-2 h-5 ${engagementBadge.className}`}
            >
              {engagementBadge.text}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground mt-1">
            {formatPercentage(
              (statistics.publishedPublications / statistics.totalPublications) * 100,
            )}{" "}
            publish rate
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function TotalViewsCard({ statistics }: PublicationStatisticsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Views</p>
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
            <Eye className="h-4 w-4 text-accent-foreground" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{formatNumber(statistics.totalViews)}</span>
          <span className="text-xs text-muted-foreground mt-1">Across all publications</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function AverageEngagementCard({ statistics }: PublicationStatisticsCardProps) {
  const engagementBadge = getEngagementBadge(statistics.averageEngagementScore);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Avg Engagement</p>
          <div className="h-8 w-8 rounded-full bg-chart-3/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-chart-3" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${getEngagementColor(statistics.averageEngagementScore)}`}
            >
              {formatPercentage(statistics.averageEngagementScore)}
            </span>
            <Badge
              variant="secondary"
              className={`text-[10px] px-2 h-5 ${engagementBadge.className}`}
            >
              {engagementBadge.text}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground mt-1">Average engagement score</span>
        </div>
      </CardContent>
    </Card>
  );
}
