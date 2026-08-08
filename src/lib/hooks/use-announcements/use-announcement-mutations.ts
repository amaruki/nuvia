"use client";

import { useCallback } from "react";

import type { Announcement, AnnouncementFormData } from "@/types/announcement";

import { formToPayload, type ContentCollectionApi } from "../use-content-collection";

export function useAnnouncementMutations(
  api: ContentCollectionApi<Announcement>,
  announcements: Announcement[],
) {
  // CRUD operations
  const addAnnouncement = useCallback(
    async (data: AnnouncementFormData): Promise<Announcement> => {
      const created = await api.createItem(formToPayload({ ...data }));
      return created as Announcement;
    },
    [api],
  );

  const updateAnnouncement = useCallback(
    async (id: string, data: Partial<AnnouncementFormData>): Promise<Announcement> => {
      const updated = await api.updateItem(id, formToPayload({ ...data }));
      return updated as Announcement;
    },
    [api],
  );

  const deleteAnnouncement = useCallback(
    async (id: string): Promise<void> => {
      await api.deleteItem(id);
    },
    [api],
  );

  const duplicateAnnouncement = useCallback(
    async (id: string): Promise<Announcement> => {
      const original = announcements.find((announcement) => announcement.id === id);
      if (!original) throw new Error("Announcement not found");
      const created = await api.createItem({
        title: `${original.title} (Copy)`,
        slug: `${original.slug}-copy`,
        excerpt: original.excerpt,
        content: original.content,
        type: original.type,
        category: "announcements",
        status: "draft",
        authorId: original.author.id,
        tags: original.tags.map((tag) => tag.name),
        featuredImage: original.featuredImage,
        visibility: original.visibility,
        priority: original.priority,
        targetAudience: original.targetAudience,
        targetChapters: original.targetChapters,
        targetCommittees: original.targetCommittees,
        expiresAt: original.expiresAt?.toISOString(),
        isPinned: false,
        isUrgent: original.isUrgent,
        requiresAcknowledgment: original.requiresAcknowledgment,
        sendEmailNotification: original.sendEmailNotification,
        sendPushNotification: original.sendPushNotification,
        displayOnHomepage: original.displayOnHomepage,
        displayInDashboard: original.displayInDashboard,
        commentsEnabled: original.commentsEnabled,
        sharingEnabled: original.sharingEnabled,
        downloadEnabled: original.downloadEnabled,
      });
      return created as Announcement;
    },
    [announcements, api],
  );

  // Status management
  const publishAnnouncement = useCallback(
    async (id: string): Promise<void> => {
      await api.updateItem(id, { status: "published", publishedAt: new Date().toISOString() });
    },
    [api],
  );

  const archiveAnnouncement = useCallback(
    async (id: string): Promise<void> => {
      await api.updateItem(id, { status: "archived" });
    },
    [api],
  );

  const scheduleAnnouncement = useCallback(
    async (id: string, date: Date): Promise<void> => {
      await api.updateItem(id, { status: "scheduled", scheduledFor: date.toISOString() });
    },
    [api],
  );

  const unpublishAnnouncement = useCallback(
    async (id: string): Promise<void> => {
      await api.updateItem(id, { status: "draft" });
    },
    [api],
  );

  const reviewAnnouncement = useCallback(
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
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    duplicateAnnouncement,
    publishAnnouncement,
    archiveAnnouncement,
    scheduleAnnouncement,
    unpublishAnnouncement,
    reviewAnnouncement,
    bulkPublish,
    bulkArchive,
    bulkDelete,
    bulkReview,
  };
}
