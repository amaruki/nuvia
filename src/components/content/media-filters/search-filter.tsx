"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FilterControlProps } from "./types";

export function SearchFilter({ filters, onFiltersChange }: FilterControlProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="search" className="text-sm font-medium">
        Search
      </Label>
      <Input
        id="search"
        placeholder="Search by title, description, or tags..."
        value={filters.search || ""}
        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        className="w-full"
      />
    </div>
  );
}
