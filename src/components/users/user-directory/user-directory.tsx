"use client";

import { useState } from "react";
import { UserStats } from "../user-stats";
import { UserFilter } from "../user-filter";
import { UserActions } from "../user-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users, Download, Filter, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import UserDirectoryEmptyState from "./empty-state";
import UserDirectoryGridView from "./grid-view";
import UserDirectoryListView from "./list-view";
import UserDirectoryLoadingSkeleton from "./loading-skeleton";
import UserDirectorySearchFilterBar from "./search-filter-bar";
import { getActiveFiltersCount } from "./helpers";
import type { UserDirectoryProps } from "./types";

export function UserDirectory({
  users,
  total,
  stats,
  filters,
  sort,
  isLoading,
  onFilterChange,
  onSortChange,
  onClearFilters,
  currentUserRole,
  className,
}: UserDirectoryProps) {
  const [isGridView, setIsGridView] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = getActiveFiltersCount(filters);

  const handleUserSelect = (userId: string, checked: boolean) => {
    setSelectedUsers((prev) => (checked ? [...prev, userId] : prev.filter((id) => id !== userId)));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? users.map((user) => user.id) : []);
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  const isAdmin = currentUserRole === "admin" || currentUserRole === "moderator";

  if (isLoading && users.length === 0) {
    return <UserDirectoryLoadingSkeleton className={className} />;
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
              <h2 className="text-2xl font-bold tracking-tight">User Directory</h2>
              <p className="text-sm text-muted-foreground">
                {total.toLocaleString()} {total === 1 ? "user" : "users"} total
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="size-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="size-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full gap-2"
          >
            <Search className="size-4" />
            Search & Filters
          </Button>
        </div>

        <UserDirectorySearchFilterBar
          sort={sort}
          onSortChange={onSortChange}
          isGridView={isGridView}
          onViewModeChange={setIsGridView}
          activeFiltersCount={activeFiltersCount}
          onClearFilters={onClearFilters}
          shownCount={users.length}
          total={total}
        />
      </div>

      {/* Statistics Dashboard */}
      <UserStats stats={stats} />

      <Separator className="opacity-50" />

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-2 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filters</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <UserFilter
              filters={filters}
              onFilterChange={onFilterChange}
              onClearFilters={onClearFilters}
            />
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedUsers.length > 0 && (
        <UserActions
          selectedUsers={selectedUsers}
          onClearSelection={handleClearSelection}
          currentUserRole={currentUserRole}
        />
      )}

      {/* User Grid/Table */}
      {users.length > 0 ? (
        isGridView ? (
          <UserDirectoryGridView
            users={users}
            selectedUsers={selectedUsers}
            onSelectUser={handleUserSelect}
            showSelection={isAdmin}
          />
        ) : (
          <UserDirectoryListView
            users={users}
            selectedUsers={selectedUsers}
            onSelectUser={handleUserSelect}
            onSelectAll={handleSelectAll}
            sort={sort}
            onSort={onSortChange}
            showSelection={isAdmin}
          />
        )
      ) : (
        <UserDirectoryEmptyState
          activeFiltersCount={activeFiltersCount}
          onClearFilters={onClearFilters}
        />
      )}

      {/* Loading More Indicator */}
      {isLoading && users.length > 0 && (
        <div className="flex justify-center pt-6">
          <Card className="border-dashed">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="font-medium">Loading more users...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Info Bar */}
      {users.length > 0 && !isLoading && (
        <div className="flex justify-center pt-4">
          <div className="text-sm text-muted-foreground px-4 py-2 rounded-full bg-muted/50">
            Showing all {total} users
          </div>
        </div>
      )}
    </div>
  );
}
