"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DataTableBulkBarProps {
  selectedCount: number;
  /** Action buttons for the current selection; destructive ones confirm first. */
  actions: ReactNode;
  onClearSelection: () => void;
  className?: string;
}

/**
 * Floating bulk-action bar. Rendered by the page (it owns selection state)
 * while at least one row is selected.
 */
export function DataTableBulkBar({
  selectedCount,
  actions,
  onClearSelection,
  className,
}: DataTableBulkBarProps) {
  if (selectedCount === 0) {
    return null;
  }
  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={cn(
        "bg-card fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-lg border px-4 py-2 shadow-lg",
        className,
      )}
    >
      <p className="text-sm" aria-live="polite">
        <span className="font-medium tabular-nums">{selectedCount}</span> selected
      </p>
      <Separator orientation="vertical" className="h-5" />
      <div className="flex items-center gap-2">{actions}</div>
      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        <X aria-hidden="true" />
        Clear
      </Button>
    </div>
  );
}
