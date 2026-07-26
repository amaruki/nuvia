"use client";

import { useState } from "react";
import { MemberCard } from "./member-card";
import { MembershipProfile, MembershipFilter, MembershipSort } from "@/types/membership.types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import LoadingSkeleton from "@/components/ui/loading-skeleton";
import { Users, ArrowUpDown, Download, Grid3X3, List, Filter, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MembershipListProps {
  members: MembershipProfile[];
  isLoading: boolean;
  total: number;
  filters: MembershipFilter;
  sort: MembershipSort;
  onSortChange: (sort: MembershipSort) => void;
  onClearFilters?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A-Z)", icon: "↑" },
  { value: "name-desc", label: "Name (Z-A)", icon: "↓" },
  { value: "membershipStartDate-desc", label: "Newest First", icon: "🆕" },
  { value: "membershipStartDate-asc", label: "Oldest First", icon: "📅" },
  { value: "membershipTier-asc", label: "Tier ↑", icon: "⭐" },
  { value: "membershipTier-desc", label: "Tier ↓", icon: "⭐" },
  { value: "location-asc", label: "Location (A-Z)", icon: "📍" },
  { value: "company-asc", label: "Company (A-Z)", icon: "🏢" },
];

function parseSortValue(value: string): MembershipSort {
  const [field, direction] = value.split("-") as [MembershipSort["field"], "asc" | "desc"];
  return { field, direction };
}

export function MembershipList({
  members,
  isLoading,
  total,
  filters,
  sort,
  onSortChange,
  onClearFilters,
  onLoadMore,
  hasMore,
  className,
}: MembershipListProps) {
  const [isGridView, setIsGridView] = useState(true);

  const handleSortChange = (value: string) => {
    onSortChange(parseSortValue(value));
  };

  const getSortValue = () => {
    return `${sort.field}-${sort.direction}`;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.tiers?.length) count++;
    if (filters.statuses?.length) count++;
    if (filters.locations?.length) count++;
    if (filters.committees?.length) count++;
    if (filters.startDateRange) count++;
    if (filters.endDateRange) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  if (isLoading && members.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Loading Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Member Directory</h2>
                <LoadingSkeleton className="h-4 w-32 mt-1" />
              </div>
            </div>
            <LoadingSkeleton className="h-10 w-32" />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <LoadingSkeleton className="h-10 w-48" />
            <LoadingSkeleton className="h-10 w-24" />
            <LoadingSkeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Loading Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="animate-pulse border-l-4 border-l-muted">
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-5">
                  <LoadingSkeleton className="size-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <LoadingSkeleton className="h-5 w-32" />
                    <LoadingSkeleton className="h-4 w-24" />
                    <LoadingSkeleton className="h-4 w-28" />
                  </div>
                </div>
                <div className="space-y-3">
                  <LoadingSkeleton className="h-4 w-full" />
                  <LoadingSkeleton className="h-4 w-full" />
                  <LoadingSkeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Enhanced Header */}
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
          <Select value={getSortValue()} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[200px] h-10 font-medium">
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
              onClick={() => setIsGridView(true)}
              className={cn("h-10 px-3 rounded-r-none border-r", isGridView && "shadow-sm")}
            >
              <Grid3X3 className="size-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={!isGridView ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsGridView(false)}
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
              {members.length}
            </Badge>
            {members.length !== total && (
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
              Showing {members.length.toLocaleString()} of {total.toLocaleString()} members
            </span>
          </div>
        )}
      </div>

      {/* Member Grid/List */}
      {members.length > 0 ? (
        <div
          className={cn(
            "gap-5",
            isGridView ? "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col",
          )}
        >
          {members.map((member) => (
            <MemberCard key={member.id} member={member} className={cn(!isGridView)} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12">
            <EmptyState
              icon={
                <div className="flex items-center justify-center size-16 rounded-full bg-muted/50 mb-4">
                  <Users className="size-8 text-muted-foreground" />
                </div>
              }
              title="No members found"
              description={
                activeFiltersCount > 0
                  ? "No members match your current filters. Try adjusting your search criteria."
                  : "The member directory is currently empty. Check back later for updates."
              }
              actions={
                activeFiltersCount > 0 && onClearFilters ? (
                  <Button variant="outline" onClick={onClearFilters} className="gap-2">
                    <X className="size-4" />
                    Clear All Filters
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Load More Section */}
      {hasMore && !isLoading && members.length > 0 && (
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {members.length} of {total} members
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={onLoadMore}
            disabled={!onLoadMore}
            className="min-w-[200px] font-medium"
          >
            Load More Members
          </Button>
        </div>
      )}

      {/* Loading More Indicator */}
      {isLoading && members.length > 0 && (
        <div className="flex justify-center pt-6">
          <Card className="border-dashed">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="font-medium">Loading more members...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Info Bar */}
      {members.length > 0 && !hasMore && (
        <div className="flex justify-center pt-4">
          <div className="text-sm text-muted-foreground px-4 py-2 rounded-full bg-muted/50">
            All {total} members loaded
          </div>
        </div>
      )}
    </div>
  );
}
