"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, Search, X } from "lucide-react";
import type { CommitteeRole, WorkspaceStatus, WorkspaceType } from "@/types/committee";
import { ActiveFiltersSummary } from "./active-filters-summary";
import { CheckboxFilterGroup } from "./checkbox-filter-group";
import { roleOptions, statusOptions, typeOptions } from "./constants";
import { DateRangeFilter } from "./date-range-filter";
import type { WorkspacesFiltersProps } from "./types";

export function WorkspacesFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: WorkspacesFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (status: WorkspaceStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s) => s !== status);

    onFiltersChange({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleTypeChange = (type: WorkspaceType, checked: boolean) => {
    const currentTypes = filters.type || [];
    const newTypes = checked ? [...currentTypes, type] : currentTypes.filter((t) => t !== type);

    onFiltersChange({ type: newTypes.length > 0 ? newTypes : undefined });
  };

  const handleRoleChange = (role: CommitteeRole, checked: boolean) => {
    const currentRoles = filters.memberRole || [];
    const newRoles = checked ? [...currentRoles, role] : currentRoles.filter((r) => r !== role);

    onFiltersChange({ memberRole: newRoles.length > 0 ? newRoles : undefined });
  };

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    const dateValue = value ? new Date(value) : undefined;
    const currentRange = filters.dateRange || { start: new Date(), end: new Date() };

    onFiltersChange({
      dateRange: {
        ...currentRange,
        [field]: dateValue,
      },
    });
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.status?.length ||
    filters.type?.length ||
    filters.memberRole?.length ||
    filters.dateRange
  );

  const clearAllFilters = () => {
    onClearFilters();
    setIsExpanded(false);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Workspace Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="mr-2 h-4 w-4" />
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
                placeholder="Search workspaces by name or description..."
                value={filters.search || ""}
                onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CheckboxFilterGroup
              label="Status"
              idPrefix="status"
              options={statusOptions}
              selected={filters.status}
              onToggle={handleStatusChange}
            />

            <CheckboxFilterGroup
              label="Workspace Type"
              idPrefix="type"
              options={typeOptions}
              selected={filters.type}
              onToggle={handleTypeChange}
            />

            <CheckboxFilterGroup
              label="Member Role"
              idPrefix="role"
              options={roleOptions}
              selected={filters.memberRole}
              onToggle={handleRoleChange}
            />
          </div>

          <DateRangeFilter dateRange={filters.dateRange} onFieldChange={handleDateRangeChange} />

          {hasActiveFilters && (
            <ActiveFiltersSummary
              filters={filters}
              onFiltersChange={onFiltersChange}
              onStatusRemove={(status) => handleStatusChange(status, false)}
              onTypeRemove={(type) => handleTypeChange(type, false)}
              onRoleRemove={(role) => handleRoleChange(role, false)}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}
