"use client";

import { useMemo } from "react";

import type { Article, ArticleFilters } from "@/types/article";

export function useFilteredArticles(articles: Article[], filters: ArticleFilters): Article[] {
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

  return filteredArticles;
}
