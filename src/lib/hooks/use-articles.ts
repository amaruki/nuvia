"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Article,
  ArticleStatistics,
  ArticleFilters,
  ArticleFormData,
  ArticleStatus,
  ArticleType,
  ArticleCategory,
  ArticleDifficulty,
  ArticleFormat,
  ArticleAuthor,
} from "@/types/article.types";
import { mockArticles, mockStatistics } from "@/lib/data/mock-article-data";
import { logger } from "@/lib/logger";

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

export function useArticles(): UseArticlesReturn {
  const [articles, setArticles] = useState<Article[]>([]);
  const [statistics, setStatistics] = useState<ArticleStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ArticleFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setArticles(mockArticles);
        setStatistics(mockStatistics);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load articles");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Search filter
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

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((article) => filters.status!.includes(article.status));
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter((article) => filters.type!.includes(article.type));
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((article) => filters.category!.includes(article.category));
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty.length > 0) {
      filtered = filtered.filter((article) => filters.difficulty!.includes(article.difficulty));
    }

    // Format filter
    if (filters.format && filters.format.length > 0) {
      filtered = filtered.filter((article) => filters.format!.includes(article.format));
    }

    // Author filter
    if (filters.author && filters.author.length > 0) {
      filtered = filtered.filter(
        (article) =>
          filters.author!.includes(article.author.id) ||
          article.coAuthors?.some((coAuthor) => filters.author!.includes(coAuthor.id)),
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((article) =>
        article.tags.some((tag) => filters.tags!.includes(tag.id)),
      );
    }

    // Series filter
    if (filters.series && filters.series.length > 0) {
      filtered = filtered.filter(
        (article) => article.series && filters.series!.includes(article.series.id),
      );
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter((article) => {
        const articleDate = article.publishedAt || article.scheduledFor || article.lastModified;
        return articleDate >= filters.dateRange!.start && articleDate <= filters.dateRange!.end;
      });
    }

    // Visibility filter
    if (filters.visibility && filters.visibility.length > 0) {
      filtered = filtered.filter((article) => filters.visibility!.includes(article.visibility));
    }

    // Featured filter
    if (filters.featured !== undefined) {
      filtered = filtered.filter((article) => article.isFeatured === filters.featured);
    }

    // Has series filter
    if (filters.hasSeries !== undefined) {
      filtered = filtered.filter((article) => !!article.series === filters.hasSeries);
    }

    // Read time range filter
    if (filters.minReadTime !== undefined) {
      filtered = filtered.filter((article) => article.readTime >= filters.minReadTime!);
    }
    if (filters.maxReadTime !== undefined) {
      filtered = filtered.filter((article) => article.readTime <= filters.maxReadTime!);
    }

    // Engagement range filter
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

    // Sort
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;

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
  const { totalPages, totalItems, itemsPerPage } = useMemo(() => {
    const total = filteredArticles.length;
    const pages = Math.ceil(total / ITEMS_PER_PAGE);

    return {
      totalPages: pages,
      totalItems: total,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  }, [filteredArticles]);

  // Paginated articles
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredArticles.slice(startIndex, endIndex);
  }, [filteredArticles, currentPage, itemsPerPage]);

  // Actions
  const refreshData = useCallback(() => {
    setLoading(true);
    setError(null);

    // Simulate API refresh
    setTimeout(() => {
      setArticles(mockArticles);
      setStatistics(mockStatistics);
      setLoading(false);
    }, 500);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<ArticleFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  // Get single article
  const getArticle = useCallback(
    (id: string): Article | null => {
      return articles.find((article) => article.id === id) || null;
    },
    [articles],
  );

  // CRUD operations
  const addArticle = useCallback(async (data: ArticleFormData): Promise<Article> => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newArticle: Article = {
        id: `article_${Date.now()}`,
        title: data.title,
        slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        excerpt: data.excerpt,
        content: data.content,
        type: data.type,
        category: data.category,
        format: data.format,
        difficulty: data.difficulty,
        status: data.status,
        author:
          mockArticles.find((a) => a.author.id === data.authorId)?.author || mockArticles[0].author,
        coAuthors: data.coAuthorIds
          ?.map((id) => mockArticles.find((a) => a.author.id === id)?.author)
          .filter((author): author is ArticleAuthor => author !== undefined),
        reviewer: data.reviewerId
          ? mockArticles.find((a) => a.author.id === data.reviewerId)?.author
          : undefined,
        tags: mockArticles[0].tags.filter((tag) => data.tagIds.includes(tag.id)),
        publishedAt: data.status === "published" ? new Date() : undefined,
        scheduledFor: data.status === "scheduled" ? data.scheduledFor : undefined,
        lastModified: new Date(),
        readTime: Math.ceil(data.content.split(" ").length / 200), // Rough estimate
        wordCount: data.content.split(" ").length,
        estimatedReadingSpeed: 200,
        seo: data.seo,
        metrics: {
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
        },
        visibility: data.visibility,
        version: 1,
        language: "en",
        commentsEnabled: data.commentsEnabled,
        sharingEnabled: data.sharingEnabled,
        downloadEnabled: data.downloadEnabled,
        isFeatured: data.isFeatured,
        isPinned: data.isPinned,
        priority: data.priority,
      };

      setArticles((prev) => [newArticle, ...prev]);
      return newArticle;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create article");
    }
  }, []);

  const updateArticle = useCallback(
    async (id: string, data: Partial<ArticleFormData>): Promise<Article> => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setArticles((prev) =>
          prev.map((article) => {
            if (article.id === id) {
              return {
                ...article,
                ...data,
                lastModified: new Date(),
                publishedAt:
                  data.status === "published" && article.status !== "published"
                    ? new Date()
                    : article.publishedAt,
                scheduledFor:
                  data.status === "scheduled" ? data.scheduledFor : article.scheduledFor,
              } as Article;
            }
            return article;
          }),
        );

        const updated = articles.find((article) => article.id === id);
        if (!updated) throw new Error("Article not found");
        return updated;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to update article");
      }
    },
    [articles],
  );

  const deleteArticle = useCallback(async (id: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setArticles((prev) => prev.filter((article) => article.id !== id));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete article");
    }
  }, []);

  const duplicateArticle = useCallback(
    async (id: string): Promise<Article> => {
      try {
        const original = articles.find((article) => article.id === id);
        if (!original) throw new Error("Article not found");

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const duplicated: Article = {
          ...original,
          id: `article_${Date.now()}`,
          title: `${original.title} (Copy)`,
          slug: `${original.slug}-copy`,
          status: "draft",
          publishedAt: undefined,
          scheduledFor: undefined,
          lastModified: new Date(),
          version: 1,
          metrics: {
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
          },
        };

        setArticles((prev) => [duplicated, ...prev]);
        return duplicated;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to duplicate article");
      }
    },
    [articles],
  );

  // Status management
  const publishArticle = useCallback(
    async (id: string): Promise<void> => {
      await updateArticle(id, { status: "published", publishedAt: new Date() });
    },
    [updateArticle],
  );

  const archiveArticle = useCallback(
    async (id: string): Promise<void> => {
      await updateArticle(id, { status: "archived" });
    },
    [updateArticle],
  );

  const scheduleArticle = useCallback(
    async (id: string, date: Date): Promise<void> => {
      await updateArticle(id, { status: "scheduled", scheduledFor: date });
    },
    [updateArticle],
  );

  const unpublishArticle = useCallback(
    async (id: string): Promise<void> => {
      await updateArticle(id, { status: "draft" });
    },
    [updateArticle],
  );

  const reviewArticle = useCallback(
    async (id: string, reviewerId: string): Promise<void> => {
      const reviewer = mockArticles.find((a) => a.author.id === reviewerId)?.author;
      await updateArticle(id, { status: "review", reviewerId });
    },
    [updateArticle],
  );

  // Bulk operations
  const bulkPublish = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setArticles((prev) =>
        prev.map((article) => {
          if (ids.includes(article.id)) {
            return {
              ...article,
              status: "published" as ArticleStatus,
              publishedAt: new Date(),
              lastModified: new Date(),
            };
          }
          return article;
        }),
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to bulk publish");
    }
  }, []);

  const bulkArchive = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setArticles((prev) =>
        prev.map((article) => {
          if (ids.includes(article.id)) {
            return {
              ...article,
              status: "archived" as ArticleStatus,
              lastModified: new Date(),
            };
          }
          return article;
        }),
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to bulk archive");
    }
  }, []);

  const bulkDelete = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setArticles((prev) => prev.filter((article) => !ids.includes(article.id)));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to bulk delete");
    }
  }, []);

  const bulkReview = useCallback(async (ids: string[], reviewerId: string): Promise<void> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const reviewer = mockArticles.find((a) => a.author.id === reviewerId)?.author;

      setArticles((prev) =>
        prev.map((article) => {
          if (ids.includes(article.id)) {
            return {
              ...article,
              status: "review" as ArticleStatus,
              reviewer,
              reviewedAt: new Date(),
              lastModified: new Date(),
            };
          }
          return article;
        }),
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to bulk review");
    }
  }, []);

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
        case "csv":
          const headers = Object.keys(dataToExport[0]).join(",");
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
        case "json":
          content = JSON.stringify(dataToExport, null, 2);
          mimeType = "application/json";
          filename = `articles-${new Date().toISOString().split("T")[0]}.json`;
          break;
        case "pdf":
          // In a real app, you'd use a PDF library
          content = JSON.stringify(dataToExport, null, 2);
          mimeType = "application/json";
          filename = `articles-${new Date().toISOString().split("T")[0]}.json`;
          break;
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

        // In a real app, you'd validate and process the imported data
        logger.info("Imported articles", data);

        // Simulate processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Refresh data after import
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
    loading,
    error,
    filters,

    // Pagination
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,

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
