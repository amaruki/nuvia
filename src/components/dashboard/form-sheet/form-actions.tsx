"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface FormActionsProps {
  /** Id of the form element these buttons submit via the HTML form attribute. */
  formId: string;
  mode: "create" | "edit";
  /** React Hook Form `formState.isSubmitting`. */
  submitting: boolean;
  onCancel: () => void;
  /**
   * Noun for the create label, e.g. "Category" renders "Create Category".
   * Edit mode always renders "Save changes".
   */
  entityLabel?: string;
}

/**
 * Standard form sheet footer: Cancel + submit with pending state. Rendered
 * in FormSheet's sticky footer slot; the submit button is linked to the
 * form element by id so it can live outside the scrollable body.
 */
export function FormActions({ formId, mode, submitting, onCancel, entityLabel }: FormActionsProps) {
  const submitLabel = submitting
    ? "Saving..."
    : mode === "edit"
      ? "Save changes"
      : entityLabel
        ? `Create ${entityLabel}`
        : "Create";

  return (
    <div className="flex items-center justify-end gap-3 border-t bg-background px-6 py-4">
      <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
        Cancel
      </Button>
      <Button type="submit" form={formId} disabled={submitting}>
        {submitting ? <Loader2 aria-hidden className="animate-spin" /> : null}
        {submitLabel}
      </Button>
    </div>
  );
}
