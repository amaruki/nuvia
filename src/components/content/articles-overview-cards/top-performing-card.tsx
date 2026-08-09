"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import type { ArticleStatisticsCardProps } from "./types";
import { formatNumber, formatPercentage } from "./helpers";

export function TopPerformingArticlesCard({ statistics }: ArticleStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Top Performing Articles
        </CardTitle>
        <CardDescription>By engagement score and views</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {statistics.topPerformingArticles.slice(0, 4).map((article) => {
            // Calculate percentage for bar width (relative to max engagement in set for visual)
            const maxEngagement = Math.max(
              ...statistics.topPerformingArticles.map((a) => a.engagementScore),
            );
            const percentage = (article.engagementScore / maxEngagement) * 100;

            return (
              <div key={article.articleId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                      {article.title}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
                    >
                      {article.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold block">{formatNumber(article.views)}</span>
                  </div>
                </div>
                {/* Visual Bar */}
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Engagement:{" "}
                    <span
                      className={
                        article.engagementScore > 80
                          ? "text-emerald-700 dark:text-emerald-400 font-medium"
                          : "text-amber-700 dark:text-amber-400"
                      }
                    >
                      {formatPercentage(article.engagementScore)}
                    </span>
                  </span>
                  <span>
                    Author: <span className="font-medium">{article.author}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
