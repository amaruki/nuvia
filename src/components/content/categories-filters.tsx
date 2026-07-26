"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_TYPES,
  CATEGORY_STATUSES,
  CATEGORY_SCOPES,
  CATEGORY_TYPE_DISPLAY,
  CATEGORY_STATUS_DISPLAY,
  CATEGORY_SCOPE_DISPLAY,
  CategoryFilters,
  CategoryType,
  CategoryStatus,
  CategoryScope,
} from "@/types/category.types";
import { X, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoriesFiltersProps {
  filters: CategoryFilters;
  onFiltersChange: (filters: Partial<CategoryFilters>) => void;
  onReset: () => void;
}

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

  const removeFilter = (filterType: "search" | "type" | "status" | "scope") => {
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
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search categories by name, description, or slug..."
                value={filters.search || ""}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-3">
            <Label>Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CATEGORY_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.type?.includes(type) || false}
                    onCheckedChange={(checked: boolean) => handleTypeChange(type, checked)}
                  />
                  <Label
                    htmlFor={`type-${type}`}
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded"
                      style={{
                        backgroundColor: CATEGORY_TYPE_DISPLAY[type].color,
                      }}
                    />
                    {CATEGORY_TYPE_DISPLAY[type].name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-3">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-3">
              {CATEGORY_STATUSES.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.status?.includes(status) || false}
                    onCheckedChange={(checked: boolean) => handleStatusChange(status, checked)}
                  />
                  <Label
                    htmlFor={`status-${status}`}
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <Badge
                      variant={CATEGORY_STATUS_DISPLAY[status].badgeVariant}
                      className="text-xs"
                    >
                      {CATEGORY_STATUS_DISPLAY[status].name}
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Scope Filter */}
          <div className="space-y-3">
            <Label>Scope</Label>
            <div className="flex flex-wrap gap-3">
              {CATEGORY_SCOPES.map((scope) => (
                <div key={scope} className="flex items-center space-x-2">
                  <Checkbox
                    id={`scope-${scope}`}
                    checked={filters.scope?.includes(scope) || false}
                    onCheckedChange={(checked: boolean) => handleScopeChange(scope, checked)}
                  />
                  <Label
                    htmlFor={`scope-${scope}`}
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded"
                      style={{
                        backgroundColor: CATEGORY_SCOPE_DISPLAY[scope].color,
                      }}
                    />
                    {CATEGORY_SCOPE_DISPLAY[scope].name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={filters.sortBy || "order"}
                onValueChange={(value) => onFiltersChange({ sortBy: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="contentCount">Content Count</SelectItem>
                  <SelectItem value="lastUsed">Last Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Select
                value={filters.sortOrder || "asc"}
                onValueChange={(value) => onFiltersChange({ sortOrder: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !isExpanded && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
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

            {filters.scope && filters.scope.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                Scope ({filters.scope.length})
                <button
                  onClick={() => removeFilter("scope")}
                  className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
