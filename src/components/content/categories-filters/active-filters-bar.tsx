"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { ActiveFiltersBarProps } from "./types";

const removeButtonClassName =
  "ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5";

export function ActiveFiltersBar({ filters, onRemoveFilter }: ActiveFiltersBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.search && (
        <Badge variant="secondary" className="gap-1">
          Search: "{filters.search}"
          <button onClick={() => onRemoveFilter("search")} className={removeButtonClassName}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.type && filters.type.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          Type ({filters.type.length})
          <button onClick={() => onRemoveFilter("type")} className={removeButtonClassName}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.status && filters.status.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          Status ({filters.status.length})
          <button onClick={() => onRemoveFilter("status")} className={removeButtonClassName}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.scope && filters.scope.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          Scope ({filters.scope.length})
          <button onClick={() => onRemoveFilter("scope")} className={removeButtonClassName}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
    </div>
  );
}
