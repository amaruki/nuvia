/**
 * Award CRUD over the real `award_programs` / `award_nominations` tables
 * (backlog D4).
 *
 * The service is the single writer: routes parse + authorize, then delegate
 * here. House style follows chapter.service.ts:
 *   - AwardServiceError carries a prebuilt RFC 9457 problem document
 *   - zod schemas validate payloads; DB enums are SCREAMING_SNAKE while the
 *     wire/UI stays lowercase
 *   - list endpoints return { items, page, limit, total, totalPages }
 */

import { and, asc, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { awardNomination, awardProgram, user } from "@/db/schema";
import { problem, problems, type ProblemDetails } from "@/lib/http";
import type {
  AwardCategory,
  AwardNomination,
  AwardNominationStatus,
  AwardProgram,
  AwardProgramStatus,
} from "@/types/award.types";

export class AwardServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "AwardServiceError";
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
// Validation schemas
// ---------------------------------------------------------------------------

const awardProgramStatusSchema = z.enum(["draft", "open", "closed", "archived"]);
const awardCategorySchema = z.enum([
  "achievement",
  "service",
  "leadership",
  "innovation",
  "scholarship",
  "lifetime_achievement",
]);
const awardNominationStatusSchema = z.enum(["pending", "under_review", "approved", "rejected"]);

export const createAwardProgramSchema = z
  .object({
    name: z.string().min(3).max(80),
    description: z.string().max(2000).optional(),
    category: awardCategorySchema.default("achievement"),
    status: awardProgramStatusSchema.default("draft"),
    criteria: z.array(z.string().min(3).max(500)).max(20).default([]),
    openDate: z.coerce.date().optional(),
    closeDate: z.coerce.date().optional(),
    awardDate: z.coerce.date().optional(),
  })
  .refine((value) => !value.openDate || !value.closeDate || value.openDate <= value.closeDate, {
    message: "openDate must be before or equal to closeDate",
    path: ["closeDate"],
  });

export const updateAwardProgramSchema = z
  .object({
    name: z.string().min(3).max(80).optional(),
    description: z.string().max(2000).nullable().optional(),
    category: awardCategorySchema.optional(),
    // Plain optional (not .partial()) so an empty PATCH cannot reset fields.
    status: awardProgramStatusSchema.optional(),
    criteria: z.array(z.string().min(3).max(500)).max(20).optional(),
    openDate: z.union([z.null(), z.coerce.date()]).optional(),
    closeDate: z.union([z.null(), z.coerce.date()]).optional(),
    awardDate: z.union([z.null(), z.coerce.date()]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const createAwardNominationSchema = z.object({
  programId: z.uuid(),
  // Accept uuid, "" or null → normalize to null (nominee without an account).
  userId: z
    .union([z.uuid(), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null)),
  nomineeName: z.string().min(2).max(120),
  nomineeEmail: z.string().email(),
  nominatorName: z.string().min(2).max(120),
  nominatorEmail: z.string().email(),
  status: awardNominationStatusSchema.default("pending"),
  statement: z.string().max(5000).optional(),
});

/** Nominations are edited through review: status transitions + statement. */
export const updateAwardNominationSchema = z
  .object({
    status: awardNominationStatusSchema.optional(),
    statement: z.string().max(5000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateAwardProgramInput = z.infer<typeof createAwardProgramSchema>;
export type UpdateAwardProgramInput = z.infer<typeof updateAwardProgramSchema>;
export type CreateAwardNominationInput = z.infer<typeof createAwardNominationSchema>;
export type UpdateAwardNominationInput = z.infer<typeof updateAwardNominationSchema>;

// ---------------------------------------------------------------------------
// Status/category mapping (DB enums are SCREAMING_SNAKE, UI is lowercase)
// ---------------------------------------------------------------------------

type DbAwardProgramStatus = "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
type DbAwardCategory =
  | "ACHIEVEMENT"
  | "SERVICE"
  | "LEADERSHIP"
  | "INNOVATION"
  | "SCHOLARSHIP"
  | "LIFETIME_ACHIEVEMENT";
type DbAwardNominationStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

const UI_TO_DB_PROGRAM_STATUS: Record<AwardProgramStatus, DbAwardProgramStatus> = {
  draft: "DRAFT",
  open: "OPEN",
  closed: "CLOSED",
  archived: "ARCHIVED",
};

const DB_TO_UI_PROGRAM_STATUS: Record<DbAwardProgramStatus, AwardProgramStatus> = {
  DRAFT: "draft",
  OPEN: "open",
  CLOSED: "closed",
  ARCHIVED: "archived",
};

const UI_TO_DB_CATEGORY: Record<AwardCategory, DbAwardCategory> = {
  achievement: "ACHIEVEMENT",
  service: "SERVICE",
  leadership: "LEADERSHIP",
  innovation: "INNOVATION",
  scholarship: "SCHOLARSHIP",
  lifetime_achievement: "LIFETIME_ACHIEVEMENT",
};

const DB_TO_UI_CATEGORY: Record<DbAwardCategory, AwardCategory> = {
  ACHIEVEMENT: "achievement",
  SERVICE: "service",
  LEADERSHIP: "leadership",
  INNOVATION: "innovation",
  SCHOLARSHIP: "scholarship",
  LIFETIME_ACHIEVEMENT: "lifetime_achievement",
};

const UI_TO_DB_NOMINATION_STATUS: Record<AwardNominationStatus, DbAwardNominationStatus> = {
  pending: "PENDING",
  under_review: "UNDER_REVIEW",
  approved: "APPROVED",
  rejected: "REJECTED",
};

const DB_TO_UI_NOMINATION_STATUS: Record<DbAwardNominationStatus, AwardNominationStatus> = {
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

type AwardProgramRow = typeof awardProgram.$inferSelect;
type AwardNominationRow = typeof awardNomination.$inferSelect;

function toUiProgram(row: AwardProgramRow, nominationCount: number): AwardProgram {
  return {
    id: row.id,
    name: row.name,
    ...(row.description !== null ? { description: row.description } : {}),
    category: DB_TO_UI_CATEGORY[row.category],
    status: DB_TO_UI_PROGRAM_STATUS[row.status],
    // jsonb criteria arrives as unknown — narrow to string[] with checked filters.
    criteria: Array.isArray(row.criteria)
      ? row.criteria.filter((item): item is string => typeof item === "string")
      : [],
    ...(row.openDate ? { openDate: row.openDate } : {}),
    ...(row.closeDate ? { closeDate: row.closeDate } : {}),
    ...(row.awardDate ? { awardDate: row.awardDate } : {}),
    nominationCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    ...(row.updatedBy ? { updatedBy: row.updatedBy } : {}),
  };
}

function toUiNomination(row: AwardNominationRow, programName: string): AwardNomination {
  return {
    id: row.id,
    programId: row.programId,
    programName,
    ...(row.userId ? { userId: row.userId } : {}),
    nomineeName: row.nomineeName,
    nomineeEmail: row.nomineeEmail,
    nominatorName: row.nominatorName,
    nominatorEmail: row.nominatorEmail,
    status: DB_TO_UI_NOMINATION_STATUS[row.status],
    ...(row.statement !== null ? { statement: row.statement } : {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    ...(row.updatedBy ? { updatedBy: row.updatedBy } : {}),
  };
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export interface AwardProgramListFilters {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AwardNominationListFilters {
  status?: string;
  programId?: string;
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

function buildProgramListWhere(filters: AwardProgramListFilters): SQL | undefined {
  const clauses: SQL[] = [];

  const statuses = csvValues(filters.status)
    ?.map((value) => UI_TO_DB_PROGRAM_STATUS[value as AwardProgramStatus])
    .filter((value): value is DbAwardProgramStatus => value !== undefined);
  if (statuses && statuses.length > 0) {
    clauses.push(inArray(awardProgram.status, statuses));
  }

  const categories = csvValues(filters.category)
    ?.map((value) => UI_TO_DB_CATEGORY[value as AwardCategory])
    .filter((value): value is DbAwardCategory => value !== undefined);
  if (categories && categories.length > 0) {
    clauses.push(inArray(awardProgram.category, categories));
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    const searchClause = or(ilike(awardProgram.name, term), ilike(awardProgram.description, term));
    if (searchClause) clauses.push(searchClause);
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

function buildNominationListWhere(filters: AwardNominationListFilters): SQL | undefined {
  const clauses: SQL[] = [];

  const statuses = csvValues(filters.status)
    ?.map((value) => UI_TO_DB_NOMINATION_STATUS[value as AwardNominationStatus])
    .filter((value): value is DbAwardNominationStatus => value !== undefined);
  if (statuses && statuses.length > 0) {
    clauses.push(inArray(awardNomination.status, statuses));
  }

  if (filters.programId) {
    clauses.push(eq(awardNomination.programId, filters.programId));
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    const searchClause = or(
      ilike(awardNomination.nomineeName, term),
      ilike(awardNomination.nomineeEmail, term),
      ilike(awardNomination.nominatorName, term),
    );
    if (searchClause) clauses.push(searchClause);
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

/** One batched nomination-count fetch for the listed programs. */
async function nominationCountsByProgram(programIds: string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  if (programIds.length === 0) return counts;

  const rows = await db
    .select({ programId: awardNomination.programId, value: count() })
    .from(awardNomination)
    .where(inArray(awardNomination.programId, programIds))
    .groupBy(awardNomination.programId);

  for (const row of rows) counts[row.programId] = row.value;
  return counts;
}

export async function listAwardPrograms(
  filters: AwardProgramListFilters = {},
): Promise<Paginated<AwardProgram>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  const where = buildProgramListWhere(filters);

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(awardProgram)
      .where(where)
      .orderBy(asc(awardProgram.name))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(awardProgram).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;

  const counts = await nominationCountsByProgram(rows.map((row) => row.id));
  const items = rows.map((row) => toUiProgram(row, counts[row.id] ?? 0));

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function listAwardNominations(
  filters: AwardNominationListFilters = {},
): Promise<Paginated<AwardNomination>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  const where = buildNominationListWhere(filters);

  const [rows, totalRows] = await Promise.all([
    db
      .select({ nomination: awardNomination, programName: awardProgram.name })
      .from(awardNomination)
      .leftJoin(awardProgram, eq(awardNomination.programId, awardProgram.id))
      .where(where)
      .orderBy(desc(awardNomination.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(awardNomination).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;

  const items = rows.map((row) => toUiNomination(row.nomination, row.programName ?? ""));

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getAwardProgram(id: string): Promise<AwardProgram | null> {
  const rows = await db.select().from(awardProgram).where(eq(awardProgram.id, id)).limit(1);
  if (rows.length === 0) return null;

  const counts = await nominationCountsByProgram([rows[0].id]);
  return toUiProgram(rows[0], counts[rows[0].id] ?? 0);
}

export async function getAwardNomination(id: string): Promise<AwardNomination | null> {
  const rows = await db
    .select({ nomination: awardNomination, programName: awardProgram.name })
    .from(awardNomination)
    .leftJoin(awardProgram, eq(awardNomination.programId, awardProgram.id))
    .where(eq(awardNomination.id, id))
    .limit(1);
  if (rows.length === 0) return null;

  return toUiNomination(rows[0].nomination, rows[0].programName ?? "");
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

async function assertProgramExists(programId: string): Promise<void> {
  const rows = await db
    .select({ id: awardProgram.id })
    .from(awardProgram)
    .where(eq(awardProgram.id, programId))
    .limit(1);
  if (rows.length === 0) {
    throw new AwardServiceError(
      problem("validation-error", 422, "Validation failed", "Unknown award program", {
        errors: [{ field: "programId", message: "Award program does not exist" }],
      }),
    );
  }
}

async function assertUserExists(userId: string): Promise<void> {
  const rows = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);
  if (rows.length === 0) {
    throw new AwardServiceError(
      problem("validation-error", 422, "Validation failed", "Unknown user", {
        errors: [{ field: "userId", message: "User account does not exist" }],
      }),
    );
  }
}

export async function createAwardProgram(
  input: CreateAwardProgramInput,
  actor: string,
): Promise<AwardProgram> {
  let row: AwardProgramRow;
  try {
    [row] = await db
      .insert(awardProgram)
      .values({
        name: input.name,
        description: input.description ?? null,
        category: UI_TO_DB_CATEGORY[input.category],
        status: UI_TO_DB_PROGRAM_STATUS[input.status],
        criteria: input.criteria,
        openDate: input.openDate ?? null,
        closeDate: input.closeDate ?? null,
        awardDate: input.awardDate ?? null,
        createdBy: actor,
      })
      .returning();
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new AwardServiceError(
        problems.conflict(`An award program named "${input.name}" already exists`),
      );
    }
    throw error;
  }
  return toUiProgram(row, 0);
}

export async function updateAwardProgram(
  id: string,
  input: UpdateAwardProgramInput,
  actor: string,
): Promise<AwardProgram> {
  const existing = await db.select().from(awardProgram).where(eq(awardProgram.id, id)).limit(1);
  if (existing.length === 0) {
    throw new AwardServiceError(problems.notFound("Award program not found"));
  }

  const patch: Partial<typeof awardProgram.$inferInsert> = { updatedBy: actor };
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.category !== undefined) patch.category = UI_TO_DB_CATEGORY[input.category];
  if (input.status !== undefined) patch.status = UI_TO_DB_PROGRAM_STATUS[input.status];
  if (input.criteria !== undefined) patch.criteria = input.criteria;
  if (input.openDate !== undefined) patch.openDate = input.openDate;
  if (input.closeDate !== undefined) patch.closeDate = input.closeDate;
  if (input.awardDate !== undefined) patch.awardDate = input.awardDate;

  // Validate the effective nomination window after the patch is applied.
  const openDate = input.openDate !== undefined ? input.openDate : existing[0].openDate;
  const closeDate = input.closeDate !== undefined ? input.closeDate : existing[0].closeDate;
  if (openDate && closeDate && openDate > closeDate) {
    throw new AwardServiceError(
      problem("validation-error", 422, "Validation failed", "Invalid nomination window", {
        errors: [{ field: "closeDate", message: "openDate must be before or equal to closeDate" }],
      }),
    );
  }

  try {
    await db.update(awardProgram).set(patch).where(eq(awardProgram.id, id));
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new AwardServiceError(
        problems.conflict(
          `An award program named "${input.name ?? existing[0].name}" already exists`,
        ),
      );
    }
    throw error;
  }

  const updated = await getAwardProgram(id);
  if (!updated) {
    throw new AwardServiceError(problems.notFound("Award program not found"));
  }
  return updated;
}

/** Deleting a program cascades its nominations (FK onDelete cascade). */
export async function deleteAwardProgram(id: string): Promise<boolean> {
  const deleted = await db
    .delete(awardProgram)
    .where(eq(awardProgram.id, id))
    .returning({ id: awardProgram.id });
  return deleted.length > 0;
}

export async function createAwardNomination(
  input: CreateAwardNominationInput,
  actor: string,
): Promise<AwardNomination> {
  await assertProgramExists(input.programId);
  if (input.userId) {
    await assertUserExists(input.userId);
  }

  const [row] = await db
    .insert(awardNomination)
    .values({
      programId: input.programId,
      userId: input.userId ?? null,
      nomineeName: input.nomineeName,
      nomineeEmail: input.nomineeEmail,
      nominatorName: input.nominatorName,
      nominatorEmail: input.nominatorEmail,
      status: UI_TO_DB_NOMINATION_STATUS[input.status],
      statement: input.statement ?? null,
      createdBy: actor,
    })
    .returning();

  const found = await getAwardNomination(row.id);
  if (!found) {
    throw new AwardServiceError(problems.notFound("Nomination not found"));
  }
  return found;
}

export async function updateAwardNomination(
  id: string,
  input: UpdateAwardNominationInput,
  actor: string,
): Promise<AwardNomination> {
  const existing = await db
    .select()
    .from(awardNomination)
    .where(eq(awardNomination.id, id))
    .limit(1);
  if (existing.length === 0) {
    throw new AwardServiceError(problems.notFound("Nomination not found"));
  }

  const patch: Partial<typeof awardNomination.$inferInsert> = { updatedBy: actor };
  if (input.status !== undefined) patch.status = UI_TO_DB_NOMINATION_STATUS[input.status];
  if (input.statement !== undefined) patch.statement = input.statement;

  await db.update(awardNomination).set(patch).where(eq(awardNomination.id, id));

  const updated = await getAwardNomination(id);
  if (!updated) {
    throw new AwardServiceError(problems.notFound("Nomination not found"));
  }
  return updated;
}

export async function deleteAwardNomination(id: string): Promise<boolean> {
  const deleted = await db
    .delete(awardNomination)
    .where(eq(awardNomination.id, id))
    .returning({ id: awardNomination.id });
  return deleted.length > 0;
}
