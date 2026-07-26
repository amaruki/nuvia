// Article types for Nuvia community platform

export type ArticleStatus = "draft" | "review" | "published" | "archived" | "scheduled";

export type ArticleType =
  | "tutorial"
  | "guide"
  | "opinion"
  | "case_study"
  | "research_summary"
  | "news"
  | "interview";

export type ArticleCategory =
  | "technology"
  | "business"
  | "education"
  | "research"
  | "industry_trends"
  | "best_practices"
  | "member_stories"
  | "chapter_news"
  | "announcements"
  | "career_development";

export type ArticleDifficulty = "beginner" | "intermediate" | "advanced";

export type ArticleFormat = "standard" | "tutorial" | "listicle" | "interview" | "case_study";

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

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: ArticleType;
  category: ArticleCategory;
  status: ArticleStatus;
  format: ArticleFormat;
  difficulty: ArticleDifficulty;

  // Authorship
  author: ArticleAuthor;
  coAuthors?: ArticleAuthor[];
  reviewer?: ArticleAuthor;

  // Content metadata
  tags: ArticleTag[];
  featuredImage?: string;
  gallery?: string[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }[];

  // Publishing details
  publishedAt?: Date;
  scheduledFor?: Date;
  lastModified: Date;
  reviewedAt?: Date;

  // Reading details
  readTime: number; // in minutes
  wordCount: number;
  estimatedReadingSpeed?: number; // words per minute

  // SEO and metadata
  seo: ArticleSEO;

  // Metrics and analytics
  metrics: ArticleMetrics;

  // Series information
  series?: ArticleSeries;

  // Access control
  visibility: "public" | "members_only" | "premium_only" | "chapter_only" | "committee_only";
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];

  // Version control
  version: number;
  language: string;
  parentArticleId?: string; // for translations or versions

  // Interaction settings
  commentsEnabled: boolean;
  sharingEnabled: boolean;
  downloadEnabled: boolean;

  // Featured and priority
  isFeatured: boolean;
  isPinned: boolean;
  priority: number;

  // Additional metadata
  readingProgress?: number; // for logged-in users
  isBookmarked?: boolean; // for logged-in users
  userRating?: number; // 1-5 stars
}

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

export interface ArticleFilters {
  search?: string;
  status?: ArticleStatus[];
  type?: ArticleType[];
  category?: ArticleCategory[];
  difficulty?: ArticleDifficulty[];
  format?: ArticleFormat[];
  author?: string[];
  tags?: string[];
  series?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  visibility?: string[];
  featured?: boolean;
  hasSeries?: boolean;
  minReadTime?: number;
  maxReadTime?: number;
  minEngagement?: number;
  maxEngagement?: number;
  sortBy?:
    | "title"
    | "publishedAt"
    | "views"
    | "reads"
    | "engagement"
    | "readTime"
    | "completionRate"
    | "author"
    | "category";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ArticleFormData {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  type: ArticleType;
  category: ArticleCategory;
  format: ArticleFormat;
  difficulty: ArticleDifficulty;
  status: ArticleStatus;
  authorId: string;
  coAuthorIds?: string[];
  reviewerId?: string;
  tagIds: string[];
  seriesId?: string;
  featuredImage?: string;
  gallery?: string[];
  attachments?: File[];

  // Publishing
  publishedAt?: Date;
  scheduledFor?: Date;

  // SEO
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
    canonicalUrl?: string;
  };

  // Access control
  visibility: "public" | "members_only" | "premium_only" | "chapter_only" | "committee_only";
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];

  // Interaction settings
  commentsEnabled: boolean;
  sharingEnabled: boolean;
  downloadEnabled: boolean;

  // Featured
  isFeatured: boolean;
  isPinned: boolean;
  priority: number;
}

// Export type constants for re-use
export const ARTICLE_TYPES: ArticleType[] = [
  "tutorial",
  "guide",
  "opinion",
  "case_study",
  "research_summary",
  "news",
  "interview",
] as const;

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  "technology",
  "business",
  "education",
  "research",
  "industry_trends",
  "best_practices",
  "member_stories",
  "chapter_news",
  "announcements",
  "career_development",
] as const;

export const ARTICLE_STATUSES: ArticleStatus[] = [
  "draft",
  "review",
  "published",
  "archived",
  "scheduled",
] as const;

export const ARTICLE_DIFFICULTIES: ArticleDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export const ARTICLE_FORMATS: ArticleFormat[] = [
  "standard",
  "tutorial",
  "listicle",
  "interview",
  "case_study",
] as const;

