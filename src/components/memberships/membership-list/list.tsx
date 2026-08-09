"use client";

import { useState } from "react";
import { MemberCard } from "../member-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { countActiveFilters, parseSortValue } from "./helpers";
import ListHeader from "./list-header";
import ListLoadingState from "./loading-state";
import type { MembershipListProps } from "./types";

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

  const activeFiltersCount = countActiveFilters(filters);

  if (isLoading && members.length === 0) {
    return <ListLoadingState className={className} />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Enhanced Header */}
      <ListHeader
        total={total}
        resultCount={members.length}
        sortValue={getSortValue()}
        onSortChange={handleSortChange}
        isGridView={isGridView}
        onViewChange={setIsGridView}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={onClearFilters}
      />

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
