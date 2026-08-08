"use client";

import { useCallback } from "react";

import type { Publication } from "@/types/publication.types";

import { logger } from "@/lib/logger";

export function usePublicationUtilities(
  paginatedPublications: Publication[],
  refreshData: () => void,
) {
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
        case "csv": {
          const headers = Object.keys(dataToExport[0] ?? {}).join(",");
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
        }
        case "json":
        case "pdf": {
          content = JSON.stringify(dataToExport, null, 2);
          mimeType = "application/json";
          filename = `publications-${new Date().toISOString().split("T")[0]}.json`;
          break;
        }
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
        logger.info("Imported publications", data);
        refreshData();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to import publications");
      }
    },
    [refreshData],
  );

  return { exportPublications, importPublications };
}
