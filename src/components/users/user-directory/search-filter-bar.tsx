import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Filter, Grid3X3, List, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, getSortValue, parseSortValue } from "./helpers";
import type { UserDirectorySearchFilterBarProps } from "./types";

export default function UserDirectorySearchFilterBar({
  sort,
  onSortChange,
  isGridView,
  onViewModeChange,
  activeFiltersCount,
  onClearFilters,
  shownCount,
  total,
}: UserDirectorySearchFilterBarProps) {
  return (
    <>
      {/* Controls Bar - Mobile Optimized */}
      <div className="space-y-3">
        {/* Primary Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Sort Dropdown - Full width on mobile */}
          <Select
            value={getSortValue(sort)}
            onValueChange={(value) => onSortChange(parseSortValue(value))}
          >
            <SelectTrigger className="w-full sm:w-[200px] h-10 font-medium">
              <ArrowUpDown className="size-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="font-medium">
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border bg-background shadow-sm">
            <Button
              variant={isGridView ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange(true)}
              className={cn("h-10 px-3 rounded-r-none border-r", isGridView && "shadow-sm")}
              aria-label="Grid view"
            >
              <Grid3X3 className="size-4 mr-2" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={!isGridView ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange(false)}
              className={cn("h-10 px-3 rounded-l-none", !isGridView && "shadow-sm")}
              aria-label="Table view"
            >
              <List className="size-4 mr-2" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </div>
        </div>

        {/* Secondary Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 font-medium">
                <Filter className="size-3.5" />
                {activeFiltersCount} Active
              </Badge>
              {onClearFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-10 gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </Button>
              )}
            </div>
          )}

          {/* Results Counter */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing</span>
            <Badge variant="outline" className="font-mono font-semibold">
              {shownCount}
            </Badge>
            {shownCount !== total && (
              <>
                <span>of</span>
                <Badge variant="outline" className="font-mono font-semibold">
                  {total}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Results Counter */}
      {activeFiltersCount > 0 && (
        <div className="lg:hidden flex items-center gap-2 text-sm px-1">
          <span className="text-muted-foreground">
            Showing {shownCount.toLocaleString()} of {total.toLocaleString()} users
          </span>
        </div>
      )}
    </>
  );
}
