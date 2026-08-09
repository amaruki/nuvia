import { BarChart3, Bookmark, Eye, Heart, MessageCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicationMetrics } from "@/types/publication";
import { formatNumber } from "./publication-helpers";

interface PublicationMetricsCardProps {
  metrics: PublicationMetrics;
}

export function PublicationMetricsCard({ metrics }: PublicationMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(metrics.views)}</p>
              <p className="text-sm text-muted-foreground">Views</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-success/10">
              <Heart className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(metrics.likes)}</p>
              <p className="text-sm text-muted-foreground">Likes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent">
              <MessageCircle className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(metrics.comments)}</p>
              <p className="text-sm text-muted-foreground">Comments</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-warning/10">
              <Bookmark className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(metrics.bookmarks)}</p>
              <p className="text-sm text-muted-foreground">Bookmarks</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-sm font-medium">Engagement Score</span>
            <span className="text-lg font-bold">{metrics.engagementScore}%</span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-sm font-medium">Average Read Time</span>
            <span className="text-lg font-bold">{metrics.averageReadTime} min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
