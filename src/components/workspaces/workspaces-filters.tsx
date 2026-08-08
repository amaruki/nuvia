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
  WorkspaceFilterOptions,
  WorkspaceStatus,
  WorkspaceType,
  CommitteeRole,
} from "@/types/committee";

interface WorkspacesFiltersProps {
  filters: WorkspaceFilterOptions;
  onFiltersChange: (filters: Partial<WorkspaceFilterOptions>) => void;
  onClearFilters: () => void;
}

export function WorkspacesFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: WorkspacesFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions: { value: WorkspaceStatus; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
    { value: "locked", label: "Locked" },
  ];

  const typeOptions: { value: WorkspaceType; label: string }[] = [
    { value: "general", label: "General" },
    { value: "project", label: "Project" },
    { value: "document", label: "Document" },
    { value: "discussion", label: "Discussion" },
    { value: "meeting", label: "Meeting" },
  ];

  const roleOptions: { value: CommitteeRole; label: string }[] = [
    { value: "chair", label: "Chair" },
    { value: "co_chair", label: "Co-Chair" },
    { value: "secretary", label: "Secretary" },
    { value: "treasurer", label: "Treasurer" },
    { value: "member", label: "Member" },
    { value: "advisor", label: "Advisor" },
  ];

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
              <Label>Workspace Type</Label>
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

            {/* Member Role Filter */}
            <div className="space-y-3">
              <Label>Member Role</Label>
              <div className="space-y-2">
                {roleOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${option.value}`}
                      checked={filters.memberRole?.includes(option.value) || false}
                      onCheckedChange={(checked) =>
                        handleRoleChange(option.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`role-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label>Creation Date Range</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="start-date" className="text-sm text-muted-foreground">
                  From
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={
                    filters.dateRange?.start
                      ? filters.dateRange.start.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => handleDateRangeChange("start", e.target.value)}
                />
              </div>
              <div className="flex items-center justify-center h-10">
                <span className="text-muted-foreground">to</span>
              </div>
              <div className="flex-1">
                <Label htmlFor="end-date" className="text-sm text-muted-foreground">
                  To
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={
                    filters.dateRange?.end ? filters.dateRange.end.toISOString().split("T")[0] : ""
                  }
                  onChange={(e) => handleDateRangeChange("end", e.target.value)}
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
                    Type: {type}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleTypeChange(type, false)}
                    />
                  </Badge>
                ))}
                {filters.memberRole?.map((role) => (
                  <Badge key={role} variant="secondary" className="gap-1">
                    Role: {role.replace("_", " ")}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRoleChange(role, false)}
                    />
                  </Badge>
                ))}
                {filters.dateRange && (
                  <Badge variant="secondary" className="gap-1">
                    Date: {filters.dateRange.start.toLocaleDateString()} -{" "}
                    {filters.dateRange.end.toLocaleDateString()}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => onFiltersChange({ dateRange: undefined })}
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
