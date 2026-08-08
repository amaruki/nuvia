"use client";

import { useCallback, useEffect, useState } from "react";

import type { Media, MediaFilters, MediaFolder, MediaStatistics } from "@/types/media";

import { apiFetch } from "@/lib/api-client";

import { DEFAULT_PAGE_SIZE } from "./constants";
import { recordToMedia } from "./hydrate-media";
import { applyMediaFilters } from "./media-filters";
import { buildMediaStatistics } from "./media-statistics";
import type { MediaUploadRecordDto, UseMediaReturn } from "./types";
import { useMediaMutations } from "./use-media-mutations";
import { useMediaUtilities } from "./use-media-utilities";

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

  const {
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
  } = useMediaMutations({
    setMedia,
    setSelectedMedia,
    setError,
    setLoading,
    reloadMedia: loadMedia,
  });

  const { exportMedia, importMedia } = useMediaUtilities(setError);

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
