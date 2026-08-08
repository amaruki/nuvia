"use client";

import { useCallback, useMemo, useState } from "react";

import type { Announcement, AnnouncementFilters } from "@/types/announcement.types";

import {
  useContentCollectionApi,
  type RawContentItem as RawApiItem,
} from "../use-content-collection";

import { buildAnnouncementStatistics } from "./announcement-statistics";
import { DEFAULT_FILTERS, ITEMS_PER_PAGE } from "./constants";
import { hydrateAnnouncement } from "./hydrate-announcement";
import type { UseAnnouncementsReturn } from "./types";
import { useAnnouncementMutations } from "./use-announcement-mutations";
import { useAnnouncementUtilities } from "./use-announcement-utilities";
import { useFilteredAnnouncements } from "./use-filtered-announcements";

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

  const filteredAnnouncements = useFilteredAnnouncements(announcements, filters);

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

  const {
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
  } = useAnnouncementMutations(api, announcements);

  const { exportAnnouncements, importAnnouncements } = useAnnouncementUtilities(
    filteredAnnouncements,
    refreshData,
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
