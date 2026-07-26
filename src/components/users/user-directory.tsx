"use client";

import { useState } from "react";
import { UserCard } from "./user-card";
import { UserTable } from "./user-table";
import { UserStats } from "./user-stats";
import { UserFilter } from "./user-filter";
import { UserActions } from "./user-actions";
import {
  UserProfile,
  UserFilter as UserFilterType,
  UserSort,
  UserStats as UserStatsType,
} from "@/types/user-management.types";
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
import { Separator } from "@/components/ui/separator";
import LoadingSkeleton from "@/components/ui/loading-skeleton";
import {
  Users,
  ArrowUpDown,
  Download,
  Grid3X3,
  List,
  Filter,
  X,
  Loader2,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserDirectoryProps {
  users: UserProfile[];
  total: number;
  stats: UserStatsType;
  filters: UserFilterType;
  sort: UserSort;
  isLoading: boolean;
  onFilterChange: (filters: UserFilterType) => void;
  onSortChange: (sort: UserSort) => void;
  onClearFilters?: () => void;
  currentUserRole?: string;
  className?: string;
}

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A-Z)", icon: "↑" },
  { value: "name-desc", label: "Name (Z-A)", icon: "↓" },
  { value: "createdAt-desc", label: "Newest First", icon: "🆕" },
  { value: "createdAt-asc", label: "Oldest First", icon: "📅" },
  { value: "userRole-asc", label: "Role ↑", icon: "👤" },
  { value: "userRole-desc", label: "Role ↓", icon: "👤" },
  { value: "status-asc", label: "Status ↑", icon: "🔵" },
  { value: "status-desc", label: "Status ↓", icon: "🔵" },
  { value: "lastLoginAt-desc", label: "Recent Login", icon: "🕐" },
  { value: "lastLoginAt-asc", label: "Last Login", icon: "🕐" },
];

function parseSortValue(value: string): UserSort {
  const [field, direction] = value.split("-") as [UserSort["field"], "asc" | "desc"];
  return { field, direction };
}

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

  const handleSortChange = (value: string) => {
    onSortChange(parseSortValue(value));
  };

  const getSortValue = () => {
    return `${sort.field}-${sort.direction}`;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.roles?.length) count++;
    if (filters.statuses?.length) count++;
    if (filters.authStatuses?.length) count++;
    if (filters.emailVerified !== undefined) count++;
    if (filters.phoneVerified !== undefined) count++;
    if (filters.locations?.length) count++;
    if (filters.registrationDateRange) count++;
    if (filters.lastLoginRange) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

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
                <h2 className="text-2xl font-bold">User Directory</h2>
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

        {/* Loading Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <LoadingSkeleton className="h-4 w-20 mb-2" />
                <LoadingSkeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
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

        {/* Controls Bar - Mobile Optimized */}
        <div className="space-y-3">
          {/* Primary Controls */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {/* Sort Dropdown - Full width on mobile */}
            <Select value={getSortValue()} onValueChange={handleSortChange}>
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
                onClick={() => setIsGridView(true)}
                className={cn("h-10 px-3 rounded-r-none border-r", isGridView && "shadow-sm")}
                aria-label="Grid view"
              >
                <Grid3X3 className="size-4 mr-2" />
                <span className="hidden sm:inline">Grid</span>
              </Button>
              <Button
                variant={!isGridView ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsGridView(false)}
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
                {users.length}
              </Badge>
              {users.length !== total && (
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
              Showing {users.length.toLocaleString()} of {total.toLocaleString()} users
            </span>
          </div>
        )}
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
        <div
          className={cn(
            isGridView
              ? "grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-0",
          )}
        >
          {isGridView ? (
            // Grid View
            users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                selected={selectedUsers.includes(user.id)}
                onSelect={(checked) => handleUserSelect(user.id, checked)}
                showSelection={isAdmin}
              />
            ))
          ) : (
            // Table View
            <UserTable
              users={users}
              selectedUsers={selectedUsers}
              onSelectUser={handleUserSelect}
              onSelectAll={handleSelectAll}
              sort={sort}
              onSort={onSortChange}
              showSelection={isAdmin}
            />
          )}
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
              title="No users found"
              description={
                activeFiltersCount > 0
                  ? "No users match your current filters. Try adjusting your search criteria."
                  : "The user directory is currently empty. Check back later for updates."
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
