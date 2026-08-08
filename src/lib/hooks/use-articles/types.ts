import type {
  Article,
  ArticleFilters,
  ArticleFormData,
  ArticleStatistics,
} from "@/types/article.types";

export interface RawContentItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: string;
  category: string;
  status: string;
  visibility: string;
  featuredImage?: string;
  gallery?: string[];
  attachments?: unknown[];
  author: {
    id: string;
    name: string;
    email?: string;
    image?: string;
    role?: string;
  };
  reviewer?: { id: string; name: string; image?: string } | null;
  publishedAt?: string | null;
  scheduledFor?: string | null;
  createdAt: string;
  updatedAt: string;
  readTime?: number;
  wordCount?: number;
  format?: string;
  difficulty?: string;
  series?: { id: string; name: string } | null;
  tags?: string[];
  ui?: {
    version?: number;
    language?: string;
    reviewerId?: string;
    isFeatured?: boolean;
    isPinned?: boolean;
    priority?: number;
    commentsEnabled?: boolean;
    sharingEnabled?: boolean;
    downloadEnabled?: boolean;
    estimatedReadingSpeed?: number;
    seo?: {
      title: string;
      description: string;
      keywords: string[];
      ogImage?: string;
      canonicalUrl?: string;
    };
  };
}

export interface UseArticlesReturn {
  // Data
  articles: Article[];
  statistics: ArticleStatistics | null;
  filteredArticles: Article[];

  // State
  loading: boolean;
  error: string | null;
  filters: ArticleFilters;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;

  // Actions
  refreshData: () => void;
  updateFilters: (filters: Partial<ArticleFilters>) => void;
  clearFilters: () => void;

  // CRUD operations
  getArticle: (id: string) => Article | null;
  addArticle: (data: ArticleFormData) => Promise<Article>;
  updateArticle: (id: string, data: Partial<ArticleFormData>) => Promise<Article>;
  deleteArticle: (id: string) => Promise<void>;
  duplicateArticle: (id: string) => Promise<Article>;

  // Status management
  publishArticle: (id: string) => Promise<void>;
  archiveArticle: (id: string) => Promise<void>;
  scheduleArticle: (id: string, date: Date) => Promise<void>;
  unpublishArticle: (id: string) => Promise<void>;
  reviewArticle: (id: string, reviewerId: string) => Promise<void>;

  // Bulk operations
  bulkPublish: (ids: string[]) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkReview: (ids: string[], reviewerId: string) => Promise<void>;

  // Utility
  exportArticles: (format: "csv" | "json" | "pdf") => void;
  importArticles: (file: File) => Promise<void>;
}
