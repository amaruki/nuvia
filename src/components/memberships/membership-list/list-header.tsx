import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowUpDown, Download, Grid3X3, List, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS } from "./helpers";

interface ListHeaderProps {
  total: number;
  resultCount: number;
  sortValue: string;
  onSortChange: (value: string) => void;
  isGridView: boolean;
  onViewChange: (isGridView: boolean) => void;
  activeFiltersCount: number;
  onClearFilters?: () => void;
}

export default function ListHeader({
  total,
  resultCount,
  sortValue,
  onSortChange,
  isGridView,
  onViewChange,
  activeFiltersCount,
  onClearFilters,
}: ListHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Member Directory</h2>
            <p className="text-sm text-muted-foreground">
              {total.toLocaleString()} {total === 1 ? "member" : "members"} total
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Sort Dropdown */}
        <Select value={sortValue} onValueChange={onSortChange}>
          <SelectTrigger aria-label="Sort members" className="w-[200px] h-10 font-medium">
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
            onClick={() => onViewChange(true)}
            className={cn("h-10 px-3 rounded-r-none border-r", isGridView && "shadow-sm")}
          >
            <Grid3X3 className="size-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={!isGridView ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange(false)}
            className={cn("h-10 px-3 rounded-l-none", !isGridView && "shadow-sm")}
          >
            <List className="size-4 mr-2" />
            List
          </Button>
        </div>

        {/* Active Filters Indicator */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
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
                Clear All
              </Button>
            )}
          </div>
        )}

        {/* Results Counter */}
        <div className="ml-auto hidden lg:flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Showing</span>
          <Badge variant="outline" className="font-mono font-semibold">
            {resultCount}
          </Badge>
          {resultCount !== total && (
            <>
              <span className="text-muted-foreground">of</span>
              <Badge variant="outline" className="font-mono font-semibold">
                {total}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Mobile Results Counter */}
      {activeFiltersCount > 0 && (
        <div className="lg:hidden flex items-center gap-2 text-sm px-1">
          <span className="text-muted-foreground">
            Showing {resultCount.toLocaleString()} of {total.toLocaleString()} members
          </span>
        </div>
      )}
    </div>
  );
}