// Display information
export const ARTICLE_TYPE_DISPLAY: Record<
  ArticleType,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  tutorial: {
    name: "Tutorial",
    description: "Step-by-step instructional content",
    icon: "book-open",
    color: "blue",
  },
  guide: {
    name: "Guide",
    description: "Comprehensive guide on a topic",
    icon: "compass",
    color: "green",
  },
  opinion: {
    name: "Opinion",
    description: "Personal viewpoint or analysis",
    icon: "message-square",
    color: "purple",
  },
  case_study: {
    name: "Case Study",
    description: "Detailed analysis of a specific case",
    icon: "briefcase",
    color: "orange",
  },
  research_summary: {
    name: "Research Summary",
    description: "Summary of research findings",
    icon: "microscope",
    color: "indigo",
  },
  news: {
    name: "News",
    description: "Latest news and updates",
    icon: "newspaper",
    color: "red",
  },
  interview: {
    name: "Interview",
    description: "Interview with industry experts",
    icon: "users",
    color: "cyan",
  },
};

export const ARTICLE_CATEGORY_DISPLAY: Record<
  ArticleCategory,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  technology: {
    name: "Technology",
    description: "Technology-related articles and tutorials",
    icon: "cpu",
    color: "blue",
  },
  business: {
    name: "Business",
    description: "Business and management articles",
    icon: "briefcase",
    color: "green",
  },
  education: {
    name: "Education",
    description: "Educational content and learning resources",
    icon: "graduation-cap",
    color: "orange",
  },
  research: {
    name: "Research",
    description: "Research findings and academic content",
    icon: "microscope",
    color: "purple",
  },
  industry_trends: {
    name: "Industry Trends",
    description: "Latest industry trends and insights",
    icon: "trending-up",
    color: "indigo",
  },
  best_practices: {
    name: "Best Practices",
    description: "Best practices and guidelines",
    icon: "check-circle",
    color: "emerald",
  },
  member_stories: {
    name: "Member Stories",
    description: "Stories and experiences from members",
    icon: "users",
    color: "pink",
  },
  chapter_news: {
    name: "Chapter News",
    description: "Chapter-specific news and updates",
    icon: "building",
    color: "cyan",
  },
  announcements: {
    name: "Announcements",
    description: "Official announcements and notices",
    icon: "megaphone",
    color: "red",
  },
  career_development: {
    name: "Career Development",
    description: "Career growth and professional development",
    icon: "trending-up",
    color: "amber",
  },
};

export const ARTICLE_STATUS_DISPLAY: Record<
  ArticleStatus,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
    badgeVariant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  draft: {
    name: "Draft",
    description: "Work in progress, not published",
    icon: "edit",
    color: "slate",
    badgeVariant: "secondary",
  },
  review: {
    name: "Under Review",
    description: "Pending review and approval",
    icon: "clock",
    color: "amber",
    badgeVariant: "outline",
  },
  published: {
    name: "Published",
    description: "Live and accessible to readers",
    icon: "check-circle",
    color: "emerald",
    badgeVariant: "default",
  },
  archived: {
    name: "Archived",
    description: "No longer active but preserved",
    icon: "archive",
    color: "slate",
    badgeVariant: "secondary",
  },
  scheduled: {
    name: "Scheduled",
    description: "Scheduled for future publication",
    icon: "calendar",
    color: "blue",
    badgeVariant: "outline",
  },
};

export const ARTICLE_DIFFICULTY_DISPLAY: Record<
  ArticleDifficulty,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  beginner: {
    name: "Beginner",
    description: "Suitable for newcomers to the topic",
    icon: "star",
    color: "green",
  },
  intermediate: {
    name: "Intermediate",
    description: "Requires some prior knowledge",
    icon: "star-half",
    color: "amber",
  },
  advanced: {
    name: "Advanced",
    description: "Requires extensive knowledge and experience",
    icon: "zap",
    color: "red",
  },
};

export const ARTICLE_FORMAT_DISPLAY: Record<
  ArticleFormat,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  standard: {
    name: "Standard Article",
    description: "Traditional article format",
    icon: "file-text",
    color: "blue",
  },
  tutorial: {
    name: "Tutorial",
    description: "Step-by-step instructional content",
    icon: "book-open",
    color: "green",
  },
  listicle: {
    name: "Listicle",
    description: "Article presented as a list",
    icon: "list",
    color: "purple",
  },
  interview: {
    name: "Interview",
    description: "Q&A format with experts",
    icon: "users",
    color: "orange",
  },
  case_study: {
    name: "Case Study",
    description: "Detailed analysis of specific cases",
    icon: "briefcase",
    color: "indigo",
  },
};
