"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import { apiFetch } from "@/lib/api-client";

import type { MediaUploadRecordDto } from "./types";

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useMediaUtilities(setError: Dispatch<SetStateAction<string | null>>) {
  // Export the real upload manifest (backlog F2): JSON is the API payload;
  // CSV flattens the same records. There is no server-side export endpoint.
  const exportMedia = useCallback(
    async (format: "csv" | "json") => {
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
    },
    [setError],
  );

  const importMedia = useCallback(async (_file: File) => {
    throw new Error("Media import is not available yet: use the upload dialog to add files.");
  }, []);

  return { exportMedia, importMedia };
}
