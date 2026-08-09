"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, Search, X } from "lucide-react";
import type { CommitteeAuthorityLevel, CommitteeStatus, CommitteeType } from "@/types/committee";
import { ActiveFiltersSummary } from "./active-filters-summary";
import { CheckboxFilterGroup } from "./checkbox-filter-group";
import { authorityOptions, statusOptions, typeOptions } from "./constants";
import { MemberCountFilter } from "./member-count-filter";
import type { CommitteesFiltersProps, MemberCountRange } from "./types";

export function CommitteesFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: CommitteesFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (status: CommitteeStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s) => s !== status);

    onFiltersChange({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleTypeChange = (type: CommitteeType, checked: boolean) => {
    const currentTypes = filters.type || [];
    const newTypes = checked ? [...currentTypes, type] : currentTypes.filter((t) => t !== type);

    onFiltersChange({ type: newTypes.length > 0 ? newTypes : undefined });
  };

  const handleAuthorityChange = (authority: CommitteeAuthorityLevel, checked: boolean) => {
    const currentAuthorities = filters.authorityLevel || [];
    const newAuthorities = checked
      ? [...currentAuthorities, authority]
      : currentAuthorities.filter((a) => a !== authority);

    onFiltersChange({ authorityLevel: newAuthorities.length > 0 ? newAuthorities : undefined });
  };

  const handleMemberCountRangeChange = (range: MemberCountRange) => {
    onFiltersChange({ memberCountRange: range });
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.status?.length ||
    filters.type?.length ||
    filters.authorityLevel?.length ||
    filters.memberCountRange
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
            Committee Filters
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
                placeholder="Search committees by name, description, or purpose..."
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
              label="Committee Type"
              idPrefix="type"
              options={typeOptions}
              selected={filters.type}
              onToggle={handleTypeChange}
            />
            <CheckboxFilterGroup
              label="Authority Level"
              idPrefix="authority"
              options={authorityOptions}
              selected={filters.authorityLevel}
              onToggle={handleAuthorityChange}
            />
          </div>

          <MemberCountFilter
            range={filters.memberCountRange}
            onChange={handleMemberCountRangeChange}
          />

          {hasActiveFilters && (
            <ActiveFiltersSummary
              filters={filters}
              onFiltersChange={onFiltersChange}
              onStatusToggle={handleStatusChange}
              onTypeToggle={handleTypeChange}
              onAuthorityToggle={handleAuthorityChange}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}
