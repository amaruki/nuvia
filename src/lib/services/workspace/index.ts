/**
 * Workspace CRUD over the real `workspaces` table (backlog D5, promotion
 * queue).
 *
 * - Rows map to the UI shape (CommitteeWorkspace in
 *   src/types/committee/) — the same contract the mock-era hook
 *   served. The members/documents/tasks/discussions/meetings/activity
 *   collections travel as jsonb and start empty; no backing tables exist
 *   for them yet, the same staging pattern chapters uses for
 *   metrics/events/finances.
 * - Every failure throws WorkspaceServiceError carrying an RFC 9457
 *   problem; the /api/v1/workspaces routes map it via handleWorkspaceRoute.
 * - `name` is unique; duplicates surface as a 409 conflict.
 *
 * Split from src/lib/services/workspace.service.ts, which stays as a
 * re-export shim so `@/lib/services/workspace.service` keeps resolving.
 */

export type { Paginated, WorkspaceListFilters } from "./types";
export {
  WORKSPACE_MEMBER_ROLES,
  WORKSPACE_STATUSES,
  WORKSPACE_TYPES,
  WorkspaceServiceError,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspacePermissionSchema,
  workspaceSettingsInputSchema,
} from "./helpers";
export type { CreateWorkspaceInput, UpdateWorkspaceInput, WorkspaceSettingsInput } from "./helpers";
export { getWorkspace, listWorkspaces } from "./queries";
export { createWorkspace, deleteWorkspace, updateWorkspace } from "./mutations";
