"use client";

import React from "react";
import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface ImportExportBarProps {
  importMedia: (file: File) => Promise<void>;
  exportMedia: (format: "csv" | "json") => Promise<void>;
}

export function ImportExportBar({ importMedia, exportMedia }: ImportExportBarProps) {
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importMedia(file);
      } catch (error) {
        logger.error("Error importing media", error);
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
          id="import-media"
        />
        <Button variant="outline" size="sm" asChild>
          <label htmlFor="import-media" className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </label>
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportMedia("csv")}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportMedia("json")}>
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
      </div>
    </div>
  );
}
