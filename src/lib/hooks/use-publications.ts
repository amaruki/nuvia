"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  Publication,
  PublicationCategory,
  PublicationFilters,
  PublicationFormData,
  PublicationStatistics,
  PublicationStatus,
  PublicationType,
} from "@/types/publication.types";
import {
  PUBLICATION_CATEGORIES,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
} from "@/types/publication.types";
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
  publishedAt?: string | null;
  scheduledFor?: string | null;
  createdAt: string;
  updatedAt: string;
  readTime?: number;
  wordCount?: number;
  difficulty?: string;
  tags?: string[];
  ui?: {
    version?: number;
    language?: string;
    isFeatured?: boolean;
    isPinned?: boolean;
    priority?: number;
    commentsEnabled?: boolean;
    sharingEnabled?: boolean;
    downloadEnabled?: boolean;
    seo?: {
      title: string;
      description: string;
      keywords: string[];
      ogImage?: string;
    };
  };
}

interface UsePublicationsReturn {
  // Data
  publications: Publication[];
  statistics: PublicationStatistics | null;
  filteredPublications: Publication[];

  // State
  loading: boolean;
  error: string | null;
  filters: PublicationFilters;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;

  // Actions
  refreshData: () => void;
  updateFilters: (filters: Partial<PublicationFilters>) => void;
  clearFilters: () => void;

  // CRUD operations
  getPublication: (id: string) => Publication | null;
  addPublication: (data: PublicationFormData) => Promise<Publication>;
  updatePublication: (id: string, data: Partial<PublicationFormData>) => Promise<Publication>;
  deletePublication: (id: string) => Promise<void>;
  duplicatePublication: (id: string) => Promise<Publication>;

  // Status management
  publishPublication: (id: string) => Promise<void>;
  archivePublication: (id: string) => Promise<void>;
  schedulePublication: (id: string, date: Date) => Promise<void>;
  unpublishPublication: (id: string) => Promise<void>;

  // Bulk operations
  bulkPublish: (ids: string[]) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;

  // Utility
  exportPublications: (format: "csv" | "json" | "pdf") => void;
  importPublications: (file: File) => Promise<void>;
}

const DEFAULT_FILTERS: PublicationFilters = {
  search: "",
  status: [],
  type: [],
  category: [],
  author: [],
  tags: [],
  dateRange: undefined,
  visibility: [],
  featured: undefined,
  sortBy: "publishedAt",
  sortOrder: "desc",
  page: 1,
  limit: 10,
};

const ITEMS_PER_PAGE = 10;

const EMPTY_METRICS = {
  views: 0,
  downloads: 0,
  shares: 0,
  comments: 0,
  likes: 0,
  bookmarks: 0,
  averageReadTime: 0,
  bounceRate: 0,
  engagementScore: 0,
};

function hydratePublication(raw: RawContentItem): Publication {
  const ui = raw.ui ?? {};
  const tags = (raw.tags ?? []).map((t) => ({ id: t, name: t, color: "#6366f1", count: 0 }));
  const wordCount = raw.wordCount ?? raw.content.split(/\s+/).filter(Boolean).length;
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    content: raw.content,
    type: raw.type as PublicationType,
    category: raw.category as PublicationCategory,
    status: raw.status as PublicationStatus,
    author: {
      id: raw.author.id,
      name: raw.author.name,
      email: raw.author.email ?? "",
      avatar: raw.author.image,
      role: raw.author.role ?? "member",
    },
    coAuthors: [],
    tags,
    featuredImage: raw.featuredImage,
    gallery: raw.gallery,
    publishedAt: hydrateDate(raw.publishedAt),
    scheduledFor: hydrateDate(raw.scheduledFor),
    lastModified: hydrateDate(raw.updatedAt) ?? new Date(),
    readTime: raw.readTime ?? Math.max(1, Math.ceil(wordCount / 200)),
    wordCount,
    difficulty: (raw.difficulty ?? "beginner") as Publication["difficulty"],
    seo: ui.seo ?? {
      title: raw.title,
      description: raw.excerpt,
      keywords: (raw.tags ?? []).slice(0, 5),
    },
    metrics: { ...EMPTY_METRICS },
    visibility: raw.visibility as Publication["visibility"],
    version: ui.version ?? 1,
    language: ui.language ?? "en",
    commentsEnabled: ui.commentsEnabled ?? true,
    sharingEnabled: ui.sharingEnabled ?? true,
    downloadEnabled: ui.downloadEnabled ?? true,
    isFeatured: ui.isFeatured ?? false,
    isPinned: ui.isPinned ?? false,
    priority: ui.priority ?? 50,
  };
}

