"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, RotateCcw } from "lucide-react";
import type { PublicationsFiltersProps } from "./types";

export function ActiveFiltersBar({
  filters,
  onFiltersChange,
  onClearFilters,
}: PublicationsFiltersProps) {
  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case "search":
        onFiltersChange({ search: "" });
        break;
      case "status":
        onFiltersChange({ status: [] });
        break;
      case "type":
        onFiltersChange({ type: [] });
        break;
      case "category":
        onFiltersChange({ category: [] });
        break;
      case "author":
        onFiltersChange({ author: [] });
        break;
      case "tags":
        onFiltersChange({ tags: [] });
        break;
      case "dateRange":
        onFiltersChange({ dateRange: undefined });
        break;
      case "visibility":
        onFiltersChange({ visibility: [] });
        break;
      case "featured":
        onFiltersChange({ featured: undefined });
        break;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border">
      <span className="text-sm font-medium">Active Filters:</span>
      {filters.search && (
        <Badge variant="secondary" className="gap-1">
          Search: "{filters.search}"
          <button
            onClick={() => removeFilter("search")}
            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.status && filters.status.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          Status ({filters.status.length})
          <button
            onClick={() => removeFilter("status")}
            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.type && filters.type.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          Type ({filters.type.length})
          <button
            onClick={() => removeFilter("type")}
            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.category && filters.category.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          Category ({filters.category.length})
          <button
            onClick={() => removeFilter("category")}
            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.author && filters.author.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          Authors ({filters.author.length})
          <button
            onClick={() => removeFilter("author")}
            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.tags && filters.tags.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          Tags ({filters.tags.length})
          <button
            onClick={() => removeFilter("tags")}
            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.dateRange && (
        <Badge variant="secondary" className="gap-1">
          Date Range
          <button
            onClick={() => removeFilter("dateRange")}
            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.visibility && filters.visibility.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          Visibility ({filters.visibility.length})
          <button
            onClick={() => removeFilter("visibility")}
            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.featured !== undefined && (
        <Badge variant="secondary" className="gap-1">
          Featured: {filters.featured ? "Yes" : "No"}
          <button
            onClick={() => removeFilter("featured")}
            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      <Button variant="outline" size="sm" onClick={onClearFilters}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Clear All
      </Button>
    </div>
  );
}
