"use client";

/**
 * Chapter write actions: POST /api/v1/chapters and PATCH/DELETE on
 * /api/v1/chapters/:id. Successful responses are folded into the hook's
 * local chapter cache; failures surface a user-facing message and rethrow
 * so callers (forms, modals) can react.
 */

import { useCallback } from "react";

import type { Chapter, ChapterFormData, ChapterStatus } from "@/types/chapter.types";

import { apiFetch } from "@/lib/api-client";
import { logger } from "@/lib/logger";

import { CHAPTERS_API_PATH } from "./constants";
import { toErrorMessage } from "./error-message";
import { hydrateChapter } from "./hydrate-chapter";
import type { WireChapter } from "./types";

export interface UseChapterMutationsDeps {
  /** Applies an update to the cached chapters and recomputes statistics. */
  applyUpdate: (update: (prev: Chapter[]) => Chapter[]) => void;
  /** Surfaces a user-facing error message from a failed action. */
  recordError: (message: string) => void;
}

export function useChapterMutations({ applyUpdate, recordError }: UseChapterMutationsDeps) {
  const addChapter = useCallback(
    async (chapterData: ChapterFormData): Promise<Chapter> => {
      try {
        const envelope = await apiFetch<WireChapter>(CHAPTERS_API_PATH, {
          method: "POST",
          body: JSON.stringify(chapterData),
        });
        const created = hydrateChapter(envelope.data);
        applyUpdate((prev) => [...prev, created]);
        return created;
      } catch (err) {
        recordError(toErrorMessage(err, "Failed to add chapter"));
        logger.error("Error adding chapter", err);
        throw err;
      }
    },
    [applyUpdate, recordError],
  );

  const updateChapter = useCallback(
    async (id: string, chapterData: Partial<ChapterFormData>): Promise<void> => {
      try {
        const envelope = await apiFetch<WireChapter>(`${CHAPTERS_API_PATH}/${id}`, {
          method: "PATCH",
          body: JSON.stringify(chapterData),
        });
        const updated = hydrateChapter(envelope.data);
        applyUpdate((prev) => prev.map((chapter) => (chapter.id === id ? updated : chapter)));
      } catch (err) {
        recordError(toErrorMessage(err, "Failed to update chapter"));
        logger.error("Error updating chapter", err);
        throw err;
      }
    },
    [applyUpdate, recordError],
  );

  const deleteChapter = useCallback(
    async (id: string): Promise<void> => {
      try {
        await apiFetch<{ id: string; deleted: boolean }>(`${CHAPTERS_API_PATH}/${id}`, {
          method: "DELETE",
        });
        applyUpdate((prev) => prev.filter((chapter) => chapter.id !== id));
      } catch (err) {
        recordError(toErrorMessage(err, "Failed to delete chapter"));
        logger.error("Error deleting chapter", err);
        throw err;
      }
    },
    [applyUpdate, recordError],
  );

  const toggleChapterStatus = useCallback(
    async (id: string, status: ChapterStatus): Promise<void> => {
      try {
        const envelope = await apiFetch<WireChapter>(`${CHAPTERS_API_PATH}/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        const updated = hydrateChapter(envelope.data);
        applyUpdate((prev) => prev.map((chapter) => (chapter.id === id ? updated : chapter)));
      } catch (err) {
        recordError(toErrorMessage(err, "Failed to update chapter status"));
        logger.error("Error toggling chapter status", err);
        throw err;
      }
    },
    [applyUpdate, recordError],
  );

  return { addChapter, updateChapter, deleteChapter, toggleChapterStatus };
}