function buildPublicationStatistics(publications: Publication[]): PublicationStatistics {
  const now = new Date();
  const average = (values: number[]) =>
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const monthKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const recentActivity = publications
    .slice()
    .sort(
      (a, b) =>
        (b.publishedAt ?? b.lastModified).getTime() - (a.publishedAt ?? a.lastModified).getTime(),
    )
    .slice(0, 10)
    .map((publication) => ({
      id: `${publication.id}-activity`,
      publicationId: publication.id,
      title: publication.title,
      action: (publication.publishedAt ? "published" : "updated") as "published" | "updated",
      author: publication.author.name,
      timestamp: publication.publishedAt ?? publication.lastModified,
    }));

  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = monthKey(monthDate);
    const inMonth = publications.filter((p) => monthKey(p.lastModified) === key);
    return {
      month: key,
      publicationsCreated: inMonth.length,
      publicationsPublished: inMonth.filter((p) => p.publishedAt).length,
      totalViews: inMonth.reduce((acc, p) => acc + p.metrics.views, 0),
      totalEngagement: inMonth.reduce((acc, p) => acc + p.metrics.engagementScore, 0),
    };
  });

  return {
    totalPublications: publications.length,
    publishedPublications: publications.filter((p) => p.status === "published").length,
    draftPublications: publications.filter((p) => p.status === "draft").length,
    scheduledPublications: publications.filter((p) => p.status === "scheduled").length,
    archivedPublications: publications.filter((p) => p.status === "archived").length,
    totalViews: publications.reduce((acc, p) => acc + p.metrics.views, 0),
    totalDownloads: publications.reduce((acc, p) => acc + p.metrics.downloads, 0),
    totalShares: publications.reduce((acc, p) => acc + p.metrics.shares, 0),
    totalComments: publications.reduce((acc, p) => acc + p.metrics.comments, 0),
    averageEngagementScore: average(publications.map((p) => p.metrics.engagementScore)),
    publicationsByType: PUBLICATION_TYPES.map((type) => {
      const items = publications.filter((p) => p.type === type);
      return {
        type,
        count: items.length,
        views: items.reduce((acc, p) => acc + p.metrics.views, 0),
        engagement: average(items.map((p) => p.metrics.engagementScore)),
      };
    }),
    publicationsByCategory: PUBLICATION_CATEGORIES.map((category) => {
      const items = publications.filter((p) => p.category === category);
      return {
        category,
        count: items.length,
        views: items.reduce((acc, p) => acc + p.metrics.views, 0),
        engagement: average(items.map((p) => p.metrics.engagementScore)),
      };
    }),
    publicationsByStatus: PUBLICATION_STATUSES.map((status) => ({
      status,
      count: publications.filter((p) => p.status === status).length,
    })),
    topPerformingPublications: publications
      .slice()
      .sort((a, b) => b.metrics.engagementScore - a.metrics.engagementScore)
      .slice(0, 10)
      .map((p) => ({
        publicationId: p.id,
        title: p.title,
        author: p.author.name,
        views: p.metrics.views,
        engagementScore: p.metrics.engagementScore,
        type: p.type,
        category: p.category,
      })),
    recentActivity,
    monthlyTrend,
  };
}

