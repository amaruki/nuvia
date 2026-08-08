"use client";

/**
 * Award Programs — real list page backed by GET /api/v1/awards/programs
 * (backlog D4). Stats cards, status/category filters and search all render
 * from the fetched page — nothing is mocked.
 */

import { useEffect } from "react";
import { useHeader } from "@/contexts/dashboard-context";
import { useAwardPrograms } from "@/lib/hooks/use-awards";
import { ProgramFiltersBar } from "./_components/program-filters-bar";
import { ProgramsErrorState, ProgramsLoadingState } from "./_components/program-page-states";
import { ProgramStatsCards } from "./_components/program-stats-cards";
import { ProgramTable } from "./_components/program-table";

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
    return <ProgramsLoadingState />;
  }

  if (error) {
    return <ProgramsErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      <ProgramStatsCards statistics={statistics} />
      <ProgramFiltersBar
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        updateFilters={updateFilters}
        clearFilters={clearFilters}
      />
      <ProgramTable
        programs={programs}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
      />
    </div>
  );
}
