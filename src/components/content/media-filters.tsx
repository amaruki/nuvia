"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { MediaFilters, MediaType, MediaStatus, MediaVisibility } from "@/types/media.types";

interface MediaFiltersProps {
  filters: MediaFilters;
  onFiltersChange: (filters: MediaFilters) => void;
  onClearFilters: () => void;
  className?: string;
}

export function MediaFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  className,
}: MediaFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof MediaFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleTypeToggle = (type: MediaType) => {
    const currentTypes = filters.type || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    handleFilterChange("type", newTypes.length > 0 ? newTypes : undefined);
  };

  const handleStatusToggle = (status: MediaStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    handleFilterChange("status", newStatuses.length > 0 ? newStatuses : undefined);
  };

  const handleVisibilityToggle = (visibility: MediaVisibility) => {
    const currentVisibilities = filters.visibility || [];
    const newVisibilities = currentVisibilities.includes(visibility)
      ? currentVisibilities.filter((v) => v !== visibility)
      : [...currentVisibilities, visibility];

    handleFilterChange("visibility", newVisibilities.length > 0 ? newVisibilities : undefined);
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    handleFilterChange("tags", newTags.length > 0 ? newTags : undefined);
  };

  const clearAllFilters = () => {
    onClearFilters();
    setIsExpanded(false);
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.type?.length ||
    filters.status?.length ||
    filters.visibility?.length ||
    filters.tags?.length ||
    filters.dateRange ||
    filters.sizeRange
  );

  const mediaTypes: MediaType[] = [
    "image",
    "video",
    "audio",
    "document",
    "archive",
    "spreadsheet",
    "presentation",
    "pdf",
    "vector",
    "font",
  ];
  const mediaStatuses: MediaStatus[] = ["uploading", "processing", "ready", "failed", "archived"];
  const mediaVisibilities: MediaVisibility[] = ["public", "private", "restricted", "draft"];

  const commonTags = [
    "featured",
    "banner",
    "thumbnail",
    "document",
    "video",
    "image",
    "audio",
    "presentation",
    "spreadsheet",
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="text-lg font-semibold">Filters</h3>
          {hasActiveFilters && (
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
            disabled={!hasActiveFilters}
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
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Search
            </Label>
            <Input
              id="search"
              placeholder="Search by title, description, or tags..."
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full"
            />
          </div>

          {/* Media Type Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Media Type</Label>
            <div className="flex flex-wrap gap-2">
              {mediaTypes.map((type) => {
                const isSelected = filters.type?.includes(type);
                return (
                  <Badge
                    key={type}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleTypeToggle(type)}
                  >
                    {type}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <div className="flex flex-wrap gap-2">
              {mediaStatuses.map((status) => {
                const isSelected = filters.status?.includes(status);
                return (
                  <Badge
                    key={status}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleStatusToggle(status)}
                  >
                    {status}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Visibility Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Visibility</Label>
            <div className="flex flex-wrap gap-2">
              {mediaVisibilities.map((visibility) => {
                const isSelected = filters.visibility?.includes(visibility);
                return (
                  <Badge
                    key={visibility}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleVisibilityToggle(visibility)}
                  >
                    {visibility}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange?.start && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.start
                      ? format(filters.dateRange.start, "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.start}
                    onSelect={(date) => {
                      const newRange = {
                        start: date || new Date(),
                        end: filters.dateRange?.end || new Date(),
                      };
                      handleFilterChange("dateRange", newRange);
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange?.end && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.end ? format(filters.dateRange.end, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.end}
                    onSelect={(date) => {
                      const newRange = {
                        start: filters.dateRange?.start || new Date(),
                        end: date || new Date(),
                      };
                      handleFilterChange("dateRange", newRange);
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Size Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">File Size Range (MB)</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="minSize" className="text-xs text-muted-foreground">
                  Min Size
                </Label>
                <Input
                  id="minSize"
                  type="number"
                  placeholder="0"
                  value={filters.sizeRange?.min ? filters.sizeRange.min / 1024 / 1024 : ""}
                  onChange={(e) => {
                    const minSize = e.target.value
                      ? parseInt(e.target.value) * 1024 * 1024
                      : undefined;
                    const newRange = {
                      min: minSize,
                      max: filters.sizeRange?.max,
                    };
                    handleFilterChange("sizeRange", newRange);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="maxSize" className="text-xs text-muted-foreground">
                  Max Size
                </Label>
                <Input
                  id="maxSize"
                  type="number"
                  placeholder="100"
                  value={filters.sizeRange?.max ? filters.sizeRange.max / 1024 / 1024 : ""}
                  onChange={(e) => {
                    const maxSize = e.target.value
                      ? parseInt(e.target.value) * 1024 * 1024
                      : undefined;
                    const newRange = {
                      min: filters.sizeRange?.min,
                      max: maxSize,
                    };
                    handleFilterChange("sizeRange", newRange);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {commonTags.map((tag) => {
                const isSelected = filters.tags?.includes(tag);
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // This would open a tag management dialog in a real implementation
                  console.log("Add custom tag");
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Custom
              </Button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sort By</Label>
              <Select
                value={filters.sortBy || "createdAt"}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="size">File Size</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                  <SelectItem value="downloads">Downloads</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Sort Order</Label>
              <Select
                value={filters.sortOrder || "desc"}
                onValueChange={(value) => handleFilterChange("sortOrder", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort order..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