export function usePublications(): UsePublicationsReturn {
  const api = useContentCollectionApi<Publication>(
    "publications",
    hydratePublication as unknown as (raw: RawApiItem) => Publication,
  );
  const [filters, setFilters] = useState<PublicationFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  const publications = api.allItems;
  const statistics = useMemo(
    () => (publications.length > 0 ? buildPublicationStatistics(publications) : null),
    [publications],
  );

  // Filter and sort publications
  const filteredPublications = useMemo(() => {
    let filtered = [...publications];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (pub) =>
          pub.title.toLowerCase().includes(searchLower) ||
          pub.excerpt.toLowerCase().includes(searchLower) ||
          pub.content.toLowerCase().includes(searchLower) ||
          pub.author.name.toLowerCase().includes(searchLower),
      );
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((pub) => filters.status!.includes(pub.status));
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter((pub) => filters.type!.includes(pub.type));
    }

    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((pub) => filters.category!.includes(pub.category));
    }

    if (filters.author && filters.author.length > 0) {
      filtered = filtered.filter(
        (pub) =>
          filters.author!.includes(pub.author.id) ||
          pub.coAuthors?.some((coAuthor) => filters.author!.includes(coAuthor.id)),
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((pub) => pub.tags.some((tag) => filters.tags!.includes(tag.id)));
    }

    if (filters.dateRange) {
      filtered = filtered.filter((pub) => {
        const pubDate = pub.publishedAt || pub.scheduledFor || pub.lastModified;
        return pubDate >= filters.dateRange!.start && pubDate <= filters.dateRange!.end;
      });
    }

    if (filters.visibility && filters.visibility.length > 0) {
      filtered = filtered.filter((pub) => filters.visibility!.includes(pub.visibility));
    }

    if (filters.featured !== undefined) {
      filtered = filtered.filter((pub) => pub.isFeatured === filters.featured);
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
          case "engagement":
            aValue = a.metrics.engagementScore;
            bValue = b.metrics.engagementScore;
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
  }, [publications, filters]);

  // Pagination
  const { totalPages, totalItems } = useMemo(() => {
    const total = filteredPublications.length;
    return {
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      totalItems: total,
    };
  }, [filteredPublications]);

  const paginatedPublications = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPublications.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPublications, currentPage]);

  // Actions
  const refreshData = useCallback(() => {
    void api.refreshData();
  }, [api]);

  const updateFilters = useCallback((newFilters: Partial<PublicationFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  const getPublication = useCallback(
    (id: string): Publication | null => publications.find((pub) => pub.id === id) || null,
    [publications],
  );

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

  // Utility functions
  const exportPublications = useCallback(
    (format: "csv" | "json" | "pdf") => {
      const dataToExport = paginatedPublications.map((pub) => ({
        title: pub.title,
        type: pub.type,
        category: pub.category,
        status: pub.status,
        author: pub.author.name,
        publishedAt: pub.publishedAt,
        views: pub.metrics.views,
        engagement: pub.metrics.engagementScore,
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
          filename = `publications-${new Date().toISOString().split("T")[0]}.csv`;
          break;
        }
        case "json":
        case "pdf": {
          content = JSON.stringify(dataToExport, null, 2);
          mimeType = "application/json";
          filename = `publications-${new Date().toISOString().split("T")[0]}.json`;
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
    [paginatedPublications],
  );

  const importPublications = useCallback(
    async (file: File): Promise<void> => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        logger.info("Imported publications", data);
        refreshData();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to import publications");
      }
    },
    [refreshData],
  );

  return {
    // Data
    publications: paginatedPublications,
    statistics,
    filteredPublications,

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
    getPublication,
    addPublication,
    updatePublication,
    deletePublication,
    duplicatePublication,

    // Status management
    publishPublication,
    archivePublication,
    schedulePublication,
    unpublishPublication,

    // Bulk operations
    bulkPublish,
    bulkArchive,
    bulkDelete,

    // Utility
    exportPublications,
    importPublications,
  };
}
