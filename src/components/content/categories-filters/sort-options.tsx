"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryFilters } from "@/types/category.types";
import { sortByOptions, sortOrderOptions } from "./constants";
import type { SortOptionsProps } from "./types";

export function SortOptions({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: SortOptionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select
          value={sortBy || "order"}
          onValueChange={(value) => onSortByChange(value as NonNullable<CategoryFilters["sortBy"]>)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortByOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sort Order</Label>
        <Select
          value={sortOrder || "asc"}
          onValueChange={(value) =>
            onSortOrderChange(value as NonNullable<CategoryFilters["sortOrder"]>)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort order" />
          </SelectTrigger>
          <SelectContent>
            {sortOrderOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
