"use client";

import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";

interface FormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
}

/** Cancel / Create bar pinned to the bottom of the create form. */
export function FormActions({ isSubmitting, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-3 pt-6 border-t">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Creating...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Create Event
          </>
        )}
      </Button>
    </div>
  );
}
