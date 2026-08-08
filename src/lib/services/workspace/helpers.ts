/**
 * Shared workspace service internals — the RFC 9457 error carrier, postgres
 * error-code plumbing, validation schemas mirroring the add-workspace form,
 * UI<->DB enum and row mapping, and the list pagination/filter primitives.
 */

import { z } from "zod";
import type { ProblemDetails } from "@/lib/http";
import type {
  CommitteeWorkspace,
  WorkspaceSettings,
  WorkspaceStatus,
  WorkspaceType,
} from "@/types/committee";
import type { DbWorkspaceStatus, DbWorkspaceType, WorkspaceRow } from "./types";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class WorkspaceServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "WorkspaceServiceError";
  }
}

export const UNIQUE_VIOLATION = "23505";

export function pgErrorCode(error: unknown): string | null {
  // drizzle wraps the driver error in DrizzleQueryError, so walk the cause
  // chain until a postgres error code surfaces.
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== null && typeof current === "object"; depth += 1) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Validation schemas (mirror the add-workspace form so form-valid payloads
// are API-accepted; the API additionally accepts status and committeeId for
// programmatic callers)
// ---------------------------------------------------------------------------

export const WORKSPACE_TYPES = ["general", "project", "document", "discussion", "meeting"] as const;
export const WORKSPACE_STATUSES = ["active", "archived", "locked"] as const;
export const WORKSPACE_MEMBER_ROLES = [
  "chair",
  "co_chair",
  "secretary",
  "treasurer",
  "member",
  "advisor",
] as const;
const WORKSPACE_PERMISSIONS = [
  "view",
  "edit",
  "delete",
  "upload",
  "download",
  "manage_members",
  "manage_settings",
] as const;

const workspaceTypeSchema = z.enum(WORKSPACE_TYPES);
const workspaceStatusSchema = z.enum(WORKSPACE_STATUSES);

export const workspacePermissionSchema = z.object({
  role: z.enum(WORKSPACE_MEMBER_ROLES),
  permissions: z.array(z.enum(WORKSPACE_PERMISSIONS)),
});

export const workspaceSettingsInputSchema = z.object({
  isPublic: z.boolean(),
  allowGuestAccess: z.boolean(),
  requireApproval: z.boolean(),
  enableNotifications: z.boolean(),
  autoArchiveDays: z.number().int().min(1).max(1095),
  maxFileSize: z.number().int().min(1).max(1000),
  allowedFileTypes: z.array(z.string().min(1)).min(1),
  memberPermissions: z.array(workspacePermissionSchema).min(1),
});

export type WorkspaceSettingsInput = z.infer<typeof workspaceSettingsInputSchema>;

export const createWorkspaceSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(2000).optional(),
  type: workspaceTypeSchema.default("general"),
  status: workspaceStatusSchema.default("active"),
  committeeId: z
    .union([z.uuid(), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null)),
  settings: workspaceSettingsInputSchema,
});

export const updateWorkspaceSchema = createWorkspaceSchema
  .partial()
  // .partial() keeps zod defaults live, which would let an empty {} PATCH
  // reset type/status — override with plain optionals for updates.
  .extend({
    type: workspaceTypeSchema.optional(),
    status: workspaceStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

// ---------------------------------------------------------------------------
// Status/type mapping (DB enums are SCREAMING_SNAKE, UI is lowercase)
// ---------------------------------------------------------------------------

export const UI_TO_DB_TYPE: Record<WorkspaceType, DbWorkspaceType> = {
  general: "GENERAL",
  project: "PROJECT",
  document: "DOCUMENT",
  discussion: "DISCUSSION",
  meeting: "MEETING",
};

const DB_TO_UI_TYPE: Record<DbWorkspaceType, WorkspaceType> = {
  GENERAL: "general",
  PROJECT: "project",
  DOCUMENT: "document",
  DISCUSSION: "discussion",
  MEETING: "meeting",
};

export const UI_TO_DB_STATUS: Record<WorkspaceStatus, DbWorkspaceStatus> = {
  active: "ACTIVE",
  archived: "ARCHIVED",
  locked: "LOCKED",
};

const DB_TO_UI_STATUS: Record<DbWorkspaceStatus, WorkspaceStatus> = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  LOCKED: "locked",
};

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

/** jsonb blobs may be null/objects after hand edits — always surface arrays. */
function toJsonbArray<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

function toUiSettings(raw: unknown): WorkspaceSettings {
  const s = (raw ?? {}) as Partial<WorkspaceSettings>;
  return {
    isPublic: s.isPublic ?? false,
    allowGuestAccess: s.allowGuestAccess ?? false,
    requireApproval: s.requireApproval ?? true,
    enableNotifications: s.enableNotifications ?? true,
    autoArchiveDays: s.autoArchiveDays ?? 365,
    maxFileSize: s.maxFileSize ?? 50,
    allowedFileTypes: Array.isArray(s.allowedFileTypes) ? s.allowedFileTypes : [],
    memberPermissions: Array.isArray(s.memberPermissions) ? s.memberPermissions : [],
  };
}

export function toUiWorkspace(row: WorkspaceRow): CommitteeWorkspace {
  return {
    id: row.id,
    // Unlinked workspaces render an empty committee handle; the table's
    // committee link is decorative until the workspace gets linked.
    committeeId: row.committeeId ?? "",
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    type: DB_TO_UI_TYPE[row.type] ?? "general",
    status: DB_TO_UI_STATUS[row.status] ?? "active",
    settings: toUiSettings(row.settings),
    members: toJsonbArray(row.members),
    documents: toJsonbArray(row.documents),
    tasks: toJsonbArray(row.tasks),
    discussions: toJsonbArray(row.discussions),
    meetings: toJsonbArray(row.meetings),
    activity: toJsonbArray(row.activity),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    ...(row.updatedBy ? { updatedBy: row.updatedBy } : {}),
  };
}

// ---------------------------------------------------------------------------
// List primitives
// ---------------------------------------------------------------------------

export function paginate(
  page?: number,
  limit?: number,
): { page: number; limit: number; offset: number } {
  const safePage = Math.max(1, Math.trunc(page ?? 1));
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit ?? 20)));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

export function csvValues(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}
