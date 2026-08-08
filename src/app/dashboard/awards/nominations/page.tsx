"use client";

/**
 * Award Nominations — real list page backed by GET /api/v1/awards/nominations
 * (backlog D4). Status filters and search render from the fetched page —
 * nothing is mocked.
 */

import { useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, Award, Filter, Inbox, RefreshCw, Search, X } from "lucide-react";
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
import { useAwardNominations } from "@/lib/hooks/use-awards";
import type { AwardNominationStatus } from "@/types/award.types";

const STATUS_BADGE_VARIANTS: Record<
  AwardNominationStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  approved: "default",
  under_review: "secondary",
  pending: "outline",
  rejected: "destructive",
};

const STATUS_OPTIONS: { value: AwardNominationStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function formatEnumLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

export default function AwardNominations() {
  const { setHeader, clearHeader } = useHeader();
  const {
    nominations,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
  } = useAwardNominations();

  useEffect(() => {
    setHeader({
      title: "Award Nominations",
      description: "Review nominations submitted against award programs",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const hasActiveFilters = Boolean(
    (filters.status && filters.status.length > 0) || filters.search?.trim(),
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
      {/* Review queue summary (computed from the fetched page) */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <Award className="h-4 w-4 text-primary" />
              {statistics.totalNominations} nomination{statistics.totalNominations === 1 ? "" : "s"}
            </span>
            <span className="text-muted-foreground">{statistics.pending} pending</span>
            <span className="text-muted-foreground">{statistics.underReview} under review</span>
            <span className="text-emerald-600">{statistics.approved} approved</span>
            <span className="text-rose-600">{statistics.rejected} rejected</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_200px_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="award-nomination-search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Label>
              <Input
                id="award-nomination-search"
                placeholder="Search by nominee or nominator..."
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
                    status: value === "all" ? undefined : [value as AwardNominationStatus],
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
          {nominations.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-10 w-10 text-muted-foreground" />}
              title={hasActiveFilters ? "No nominations match your filters" : "No nominations yet"}
              description={
                hasActiveFilters
                  ? "Try adjusting the status filter or search terms."
                  : "Nominations created through the awards API will appear here."
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
                  <TableHead>Nominee</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Nominator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nominations.map((nomination) => (
                  <TableRow key={nomination.id}>
                    <TableCell className="max-w-xs">
                      <div className="font-medium">{nomination.nomineeName}</div>
                      <div className="truncate text-sm text-muted-foreground">
                        {nomination.nomineeEmail}
                      </div>
                    </TableCell>
                    <TableCell>{nomination.programName || "—"}</TableCell>
                    <TableCell className="max-w-xs">
                      <div>{nomination.nominatorName}</div>
                      <div className="truncate text-sm text-muted-foreground">
                        {nomination.nominatorEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANTS[nomination.status]}>
                        {formatEnumLabel(nomination.status)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-sm text-muted-foreground"
                      title={format(nomination.createdAt, "PPP p")}
                    >
                      {formatDistanceToNow(nomination.createdAt, { addSuffix: true })}
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
