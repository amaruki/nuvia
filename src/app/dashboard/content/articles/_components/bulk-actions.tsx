"use client";

import { useState } from "react";
import { AlertTriangle, Archive, FileText } from "lucide-react";

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
  selectedArticles: string[];
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
    title: "Publish selected articles?",
    confirmLabel: "Publish",
    logMessage: "Error bulk publishing",
    description: (count) => `Are you sure you want to publish ${count} selected articles?`,
  },
  archive: {
    title: "Archive selected articles?",
    confirmLabel: "Archive",
    logMessage: "Error bulk archiving",
    description: (count) => `Are you sure you want to archive ${count} selected articles?`,
  },
  delete: {
    title: "Delete selected articles?",
    confirmLabel: "Delete",
    logMessage: "Error bulk deleting",
    description: (count) =>
      `Are you sure you want to delete ${count} selected articles? This action cannot be undone.`,
  },
};

export function BulkActions({
  selectedArticles,
  bulkPublish,
  bulkArchive,
  bulkDelete,
  clearSelection,
}: BulkActionsProps) {
  const [pendingAction, setPendingAction] = useState<BulkActionKind | null>(null);

  const handleBulkPublish = () => {
    if (selectedArticles.length === 0) return;
    setPendingAction("publish");
  };

  const handleBulkArchive = () => {
    if (selectedArticles.length === 0) return;
    setPendingAction("archive");
  };

  const handleBulkDelete = () => {
    if (selectedArticles.length === 0) return;
    setPendingAction("delete");
  };

  const runPendingAction = async () => {
    if (!pendingAction || selectedArticles.length === 0) return;
    const action = pendingAction;
    setPendingAction(null);
    try {
      if (action === "publish") {
        await bulkPublish(selectedArticles);
      } else if (action === "archive") {
        await bulkArchive(selectedArticles);
      } else {
        await bulkDelete(selectedArticles);
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
        <FileText className="mr-2 h-4 w-4" />
        Publish ({selectedArticles.length})
      </Button>
      <Button variant="outline" size="sm" onClick={handleBulkArchive}>
        <Archive className="mr-2 h-4 w-4" />
        Archive ({selectedArticles.length})
      </Button>
      <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
        <AlertTriangle className="mr-2 h-4 w-4" />
        Delete ({selectedArticles.length})
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
              {copy ? copy.description(selectedArticles.length) : ""}
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
