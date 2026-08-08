"use client";

import type { ChangeEvent } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface ImportExportBarProps {
  importAnnouncements: (file: File) => Promise<void>;
  exportAnnouncements: (format: "csv" | "json" | "pdf") => void;
}

export function ImportExportBar({
  importAnnouncements,
  exportAnnouncements,
}: ImportExportBarProps) {
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importAnnouncements(file);
      } catch (error) {
        logger.error("Error importing announcements", error);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg border">
      <span className="text-sm font-medium">Import/Export:</span>
      <div className="flex gap-2">
        <input
          type="file"
          accept=".json,.csv"
          onChange={handleImport}
          className="hidden"
          id="import-announcements"
        />
        <Button variant="outline" size="sm" asChild>
          <label htmlFor="import-announcements" className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            Import
          </label>
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportAnnouncements("csv")}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportAnnouncements("json")}>
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
      </div>
    </div>
  );
}
