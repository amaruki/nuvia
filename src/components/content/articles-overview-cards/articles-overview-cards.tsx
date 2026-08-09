"use client";

import type { ArticlesOverviewCardsProps } from "./types";
import {
  AverageEngagementCard,
  PublishedArticlesCard,
  TotalArticlesCard,
  TotalViewsCard,
} from "./stat-cards";
import { ArticleHealthCard } from "./article-health-card";
import { TopPerformingArticlesCard } from "./top-performing-card";
import { ArticleCategoriesCard } from "./article-categories-card";

export function ArticlesOverviewCards({ statistics }: ArticlesOverviewCardsProps) {
  return (
    <div className="space-y-6">
      {/* Top Key Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <TotalArticlesCard statistics={statistics} />
        <PublishedArticlesCard statistics={statistics} />
        <TotalViewsCard statistics={statistics} />
        <AverageEngagementCard statistics={statistics} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Article Status Breakdown */}
        <ArticleHealthCard statistics={statistics} />

        {/* Top Performing Articles */}
        <TopPerformingArticlesCard statistics={statistics} />

        {/* Article Categories */}
        <ArticleCategoriesCard statistics={statistics} />
      </div>
    </div>
  );
}
