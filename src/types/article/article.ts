import type {
  ArticleCategory,
  ArticleDifficulty,
  ArticleFormat,
  ArticleStatus,
  ArticleType,
} from "./base";
import type {
  ArticleAuthor,
  ArticleMetrics,
  ArticleSEO,
  ArticleSeries,
  ArticleTag,
} from "./entities";

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
