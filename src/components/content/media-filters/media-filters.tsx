"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaStatus, MediaType, MediaVisibility } from "@/types/media";
import type { MediaFiltersProps } from "./types";
import { hasActiveFilters, toggleArrayValue } from "./filter-helpers";
import { mediaStatuses, mediaTypes, mediaVisibilities } from "./constants";
import { SearchFilter } from "./search-filter";
import { BadgeToggleGroup } from "./badge-toggle-group";
import { DateRangeFilter } from "./date-range-filter";
import { SizeRangeFilter } from "./size-range-filter";
import { TagsFilter } from "./tags-filter";
import { SortOptions } from "./sort-options";

export function MediaFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  className,
}: MediaFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTypeToggle = (type: MediaType) => {
    onFiltersChange({ ...filters, type: toggleArrayValue(filters.type, type) });
  };

  const handleStatusToggle = (status: MediaStatus) => {
    onFiltersChange({ ...filters, status: toggleArrayValue(filters.status, status) });
  };

  const handleVisibilityToggle = (visibility: MediaVisibility) => {
    onFiltersChange({
      ...filters,
      visibility: toggleArrayValue(filters.visibility, visibility),
    });
  };

  const clearAllFilters = () => {
    onClearFilters();
    setIsExpanded(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="text-lg font-semibold">Filters</h3>
          {hasActiveFilters(filters) && (
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters(filters)}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 border-t pt-4">
          {/* Search Filter */}
          <SearchFilter filters={filters} onFiltersChange={onFiltersChange} />

          {/* Media Type Filter */}
          <BadgeToggleGroup
            label="Media Type"
            options={mediaTypes}
            selected={filters.type}
            onToggle={handleTypeToggle}
          />

          {/* Status Filter */}
          <BadgeToggleGroup
            label="Status"
            options={mediaStatuses}
            selected={filters.status}
            onToggle={handleStatusToggle}
          />

          {/* Visibility Filter */}
          <BadgeToggleGroup
            label="Visibility"
            options={mediaVisibilities}
            selected={filters.visibility}
            onToggle={handleVisibilityToggle}
          />

          {/* Date Range Filter */}
          <DateRangeFilter filters={filters} onFiltersChange={onFiltersChange} />

          {/* Size Range Filter */}
          <SizeRangeFilter filters={filters} onFiltersChange={onFiltersChange} />

          {/* Tags Filter */}
          <TagsFilter filters={filters} onFiltersChange={onFiltersChange} />

          {/* Sort Options */}
          <SortOptions filters={filters} onFiltersChange={onFiltersChange} />
        </div>
      )}
    </div>
  );
}
