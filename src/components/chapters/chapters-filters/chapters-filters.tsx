"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Filter, MapPin, Search, Shield, UserCheck } from "lucide-react";
import type { ChapterRole, ChapterStatus } from "@/types/chapter.types";
import { CheckboxFilterGroup } from "./checkbox-filter-group";
import { countryOptions, leadershipRoleOptions, regionOptions, statusOptions } from "./constants";
import { FilterActionsBar } from "./filter-actions-bar";
import { MemberCountFilter } from "./member-count-filter";
import type { ChaptersFiltersProps } from "./types";

export function ChaptersFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ChaptersFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleStatusChange = (status: ChapterStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s) => s !== status);

    onFiltersChange({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleRegionChange = (region: string, checked: boolean) => {
    const currentRegions = filters.region || [];
    const newRegions = checked
      ? [...currentRegions, region]
      : currentRegions.filter((r) => r !== region);

    onFiltersChange({ region: newRegions.length > 0 ? newRegions : undefined });
  };

  const handleCountryChange = (country: string, checked: boolean) => {
    const currentCountries = filters.country || [];
    const newCountries = checked
      ? [...currentCountries, country]
      : currentCountries.filter((c) => c !== country);

    onFiltersChange({ country: newCountries.length > 0 ? newCountries : undefined });
  };

  const handleLeadershipRoleChange = (role: ChapterRole, checked: boolean) => {
    const currentRoles = filters.leadershipRole || [];
    const newRoles = checked ? [...currentRoles, role] : currentRoles.filter((r) => r !== role);

    onFiltersChange({ leadershipRole: newRoles.length > 0 ? newRoles : undefined });
  };

  const handleMemberCountRangeChange = (range: { min: number; max: number }) => {
    onFiltersChange({ memberCountRange: range });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value || undefined });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.region?.length) count++;
    if (filters.country?.length) count++;
    if (filters.leadershipRole?.length) count++;
    if (filters.memberCountRange) count++;
    if (filters.search) count++;
    return count;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <Card className="shadow-sm">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Label>
              <Input
                id="search"
                placeholder="Search by name, location, or description..."
                value={filters.search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <CheckboxFilterGroup
                label="Status"
                icon={<Shield className="h-4 w-4" />}
                idPrefix="status"
                options={statusOptions}
                selected={filters.status}
                onToggle={handleStatusChange}
              />

              <CheckboxFilterGroup
                label="Region"
                icon={<MapPin className="h-4 w-4" />}
                idPrefix="region"
                options={regionOptions}
                selected={filters.region}
                onToggle={handleRegionChange}
              />

              <CheckboxFilterGroup
                label="Country"
                icon={<MapPin className="h-4 w-4" />}
                idPrefix="country"
                options={countryOptions}
                selected={filters.country}
                onToggle={handleCountryChange}
              />

              <CheckboxFilterGroup
                label="Leadership Role"
                icon={<UserCheck className="h-4 w-4" />}
                idPrefix="role"
                options={leadershipRoleOptions}
                selected={filters.leadershipRole}
                onToggle={handleLeadershipRoleChange}
              />

              <MemberCountFilter
                range={filters.memberCountRange}
                onChange={handleMemberCountRangeChange}
              />
            </div>

            <FilterActionsBar
              activeCount={getActiveFiltersCount()}
              onClearFilters={onClearFilters}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
