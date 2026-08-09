"use client";

import { useState } from "react";
import type { ComponentType } from "react";

import { DataTableBulkBar } from "@/components/data-table";
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

export interface ContentBulkAction {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  destructive?: boolean;
  /** Confirmation copy shown in the AlertDialog before running. */
  confirmTitle: string;
  confirmDescription: (count: number) => string;
  confirmLabel: string;
}

export interface ContentBulkBarProps {
  selectedCount: number;
  actions: ContentBulkAction[];
  /** Runs the confirmed action; the bar stays busy until it settles. */
  onAction: (key: string) => Promise<void>;
  onClear: () => void;
}

/**
 * Floating bulk bar + AlertDialog confirmation for the content tables.
 * Bulk publish/archive/delete are destructive enough to warrant a confirm
 * step (the old pages already used AlertDialogs for the same reason).
 */
export function ContentBulkBar({ selectedCount, actions, onAction, onClear }: ContentBulkBarProps) {
  const [pending, setPending] = useState<ContentBulkAction | null>(null);
  const [running, setRunning] = useState(false);

  const confirm = async () => {
    if (!pending || running) return;
    setRunning(true);
    try {
      await onAction(pending.key);
      setPending(null);
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <DataTableBulkBar
        selectedCount={selectedCount}
        onClearSelection={onClear}
        actions={
          <div className="flex items-center gap-2">
            {actions.map((action) => (
              <Button
                key={action.key}
                variant={action.destructive ? "destructive" : "outline"}
                size="sm"
                onClick={() => setPending(action)}
              >
                <action.icon className="size-4" />
                {action.label}
              </Button>
            ))}
          </div>
        }
      />
      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => !open && !running && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending ? pending.confirmDescription(selectedCount) : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={running}>Cancel</AlertDialogCancel>
            <Button
              variant={pending?.destructive ? "destructive" : "default"}
              onClick={confirm}
              disabled={running}
            >
              {running ? "Working..." : (pending?.confirmLabel ?? "Confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
