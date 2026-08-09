import { BarChart3, Clock, Eye, MessageSquare, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticleMetrics } from "@/types/article";
import { formatNumber } from "./article-helpers";

interface ArticleMetricsCardProps {
  metrics: ArticleMetrics;
}

export function ArticleMetricsCard({ metrics }: ArticleMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Views</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(metrics.views)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-success" />
              <span className="text-sm font-medium">Read Time</span>
            </div>
            <p className="text-2xl font-bold">{metrics.averageReadTime} min</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent-foreground" />
              <span className="text-sm font-medium">Engagement</span>
            </div>
            <p className="text-2xl font-bold">{metrics.engagementScore}%</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">Comments</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(metrics.comments)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
