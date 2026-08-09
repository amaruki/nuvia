"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Eye, FileText, TrendingUp } from "lucide-react";
import type { ArticleStatisticsCardProps } from "./types";
import { formatNumber, formatPercentage, getEngagementBadge, getEngagementColor } from "./helpers";

export function TotalArticlesCard({ statistics }: ArticleStatisticsCardProps) {
  return (
    <Card className="shadow-sm border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Articles</p>
          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{formatNumber(statistics.totalArticles)}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {statistics.publishedArticles} published, {statistics.draftArticles} drafts
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function PublishedArticlesCard({ statistics }: ArticleStatisticsCardProps) {
  const engagementBadge = getEngagementBadge(statistics.averageEngagementScore);

  return (
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
            <span className="text-2xl font-bold">{formatNumber(statistics.publishedArticles)}</span>
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
  );
}

export function TotalViewsCard({ statistics }: ArticleStatisticsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Views</p>
          <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
            <Eye className="h-4 w-4 text-purple-600" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{formatNumber(statistics.totalViews)}</span>
          <span className="text-xs text-muted-foreground mt-1">Across all articles</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function AverageEngagementCard({ statistics }: ArticleStatisticsCardProps) {
  const engagementBadge = getEngagementBadge(statistics.averageEngagementScore);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Avg Engagement</p>
          <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
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
