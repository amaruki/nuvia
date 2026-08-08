"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  Announcement,
  AnnouncementFilters,
  AnnouncementFormData,
  AnnouncementPriority,
  AnnouncementStatistics,
  AnnouncementTargetAudience,
  AnnouncementType,
} from "@/types/announcement.types";
import {
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_TARGET_AUDIENCES,
  ANNOUNCEMENT_TYPES,
} from "@/types/announcement.types";
import type { ArticleCategory, ArticleStatus, ArticleType } from "@/types/article.types";
import { logger } from "@/lib/logger";
import {
  formToPayload,
  hydrateDate,
  useContentCollectionApi,
  type RawContentItem as RawApiItem,
} from "./use-content-collection";

interface RawContentItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: string;
  status: string;
  visibility: string;
  featuredImage?: string;
  gallery?: string[];
  attachments?: { id: string; name: string; url: string; size: number; type: string }[];
  author: {
    id: string;
    name: string;
    email?: string;
    image?: string;
    role?: string;
  };
  publishedAt?: string | null;
  scheduledFor?: string | null;
  createdAt: string;
  updatedAt: string;
  readTime?: number;
  wordCount?: number;
  tags?: string[];
  ui?: {
    version?: number;
    language?: string;
    reviewerId?: string;
    priority?: AnnouncementPriority;
    targetAudience?: AnnouncementTargetAudience;
    targetChapters?: string[];
    targetCommittees?: string[];
    expiresAt?: string | null;
    isPinned?: boolean;
    isUrgent?: boolean;
    requiresAcknowledgment?: boolean;
    acknowledgmentCount?: number;
    sendEmailNotification?: boolean;
    sendPushNotification?: boolean;
    displayOnHomepage?: boolean;
    displayInDashboard?: boolean;
    allowedRoles?: string[];
    allowedChapters?: string[];
    allowedCommittees?: string[];
    commentsEnabled?: boolean;
    sharingEnabled?: boolean;
    downloadEnabled?: boolean;
    isFeatured?: boolean;
    seo?: {
      title: string;
      description: string;
      keywords: string[];
      ogImage?: string;
      canonicalUrl?: string;
    };
  };
}

interface UseAnnouncementsReturn {
  // Data
  announcements: Announcement[];
  statistics: AnnouncementStatistics | null;
  filteredAnnouncements: Announcement[];

  // State
  loading: boolean;
  error: string | null;
  filters: AnnouncementFilters;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;

  // Actions
  refreshData: () => void;
  updateFilters: (filters: Partial<AnnouncementFilters>) => void;
  clearFilters: () => void;

  // CRUD operations
  getAnnouncement: (id: string) => Announcement | null;
  addAnnouncement: (data: AnnouncementFormData) => Promise<Announcement>;
  updateAnnouncement: (id: string, data: Partial<AnnouncementFormData>) => Promise<Announcement>;
  deleteAnnouncement: (id: string) => Promise<void>;
  duplicateAnnouncement: (id: string) => Promise<Announcement>;

  // Status management
  publishAnnouncement: (id: string) => Promise<void>;
  archiveAnnouncement: (id: string) => Promise<void>;
  scheduleAnnouncement: (id: string, date: Date) => Promise<void>;
  unpublishAnnouncement: (id: string) => Promise<void>;
  reviewAnnouncement: (id: string, reviewerId: string) => Promise<void>;

  // Bulk operations
  bulkPublish: (ids: string[]) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkReview: (ids: string[], reviewerId: string) => Promise<void>;

  // Utility
  exportAnnouncements: (format: "csv" | "json" | "pdf") => void;
  importAnnouncements: (file: File) => Promise<void>;
}

