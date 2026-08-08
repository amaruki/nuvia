"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Filter, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicationsFiltersProps } from "./types";
import { hasActiveFilters, getActiveFilterCount } from "./filter-helpers";
import { useFilterFacets } from "./use-filter-facets";
import { ActiveFiltersBar } from "./active-filters-bar";
import { CheckboxFilters } from "./checkbox-filters";
import { FacetFilters } from "./facet-filters";
import { DateRangeFilter } from "./date-range-filter";
import { SelectFilters } from "./select-filters";
import { SortOptions } from "./sort-options";

export function PublicationsFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: PublicationsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { authors, tags } = useFilterFacets();

  return (
    <div className="space-y-4">
      {/* Active Filters Bar */}
      {hasActiveFilters(filters) && (
        <ActiveFiltersBar
          filters={filters}
          onFiltersChange={onFiltersChange}
          onClearFilters={onClearFilters}
        />
      )}

      {/* Filters Panel */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {getActiveFilterCount(filters) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount(filters)}
              </Badge>
            )}
            <ChevronDown
              className={cn("ml-2 h-4 w-4 transition-transform", isExpanded && "rotate-180")}
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-6 mt-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search publications..."
                value={filters.search || ""}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CheckboxFilters filters={filters} onFiltersChange={onFiltersChange} />
            <FacetFilters
              filters={filters}
              onFiltersChange={onFiltersChange}
              authors={authors}
              tags={tags}
            />
            {/* Date Range Filter */}
            <DateRangeFilter filters={filters} onFiltersChange={onFiltersChange} />
            <SelectFilters filters={filters} onFiltersChange={onFiltersChange} />
          </div>

          {/* Sort Options */}
          <SortOptions filters={filters} onFiltersChange={onFiltersChange} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
