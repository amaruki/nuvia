"use client";

import { useCallback, useMemo, useState } from "react";

import type { Article, ArticleFilters } from "@/types/article.types";

import { logger } from "@/lib/logger";

import {
  useContentCollectionApi,
  type RawContentItem as RawApiItem,
} from "../use-content-collection";

import { buildArticleStatistics } from "./article-statistics";
import { DEFAULT_FILTERS, ITEMS_PER_PAGE } from "./constants";
import { hydrateArticle } from "./hydrate-article";
import type { UseArticlesReturn } from "./types";
import { useArticleMutations } from "./use-article-mutations";
import { useFilteredArticles } from "./use-filtered-articles";

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

  const filteredArticles = useFilteredArticles(articles, filters);

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

  const {
    addArticle,
    updateArticle,
    deleteArticle,
    duplicateArticle,
    publishArticle,
    archiveArticle,
    scheduleArticle,
    unpublishArticle,
    reviewArticle,
    bulkPublish,
    bulkArchive,
    bulkDelete,
    bulkReview,
  } = useArticleMutations(api, articles);

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
