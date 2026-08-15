"use client";

import * as React from "react";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { UnsavedChangesGuard } from "./unsaved-changes-guard";

export type FormSheetSize = "default" | "wide";

const SIZE_CLASSES: Record<FormSheetSize, string> = {
  default: "sm:max-w-xl",
  wide: "sm:max-w-3xl",
};

export interface FormSheetProps {
  open: boolean;
  /**
   * Called for every successful close. Close attempts on a dirty form are
   * intercepted and confirmed first via UnsavedChangesGuard, so callers
   * should close the sheet here (typically the useFormSheet `close`).
   */
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** "default" for short forms, "wide" for multi-section forms. */
  size?: FormSheetSize;
  /**
   * React Hook Form `formState.isDirty`. When true, X / overlay / ESC /
   * Cancel close attempts ask for confirmation before discarding input.
   */
  isDirty?: boolean;
  /** Sticky footer slot; pass FormActions here. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Standard container for dashboard CRUD forms (CODING_STANDARD "Dashboard
 * forms"): a right-side Sheet with a fixed header, a fully scrollable body,
 * and a sticky footer. Create and edit share this container; the page owns
 * title stays in the dashboard shell header, and the sheet title is the
 * accessible name of this dialog, not a page heading.
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  size = "default",
  isDirty = false,
  footer,
  children,
}: FormSheetProps) {
  const [confirmingClose, setConfirmingClose] = useState(false);

  // Programmatic closes (open=false from the parent after a successful
  // submit) bypass onOpenChange, so only user-initiated close attempts are
  // intercepted here.
  const handleOpenChange = (next: boolean) => {
    if (!next && isDirty) {
      setConfirmingClose(true);
      return;
    }
    onOpenChange(next);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className={cn("gap-0 overflow-hidden p-0", SIZE_CLASSES[size])}>
          <SheetHeader className="border-b bg-background px-6 py-4 text-left">
            <SheetTitle>{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">{children}</div>
          {footer}
        </SheetContent>
      </Sheet>
      <UnsavedChangesGuard
        open={confirmingClose}
        onDiscard={() => {
          setConfirmingClose(false);
          onOpenChange(false);
        }}
        onKeep={() => setConfirmingClose(false)}
      />
    </>
  );
}
