"use client";

/**
 * Chapters dashboard hook — real API (backlog D1).
 *
 * Reads /api/v1/chapters through apiFetch (docs/api/conventions.md) and
 * keeps the exact surface the mock-era hook served the dashboard pages:
 * client-side filtering, derived statistics, and optimistic state updates
 * fed by the server's responses. Dates arrive as ISO strings over JSON and
 * are hydrated at the wire boundary (hydrate-chapter.ts).
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  Chapter,
  ChapterFilterOptions,
  ChapterOverallStatistics,
} from "@/types/chapter.types";

import { logger } from "@/lib/logger";

import { applyChapterFilters } from "./chapter-filters";
import { computeChapterStatistics } from "./chapter-statistics";
import { CHAPTERS_API_PATH } from "./constants";
import { toErrorMessage } from "./error-message";
import { hydrateChapter } from "./hydrate-chapter";
import type { WireChapter } from "./types";
import { useChapterMutations } from "./use-chapter-mutations";
import { fetchAllPages } from "../fetch-all-pages";

export { hydrateChapter } from "./hydrate-chapter";
export type { WireChapter } from "./types";

export function useChapters() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [statistics, setStatistics] = useState<ChapterOverallStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ChapterFilterOptions>({});

  const applyChapters = useCallback((next: Chapter[]) => {
    setChapters(next);
    setStatistics(computeChapterStatistics(next));
  }, []);

  const applyChapterUpdate = useCallback((update: (prev: Chapter[]) => Chapter[]) => {
    setChapters((prev) => {
      const next = update(prev);
      setStatistics(computeChapterStatistics(next));
      return next;
    });
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      // Drain every page (UI-09 C3): overview, leadership, analytics and
      // the detail page all need the full chapter set, not a 100-row cap.
      const wires = await fetchAllPages<WireChapter>(CHAPTERS_API_PATH);
      applyChapters(wires.map(hydrateChapter));
      setError(null);
    } catch (err) {
      setError(toErrorMessage(err, "Failed to load chapter data"));
      logger.error("Error loading chapter data", err);
    } finally {
      setLoading(false);
    }
  }, [applyChapters]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  // Client-side filtering (the API accepts the same filters server-side).
  const filteredChapters = useMemo(
    () => applyChapterFilters(chapters, filters),
    [chapters, filters],
  );

  const updateFilters = useCallback((newFilters: Partial<ChapterFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const recordError = useCallback((message: string) => {
    setError(message);
  }, []);

  const { addChapter, updateChapter, deleteChapter, toggleChapterStatus } = useChapterMutations({
    applyUpdate: applyChapterUpdate,
    recordError,
  });

  return {
    chapters: filteredChapters,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    addChapter,
    updateChapter,
    deleteChapter,
    toggleChapterStatus,
  };
}
