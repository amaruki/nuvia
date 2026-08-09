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

/** The job posting the admin asked to delete. */
export interface DeleteJobTarget {
  id: string;
  title: string;
}

interface DeleteJobDialogProps {
  target: DeleteJobTarget | null;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Destructive confirmation before deleting a job posting. Follows the
 * AlertDialog + pending-state contract used in dashboard/events/registrations:
 * the dialog stays open while the delete is in flight and closes only when the
 * caller clears the target.
 */
export function DeleteJobDialog({ target, isPending, onConfirm, onCancel }: DeleteJobDialogProps) {
  return (
    <AlertDialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open && !isPending) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{target?.title}"?</AlertDialogTitle>
          <AlertDialogDescription>This also removes its applications.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={isPending || !target} onClick={onConfirm}>
            {isPending ? "Deleting..." : "Delete job"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
