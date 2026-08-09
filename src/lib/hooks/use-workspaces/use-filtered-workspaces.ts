"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAllPages } from "@/lib/hooks/fetch-all-pages";

import { toWorkspaceUi } from "./hydrate-workspace";
import type { WireWorkspace } from "./types";
import { WORKSPACES_API_PATH } from "./constants";
import { workspaceFilterParams } from "./use-workspace-utilities";
import type { WorkspaceFilterOptions } from "@/types/committee";

/**
 * Workspace list for the active filters. Filtering happens server-side — the
 * filters ride along as /api/v1/workspaces query params — and every matching
 * page is drained via fetchAllPages (no silent row cap).
 */
export function useFilteredWorkspaces(filters: WorkspaceFilterOptions) {
  return useQuery({
    queryKey: ["workspaces", "list", filters],
    queryFn: async () => {
      const rows = await fetchAllPages<WireWorkspace>(
        WORKSPACES_API_PATH,
        workspaceFilterParams(filters),
      );
      return rows.map(toWorkspaceUi);
    },
  });
}
