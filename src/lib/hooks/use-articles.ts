"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  Article,
  ArticleCategory,
  ArticleDifficulty,
  ArticleFilters,
  ArticleFormData,
  ArticleStatistics,
  ArticleStatus,
  ArticleType,
} from "@/types/article.types";
import { ARTICLE_CATEGORIES, ARTICLE_TYPES, ARTICLE_STATUSES } from "@/types/article.types";
import { ARTICLE_DIFFICULTIES } from "@/types/article.types";
import { logger } from "@/lib/logger";
import {
  useContentCollectionApi,
  formToPayload,
  hydrateDate,
  type RawContentItem as RawApiItem,
} from "./use-content-collection";

interface RawContentItem {
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

interface UseArticlesReturn {
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

const DEFAULT_FILTERS: ArticleFilters = {
  search: "",
  status: [],
  type: [],
  category: [],
  difficulty: [],
  format: [],
  author: [],
  tags: [],
  series: [],
  dateRange: undefined,
  visibility: [],
  featured: undefined,
  hasSeries: undefined,
  minReadTime: undefined,
  maxReadTime: undefined,
  minEngagement: undefined,
  maxEngagement: undefined,
  sortBy: "publishedAt",
  sortOrder: "desc",
  page: 1,
  limit: 10,
};

const ITEMS_PER_PAGE = 10;

const EMPTY_METRICS = {
  views: 0,
  reads: 0,
  shares: 0,
  comments: 0,
  likes: 0,
  bookmarks: 0,
  averageReadTime: 0,
  completionRate: 0,
  engagementScore: 0,
  bounceRate: 0,
};

function hydrateArticle(raw: RawContentItem): Article {
  const ui = raw.ui ?? {};
  const tags = (raw.tags ?? []).map((t) => ({ id: t, name: t, color: "#6366f1", count: 0 }));
  const wordCount = raw.wordCount ?? raw.content.split(/\s+/).filter(Boolean).length;
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    content: raw.content,
    type: raw.type as ArticleType,
    category: raw.category as ArticleCategory,
    format: (raw.format ?? "standard") as Article["format"],
    difficulty: (raw.difficulty ?? "beginner") as ArticleDifficulty,
    status: raw.status as ArticleStatus,
    author: {
      id: raw.author.id,
      name: raw.author.name,
      email: raw.author.email ?? "",
      avatar: raw.author.image,
      role: raw.author.role ?? "member",
    },
    coAuthors: [],
    reviewer: ui.reviewerId
      ? { id: ui.reviewerId, name: ui.reviewerId, email: "", role: "reviewer" }
      : undefined,
    tags,
    featuredImage: raw.featuredImage,
    publishedAt: hydrateDate(raw.publishedAt),
    scheduledFor: hydrateDate(raw.scheduledFor),
    lastModified: hydrateDate(raw.updatedAt) ?? new Date(),
    readTime: raw.readTime ?? Math.max(1, Math.ceil(wordCount / 200)),
    wordCount,
    estimatedReadingSpeed: ui.estimatedReadingSpeed ?? 200,
    seo: ui.seo ?? {
      title: raw.title,
      description: raw.excerpt,
      keywords: (raw.tags ?? []).slice(0, 5),
    },
    metrics: { ...EMPTY_METRICS },
    visibility: raw.visibility as Article["visibility"],
    version: ui.version ?? 1,
    language: ui.language ?? "en",
    commentsEnabled: ui.commentsEnabled ?? true,
    sharingEnabled: ui.sharingEnabled ?? true,
    downloadEnabled: ui.downloadEnabled ?? false,
    isFeatured: ui.isFeatured ?? false,
    isPinned: ui.isPinned ?? false,
    priority: ui.priority ?? 50,
  };
}

function buildArticleStatistics(articles: Article[]): ArticleStatistics {
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

export function useArticles(): UseArticlesReturn {
  const api = useContentCollectionApi<Article>(
    "articles",
    hydrateArticle as unknown as (raw: RawApiItem) => Article,
  );
  const [filters, setFilters] = useState<ArticleFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  const articles = api.allItems;
  const statistics = useMemo(
    () => (articles.length > 0 ? buildArticleStatistics(articles) : null),
    [articles],
  );

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.excerpt.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          article.author.name.toLowerCase().includes(searchLower),
      );
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((article) => filters.status!.includes(article.status));
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter((article) => filters.type!.includes(article.type));
    }

    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((article) => filters.category!.includes(article.category));
    }

    if (filters.difficulty && filters.difficulty.length > 0) {
      filtered = filtered.filter((article) => filters.difficulty!.includes(article.difficulty));
    }

    if (filters.format && filters.format.length > 0) {
      filtered = filtered.filter((article) => filters.format!.includes(article.format));
    }

    if (filters.author && filters.author.length > 0) {
      filtered = filtered.filter(
        (article) =>
          filters.author!.includes(article.author.id) ||
          article.coAuthors?.some((coAuthor) => filters.author!.includes(coAuthor.id)),
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((article) =>
        article.tags.some((tag) => filters.tags!.includes(tag.id)),
      );
    }

    if (filters.series && filters.series.length > 0) {
      filtered = filtered.filter(
        (article) => article.series && filters.series!.includes(article.series.id),
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter((article) => {
        const articleDate = article.publishedAt || article.scheduledFor || article.lastModified;
        return articleDate >= filters.dateRange!.start && articleDate <= filters.dateRange!.end;
      });
    }

    if (filters.visibility && filters.visibility.length > 0) {
      filtered = filtered.filter((article) => filters.visibility!.includes(article.visibility));
    }

    if (filters.featured !== undefined) {
      filtered = filtered.filter((article) => article.isFeatured === filters.featured);
    }

    if (filters.hasSeries !== undefined) {
      filtered = filtered.filter((article) => !!article.series === filters.hasSeries);
    }

    if (filters.minReadTime !== undefined) {
      filtered = filtered.filter((article) => article.readTime >= filters.minReadTime!);
    }
    if (filters.maxReadTime !== undefined) {
      filtered = filtered.filter((article) => article.readTime <= filters.maxReadTime!);
    }

    if (filters.minEngagement !== undefined) {
      filtered = filtered.filter(
        (article) => article.metrics.engagementScore >= filters.minEngagement!,
      );
    }
    if (filters.maxEngagement !== undefined) {
      filtered = filtered.filter(
        (article) => article.metrics.engagementScore <= filters.maxEngagement!,
      );
    }

    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

        switch (filters.sortBy) {
          case "title":
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case "publishedAt":
            aValue = a.publishedAt || a.scheduledFor || a.lastModified;
            bValue = b.publishedAt || b.scheduledFor || b.lastModified;
            break;
          case "views":
            aValue = a.metrics.views;
            bValue = b.metrics.views;
            break;
          case "reads":
            aValue = a.metrics.reads;
            bValue = b.metrics.reads;
            break;
          case "engagement":
            aValue = a.metrics.engagementScore;
            bValue = b.metrics.engagementScore;
            break;
          case "readTime":
            aValue = a.readTime;
            bValue = b.readTime;
            break;
          case "completionRate":
            aValue = a.metrics.completionRate;
            bValue = b.metrics.completionRate;
            break;
          case "author":
            aValue = a.author.name.toLowerCase();
            bValue = b.author.name.toLowerCase();
            break;
          case "category":
            aValue = a.category;
            bValue = b.category;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [articles, filters]);

  // Pagination
  const { totalPages, totalItems } = useMemo(() => {
    const total = filteredArticles.length;
    return {
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      totalItems: total,
    };
  }, [filteredArticles]);

  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

  // Actions
  const refreshData = useCallback(() => {
    void api.refreshData();
  }, [api]);

  const updateFilters = useCallback((newFilters: Partial<ArticleFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  const getArticle = useCallback(
    (id: string): Article | null => articles.find((article) => article.id === id) || null,
    [articles],
  );

  // CRUD operations
  const addArticle = useCallback(
    async (data: ArticleFormData): Promise<Article> => {
      const created = await api.createItem(formToPayload({ ...data }));
      return created as Article;
    },
    [api],
  );

  const updateArticle = useCallback(
    async (id: string, data: Partial<ArticleFormData>): Promise<Article> => {
      const updated = await api.updateItem(id, formToPayload({ ...data }));
      return updated as Article;
    },
    [api],
  );

  const deleteArticle = useCallback(
    async (id: string): Promise<void> => {
      await api.deleteItem(id);
    },
    [api],
  );

  const duplicateArticle = useCallback(
    async (id: string): Promise<Article> => {
      const original = articles.find((article) => article.id === id);
      if (!original) throw new Error("Article not found");
      const created = await api.createItem({
        title: `${original.title} (Copy)`,
        slug: `${original.slug}-copy`,
        excerpt: original.excerpt,
        content: original.content,
        type: original.type,
        category: original.category,
        format: original.format,
        difficulty: original.difficulty,
        status: "draft",
        authorId: original.author.id,
        tags: original.tags.map((tag) => tag.name),
        featuredImage: original.featuredImage,
        visibility: original.visibility,
        commentsEnabled: original.commentsEnabled,
        sharingEnabled: original.sharingEnabled,
        downloadEnabled: original.downloadEnabled,
        seo: original.seo,
        isFeatured: false,
        isPinned: false,
      });
      return created as Article;
    },
    [articles, api],
  );

  // Status management
  const publishArticle = useCallback(
    async (id: string): Promise<void> => {
      await api.updateItem(id, { status: "published", publishedAt: new Date().toISOString() });
    },
    [api],
  );

  const archiveArticle = useCallback(
    async (id: string): Promise<void> => {
      await api.updateItem(id, { status: "archived" });
    },
    [api],
  );

  const scheduleArticle = useCallback(
    async (id: string, date: Date): Promise<void> => {
      await api.updateItem(id, { status: "scheduled", scheduledFor: date.toISOString() });
    },
    [api],
  );

  const unpublishArticle = useCallback(
    async (id: string): Promise<void> => {
      await api.updateItem(id, { status: "draft" });
    },
    [api],
  );

  const reviewArticle = useCallback(
    async (id: string, reviewerId: string): Promise<void> => {
      await api.updateItem(id, { status: "review", reviewerId });
    },
    [api],
  );

  // Bulk operations
  const bulkPublish = useCallback(
    async (ids: string[]): Promise<void> => {
      await Promise.all(
        ids.map((id) =>
          api.updateItem(id, { status: "published", publishedAt: new Date().toISOString() }),
        ),
      );
    },
    [api],
  );

  const bulkArchive = useCallback(
    async (ids: string[]): Promise<void> => {
      await Promise.all(ids.map((id) => api.updateItem(id, { status: "archived" })));
    },
    [api],
  );

  const bulkDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      await Promise.all(ids.map((id) => api.deleteItem(id)));
    },
    [api],
  );

  const bulkReview = useCallback(
    async (ids: string[], reviewerId: string): Promise<void> => {
      await Promise.all(ids.map((id) => api.updateItem(id, { status: "review", reviewerId })));
    },
    [api],
  );

  // Utility functions
  const exportArticles = useCallback(
    (format: "csv" | "json" | "pdf") => {
      const dataToExport = paginatedArticles.map((article) => ({
        title: article.title,
        type: article.type,
        category: article.category,
        status: article.status,
        author: article.author.name,
        publishedAt: article.publishedAt,
        views: article.metrics.views,
        reads: article.metrics.reads,
        engagement: article.metrics.engagementScore,
        readTime: article.readTime,
        difficulty: article.difficulty,
      }));

      let content: string;
      let mimeType: string;
      let filename: string;

      switch (format) {
        case "csv": {
          const headers = Object.keys(dataToExport[0] ?? {}).join(",");
          const rows = dataToExport
            .map((item) =>
              Object.values(item)
                .map((value) => `"${value}"`)
                .join(","),
            )
            .join("\n");
          content = `${headers}\n${rows}`;
          mimeType = "text/csv";
          filename = `articles-${new Date().toISOString().split("T")[0]}.csv`;
          break;
        }
        case "json":
        case "pdf": {
          content = JSON.stringify(dataToExport, null, 2);
          mimeType = "application/json";
          filename = `articles-${new Date().toISOString().split("T")[0]}.json`;
          break;
        }
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [paginatedArticles],
  );

  const importArticles = useCallback(
    async (file: File): Promise<void> => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        logger.info("Imported articles", data);
        refreshData();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to import articles");
      }
    },
    [refreshData],
  );

  return {
    // Data
    articles: paginatedArticles,
    statistics,
    filteredArticles,

    // State
    loading: api.loading,
    error: api.error,
    filters,

    // Pagination
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: ITEMS_PER_PAGE,

    // Actions
    refreshData,
    updateFilters,
    clearFilters,

    // CRUD operations
    getArticle,
    addArticle,
    updateArticle,
    deleteArticle,
    duplicateArticle,

    // Status management
    publishArticle,
    archiveArticle,
    scheduleArticle,
    unpublishArticle,
    reviewArticle,

    // Bulk operations
    bulkPublish,
    bulkArchive,
    bulkDelete,
    bulkReview,

    // Utility
    exportArticles,
    importArticles,
  };
}
