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
 */

import { and, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { committee, workspace } from "@/db/schema";
import { problem, problems, type ProblemDetails } from "@/lib/http";
import type {
  CommitteeRole,
  CommitteeWorkspace,
  WorkspaceSettings,
  WorkspaceStatus,
  WorkspaceType,
} from "@/types/committee";

export class WorkspaceServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "WorkspaceServiceError";
  }
}

const UNIQUE_VIOLATION = "23505";

function pgErrorCode(error: unknown): string | null {
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

type DbWorkspaceType = "GENERAL" | "PROJECT" | "DOCUMENT" | "DISCUSSION" | "MEETING";
type DbWorkspaceStatus = "ACTIVE" | "ARCHIVED" | "LOCKED";

const UI_TO_DB_TYPE: Record<WorkspaceType, DbWorkspaceType> = {
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

const UI_TO_DB_STATUS: Record<WorkspaceStatus, DbWorkspaceStatus> = {
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

type WorkspaceRow = typeof workspace.$inferSelect;

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

function toUiWorkspace(row: WorkspaceRow): CommitteeWorkspace {
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
// List
// ---------------------------------------------------------------------------

export interface WorkspaceListFilters {
  /** Comma-separated UI status values, e.g. "active,locked". */
  status?: string;
  /** Comma-separated UI type values, e.g. "general,project". */
  type?: string;
  /** Comma-separated CommitteeRole values; matches workspaces whose roster holds the role. */
  memberRole?: string;
  /** ISO date bound (inclusive) on createdAt — the dashboard's date-range filter. */
  createdAfter?: string;
  createdBefore?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function paginate(page?: number, limit?: number): { page: number; limit: number; offset: number } {
  const safePage = Math.max(1, Math.trunc(page ?? 1));
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit ?? 20)));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

function csvValues(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function buildListWhere(filters: WorkspaceListFilters): SQL | undefined {
  const clauses: SQL[] = [];

  const statuses = csvValues(filters.status)
    ?.map((value) => UI_TO_DB_STATUS[value as WorkspaceStatus])
    .filter((value): value is DbWorkspaceStatus => value !== undefined);
  if (statuses && statuses.length > 0) {
    clauses.push(inArray(workspace.status, statuses));
  }

  const types = csvValues(filters.type)
    ?.map((value) => UI_TO_DB_TYPE[value as WorkspaceType])
    .filter((value): value is DbWorkspaceType => value !== undefined);
  if (types && types.length > 0) {
    clauses.push(inArray(workspace.type, types));
  }

  const memberRoles = csvValues(filters.memberRole)?.filter((value): value is CommitteeRole =>
    (WORKSPACE_MEMBER_ROLES as readonly string[]).includes(value),
  );
  if (memberRoles && memberRoles.length > 0) {
    // Roster lives in the members jsonb blob; match any entry's role.
    clauses.push(sql`exists (
      select 1 from jsonb_array_elements(${workspace.members}) as member
      where member->>'role' in (${sql.join(
        memberRoles.map((role) => sql`${role}`),
        sql`, `,
      )})
    )`);
  }

  if (filters.createdAfter) {
    const after = new Date(filters.createdAfter);
    if (!Number.isNaN(after.getTime())) clauses.push(gte(workspace.createdAt, after));
  }
  if (filters.createdBefore) {
    const before = new Date(filters.createdBefore);
    if (!Number.isNaN(before.getTime())) clauses.push(lte(workspace.createdAt, before));
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    const searchClause = or(ilike(workspace.name, term), ilike(workspace.description, term));
    if (searchClause) clauses.push(searchClause);
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export async function listWorkspaces(
  filters: WorkspaceListFilters = {},
): Promise<Paginated<CommitteeWorkspace>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  const where = buildListWhere(filters);

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(workspace)
      .where(where)
      .orderBy(desc(workspace.createdAt), desc(workspace.id))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(workspace).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;

  return {
    items: rows.map(toUiWorkspace),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getWorkspace(id: string): Promise<CommitteeWorkspace | null> {
  const rows = await db.select().from(workspace).where(eq(workspace.id, id)).limit(1);
  if (rows.length === 0) return null;
  return toUiWorkspace(rows[0]);
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

async function assertCommitteeExists(committeeId: string): Promise<void> {
  const rows = await db
    .select({ id: committee.id })
    .from(committee)
    .where(eq(committee.id, committeeId))
    .limit(1);
  if (rows.length === 0) {
    throw new WorkspaceServiceError(
      problem("validation-error", 422, "Validation failed", "Unknown committee", {
        errors: [{ field: "committeeId", message: "Committee does not exist" }],
      }),
    );
  }
}

export async function createWorkspace(
  input: CreateWorkspaceInput,
  actorId: string,
): Promise<CommitteeWorkspace> {
  if (input.committeeId) {
    await assertCommitteeExists(input.committeeId);
  }

  let row: WorkspaceRow;
  try {
    [row] = await db
      .insert(workspace)
      .values({
        name: input.name,
        description: input.description,
        type: UI_TO_DB_TYPE[input.type],
        status: UI_TO_DB_STATUS[input.status],
        committeeId: input.committeeId,
        settings: input.settings,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new WorkspaceServiceError(
        problems.conflict(`A workspace named "${input.name}" already exists`),
      );
    }
    throw error;
  }
  return toUiWorkspace(row);
}

export async function updateWorkspace(
  id: string,
  input: UpdateWorkspaceInput,
  actorId: string,
): Promise<CommitteeWorkspace> {
  const existing = await db.select().from(workspace).where(eq(workspace.id, id)).limit(1);
  if (existing.length === 0) {
    throw new WorkspaceServiceError(problems.notFound("Workspace not found"));
  }

  if (input.committeeId) {
    await assertCommitteeExists(input.committeeId);
  }

  const patch: Partial<typeof workspace.$inferInsert> = { updatedBy: actorId };
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.type !== undefined) patch.type = UI_TO_DB_TYPE[input.type];
  if (input.status !== undefined) patch.status = UI_TO_DB_STATUS[input.status];
  if (input.committeeId !== undefined) patch.committeeId = input.committeeId;
  if (input.settings !== undefined) patch.settings = input.settings;

  try {
    await db.update(workspace).set(patch).where(eq(workspace.id, id));
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new WorkspaceServiceError(
        problems.conflict(`A workspace named "${input.name ?? existing[0].name}" already exists`),
      );
    }
    throw error;
  }

  const updated = await getWorkspace(id);
  if (!updated) {
    throw new WorkspaceServiceError(problems.notFound("Workspace not found"));
  }
  return updated;
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  const deleted = await db
    .delete(workspace)
    .where(eq(workspace.id, id))
    .returning({ id: workspace.id });
  return deleted.length > 0;
}
