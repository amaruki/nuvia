"use client";

/**
 * D5: workspaces dashboard hook backed by the real workspaces API.
 *
 * - List reads /api/v1/workspaces with the active filters; mutations POST /
 *   PATCH / DELETE and invalidate the list cache.
 * - The API serves ISO date strings; toWorkspaceUi hydrates them to Date at
 *   the wire boundary (nested roster/document/task/discussion/meeting/
 *   activity collections included).
 * - Statistics are computed client-side from the fetched rows — never
 *   invented — the same pattern use-committees uses.
 */

import { useMemo, useState } from "react";

import type { WorkspaceFilterOptions } from "@/types/committee";

import { ApiClientError } from "@/lib/api-client";

import { DEFAULT_FILTERS } from "./constants";
import type { UseWorkspacesReturn } from "./types";
import { useFilteredWorkspaces } from "./use-filtered-workspaces";
import { useWorkspaceMutations } from "./use-workspace-mutations";
import { buildWorkspaceStatistics } from "./workspace-statistics";

export { toWorkspaceUi } from "./hydrate-workspace";
export type { WireWorkspace } from "./types";

export function useWorkspaces(): UseWorkspacesReturn {
  const [filters, setFilters] = useState<WorkspaceFilterOptions>(DEFAULT_FILTERS);

  const listQuery = useFilteredWorkspaces(filters);

  const {
    invalidateWorkspaces,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    toggleWorkspaceStatus,
  } = useWorkspaceMutations();

  const workspaces = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const statistics = useMemo(() => buildWorkspaceStatistics(workspaces), [workspaces]);

  const activeWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.status === "active"),
    [workspaces],
  );
  const archivedWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.status === "archived"),
    [workspaces],
  );
  const lockedWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.status === "locked"),
    [workspaces],
  );

  return {
    // Data
    workspaces,
    statistics,
    loading: listQuery.isPending,
    error: listQuery.error
      ? listQuery.error instanceof ApiClientError
        ? listQuery.error.message
        : "Failed to fetch workspaces. Please try again."
      : null,
    filters,

    // Computed
    activeWorkspaces,
    archivedWorkspaces,
    lockedWorkspaces,

    // Actions
    updateFilters: (newFilters: Partial<WorkspaceFilterOptions>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    clearFilters: () => setFilters(DEFAULT_FILTERS),
    refreshData: invalidateWorkspaces,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    toggleWorkspaceStatus,
  };
}
