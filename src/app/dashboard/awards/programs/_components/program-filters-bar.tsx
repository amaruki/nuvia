"use client";

import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AwardCategory,
  AwardProgramFilterOptions,
  AwardProgramStatus,
} from "@/types/award.types";
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from "./program-utils";

interface ProgramFiltersBarProps {
  filters: AwardProgramFilterOptions;
  hasActiveFilters: boolean;
  updateFilters: (newFilters: Partial<AwardProgramFilterOptions>) => void;
  clearFilters: () => void;
}

export function ProgramFiltersBar({
  filters,
  hasActiveFilters,
  updateFilters,
  clearFilters,
}: ProgramFiltersBarProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_180px_220px_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="award-program-search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Label>
            <Input
              id="award-program-search"
              placeholder="Search by name or description..."
              value={filters.search || ""}
              onChange={(event) => updateFilters({ search: event.target.value || undefined })}
            />
          </div>

          <div className="space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              Status
            </span>
            <Select
              value={filters.status && filters.status.length > 0 ? filters.status[0] : "all"}
              onValueChange={(value) =>
                updateFilters({
                  status: value === "all" ? undefined : [value as AwardProgramStatus],
                })
              }
            >
              <SelectTrigger aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Category</span>
            <Select
              value={filters.category && filters.category.length > 0 ? filters.category[0] : "all"}
              onValueChange={(value) =>
                updateFilters({
                  category: value === "all" ? undefined : [value as AwardCategory],
                })
              }
            >
              <SelectTrigger aria-label="Filter by category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" onClick={clearFilters} disabled={!hasActiveFilters}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
