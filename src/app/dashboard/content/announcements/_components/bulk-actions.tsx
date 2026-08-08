"use client";

import { AlertTriangle, Archive, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface BulkActionsProps {
  selectedAnnouncements: string[];
  bulkPublish: (ids: string[]) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  clearSelection: () => void;
}

export function BulkActions({
  selectedAnnouncements,
  bulkPublish,
  bulkArchive,
  bulkDelete,
  clearSelection,
}: BulkActionsProps) {
  const handleBulkPublish = async () => {
    if (selectedAnnouncements.length === 0) return;

    if (
      confirm(
        `Are you sure you want to publish ${selectedAnnouncements.length} selected announcements?`,
      )
    ) {
      try {
        await bulkPublish(selectedAnnouncements);
        clearSelection();
      } catch (error) {
        logger.error("Error bulk publishing", error);
      }
    }
  };

  const handleBulkArchive = async () => {
    if (selectedAnnouncements.length === 0) return;

    if (
      confirm(
        `Are you sure you want to archive ${selectedAnnouncements.length} selected announcements?`,
      )
    ) {
      try {
        await bulkArchive(selectedAnnouncements);
        clearSelection();
      } catch (error) {
        logger.error("Error bulk archiving", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAnnouncements.length === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selectedAnnouncements.length} selected announcements? This action cannot be undone.`,
      )
    ) {
      try {
        await bulkDelete(selectedAnnouncements);
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
        <Megaphone className="mr-2 h-4 w-4" />
        Publish ({selectedAnnouncements.length})
      </Button>
      <Button variant="outline" size="sm" onClick={handleBulkArchive}>
        <Archive className="mr-2 h-4 w-4" />
        Archive ({selectedAnnouncements.length})
      </Button>
      <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
        <AlertTriangle className="mr-2 h-4 w-4" />
        Delete ({selectedAnnouncements.length})
      </Button>
    </div>
  );
}
