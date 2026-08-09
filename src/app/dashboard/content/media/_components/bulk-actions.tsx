"use client";

import { useState } from "react";
import { Folder, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface BulkActionsProps {
  selectedMedia: string[];
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkMove: (ids: string[], folderId: string) => Promise<void>;
  clearSelection: () => void;
}

export function BulkActions({
  selectedMedia,
  bulkDelete,
  bulkMove,
  clearSelection,
}: BulkActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleBulkDelete = () => {
    if (selectedMedia.length === 0) return;
    setDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    setDeleteDialogOpen(false);
    try {
      await bulkDelete(selectedMedia);
      clearSelection();
    } catch (error) {
      logger.error("Error bulk deleting", error);
    }
  };

  const handleBulkMove = async (folderId: string) => {
    if (selectedMedia.length === 0) return;

    try {
      await bulkMove(selectedMedia, folderId);
      clearSelection();
    } catch (error) {
      logger.error("Error bulk moving", error);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
      <span className="text-sm font-medium">Bulk Actions:</span>
      <Button variant="outline" size="sm" onClick={() => handleBulkMove("folder_images")}>
        <Folder className="mr-2 h-4 w-4" />
        Move to Images
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleBulkMove("folder_documents")}>
        <Folder className="mr-2 h-4 w-4" />
        Move to Documents
      </Button>
      <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete ({selectedMedia.length})
      </Button>

      {/* Bulk delete confirmation (UI-06: replaces native confirm()). */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected items?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete ${selectedMedia.length} selected items? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleConfirmBulkDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
