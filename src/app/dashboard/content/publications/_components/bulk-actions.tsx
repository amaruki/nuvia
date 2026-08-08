"use client";

import { AlertTriangle, Archive, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface BulkActionsProps {
  selectedPublications: string[];
  bulkPublish: (ids: string[]) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  clearSelection: () => void;
}

export function BulkActions({
  selectedPublications,
  bulkPublish,
  bulkArchive,
  bulkDelete,
  clearSelection,
}: BulkActionsProps) {
  const handleBulkPublish = async () => {
    if (selectedPublications.length === 0) return;

    if (
      confirm(
        `Are you sure you want to publish ${selectedPublications.length} selected publications?`,
      )
    ) {
      try {
        await bulkPublish(selectedPublications);
        clearSelection();
      } catch (error) {
        logger.error("Error bulk publishing", error);
      }
    }
  };

  const handleBulkArchive = async () => {
    if (selectedPublications.length === 0) return;

    if (
      confirm(
        `Are you sure you want to archive ${selectedPublications.length} selected publications?`,
      )
    ) {
      try {
        await bulkArchive(selectedPublications);
        clearSelection();
      } catch (error) {
        logger.error("Error bulk archiving", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPublications.length === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selectedPublications.length} selected publications? This action cannot be undone.`,
      )
    ) {
      try {
        await bulkDelete(selectedPublications);
        clearSelection();
      } catch (error) {
        logger.error("Error bulk deleting", error);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
      <span className="text-sm font-medium">Bulk Actions:</span>
      <Button variant="outline" size="sm" onClick={handleBulkPublish}>
        <FileText className="mr-2 h-4 w-4" />
        Publish ({selectedPublications.length})
      </Button>
      <Button variant="outline" size="sm" onClick={handleBulkArchive}>
        <Archive className="mr-2 h-4 w-4" />
        Archive ({selectedPublications.length})
      </Button>
      <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
        <AlertTriangle className="mr-2 h-4 w-4" />
        Delete ({selectedPublications.length})
      </Button>
    </div>
  );
}
