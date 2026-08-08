"use client";

import { useCallback, useMemo, useState } from "react";

import type { Publication, PublicationFilters } from "@/types/publication.types";

import {
  useContentCollectionApi,
  type RawContentItem as RawApiItem,
} from "../use-content-collection";

import { DEFAULT_FILTERS, ITEMS_PER_PAGE } from "./constants";
import { hydratePublication } from "./hydrate-publication";
import { buildPublicationStatistics } from "./publication-statistics";
import type { UsePublicationsReturn } from "./types";
import { useFilteredPublications } from "./use-filtered-publications";
import { usePublicationMutations } from "./use-publication-mutations";
import { usePublicationUtilities } from "./use-publication-utilities";

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

  const filteredPublications = useFilteredPublications(publications, filters);

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

  const {
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
  } = usePublicationMutations(api, publications);

  const { exportPublications, importPublications } = usePublicationUtilities(
    paginatedPublications,
    refreshData,
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
