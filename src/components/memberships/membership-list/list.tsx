"use client";

import { useState } from "react";
import { MemberCard } from "../member-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { countActiveFilters, parseSortValue } from "./helpers";
import ListHeader from "./list-header";
import ListLoadingState from "./loading-state";
import type { MembershipListProps } from "./types";

export function MembershipList({
  members,
  isLoading,
  isFetching,
  total,
  totalPages,
  page,
  onPageChange,
  filters,
  sort,
  onSortChange,
  onClearFilters,
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

      {/* Server-side pagination (replaces load-more) */}
      {members.length > 0 && (
        <div className={cn("space-y-3 pt-4", isFetching && "opacity-70 transition-opacity")}>
          <div className="text-center text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} member{total === 1 ? "" : "s"} total
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  aria-disabled={page <= 1}
                  className={cn(page <= 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "ellipsis")[]>((acc, p, idx, list) => {
                  if (idx > 0 && p - (list[idx - 1] as number) > 1) acc.push("ellipsis");
                  acc.push(p);
                  return acc;
                }, [])
                .map((entry, idx) =>
                  entry === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={entry}>
                      <PaginationLink
                        onClick={() => onPageChange(entry)}
                        isActive={entry === page}
                        aria-current={entry === page ? "page" : undefined}
                      >
                        {entry}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  aria-disabled={page >= totalPages}
                  className={cn(page >= totalPages && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
