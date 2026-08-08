import type {
  ArticleCategory,
  ArticleDifficulty,
  ArticleFormat,
  ArticleStatus,
  ArticleType,
} from "./base";

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
