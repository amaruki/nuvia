"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { WorkspaceFilterOptions } from "@/types/committee";

import { toWorkspaceUi } from "./hydrate-workspace";
import type { WireWorkspace } from "./types";
import { workspacesQueryPath } from "./use-workspace-utilities";

/**
 * Workspace list for the active filters. Filtering happens server-side — the
 * filters ride along as /api/v1/workspaces query params — so this hook only
 * fetches and hydrates the rows the API returns.
 */
export function useFilteredWorkspaces(filters: WorkspaceFilterOptions) {
  return useQuery({
    queryKey: ["workspaces", "list", filters],
    queryFn: async () => {
      const { data } = await apiFetch<WireWorkspace[]>(workspacesQueryPath(filters));
      return data.map(toWorkspaceUi);
    },
  });
}
