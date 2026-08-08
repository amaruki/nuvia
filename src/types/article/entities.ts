export interface ArticleAuthor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: string;
  chapter?: string;
  committee?: string;
  expertise?: string[];
}

export interface ArticleTag {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface ArticleMetrics {
  views: number;
  reads: number;
  shares: number;
  comments: number;
  likes: number;
  bookmarks: number;
  averageReadTime: number; // in minutes
  completionRate: number; // percentage
  engagementScore: number; // calculated score 0-100
  bounceRate: number; // percentage
}

export interface ArticleSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  metaRobots?: string;
}

export interface ArticleSeries {
  id: string;
  title: string;
  description: string;
  totalArticles: number;
  currentArticle: number;
}
