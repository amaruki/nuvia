"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { FilterActionsBarProps } from "./types";

export function FilterActionsBar({ activeCount, onClearFilters }: FilterActionsBarProps) {
  const hasActiveFilters = activeCount > 0;

  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div className="text-sm text-muted-foreground">
        {hasActiveFilters && (
          <span>
            {activeCount} filter{activeCount !== 1 ? "s" : ""} applied
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
}
