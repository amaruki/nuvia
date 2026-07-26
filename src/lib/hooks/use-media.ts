"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Media,
  MediaFolder,
  MediaStatistics,
  MediaFilters,
  MediaFormData,
  MediaUploadOptions,
  MediaVersion,
  MediaPermission,
  MediaAnalytics,
  MediaType,
  MediaStatus,
  MediaVisibility,
} from "@/types/media.types";

// Mock service imports - will be replaced with actual service
import { MediaService } from "@/lib/services/media.service";

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

  // Load media based on filters
  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await MediaService.getMedia(filters);
      setMedia(result.data.media);
      setCurrentPage(result.data.page);
      setTotalPages(result.data.totalPages);
      setTotalItems(result.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load folders
  const loadFolders = useCallback(async () => {
    try {
      const result = await MediaService.getFolders();
      setFolders(result.data);
    } catch (err) {
      console.error("Failed to load folders:", err);
    }
  }, []);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const result = await MediaService.getStatistics();
      setStatistics(result.data);
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  }, []);

  // CRUD operations
  const uploadMedia = useCallback(
    async (files: File[], options?: MediaUploadOptions) => {
      setLoading(true);
      setError(null);

      try {
        const uploadPromises = files.map((file) =>
          MediaService.createMedia({
            title: file.name,
            type: "image", // Default type, should be determined from file
            description: "",
            visibility: options?.visibility || "private",
            size: file.size,
            format: file.name.split(".").pop() || "",
            mimeType: file.type,
            uploadedBy: "current_user",
          }),
        );
        const responses = await Promise.all(uploadPromises);
        const results = responses.map((response) => response.data);

        // Add new media to state
        setMedia((prev) => [...results, ...prev]);

        // Refresh statistics
        await loadStatistics();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadStatistics],
  );

  const updateMedia = useCallback(
    async (id: string, data: Partial<MediaFormData>) => {
      try {
        const response = await MediaService.updateMedia(id, data);
        const updatedMedia = response.data;

        // Update media in state
        setMedia((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedMedia } : item)),
        );

        // Refresh statistics
        await loadStatistics();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
        throw err;
      }
    },
    [loadStatistics],
  );

  const deleteMedia = useCallback(
    async (id: string) => {
      try {
        await MediaService.deleteMedia(id);

        // Remove from state
        setMedia((prev) => prev.filter((item) => item.id !== id));
        setSelectedMedia((prev) => prev.filter((selectedId) => selectedId !== id));

        // Refresh statistics
        await loadStatistics();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
        throw err;
      }
    },
    [loadStatistics],
  );

  const duplicateMedia = useCallback(
    async (id: string) => {
      try {
        const response = await MediaService.duplicateMedia(id);
        const duplicatedMedia = response.data;

        // Add to state
        setMedia((prev) => [duplicatedMedia, ...prev]);

        // Refresh statistics
        await loadStatistics();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Duplicate failed");
        throw err;
      }
    },
    [loadStatistics],
  );

  // Version management
  const createVersion = useCallback(async (mediaId: string, file: File, changelog?: string) => {
    try {
      const response = await MediaService.createMediaVersion(mediaId, {
        url: URL.createObjectURL(file),
        metadata: {
          size: file.size,
          originalName: file.name,
          fileName: file.name,
          fileExtension: file.name.split(".").pop() || "",
          mimeType: file.type,
          sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          checksum: `checksum_${Date.now()}`,
          customFields: {},
        },
      });
      const newVersion = response.data;

      // Update media versions in state
      setMedia((prev) =>
        prev.map((item) =>
          item.id === mediaId
            ? {
                ...item,
                versions: [...item.versions, newVersion],
                currentVersion: newVersion.version,
              }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Version creation failed");
      throw err;
    }
  }, []);

  const restoreVersion = useCallback(async (mediaId: string, versionId: string) => {
    try {
      // This method doesn't exist in MediaService, so we'll implement a basic version
      const mediaResponse = await MediaService.getMediaById(mediaId);
      const media = mediaResponse.data;

      // Find the version to restore
      const versionResponse = await MediaService.getMediaVersions(mediaId);
      const version = versionResponse.data.find((v) => v.id === versionId);

      if (!version) {
        throw new Error("Version not found");
      }

      // Update media with version data
      const updatedMediaResponse = await MediaService.updateMedia(mediaId, {
        url: version.url,
        thumbnailUrl: version.thumbnailUrl,
      });
      const updatedMedia = updatedMediaResponse.data;

      // Update media in state
      setMedia((prev) => prev.map((item) => (item.id === mediaId ? updatedMedia : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Version restore failed");
      throw err;
    }
  }, []);

  const deleteVersion = useCallback(async (mediaId: string, versionId: string) => {
    try {
      // This method doesn't exist in MediaService, so we'll implement a basic version
      // Get current versions
      const versionResponse = await MediaService.getMediaVersions(mediaId);
      const versions = versionResponse.data;

      // Filter out the version to delete
      const updatedVersions = versions.filter((v) => v.id !== versionId);

      // Update media with filtered versions
      const mediaResponse = await MediaService.getMediaById(mediaId);
      const media = mediaResponse.data;

      // Update media versions in state
      setMedia((prev) =>
        prev.map((item) =>
          item.id === mediaId
            ? {
                ...item,
                versions: updatedVersions,
              }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Version delete failed");
      throw err;
    }
  }, []);

  // Folder management
  const createFolder = useCallback(
    async (data: Omit<MediaFolder, "id" | "createdAt" | "updatedAt">) => {
      try {
        const response = await MediaService.createFolder(data);
        const newFolder = response.data;

        // Add to state
        setFolders((prev) => [...prev, newFolder]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Folder creation failed");
        throw err;
      }
    },
    [],
  );

  const updateFolder = useCallback(async (id: string, data: Partial<MediaFolder>) => {
    try {
      const response = await MediaService.updateFolder(id, data);
      const updatedFolder = response.data;

      // Update in state
      setFolders((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updatedFolder } : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Folder update failed");
      throw err;
    }
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    try {
      await MediaService.deleteFolder(id);

      // Remove from state
      setFolders((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Folder delete failed");
      throw err;
    }
  }, []);

  // Permission management
  const grantPermission = useCallback(
    async (mediaId: string, permission: Omit<MediaPermission, "id" | "grantedAt">) => {
      try {
        // This method doesn't exist in MediaService, so we'll implement a basic version
        const newPermission: MediaPermission = {
          id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          mediaId,
          entityType: permission.entityType,
          entityId: permission.entityId,
          entityName: permission.entityName,
          permissions: permission.permissions,
          grantedAt: new Date(),
          grantedBy: "current_user",
          expiresAt: permission.expiresAt,
        };

        // Update media permissions in state
        setMedia((prev) =>
          prev.map((item) =>
            item.id === mediaId
              ? {
                  ...item,
                  permissions: [...item.permissions, newPermission],
                }
              : item,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Permission grant failed");
        throw err;
      }
    },
    [],
  );

  const revokePermission = useCallback(async (permissionId: string) => {
    try {
      // This method doesn't exist in MediaService, so we'll implement a basic version
      // Remove permission from all media
      setMedia((prev) =>
        prev.map((item) => ({
          ...item,
          permissions: item.permissions.filter((p) => p.id !== permissionId),
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Permission revoke failed");
      throw err;
    }
  }, []);

  // Analytics
  const getAnalytics = useCallback(
    async (mediaId: string, dateRange?: { start: Date; end: Date }) => {
      try {
        const response = await MediaService.getMediaAnalytics(mediaId);
        const analytics = response.data;

        // Update media analytics in state
        setMedia((prev) =>
          prev.map((item) => (item.id === mediaId ? { ...item, analytics: [analytics] } : item)),
        );

        return [analytics];
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analytics fetch failed");
        throw err;
      }
    },
    [],
  );

  // Bulk operations
  const bulkDelete = useCallback(
    async (ids: string[]) => {
      try {
        await MediaService.bulkDeleteMedia(ids);

        // Remove from state
        setMedia((prev) => prev.filter((item) => !ids.includes(item.id)));
        setSelectedMedia((prev) => prev.filter((id) => !ids.includes(id)));

        // Refresh statistics
        await loadStatistics();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bulk delete failed");
        throw err;
      }
    },
    [loadStatistics],
  );

  const bulkUpdate = useCallback(
    async (ids: string[], data: Partial<MediaFormData>) => {
      try {
        const response = await MediaService.bulkUpdateMedia(ids, data);
        const updatedItems = response.data;

        // Update in state
        setMedia((prev) =>
          prev.map((item) => {
            const updatedItem = updatedItems.find((updated: any) => updated.id === item.id);
            return updatedItem ? { ...item, ...updatedItem } : item;
          }),
        );

        // Refresh statistics
        await loadStatistics();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bulk update failed");
        throw err;
      }
    },
    [loadStatistics],
  );

  const bulkMove = useCallback(async (ids: string[], folderId: string) => {
    try {
      await MediaService.bulkMoveMedia(ids, folderId);

      // Update in state
      setMedia((prev) =>
        prev.map((item) => (ids.includes(item.id) ? { ...item, folderId } : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk move failed");
      throw err;
    }
  }, []);

  // Import/Export
  const exportMedia = useCallback(
    async (format: "csv" | "json") => {
      try {
        await MediaService.exportMedia(format, filters);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Export failed");
        throw err;
      }
    },
    [filters],
  );

  const importMedia = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);

      try {
        await MediaService.importMedia(file);

        // Refresh data
        await loadMedia();
        await loadStatistics();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadMedia, loadStatistics],
  );

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
