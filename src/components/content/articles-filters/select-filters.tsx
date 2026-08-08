"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FiltersControlProps } from "./types";

export function SelectFilters({ filters, onFiltersChange }: FiltersControlProps) {
  return (
    <>
      {/* Visibility Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Visibility</Label>
        <Select
          value={filters.visibility?.[0] || ""}
          onValueChange={(value) => onFiltersChange({ visibility: value ? [value] : [] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="members_only">Members Only</SelectItem>
            <SelectItem value="premium_only">Premium Only</SelectItem>
            <SelectItem value="chapter_only">Chapter Only</SelectItem>
            <SelectItem value="committee_only">Committee Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Featured Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Featured</Label>
        <Select
          value={filters.featured === undefined ? "" : filters.featured.toString()}
          onValueChange={(value) =>
            onFiltersChange({
              featured: value === "" ? undefined : value === "true",
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="true">Featured Only</SelectItem>
            <SelectItem value="false">Not Featured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Has Series Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Series</Label>
        <Select
          value={filters.hasSeries === undefined ? "" : filters.hasSeries.toString()}
          onValueChange={(value) =>
            onFiltersChange({
              hasSeries: value === "" ? undefined : value === "true",
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="true">Has Series</SelectItem>
            <SelectItem value="false">No Series</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
