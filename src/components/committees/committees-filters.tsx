"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Search, Filter } from "lucide-react";
import {
  CommitteeFilterOptions,
  CommitteeStatus,
  CommitteeType,
  CommitteeAuthorityLevel,
} from "@/types/committee";

interface CommitteesFiltersProps {
  filters: CommitteeFilterOptions;
  onFiltersChange: (filters: Partial<CommitteeFilterOptions>) => void;
  onClearFilters: () => void;
}

export function CommitteesFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: CommitteesFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions: { value: CommitteeStatus; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending" },
    { value: "suspended", label: "Suspended" },
  ];

  const typeOptions: { value: CommitteeType; label: string }[] = [
    { value: "executive", label: "Executive" },
    { value: "functional", label: "Functional" },
    { value: "special_interest", label: "Special Interest" },
    { value: "ad_hoc", label: "Ad Hoc" },
    { value: "standing", label: "Standing" },
  ];

  const authorityOptions: { value: CommitteeAuthorityLevel; label: string }[] = [
    { value: "executive", label: "Executive" },
    { value: "strategic", label: "Strategic" },
    { value: "operational", label: "Operational" },
    { value: "advisory", label: "Advisory" },
  ];

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

  const handleMemberCountRangeChange = (field: "min" | "min" | "max", value: string) => {
    const numValue = parseInt(value) || 0;
    const currentRange = filters.memberCountRange || { min: 0, max: 100 };

    onFiltersChange({
      memberCountRange: {
        ...currentRange,
        [field]: numValue,
      },
    });
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
            {/* Status Filter */}
            <div className="space-y-3">
              <Label>Status</Label>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.status?.includes(option.value) || false}
                      onCheckedChange={(checked) =>
                        handleStatusChange(option.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`status-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-3">
              <Label>Committee Type</Label>
              <div className="space-y-2">
                {typeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${option.value}`}
                      checked={filters.type?.includes(option.value) || false}
                      onCheckedChange={(checked) =>
                        handleTypeChange(option.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`type-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Authority Level Filter */}
            <div className="space-y-3">
              <Label>Authority Level</Label>
              <div className="space-y-2">
                {authorityOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`authority-${option.value}`}
                      checked={filters.authorityLevel?.includes(option.value) || false}
                      onCheckedChange={(checked) =>
                        handleAuthorityChange(option.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`authority-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Member Count Range */}
          <div className="space-y-3">
            <Label>Member Count Range</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="min-members" className="text-sm text-muted-foreground">
                  Minimum
                </Label>
                <Input
                  id="min-members"
                  type="number"
                  placeholder="0"
                  value={filters.memberCountRange?.min.toString() || ""}
                  onChange={(e) => handleMemberCountRangeChange("min", e.target.value)}
                  min="0"
                />
              </div>
              <div className="flex items-center justify-center h-10">
                <span className="text-muted-foreground">to</span>
              </div>
              <div className="flex-1">
                <Label htmlFor="max-members" className="text-sm text-muted-foreground">
                  Maximum
                </Label>
                <Input
                  id="max-members"
                  type="number"
                  placeholder="100"
                  value={filters.memberCountRange?.max.toString() || ""}
                  onChange={(e) => handleMemberCountRangeChange("max", e.target.value)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="space-y-3">
              <Label>Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{filters.search}"
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => onFiltersChange({ search: undefined })}
                    />
                  </Badge>
                )}
                {filters.status?.map((status) => (
                  <Badge key={status} variant="secondary" className="gap-1">
                    Status: {status}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleStatusChange(status, false)}
                    />
                  </Badge>
                ))}
                {filters.type?.map((type) => (
                  <Badge key={type} variant="secondary" className="gap-1">
                    Type: {type.replace("_", " ")}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleTypeChange(type, false)}
                    />
                  </Badge>
                ))}
                {filters.authorityLevel?.map((authority) => (
                  <Badge key={authority} variant="secondary" className="gap-1">
                    Authority: {authority}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleAuthorityChange(authority, false)}
                    />
                  </Badge>
                ))}
                {filters.memberCountRange && (
                  <Badge variant="secondary" className="gap-1">
                    Members: {filters.memberCountRange.min}-{filters.memberCountRange.max}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => onFiltersChange({ memberCountRange: undefined })}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
