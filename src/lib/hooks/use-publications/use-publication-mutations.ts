"use client";

import { useCallback } from "react";

import type { Publication, PublicationFormData } from "@/types/publication.types";

import { formToPayload, type ContentCollectionApi } from "../use-content-collection";

export function usePublicationMutations(
  api: ContentCollectionApi<Publication>,
  publications: Publication[],
) {
  // CRUD operations
  const addPublication = useCallback(
    async (data: PublicationFormData): Promise<Publication> => {
      const created = await api.createItem(formToPayload({ ...data }));
      return created as Publication;
    },
    [api],
  );

  const updatePublication = useCallback(
    async (id: string, data: Partial<PublicationFormData>): Promise<Publication> => {
      const updated = await api.updateItem(id, formToPayload({ ...data }));
      return updated as Publication;
    },
    [api],
  );

  const deletePublication = useCallback(
    async (id: string): Promise<void> => {
      await api.deleteItem(id);
    },
    [api],
  );

  const duplicatePublication = useCallback(
    async (id: string): Promise<Publication> => {
      const original = publications.find((pub) => pub.id === id);
      if (!original) throw new Error("Publication not found");
      const created = await api.createItem({
        title: `${original.title} (Copy)`,
        slug: `${original.slug}-copy`,
        excerpt: original.excerpt,
        content: original.content,
        type: original.type,
        category: original.category,
        status: "draft",
        authorId: original.author.id,
        tags: original.tags.map((tag) => tag.name),
        featuredImage: original.featuredImage,
        visibility: original.visibility,
        difficulty: original.difficulty,
        commentsEnabled: original.commentsEnabled,
        sharingEnabled: original.sharingEnabled,
        downloadEnabled: original.downloadEnabled,
        seo: original.seo,
        isFeatured: false,
        isPinned: false,
      });
      return created as Publication;
    },
    [publications, api],
  );

  // Status management
  const publishPublication = useCallback(
    async (id: string): Promise<void> => {
      await api.updateItem(id, { status: "published", publishedAt: new Date().toISOString() });
    },
    [api],
  );

  const archivePublication = useCallback(
    async (id: string): Promise<void> => {
      await api.updateItem(id, { status: "archived" });
    },
    [api],
  );

  const schedulePublication = useCallback(
    async (id: string, date: Date): Promise<void> => {
      await api.updateItem(id, { status: "scheduled", scheduledFor: date.toISOString() });
    },
    [api],
  );

  const unpublishPublication = useCallback(
    async (id: string): Promise<void> => {
      await api.updateItem(id, { status: "draft" });
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

  return {
    addPublication,
    updatePublication,
    deletePublication,
    duplicatePublication,
    publishPublication,
    archivePublication,
    schedulePublication,
    unpublishPublication,
    bulkPublish,
    bulkArchive,
    bulkDelete,
  };
}
