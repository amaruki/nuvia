"use client";

import { useState } from "react";
import { AlertTriangle, Archive, Megaphone } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

type BulkActionKind = "publish" | "archive" | "delete";

interface BulkActionsProps {
  selectedAnnouncements: string[];
  bulkPublish: (ids: string[]) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  clearSelection: () => void;
}

const BULK_ACTION_COPY: Record<
  BulkActionKind,
  {
    title: string;
    confirmLabel: string;
    logMessage: string;
    description: (count: number) => string;
  }
> = {
  publish: {
    title: "Publish selected announcements?",
    confirmLabel: "Publish",
    logMessage: "Error bulk publishing",
    description: (count) => `Are you sure you want to publish ${count} selected announcements?`,
  },
  archive: {
    title: "Archive selected announcements?",
    confirmLabel: "Archive",
    logMessage: "Error bulk archiving",
    description: (count) => `Are you sure you want to archive ${count} selected announcements?`,
  },
  delete: {
    title: "Delete selected announcements?",
    confirmLabel: "Delete",
    logMessage: "Error bulk deleting",
    description: (count) =>
      `Are you sure you want to delete ${count} selected announcements? This action cannot be undone.`,
  },
};

export function BulkActions({
  selectedAnnouncements,
  bulkPublish,
  bulkArchive,
  bulkDelete,
  clearSelection,
}: BulkActionsProps) {
  const [pendingAction, setPendingAction] = useState<BulkActionKind | null>(null);

  const handleBulkPublish = () => {
    if (selectedAnnouncements.length === 0) return;
    setPendingAction("publish");
  };

  const handleBulkArchive = () => {
    if (selectedAnnouncements.length === 0) return;
    setPendingAction("archive");
  };

  const handleBulkDelete = () => {
    if (selectedAnnouncements.length === 0) return;
    setPendingAction("delete");
  };

  const runPendingAction = async () => {
    if (!pendingAction || selectedAnnouncements.length === 0) return;
    const action = pendingAction;
    setPendingAction(null);
    try {
      if (action === "publish") {
        await bulkPublish(selectedAnnouncements);
      } else if (action === "archive") {
        await bulkArchive(selectedAnnouncements);
      } else {
        await bulkDelete(selectedAnnouncements);
      }
      clearSelection();
    } catch (error) {
      logger.error(BULK_ACTION_COPY[action].logMessage, error);
    }
  };

  const copy = pendingAction ? BULK_ACTION_COPY[pendingAction] : null;

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

      {/* Bulk action confirmation (UI-06: replaces native confirm()). */}
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy?.title ?? ""}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy ? copy.description(selectedAnnouncements.length) : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {pendingAction === "publish" ? (
              <AlertDialogAction onClick={runPendingAction}>
                {copy?.confirmLabel ?? "Publish"}
              </AlertDialogAction>
            ) : (
              <Button variant="destructive" onClick={runPendingAction}>
                {copy?.confirmLabel ?? "Confirm"}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
