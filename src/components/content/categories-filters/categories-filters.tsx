"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter } from "lucide-react";
import type { CategoryScope, CategoryStatus, CategoryType } from "@/types/category.types";
import { ActiveFiltersBar } from "./active-filters-bar";
import { ScopeFilter } from "./scope-filter";
import { SearchFilter } from "./search-filter";
import { SortOptions } from "./sort-options";
import { StatusFilter } from "./status-filter";
import { TypeFilter } from "./type-filter";
import type { ActiveFilterKey, CategoriesFiltersProps } from "./types";

export function CategoriesFilters({ filters, onFiltersChange, onReset }: CategoriesFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = !!(
    filters.search ||
    (filters.type && filters.type.length > 0) ||
    (filters.status && filters.status.length > 0) ||
    (filters.scope && filters.scope.length > 0)
  );

  const activeFilterCount = [
    !!filters.search,
    filters.type && filters.type.length > 0,
    filters.status && filters.status.length > 0,
    filters.scope && filters.scope.length > 0,
  ].filter(Boolean).length;

  const handleTypeChange = (type: CategoryType, checked: boolean) => {
    const currentTypes = filters.type || [];
    const newTypes = checked ? [...currentTypes, type] : currentTypes.filter((t) => t !== type);
    onFiltersChange({ type: newTypes });
  };

  const handleStatusChange = (status: CategoryStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s) => s !== status);
    onFiltersChange({ status: newStatuses });
  };

  const handleScopeChange = (scope: CategoryScope, checked: boolean) => {
    const currentScopes = filters.scope || [];
    const newScopes = checked
      ? [...currentScopes, scope]
      : currentScopes.filter((s) => s !== scope);
    onFiltersChange({ scope: newScopes });
  };

  const removeFilter = (filterType: ActiveFilterKey) => {
    switch (filterType) {
      case "search":
        onFiltersChange({ search: undefined });
        break;
      case "type":
        onFiltersChange({ type: [] });
        break;
      case "status":
        onFiltersChange({ status: [] });
        break;
      case "scope":
        onFiltersChange({ scope: [] });
        break;
    }
  };

  const clearAllFilters = () => {
    onReset();
    setIsExpanded(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          <SearchFilter
            value={filters.search || ""}
            onChange={(value) => onFiltersChange({ search: value })}
          />

          <TypeFilter selected={filters.type} onToggle={handleTypeChange} />

          <StatusFilter selected={filters.status} onToggle={handleStatusChange} />

          <ScopeFilter selected={filters.scope} onToggle={handleScopeChange} />

          <SortOptions
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortByChange={(sortBy) => onFiltersChange({ sortBy })}
            onSortOrderChange={(sortOrder) => onFiltersChange({ sortOrder })}
          />
        </CardContent>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !isExpanded && (
        <CardContent className="pt-0">
          <ActiveFiltersBar filters={filters} onRemoveFilter={removeFilter} />
        </CardContent>
      )}
    </Card>
  );
}
