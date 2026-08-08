"use client";

import { useCallback } from "react";

import type { Announcement } from "@/types/announcement";

import { logger } from "@/lib/logger";

export function useAnnouncementUtilities(
  filteredAnnouncements: Announcement[],
  refreshData: () => void,
) {
  // Utility functions
  const exportAnnouncements = useCallback(
    (format: "csv" | "json" | "pdf") => {
      const dataToExport = filteredAnnouncements.map((announcement) => ({
        title: announcement.title,
        type: announcement.type,
        priority: announcement.priority,
        targetAudience: announcement.targetAudience,
        status: announcement.status,
        author: announcement.author.name,
        publishedAt: announcement.publishedAt,
        expiresAt: announcement.expiresAt,
        acknowledgmentCount: announcement.acknowledgmentCount || 0,
        isPinned: announcement.isPinned,
        isUrgent: announcement.isUrgent,
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
          filename = `announcements-${new Date().toISOString().split("T")[0]}.csv`;
          break;
        }
        case "json":
        case "pdf": {
          content = JSON.stringify(dataToExport, null, 2);
          mimeType = "application/json";
          filename = `announcements-${new Date().toISOString().split("T")[0]}.json`;
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
    [filteredAnnouncements],
  );

  const importAnnouncements = useCallback(
    async (file: File): Promise<void> => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        logger.info("Imported announcements", data);
        refreshData();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to import announcements");
      }
    },
    [refreshData],
  );

  return { exportAnnouncements, importAnnouncements };
}
