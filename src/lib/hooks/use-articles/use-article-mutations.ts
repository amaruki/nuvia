"use client";

import { useCallback } from "react";

import type { Article, ArticleFormData } from "@/types/article";

import { formToPayload, type ContentCollectionApi } from "../use-content-collection";

export function useArticleMutations(api: ContentCollectionApi<Article>, articles: Article[]) {
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

  return {
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
  };
}
