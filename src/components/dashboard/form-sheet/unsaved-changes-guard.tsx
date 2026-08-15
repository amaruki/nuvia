"use client";

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

export interface UnsavedChangesGuardProps {
  /** Whether the confirmation dialog is visible. */
  open: boolean;
  /** User chose to throw the edits away; the sheet should close. */
  onDiscard: () => void;
  /** User chose to keep editing; the sheet stays open. */
  onKeep: () => void;
}

/**
 * Confirmation shown when a dirty form sheet is about to be closed. Part of
 * the standard form sheet contract (CODING_STANDARD "Dashboard forms"): a
 * stray overlay click or ESC press must not silently destroy typed input.
 */
export function UnsavedChangesGuard({ open, onDiscard, onKeep }: UnsavedChangesGuardProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onKeep();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            This form has edits that have not been saved. Discard them and close?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <Button variant="destructive" onClick={onDiscard}>
            Discard changes
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
