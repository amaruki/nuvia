import type { ArticleCategory, ArticleDifficulty, ArticleStatus, ArticleType } from "./base";

export interface ArticleStatistics {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  scheduledArticles: number;
  archivedArticles: number;

  // Metrics
  totalViews: number;
  totalReads: number;
  totalShares: number;
  totalComments: number;
  totalLikes: number;
  totalBookmarks: number;
  averageEngagementScore: number;
  averageReadTime: number;
  averageCompletionRate: number;

  // By type
  articlesByType: {
    type: ArticleType;
    count: number;
    views: number;
    reads: number;
    engagement: number;
  }[];

  // By category
  articlesByCategory: {
    category: ArticleCategory;
    count: number;
    views: number;
    reads: number;
    engagement: number;
  }[];

  // By difficulty
  articlesByDifficulty: {
    difficulty: ArticleDifficulty;
    count: number;
    views: number;
    reads: number;
    engagement: number;
  }[];

  // By status
  articlesByStatus: {
    status: ArticleStatus;
    count: number;
  }[];

  // Top performing
  topPerformingArticles: {
    articleId: string;
    title: string;
    author: string;
    views: number;
    reads: number;
    engagementScore: number;
    completionRate: number;
    type: ArticleType;
    category: ArticleCategory;
  }[];

  // Recent activity
  recentActivity: {
    id: string;
    articleId: string;
    title: string;
    action: "created" | "published" | "updated" | "archived" | "reviewed";
    author: string;
    timestamp: Date;
  }[];

  // Monthly trends
  monthlyTrend: {
    month: string;
    articlesCreated: number;
    articlesPublished: number;
    totalViews: number;
    totalReads: number;
    totalEngagement: number;
  }[];

  // Reading patterns
  readingPatterns: {
    peakReadingHours: number[];
    averageSessionDuration: number;
    mostReadCategories: ArticleCategory[];
    deviceBreakdown: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
  };
}
