"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PublicationFilters } from "@/types/publication.types";
import type { FiltersControlProps } from "./types";

export function SortOptions({ filters, onFiltersChange }: FiltersControlProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="sortBy" className="text-sm font-medium">
          Sort By
        </Label>
        <Select
          value={filters.sortBy || "publishedAt"}
          onValueChange={(value) =>
            onFiltersChange({
              sortBy: value as PublicationFilters["sortBy"],
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="publishedAt">Published Date</SelectItem>
            <SelectItem value="views">Views</SelectItem>
            <SelectItem value="engagement">Engagement</SelectItem>
            <SelectItem value="author">Author</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortOrder" className="text-sm font-medium">
          Order
        </Label>
        <Select
          value={filters.sortOrder || "desc"}
          onValueChange={(value) =>
            onFiltersChange({
              sortOrder: value as PublicationFilters["sortOrder"],
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
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
