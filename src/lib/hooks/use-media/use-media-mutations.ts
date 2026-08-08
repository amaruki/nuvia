"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import type {
  Media,
  MediaAnalytics,
  MediaFolder,
  MediaFormData,
  MediaPermission,
  MediaUploadOptions,
} from "@/types/media";

import { apiFetch } from "@/lib/api-client";

import type { MediaUploadRecordDto } from "./types";

interface UseMediaMutationsDeps {
  setMedia: Dispatch<SetStateAction<Media[]>>;
  setSelectedMedia: Dispatch<SetStateAction<string[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  reloadMedia: () => Promise<void>;
}

export function useMediaMutations({
  setMedia,
  setSelectedMedia,
  setError,
  setLoading,
  reloadMedia,
}: UseMediaMutationsDeps) {
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
        await reloadMedia();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [reloadMedia, setError, setLoading],
  );

  const updateMedia = useCallback(async (_id: string, _data: Partial<MediaFormData>) => {
    // Uploads are stored as immutable files (B4 local-disk sub-decision);
    // there is no media table to persist metadata edits in yet.
    throw new Error(
      "Media metadata editing is not available yet: uploads are stored as immutable files until a media table lands.",
    );
  }, []);

  const deleteMedia = useCallback(
    async (id: string) => {
      try {
        await apiFetch<{ id: string; deleted: boolean }>(
          `/api/v1/media/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
          },
        );

        // Remove from state
        setMedia((prev) => prev.filter((item) => item.id !== id));
        setSelectedMedia((prev) => prev.filter((selectedId) => selectedId !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
        throw err;
      }
    },
    [setError, setMedia, setSelectedMedia],
  );

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
  const bulkDelete = useCallback(
    async (ids: string[]): Promise<void> => {
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
    },
    [setError, setMedia, setSelectedMedia],
  );

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

  return {
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
  };
}
