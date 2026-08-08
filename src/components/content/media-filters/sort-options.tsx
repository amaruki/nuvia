"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MediaFilters } from "@/types/media";
import type { FilterControlProps } from "./types";

export function SortOptions({ filters, onFiltersChange }: FilterControlProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Sort By</Label>
        <Select
          value={filters.sortBy || "createdAt"}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, sortBy: value as MediaFilters["sortBy"] })
          }
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
          onValueChange={(value) =>
            onFiltersChange({ ...filters, sortOrder: value as MediaFilters["sortOrder"] })
          }
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
  );
}
