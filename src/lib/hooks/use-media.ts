"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Media,
  MediaFolder,
  MediaStatistics,
  MediaFilters,
  MediaFormData,
  MediaUploadOptions,
  MediaPermission,
  MediaAnalytics,
  MediaType,
  MediaStatus,
  MediaVisibility,
} from "@/types/media.types";

import { apiFetch } from "@/lib/api-client";

/** Shape returned by POST /api/v1/media (see media-upload.service.ts). */
interface MediaUploadRecordDto {
  id: string;
  filename: string;
  originalName: string;
  contentType: string;
  size: number;
  checksum: string;
  storagePath: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

const DEFAULT_PAGE_SIZE = 12;

function mediaTypeFromContentType(contentType: string): MediaType {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType === "application/pdf") return "pdf";
  if (contentType.includes("spreadsheet") || contentType.includes("excel")) return "spreadsheet";
  if (contentType.includes("presentation") || contentType.includes("powerpoint")) {
    return "presentation";
  }
  if (contentType === "application/zip") return "archive";
  return "document";
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = size;
  let unit = -1;
  do {
    value /= 1024;
    unit += 1;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value.toFixed(1)} ${units[unit]}`;
}

/** Map an API upload record onto the UI Media shape. */
function recordToMedia(record: MediaUploadRecordDto): Media {
  const createdAt = new Date(record.uploadedAt);
  return {
    id: record.id,
    title: record.originalName,
    slug: record.filename,
    description: "",
    type: mediaTypeFromContentType(record.contentType),
    status: "ready",
    visibility: "private",
    url: record.url,
    tags: [],
    categories: [],
    metadata: {
      originalName: record.originalName,
      fileName: record.filename,
      fileExtension: record.originalName.split(".").pop() ?? "",
      mimeType: record.contentType,
      size: record.size,
      sizeFormatted: formatBytes(record.size),
      checksum: record.checksum,
    },
    currentVersion: 1,
    versions: [],
    usage: [],
    permissions: [],
    analytics: [],
    storageType: "local",
    storagePath: record.storagePath,
    isOptimized: false,
    createdAt,
    updatedAt: createdAt,
    createdBy: record.uploadedBy,
    isFeatured: false,
    priority: 50,
  };
}

/**
 * Client-side filtering of the real upload manifest (backlog F2): only fields
 * that actually exist on uploaded records are filterable — there is no search
 * index, folder store, or tag store yet.
 */
function applyMediaFilters(items: Media[], filters: MediaFilters): Media[] {
  let result = items;

  if (filters.search) {
    const needle = filters.search.toLowerCase();
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.description?.toLowerCase().includes(needle),
    );
  }
  if (filters.type && filters.type.length > 0) {
    result = result.filter((item) => filters.type!.includes(item.type));
  }
  if (filters.status && filters.status.length > 0) {
    result = result.filter((item) => filters.status!.includes(item.status));
  }
  if (filters.visibility && filters.visibility.length > 0) {
    result = result.filter((item) => filters.visibility!.includes(item.visibility));
  }
  if (filters.createdBy && filters.createdBy.length > 0) {
    result = result.filter((item) => filters.createdBy!.includes(item.createdBy));
  }
  if (filters.dateRange) {
    const start = filters.dateRange.start.getTime();
    const end = filters.dateRange.end.getTime();
    result = result.filter((item) => {
      const created = new Date(item.createdAt).getTime();
      return created >= start && created <= end;
    });
  }
  if (filters.sizeRange) {
    const { min, max } = filters.sizeRange;
    result = result.filter((item) => item.metadata.size >= min && item.metadata.size <= max);
  }

  const sortBy = filters.sortBy ?? "createdAt";
  const sortOrder = filters.sortOrder ?? "desc";
  const sortValue = (item: Media): string | number => {
    switch (sortBy) {
      case "title":
        return item.title.toLowerCase();
      case "size":
        return item.metadata.size;
      case "type":
        return item.type;
      case "updatedAt":
        return new Date(item.updatedAt).getTime();
      case "views":
      case "downloads":
      case "usage":
        // No usage-analytics store exists yet; every record honestly ties.
        return 0;
      default:
        return new Date(item.createdAt).getTime();
    }
  };
  result = [...result].sort((a, b) => {
    const left = sortValue(a);
    const right = sortValue(b);
    const comparison = left < right ? -1 : left > right ? 1 : 0;
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return result;
}

/**
 * Statistics derived from the real upload manifest (backlog F2). Usage
 * metrics, top performers and monthly trends have no backing store yet and
 * are honestly zero/empty.
 */
function buildMediaStatistics(items: Media[]): MediaStatistics {
  const totalMedia = items.length;
  const totalSize = items.reduce((sum, item) => sum + item.metadata.size, 0);
  // Percentages are only computed for buckets that exist, which implies
  // totalMedia > 0.
  const byType: Record<string, { count: number; size: number }> = {};
  const byStatus: Record<string, number> = {};
  const byVisibility: Record<string, number> = {};
  for (const item of items) {
    const entry = byType[item.type] ?? { count: 0, size: 0 };
    entry.count += 1;
    entry.size += item.metadata.size;
    byType[item.type] = entry;
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    byVisibility[item.visibility] = (byVisibility[item.visibility] ?? 0) + 1;
  }

  return {
    totalMedia,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    mediaByType: Object.entries(byType).map(([type, entry]) => ({
      type: type as MediaType,
      count: entry.count,
      size: entry.size,
      sizeFormatted: formatBytes(entry.size),
      percentage: Math.round((entry.count / totalMedia) * 100),
    })),
    mediaByStatus: Object.entries(byStatus).map(([status, count]) => ({
      status: status as MediaStatus,
      count,
      percentage: Math.round((count / totalMedia) * 100),
    })),
    mediaByVisibility: Object.entries(byVisibility).map(([visibility, count]) => ({
      visibility: visibility as MediaVisibility,
      count,
      percentage: Math.round((count / totalMedia) * 100),
    })),
    // B4's local-disk store is the only storage backend; cloud buckets are
    // honestly zero.
    storageUsage: { local: totalSize, s3: 0, cloudinary: 0, azure: 0, gcs: 0 },
    // No analytics store exists yet (no media table), so usage metrics are
    // honest zeros.
    totalViews: 0,
    totalDownloads: 0,
    totalUsage: 0,
    recentUploads: [...items]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        size: item.metadata.size,
        uploadedBy: item.createdBy,
        uploadedAt: new Date(item.createdAt),
      })),
    topPerforming: [],
    monthlyTrends: [],
  };
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

interface UseMediaReturn {
  // State
  media: Media[];
  folders: MediaFolder[];
  statistics: MediaStatistics | null;
  loading: boolean;
  error: string | null;
  filters: MediaFilters;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  selectedMedia: string[];

  // Actions
  uploadMedia: (files: File[], options?: MediaUploadOptions) => Promise<void>;
  updateMedia: (id: string, data: Partial<MediaFormData>) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
  duplicateMedia: (id: string) => Promise<void>;

  // Version management
  createVersion: (mediaId: string, file: File, changelog?: string) => Promise<void>;
  restoreVersion: (mediaId: string, versionId: string) => Promise<void>;
  deleteVersion: (mediaId: string, versionId: string) => Promise<void>;

  // Folder management
  createFolder: (data: Omit<MediaFolder, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateFolder: (id: string, data: Partial<MediaFolder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Permission management
  grantPermission: (
    mediaId: string,
    permission: Omit<MediaPermission, "id" | "grantedAt">,
  ) => Promise<void>;
  revokePermission: (permissionId: string) => Promise<void>;

  // Analytics
  getAnalytics: (
    mediaId: string,
    dateRange?: { start: Date; end: Date },
  ) => Promise<MediaAnalytics[]>;

  // Bulk operations
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkUpdate: (ids: string[], data: Partial<MediaFormData>) => Promise<void>;
  bulkMove: (ids: string[], folderId: string) => Promise<void>;

  // Import/Export
  exportMedia: (format: "csv" | "json") => Promise<void>;
  importMedia: (file: File) => Promise<void>;

  // Filter and pagination
  updateFilters: (filters: Partial<MediaFilters>) => void;
  clearFilters: () => void;
  refreshData: () => Promise<void>;

  // Selection
  setSelectedMedia: (ids: string[]) => void;
  toggleMediaSelection: (id: string) => void;
  clearSelection: () => void;
}

export const useMedia = (): UseMediaReturn => {
  // State management
  const [media, setMedia] = useState<Media[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [statistics, setStatistics] = useState<MediaStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MediaFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    loadMedia();
    loadFolders();
    loadStatistics();
  }, [filters]);

  // Load media from the real upload manifest (backlog F2). Filtering, sorting
  // and pagination happen client-side because B4's local-disk store has no
  // search endpoint yet.
  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const envelope = await apiFetch<MediaUploadRecordDto[]>("/api/v1/media");
      const all = (envelope.data ?? []).map(recordToMedia);
      const filtered = applyMediaFilters(all, filters);

      const limit = filters.limit ?? DEFAULT_PAGE_SIZE;
      const pages = Math.max(1, Math.ceil(filtered.length / limit));
      const page = Math.min(filters.page ?? 1, pages);

      setMedia(filtered.slice((page - 1) * limit, page * limit));
      setCurrentPage(page);
      setTotalPages(pages);
      setTotalItems(filtered.length);
      setStatistics(buildMediaStatistics(all));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Folders have no backing store until a media table lands; the sidebar
  // honestly renders empty (backlog F2).
  const loadFolders = useCallback(async () => {
    setFolders([]);
  }, []);

  // Statistics are derived from the real upload manifest inside loadMedia;
  // there is no separate statistics endpoint (backlog F2).
  const loadStatistics = useCallback(async () => {}, []);

  // CRUD operations
  const uploadMedia = useCallback(
    async (files: File[], options?: MediaUploadOptions) => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        for (const file of files) formData.append("file", file);
        if (options) formData.append("options", JSON.stringify(options));

        await apiFetch<MediaUploadRecordDto[]>("/api/v1/media", {
          method: "POST",
          body: formData,
        });

        // Re-read the manifest so state, pagination and statistics reflect
        // the real store.
        await loadMedia();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadMedia],
  );

  const updateMedia = useCallback(async (_id: string, _data: Partial<MediaFormData>) => {
    // Uploads are stored as immutable files (B4 local-disk sub-decision);
    // there is no media table to persist metadata edits in yet.
    throw new Error(
      "Media metadata editing is not available yet: uploads are stored as immutable files until a media table lands.",
    );
  }, []);

  const deleteMedia = useCallback(async (id: string) => {
    try {
      await apiFetch<{ id: string; deleted: boolean }>(`/api/v1/media/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      // Remove from state
      setMedia((prev) => prev.filter((item) => item.id !== id));
      setSelectedMedia((prev) => prev.filter((selectedId) => selectedId !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      throw err;
    }
  }, []);

  const duplicateMedia = useCallback(async (_id: string) => {
    // No backing store beyond the upload manifest; duplicating a file would
    // invent a record that does not exist on disk.
    throw new Error(
      "Media duplication is not available yet: uploads are stored as immutable files until a media table lands.",
    );
  }, []);

  // Version management — no version store exists beyond the upload manifest
  // (backlog B4), so these fail loudly instead of faking versions.
  const createVersion = useCallback(async (_mediaId: string, _file: File, _changelog?: string) => {
    throw new Error(
      "Media versions are not available yet: uploads are stored as immutable files until a media table lands.",
    );
  }, []);

  const restoreVersion = useCallback(async (_mediaId: string, _versionId: string) => {
    throw new Error(
      "Media versions are not available yet: uploads are stored as immutable files until a media table lands.",
    );
  }, []);

  const deleteVersion = useCallback(async (_mediaId: string, _versionId: string) => {
    throw new Error(
      "Media versions are not available yet: uploads are stored as immutable files until a media table lands.",
    );
  }, []);

  // Folder management — no folder store exists yet (backlog B4), so these
  // fail loudly instead of faking folders.
  const createFolder = useCallback(
    async (_data: Omit<MediaFolder, "id" | "createdAt" | "updatedAt">) => {
      throw new Error(
        "Media folders are not available yet: there is no folder store until a media table lands.",
      );
    },
    [],
  );

  const updateFolder = useCallback(async (_id: string, _data: Partial<MediaFolder>) => {
    throw new Error(
      "Media folders are not available yet: there is no folder store until a media table lands.",
    );
  }, []);

  const deleteFolder = useCallback(async (_id: string) => {
    throw new Error(
      "Media folders are not available yet: there is no folder store until a media table lands.",
    );
  }, []);

  // Permission management — no media permission module exists yet, so these
  // fail loudly instead of faking grants (backlog F2).
  const grantPermission = useCallback(
    async (_mediaId: string, _permission: Omit<MediaPermission, "id" | "grantedAt">) => {
      throw new Error(
        "Media permissions are not available yet: there is no media permission store until a media table lands.",
      );
    },
    [],
  );

  const revokePermission = useCallback(async (_permissionId: string) => {
    throw new Error(
      "Media permissions are not available yet: there is no media permission store until a media table lands.",
    );
  }, []);

  // Analytics — no analytics store exists yet (backlog B4), so the honest
  // answer is an empty series.
  const getAnalytics = useCallback(
    async (_mediaId: string, _dateRange?: { start: Date; end: Date }) => {
      return [] as MediaAnalytics[];
    },
    [],
  );

  // Bulk operations
  const bulkDelete = useCallback(async (ids: string[]): Promise<void> => {
    try {
      // Fire deletes in parallel and settle every attempt before reporting:
      // a sequential loop would abandon the remaining items on the first
      // failure. Successful deletes must still land (and leave local state)
      // when other items fail, so failures are aggregated into a single error
      // thrown only after all attempts.
      const results = await Promise.allSettled(
        ids.map((id) =>
          apiFetch<{ id: string; deleted: boolean }>(`/api/v1/media/${encodeURIComponent(id)}`, {
            method: "DELETE",
          }),
        ),
      );

      // O(1) membership so both state cleanups below stay linear in state size.
      const deletedIds = new Set(ids);

      // Remove from state
      setMedia((prev) => prev.filter((item) => !deletedIds.has(item.id)));
      setSelectedMedia((prev) => prev.filter((id) => !deletedIds.has(id)));

      const failed = results.filter(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      );
      if (failed.length > 0) {
        throw new AggregateError(
          failed.map((result) => result.reason),
          `${failed.length} of ${ids.length} media item(s) failed to delete`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk delete failed");
      throw err;
    }
  }, []);

  const bulkUpdate = useCallback(async (_ids: string[], _data: Partial<MediaFormData>) => {
    throw new Error(
      "Media metadata editing is not available yet: uploads are stored as immutable files until a media table lands.",
    );
  }, []);

  const bulkMove = useCallback(async (_ids: string[], _folderId: string) => {
    throw new Error(
      "Media folders are not available yet: there is no folder store until a media table lands.",
    );
  }, []);

  // Import/Export
  // Export the real upload manifest (backlog F2): JSON is the API payload;
  // CSV flattens the same records. There is no server-side export endpoint.
  const exportMedia = useCallback(async (format: "csv" | "json") => {
    try {
      const envelope = await apiFetch<MediaUploadRecordDto[]>("/api/v1/media");
      const records = envelope.data ?? [];

      let content: string;
      let mimeType: string;
      if (format === "json") {
        content = JSON.stringify(records, null, 2);
        mimeType = "application/json";
      } else {
        const header =
          "id,filename,originalName,contentType,size,checksum,storagePath,url,uploadedBy,uploadedAt";
        const rows = records.map((record) =>
          [
            record.id,
            record.filename,
            record.originalName,
            record.contentType,
            String(record.size),
            record.checksum,
            record.storagePath,
            record.url,
            record.uploadedBy,
            record.uploadedAt,
          ]
            .map((value) => JSON.stringify(value))
            .join(","),
        );
        content = [header, ...rows].join("\n");
        mimeType = "text/csv";
      }

      downloadFile(`media-export.${format}`, content, mimeType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
      throw err;
    }
  }, []);

  const importMedia = useCallback(async (_file: File) => {
    throw new Error("Media import is not available yet: use the upload dialog to add files.");
  }, []);

  // Filter and pagination
  const updateFilters = useCallback((newFilters: Partial<MediaFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([loadMedia(), loadFolders(), loadStatistics()]);
  }, [loadMedia, loadFolders, loadStatistics]);

  // Selection management
  const toggleMediaSelection = useCallback((id: string) => {
    setSelectedMedia((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id],
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMedia([]);
  }, []);

  return {
    // State
    media,
    folders,
    statistics,
    loading,
    error,
    filters,
    currentPage,
    totalPages,
    totalItems,
    selectedMedia,

    // Actions
    uploadMedia,
    updateMedia,
    deleteMedia,
    duplicateMedia,
    createVersion,
    restoreVersion,
    deleteVersion,
    createFolder,
    updateFolder,
    deleteFolder,
    grantPermission,
    revokePermission,
    getAnalytics,
    bulkDelete,
    bulkUpdate,
    bulkMove,
    exportMedia,
    importMedia,

    // Filter and pagination
    updateFilters,
    clearFilters,
    refreshData,

    // Selection
    setSelectedMedia,
    toggleMediaSelection,
    clearSelection,
  };
};