const DEFAULT_FILTERS: AnnouncementFilters = {
  search: "",
  status: [],
  type: [],
  category: ["announcements"], // Always announcements
  priority: [],
  targetAudience: [],
  targetChapters: [],
  targetCommittees: [],
  author: [],
  tags: [],
  series: [],
  dateRange: undefined,
  expiresAt: undefined,
  visibility: [],
  isPinned: undefined,
  isUrgent: undefined,
  requiresAcknowledgment: undefined,
  hasExpiration: undefined,
  sendEmailNotification: undefined,
  sendPushNotification: undefined,
  displayOnHomepage: undefined,
  displayInDashboard: undefined,
  minAcknowledgmentRate: undefined,
  maxAcknowledgmentRate: undefined,
  sortBy: "title",
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

function hydrateAnnouncement(raw: RawContentItem): Announcement {
  const ui = raw.ui ?? {};
  const tags = (raw.tags ?? []).map((t) => ({ id: t, name: t, color: "#6366f1", count: 0 }));
  const wordCount = raw.wordCount ?? raw.content.split(/\s+/).filter(Boolean).length;
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    content: raw.content,
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
    gallery: raw.gallery,
    attachments: raw.attachments,
    publishedAt: hydrateDate(raw.publishedAt),
    scheduledFor: hydrateDate(raw.scheduledFor),
    lastModified: hydrateDate(raw.updatedAt) ?? new Date(),
    readTime: raw.readTime ?? Math.max(1, Math.ceil(wordCount / 200)),
    wordCount,
    estimatedReadingSpeed: 200,
    seo: ui.seo ?? {
      title: raw.title,
      description: raw.excerpt,
      keywords: (raw.tags ?? []).slice(0, 5),
    },
    metrics: { ...EMPTY_METRICS },
    visibility: raw.visibility as Announcement["visibility"],
    allowedRoles: ui.allowedRoles,
    allowedChapters: ui.allowedChapters,
    allowedCommittees: ui.allowedCommittees,
    version: ui.version ?? 1,
    language: ui.language ?? "en",
    commentsEnabled: ui.commentsEnabled ?? true,
    sharingEnabled: ui.sharingEnabled ?? true,
    downloadEnabled: ui.downloadEnabled ?? false,
    isFeatured: ui.isFeatured ?? false,

    // Announcement-specific fields
    type: (raw.type || "general") as AnnouncementType,
    category: "announcements",
    priority: ui.priority ?? "medium",
    targetAudience: ui.targetAudience ?? "all_members",
    targetChapters: ui.targetChapters ?? [],
    targetCommittees: ui.targetCommittees ?? [],
    expiresAt: hydrateDate(ui.expiresAt),
    isPinned: ui.isPinned ?? false,
    isUrgent: ui.isUrgent ?? false,
    requiresAcknowledgment: ui.requiresAcknowledgment ?? false,
    acknowledgmentCount: ui.acknowledgmentCount ?? 0,
    sendEmailNotification: ui.sendEmailNotification ?? true,
    sendPushNotification: ui.sendPushNotification ?? true,
    displayOnHomepage: ui.displayOnHomepage ?? false,
    displayInDashboard: ui.displayInDashboard ?? true,
  };
}

function buildAnnouncementStatistics(announcements: Announcement[]): AnnouncementStatistics {
  const now = new Date();

  return {
    totalAnnouncements: announcements.length,
    totalArticles: announcements.length,
    publishedArticles: announcements.filter((a) => a.status === "published").length,
    draftArticles: announcements.filter((a) => a.status === "draft").length,
    scheduledArticles: announcements.filter((a) => a.status === "scheduled").length,
    archivedArticles: announcements.filter((a) => a.status === "archived").length,
    topPerformingArticles: announcements
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
        type: a.type as unknown as ArticleType,
        category: a.category as unknown as ArticleCategory,
      })),
    announcementsByType: ANNOUNCEMENT_TYPES.map((type) => ({
      type,
      count: announcements.filter((a) => a.type === type).length,
    })),
    announcementsByPriority: ANNOUNCEMENT_PRIORITIES.map((priority) => ({
      priority,
      count: announcements.filter((a) => a.priority === priority).length,
    })),
    announcementsByTargetAudience: ANNOUNCEMENT_TARGET_AUDIENCES.map((targetAudience) => ({
      targetAudience,
      count: announcements.filter((a) => a.targetAudience === targetAudience).length,
    })),
    totalAcknowledgments: announcements.reduce((sum, a) => sum + (a.acknowledgmentCount || 0), 0),
    averageAcknowledgmentRate:
      announcements.length > 0
        ? Math.round(
            announcements.reduce((sum, a) => sum + (a.acknowledgmentCount || 0), 0) /
              announcements.length,
          )
        : 0,
    urgentAnnouncements: announcements.filter((a) => a.isUrgent).length,
    pinnedAnnouncements: announcements.filter((a) => a.isPinned).length,
    expiredAnnouncements: announcements.filter((a) => a.expiresAt && a.expiresAt < now).length,
    activeAnnouncements: announcements.filter(
      (a) => a.status === "published" && (!a.expiresAt || a.expiresAt >= now),
    ).length,
  };
}

