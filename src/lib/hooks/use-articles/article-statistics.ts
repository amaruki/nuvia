import type { Article, ArticleStatistics } from "@/types/article";

import {
  ARTICLE_CATEGORIES,
  ARTICLE_DIFFICULTIES,
  ARTICLE_STATUSES,
  ARTICLE_TYPES,
} from "@/types/article";

export function buildArticleStatistics(articles: Article[]): ArticleStatistics {
  const now = new Date();
  const sum = (fn: (a: Article) => number) => articles.reduce((acc, a) => acc + fn(a), 0);
  const average = (values: number[]) =>
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const monthKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const recentActivity = articles
    .slice()
    .sort(
      (a, b) =>
        (b.publishedAt ?? b.lastModified).getTime() - (a.publishedAt ?? a.lastModified).getTime(),
    )
    .slice(0, 10)
    .map((article) => ({
      id: `${article.id}-activity`,
      articleId: article.id,
      title: article.title,
      action: (article.publishedAt ? "published" : "updated") as "published" | "updated",
      author: article.author.name,
      timestamp: article.publishedAt ?? article.lastModified,
    }));

  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = monthKey(monthDate);
    const inMonth = articles.filter((a) => monthKey(a.lastModified) === key);
    return {
      month: key,
      articlesCreated: inMonth.length,
      articlesPublished: inMonth.filter((a) => a.publishedAt).length,
      totalViews: inMonth.reduce((acc, a) => acc + a.metrics.views, 0),
      totalReads: inMonth.reduce((acc, a) => acc + a.metrics.reads, 0),
      totalEngagement: inMonth.reduce((acc, a) => acc + a.metrics.engagementScore, 0),
    };
  });

  return {
    totalArticles: articles.length,
    publishedArticles: articles.filter((a) => a.status === "published").length,
    draftArticles: articles.filter((a) => a.status === "draft").length,
    scheduledArticles: articles.filter((a) => a.status === "scheduled").length,
    archivedArticles: articles.filter((a) => a.status === "archived").length,
    totalViews: sum((a) => a.metrics.views),
    totalReads: sum((a) => a.metrics.reads),
    totalShares: sum((a) => a.metrics.shares),
    totalComments: sum((a) => a.metrics.comments),
    totalLikes: sum((a) => a.metrics.likes),
    totalBookmarks: sum((a) => a.metrics.bookmarks),
    averageEngagementScore: average(articles.map((a) => a.metrics.engagementScore)),
    averageReadTime: average(articles.map((a) => a.readTime)),
    averageCompletionRate: average(articles.map((a) => a.metrics.completionRate)),
    articlesByType: ARTICLE_TYPES.map((type) => {
      const items = articles.filter((a) => a.type === type);
      return {
        type,
        count: items.length,
        views: items.reduce((acc, a) => acc + a.metrics.views, 0),
        reads: items.reduce((acc, a) => acc + a.metrics.reads, 0),
        engagement: average(items.map((a) => a.metrics.engagementScore)),
      };
    }),
    articlesByCategory: ARTICLE_CATEGORIES.map((category) => {
      const items = articles.filter((a) => a.category === category);
      return {
        category,
        count: items.length,
        views: items.reduce((acc, a) => acc + a.metrics.views, 0),
        reads: items.reduce((acc, a) => acc + a.metrics.reads, 0),
        engagement: average(items.map((a) => a.metrics.engagementScore)),
      };
    }),
    articlesByDifficulty: ARTICLE_DIFFICULTIES.map((difficulty) => {
      const items = articles.filter((a) => a.difficulty === difficulty);
      return {
        difficulty,
        count: items.length,
        views: items.reduce((acc, a) => acc + a.metrics.views, 0),
        reads: items.reduce((acc, a) => acc + a.metrics.reads, 0),
        engagement: average(items.map((a) => a.metrics.engagementScore)),
      };
    }),
    articlesByStatus: ARTICLE_STATUSES.map((status) => ({
      status,
      count: articles.filter((a) => a.status === status).length,
    })),
    topPerformingArticles: articles
      .slice()
      .sort((a, b) => b.metrics.engagementScore - a.metrics.engagementScore)
      .slice(0, 10)
      .map((a) => ({
        articleId: a.id,
        title: a.title,
        author: a.author.name,
        views: a.metrics.views,
        reads: a.metrics.reads,
        engagementScore: a.metrics.engagementScore,
        completionRate: a.metrics.completionRate,
        type: a.type,
        category: a.category,
      })),
    recentActivity,
    monthlyTrend,
    readingPatterns: {
      peakReadingHours: [],
      averageSessionDuration: 0,
      mostReadCategories: [],
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
    },
  };
}
