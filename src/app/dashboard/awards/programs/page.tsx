"use client";

/**
 * Award Programs — real list page backed by GET /api/v1/awards/programs
 * (backlog D4). Stats cards, status/category filters and search all render
 * from the fetched page — nothing is mocked.
 */

import { useEffect } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  Archive,
  Award,
  Filter,
  FolderOpen,
  RefreshCw,
  Search,
  Trophy,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHeader } from "@/contexts/dashboard-context";
import { useAwardPrograms } from "@/lib/hooks/use-awards";
import type { AwardCategory, AwardProgram, AwardProgramStatus } from "@/types/award.types";

const STATUS_BADGE_VARIANTS: Record<AwardProgramStatus, "default" | "secondary" | "outline"> = {
  open: "default",
  draft: "outline",
  closed: "secondary",
  archived: "secondary",
};

const CATEGORY_BADGE_CLASSES: Record<AwardCategory, string> = {
  achievement: "bg-purple-100 text-purple-800 border-purple-200",
  service: "bg-green-100 text-green-800 border-green-200",
  leadership: "bg-blue-100 text-blue-800 border-blue-200",
  innovation: "bg-orange-100 text-orange-800 border-orange-200",
  scholarship: "bg-indigo-100 text-indigo-800 border-indigo-200",
  lifetime_achievement: "bg-amber-100 text-amber-800 border-amber-200",
};

const STATUS_OPTIONS: { value: AwardProgramStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

const CATEGORY_OPTIONS: { value: AwardCategory; label: string }[] = [
  { value: "achievement", label: "Achievement" },
  { value: "service", label: "Service" },
  { value: "leadership", label: "Leadership" },
  { value: "innovation", label: "Innovation" },
  { value: "scholarship", label: "Scholarship" },
  { value: "lifetime_achievement", label: "Lifetime Achievement" },
];

function formatEnumLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

function formatDateRange(program: AwardProgram): string {
  if (!program.openDate && !program.closeDate) return "—";
  const open = program.openDate ? format(program.openDate, "MMM d, yyyy") : "…";
  const close = program.closeDate ? format(program.closeDate, "MMM d, yyyy") : "…";
  return `${open} – ${close}`;
}

export default function AwardPrograms() {
  const { setHeader, clearHeader } = useHeader();
  const {
    programs,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
  } = useAwardPrograms();

  useEffect(() => {
    setHeader({
      title: "Award Programs",
      description: "Manage award programs, nomination windows, and categories",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const hasActiveFilters = Boolean(
    (filters.status && filters.status.length > 0) ||
    (filters.category && filters.category.length > 0) ||
    filters.search?.trim(),
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Programs</p>
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{statistics.totalPrograms}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {statistics.draftPrograms} drafts, {statistics.archivedPrograms} archived
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Open for Nominations</p>
              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{statistics.openPrograms}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {statistics.closedPrograms} closed
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Nominations</p>
              <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                <Award className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{statistics.totalNominations}</span>
              <span className="text-xs text-muted-foreground mt-1">across all programs</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Categories</p>
              <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                <Archive className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-bold">{statistics.categoryBreakdown.length}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {statistics.categoryBreakdown[0]
                  ? `${formatEnumLabel(statistics.categoryBreakdown[0].category)} leads`
                  : "no programs yet"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
                value={
                  filters.category && filters.category.length > 0 ? filters.category[0] : "all"
                }
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {programs.length === 0 ? (
            <EmptyState
              icon={<Trophy className="h-10 w-10 text-muted-foreground" />}
              title={hasActiveFilters ? "No programs match your filters" : "No award programs yet"}
              description={
                hasActiveFilters
                  ? "Try adjusting the status, category, or search terms."
                  : "Award programs created through the awards API will appear here."
              }
              actions={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Nominations</TableHead>
                  <TableHead>Nomination Window</TableHead>
                  <TableHead>Award Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="max-w-xs">
                      <div className="font-medium">{program.name}</div>
                      {program.description && (
                        <div className="truncate text-sm text-muted-foreground">
                          {program.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={CATEGORY_BADGE_CLASSES[program.category]}>
                        {formatEnumLabel(program.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANTS[program.status]}>
                        {formatEnumLabel(program.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{program.nominationCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateRange(program)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {program.awardDate ? format(program.awardDate, "MMM d, yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
