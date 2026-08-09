"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Book } from "lucide-react";
import type { ArticleStatisticsCardProps } from "./types";
import { formatNumber, formatPercentage } from "./helpers";

export function ArticleCategoriesCard({ statistics }: ArticleStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Article Categories</CardTitle>
        <CardDescription>Distribution by article category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statistics.articlesByCategory
            .sort((a, b) => b.count - a.count)
            .slice(0, 4)
            .map((category) => (
              <div
                key={category.category}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Book className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {category.category.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">{category.count} articles</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">{formatNumber(category.views)}</span>
                  <p className="text-xs text-muted-foreground">
                    {formatPercentage(category.engagement)} engagement
                  </p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
