import type { WorkspaceFilterOptions, WorkspaceType } from "@/types/committee";

/** Base route for the workspaces API; item routes append `/${id}`. */
export const WORKSPACES_API_PATH = "/api/v1/workspaces";

export const DEFAULT_FILTERS: WorkspaceFilterOptions = {};

export const WORKSPACE_TYPE_OPTIONS: WorkspaceType[] = [
  "general",
  "project",
  "document",
  "discussion",
  "meeting",
];