export function useAnnouncements(): UseAnnouncementsReturn {
  const api = useContentCollectionApi<Announcement>(
    "announcements",
    hydrateAnnouncement as unknown as (raw: RawApiItem) => Announcement,
  );
  const [filters, setFilters] = useState<AnnouncementFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  const announcements = api.allItems;
  const statistics = useMemo(
    () => (announcements.length > 0 ? buildAnnouncementStatistics(announcements) : null),
    [announcements],
  );

  // Filter and sort announcements
  const filteredAnnouncements = useMemo(() => {
    let filtered = [...announcements];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (announcement) =>
          announcement.title.toLowerCase().includes(searchLower) ||
          announcement.excerpt.toLowerCase().includes(searchLower) ||
          announcement.content.toLowerCase().includes(searchLower) ||
          announcement.author.name.toLowerCase().includes(searchLower),
      );
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((announcement) => filters.status!.includes(announcement.status));
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter((announcement) => filters.type!.includes(announcement.type));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((announcement) =>
        filters.priority!.includes(announcement.priority),
      );
    }

    if (filters.targetAudience && filters.targetAudience.length > 0) {
      filtered = filtered.filter((announcement) =>
        filters.targetAudience!.includes(announcement.targetAudience),
      );
    }

    if (filters.targetChapters && filters.targetChapters.length > 0) {
      filtered = filtered.filter((announcement) =>
        announcement.targetChapters?.some((chapter) => filters.targetChapters!.includes(chapter)),
      );
    }

    if (filters.targetCommittees && filters.targetCommittees.length > 0) {
      filtered = filtered.filter((announcement) =>
        announcement.targetCommittees?.some((committee) =>
          filters.targetCommittees!.includes(committee),
        ),
      );
    }

    if (filters.author && filters.author.length > 0) {
      filtered = filtered.filter(
        (announcement) =>
          filters.author!.includes(announcement.author.id) ||
          announcement.coAuthors?.some((coAuthor) => filters.author!.includes(coAuthor.id)),
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((announcement) =>
        announcement.tags.some((tag) => filters.tags!.includes(tag.id)),
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter((announcement) => {
        const announcementDate =
          announcement.publishedAt || announcement.scheduledFor || announcement.lastModified;
        return (
          announcementDate >= filters.dateRange!.start && announcementDate <= filters.dateRange!.end
        );
      });
    }

    if (filters.expiresAt) {
      filtered = filtered.filter((announcement) => {
        if (!announcement.expiresAt) return false;
        if (filters.expiresAt!.start && announcement.expiresAt < filters.expiresAt!.start)
          return false;
        if (filters.expiresAt!.end && announcement.expiresAt > filters.expiresAt!.end) return false;
        return true;
      });
    }

    if (filters.visibility && filters.visibility.length > 0) {
      filtered = filtered.filter((announcement) =>
        filters.visibility!.includes(announcement.visibility),
      );
    }

    if (filters.isPinned !== undefined) {
      filtered = filtered.filter((announcement) => announcement.isPinned === filters.isPinned);
    }

    if (filters.isUrgent !== undefined) {
      filtered = filtered.filter((announcement) => announcement.isUrgent === filters.isUrgent);
    }

    if (filters.requiresAcknowledgment !== undefined) {
      filtered = filtered.filter(
        (announcement) => announcement.requiresAcknowledgment === filters.requiresAcknowledgment,
      );
    }

    if (filters.hasExpiration !== undefined) {
      filtered = filtered.filter(
        (announcement) => !!announcement.expiresAt === filters.hasExpiration,
      );
    }

    if (filters.sendEmailNotification !== undefined) {
      filtered = filtered.filter(
        (announcement) => announcement.sendEmailNotification === filters.sendEmailNotification,
      );
    }

    if (filters.sendPushNotification !== undefined) {
      filtered = filtered.filter(
        (announcement) => announcement.sendPushNotification === filters.sendPushNotification,
      );
    }

    if (filters.displayOnHomepage !== undefined) {
      filtered = filtered.filter(
        (announcement) => announcement.displayOnHomepage === filters.displayOnHomepage,
      );
    }

    if (filters.displayInDashboard !== undefined) {
      filtered = filtered.filter(
        (announcement) => announcement.displayInDashboard === filters.displayInDashboard,
      );
    }

    if (filters.minAcknowledgmentRate !== undefined) {
      filtered = filtered.filter((announcement) => {
        const rate =
          announcement.acknowledgmentCount && announcement.acknowledgmentCount > 0 ? 100 : 0;
        return rate >= filters.minAcknowledgmentRate!;
      });
    }

    if (filters.maxAcknowledgmentRate !== undefined) {
      filtered = filtered.filter((announcement) => {
        const rate =
          announcement.acknowledgmentCount && announcement.acknowledgmentCount > 0 ? 100 : 0;
        return rate <= filters.maxAcknowledgmentRate!;
      });
    }

    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: string | Date;
        let bValue: string | Date;

        switch (filters.sortBy) {
          case "title":
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case "publishedAt":
            aValue = a.publishedAt || a.scheduledFor || a.lastModified;
            bValue = b.publishedAt || b.scheduledFor || b.lastModified;
            break;
          case "author":
            aValue = a.author.name.toLowerCase();
            bValue = b.author.name.toLowerCase();
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
  }, [announcements, filters]);

  // Pagination
  const { totalPages, totalItems } = useMemo(() => {
    const total = filteredAnnouncements.length;
    return {
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      totalItems: total,
    };
  }, [filteredAnnouncements]);

  // Actions
  const refreshData = useCallback(() => {
    void api.refreshData();
  }, [api]);

  const updateFilters = useCallback((newFilters: Partial<AnnouncementFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  const getAnnouncement = useCallback(
    (id: string): Announcement | null =>
      announcements.find((announcement) => announcement.id === id) || null,
    [announcements],
  );

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

  // Utility functions
  const exportAnnouncements = useCallback(
    (format: "csv" | "json" | "pdf") => {
      const dataToExport = filteredAnnouncements.map((announcement) => ({
        title: announcement.title,
        type: announcement.type,
        priority: announcement.priority,
        targetAudience: announcement.targetAudience,
        status: announcement.status,
        author: announcement.author.name,
        publishedAt: announcement.publishedAt,
        expiresAt: announcement.expiresAt,
        acknowledgmentCount: announcement.acknowledgmentCount || 0,
        isPinned: announcement.isPinned,
        isUrgent: announcement.isUrgent,
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
          filename = `announcements-${new Date().toISOString().split("T")[0]}.csv`;
          break;
        }
        case "json":
        case "pdf": {
          content = JSON.stringify(dataToExport, null, 2);
          mimeType = "application/json";
          filename = `announcements-${new Date().toISOString().split("T")[0]}.json`;
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
    [filteredAnnouncements],
  );

  const importAnnouncements = useCallback(
    async (file: File): Promise<void> => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        logger.info("Imported announcements", data);
        refreshData();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to import announcements");
      }
    },
    [refreshData],
  );

  return {
    // Data
    announcements: filteredAnnouncements,
    statistics,
    filteredAnnouncements,

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
    getAnnouncement,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    duplicateAnnouncement,

    // Status management
    publishAnnouncement,
    archiveAnnouncement,
    scheduleAnnouncement,
    unpublishAnnouncement,
    reviewAnnouncement,

    // Bulk operations
    bulkPublish,
    bulkArchive,
    bulkDelete,
    bulkReview,

    // Utility
    exportAnnouncements,
    importAnnouncements,
  };
}
