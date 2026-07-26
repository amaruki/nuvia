"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Publication,
  PublicationStatistics,
  PublicationFilters,
  PublicationFormData,
  PublicationStatus,
  PublicationType,
  PublicationCategory,
} from "@/types/publication.types";
import { mockPublications, mockStatistics } from "@/lib/data/mock-publication-data";

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

export function usePublications(): UsePublicationsReturn {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [statistics, setStatistics] = useState<PublicationStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PublicationFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setPublications(mockPublications);
        setStatistics(mockStatistics);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load publications");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter and sort publications
  const filteredPublications = useMemo(() => {
    let filtered = [...publications];

    // Search filter
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

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((pub) => filters.status!.includes(pub.status));
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter((pub) => filters.type!.includes(pub.type));
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((pub) => filters.category!.includes(pub.category));
    }

    // Author filter
    if (filters.author && filters.author.length > 0) {
      filtered = filtered.filter(
        (pub) =>
          filters.author!.includes(pub.author.id) ||
          pub.coAuthors?.some((coAuthor) => filters.author!.includes(coAuthor.id)),
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((pub) => pub.tags.some((tag) => filters.tags!.includes(tag.id)));
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter((pub) => {
        const pubDate = pub.publishedAt || pub.scheduledFor || pub.lastModified;
        return pubDate >= filters.dateRange!.start && pubDate <= filters.dateRange!.end;
      });
    }

    // Visibility filter
    if (filters.visibility && filters.visibility.length > 0) {
      filtered = filtered.filter((pub) => filters.visibility!.includes(pub.visibility));
    }

    // Featured filter
    if (filters.featured !== undefined) {
      filtered = filtered.filter((pub) => pub.isFeatured === filters.featured);
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
  const { totalPages, totalItems, itemsPerPage } = useMemo(() => {
    const total = filteredPublications.length;
    const pages = Math.ceil(total / ITEMS_PER_PAGE);

    return {
      totalPages: pages,
      totalItems: total,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  }, [filteredPublications]);

  // Paginated publications
  const paginatedPublications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPublications.slice(startIndex, endIndex);
  }, [filteredPublications, currentPage, itemsPerPage]);

  // Actions
  const refreshData = useCallback(() => {
    setLoading(true);
    setError(null);

    // Simulate API refresh
    setTimeout(() => {
      setPublications(mockPublications);
      setStatistics(mockStatistics);
      setLoading(false);
    }, 500);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<PublicationFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  // Get single publication
  const getPublication = useCallback(
    (id: string): Publication | null => {
      return publications.find((pub) => pub.id === id) || null;
    },
    [publications],
  );

  // CRUD operations
  const addPublication = useCallback(async (data: PublicationFormData): Promise<Publication> => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newPublication: Publication = {
        id: `pub_${Date.now()}`,
        title: data.title,
        slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        excerpt: data.excerpt,
        content: data.content,
        type: data.type,
        category: data.category,
        status: data.status,
        author:
          mockPublications.find((p) => p.author.id === data.authorId)?.author ||
          mockPublications[0].author,
        tags: mockPublications[0].tags.filter((tag) => data.tagIds.includes(tag.id)),
        publishedAt: data.status === "published" ? new Date() : undefined,
        scheduledFor: data.status === "scheduled" ? data.scheduledFor : undefined,
        lastModified: new Date(),
        readTime: Math.ceil(data.content.split(" ").length / 200), // Rough estimate
        wordCount: data.content.split(" ").length,
        difficulty: data.difficulty,
        seo: data.seo,
        metrics: {
          views: 0,
          downloads: 0,
          shares: 0,
          comments: 0,
          likes: 0,
          bookmarks: 0,
          averageReadTime: 0,
          bounceRate: 0,
          engagementScore: 0,
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

      setPublications((prev) => [newPublication, ...prev]);
      return newPublication;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create publication");
    }
  }, []);

  const updatePublication = useCallback(
    async (id: string, data: Partial<PublicationFormData>): Promise<Publication> => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setPublications((prev) =>
          prev.map((pub) => {
            if (pub.id === id) {
              return {
                ...pub,
                ...data,
                lastModified: new Date(),
                publishedAt:
                  data.status === "published" && pub.status !== "published"
                    ? new Date()
                    : pub.publishedAt,
                scheduledFor: data.status === "scheduled" ? data.scheduledFor : pub.scheduledFor,
              } as Publication;
            }
            return pub;
          }),
        );

        const updated = publications.find((pub) => pub.id === id);
        if (!updated) throw new Error("Publication not found");
        return updated;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to update publication");
      }
    },
    [publications],
  );

  const deletePublication = useCallback(async (id: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPublications((prev) => prev.filter((pub) => pub.id !== id));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete publication");
    }
  }, []);

  const duplicatePublication = useCallback(
    async (id: string): Promise<Publication> => {
      try {
        const original = publications.find((pub) => pub.id === id);
        if (!original) throw new Error("Publication not found");

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const duplicated: Publication = {
          ...original,
          id: `pub_${Date.now()}`,
          title: `${original.title} (Copy)`,
          slug: `${original.slug}-copy`,
          status: "draft",
          publishedAt: undefined,
          scheduledFor: undefined,
          lastModified: new Date(),
          version: 1,
          metrics: {
            views: 0,
            downloads: 0,
            shares: 0,
            comments: 0,
            likes: 0,
            bookmarks: 0,
            averageReadTime: 0,
            bounceRate: 0,
            engagementScore: 0,
          },
        };

        setPublications((prev) => [duplicated, ...prev]);
        return duplicated;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to duplicate publication");
      }
    },
    [publications],
  );

  // Status management
  const publishPublication = useCallback(
    async (id: string): Promise<void> => {
      await updatePublication(id, { status: "published", publishedAt: new Date() });
    },
    [updatePublication],
  );

  const archivePublication = useCallback(
    async (id: string): Promise<void> => {
      await updatePublication(id, { status: "archived" });
    },
    [updatePublication],
  );

  const schedulePublication = useCallback(
    async (id: string, date: Date): Promise<void> => {
      await updatePublication(id, { status: "scheduled", scheduledFor: date });
    },
    [updatePublication],
  );

  const unpublishPublication = useCallback(
    async (id: string): Promise<void> => {
      await updatePublication(id, { status: "draft" });
    },
    [updatePublication],
  );

  // Bulk operations
  const bulkPublish = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setPublications((prev) =>
        prev.map((pub) => {
          if (ids.includes(pub.id)) {
            return {
              ...pub,
              status: "published" as PublicationStatus,
              publishedAt: new Date(),
              lastModified: new Date(),
            };
          }
          return pub;
        }),
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to bulk publish");
    }
  }, []);

  const bulkArchive = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setPublications((prev) =>
        prev.map((pub) => {
          if (ids.includes(pub.id)) {
            return {
              ...pub,
              status: "archived" as PublicationStatus,
              lastModified: new Date(),
            };
          }
          return pub;
        }),
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to bulk archive");
    }
  }, []);

  const bulkDelete = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setPublications((prev) => prev.filter((pub) => !ids.includes(pub.id)));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to bulk delete");
    }
  }, []);

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
          filename = `publications-${new Date().toISOString().split("T")[0]}.csv`;
          break;
        case "json":
          content = JSON.stringify(dataToExport, null, 2);
          mimeType = "application/json";
          filename = `publications-${new Date().toISOString().split("T")[0]}.json`;
          break;
        case "pdf":
          // In a real app, you'd use a PDF library
          content = JSON.stringify(dataToExport, null, 2);
          mimeType = "application/json";
          filename = `publications-${new Date().toISOString().split("T")[0]}.json`;
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
    [paginatedPublications],
  );

  const importPublications = useCallback(
    async (file: File): Promise<void> => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // In a real app, you'd validate and process the imported data
        console.log("Imported publications:", data);

        // Simulate processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Refresh data after import
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
