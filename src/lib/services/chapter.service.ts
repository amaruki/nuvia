/**
 * Chapter CRUD over the real `chapters` / `chapter_members` tables
 * (backlog D1, promotion queue).
 *
 * - Rows map to the UI shape (src/types/chapter.types.ts) — the same
 *   contract the mock-era hook served. The metrics/events/finances fields
 *   have no backing tables yet and render as neutral defaults, the same
 *   staging pattern the event service uses for not-yet-modeled fields.
 * - Every failure throws ChapterServiceError carrying an RFC 9457 problem;
 *   the /api/v1/chapters routes map it via handleChapterRoute.
 * - `name` is unique; duplicates surface as a 409 conflict.
 */

import { and, asc, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { chapter, chapterMember } from "@/db/schema";
import { problem, problems, type ProblemDetails } from "@/lib/http";
import type {
  Chapter,
  ChapterContactInfo,
  ChapterLeadership,
  ChapterRole,
  ChapterSettings,
  ChapterSocialMedia,
  ChapterStatus,
} from "@/types/chapter.types";

export class ChapterServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "ChapterServiceError";
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
// Validation schemas (mirror the add-chapter form; the API accepts a small
// superset — memberCount and establishedDate — for programmatic callers)
// ---------------------------------------------------------------------------

const locationSchema = z.object({
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  postalCode: z.string().min(3),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  timezone: z.string().min(1),
  region: z.string().min(2),
});

const contactInfoSchema = z.object({
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().min(5),
  mailingAddress: z.string().max(200).optional(),
});

const socialMediaSchema = z.object({
  facebook: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
});

const settingsSchema = z.object({
  allowOnlineRegistration: z.boolean(),
  requireApproval: z.boolean(),
  membershipDues: z.number().min(0),
  meetingFrequency: z.enum(["weekly", "biweekly", "monthly", "quarterly"]),
  meetingDay: z.string().max(20).optional(),
  meetingTime: z.string().max(10).optional(),
  autoRenewMembership: z.boolean(),
  sendReminders: z.boolean(),
  publicDirectory: z.boolean(),
});

const chapterStatusSchema = z.enum(["active", "inactive", "pending", "suspended"]);

export const createChapterSchema = z.object({
  name: z.string().min(3).max(50),
  displayName: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  status: chapterStatusSchema.default("pending"),
  location: locationSchema,
  contactInfo: contactInfoSchema,
  socialMedia: socialMediaSchema,
  settings: settingsSchema,
  parentChapterId: z
    .union([z.uuid(), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null)),
  memberCount: z.number().int().min(0).optional(),
  establishedDate: z.coerce.date().optional(),
});

export const updateChapterSchema = createChapterSchema
  .partial()
  // .partial() keeps zod defaults live, which would let an empty {} PATCH
  // reset status — override with a plain optional for updates.
  .extend({ status: chapterStatusSchema.optional() })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;

// ---------------------------------------------------------------------------
// Status/role mapping (DB enums are SCREAMING_SNAKE, UI is lowercase)
// ---------------------------------------------------------------------------

type DbChapterStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";
type DbChapterRole =
  | "PRESIDENT"
  | "VICE_PRESIDENT"
  | "SECRETARY"
  | "TREASURER"
  | "ADMIN"
  | "MEMBER";

const UI_TO_DB_STATUS: Record<ChapterStatus, DbChapterStatus> = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  pending: "PENDING",
  suspended: "SUSPENDED",
};

const DB_TO_UI_STATUS: Record<DbChapterStatus, ChapterStatus> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  SUSPENDED: "suspended",
};

const DB_TO_UI_ROLE: Record<DbChapterRole, ChapterRole> = {
  PRESIDENT: "president",
  VICE_PRESIDENT: "vice_president",
  SECRETARY: "secretary",
  TREASURER: "treasurer",
  ADMIN: "admin",
  MEMBER: "member",
};

const ROLE_TITLE_FALLBACK: Record<ChapterRole, string> = {
  president: "President",
  vice_president: "Vice President",
  secretary: "Secretary",
  treasurer: "Treasurer",
  admin: "Chapter Admin",
  member: "Member",
};

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

type ChapterRow = typeof chapter.$inferSelect;
type ChapterMemberRow = typeof chapterMember.$inferSelect;

function toUiLeadership(row: ChapterMemberRow): ChapterLeadership {
  const role = DB_TO_UI_ROLE[row.role as DbChapterRole] ?? "member";
  return {
    id: row.id,
    userId: row.userId ?? "",
    name: row.name,
    email: row.email,
    role,
    title: row.title ?? ROLE_TITLE_FALLBACK[role],
    startDate: row.startDate ?? row.createdAt,
    endDate: row.endDate ?? undefined,
    isActive: row.isActive,
    avatar: row.avatar ?? undefined,
    phone: row.phone ?? undefined,
  };
}

function toUiSettings(raw: unknown): ChapterSettings {
  const s = (raw ?? {}) as Partial<ChapterSettings>;
  return {
    allowOnlineRegistration: s.allowOnlineRegistration ?? false,
    requireApproval: s.requireApproval ?? false,
    membershipDues: s.membershipDues ?? 0,
    meetingFrequency: s.meetingFrequency ?? "monthly",
    meetingDay: s.meetingDay,
    meetingTime: s.meetingTime,
    autoRenewMembership: s.autoRenewMembership ?? false,
    sendReminders: s.sendReminders ?? false,
    publicDirectory: s.publicDirectory ?? false,
  };
}

function toUiContactInfo(raw: unknown): ChapterContactInfo {
  const c = (raw ?? {}) as Partial<ChapterContactInfo>;
  return {
    email: c.email ?? "",
    phone: c.phone,
    website: c.website,
    address: c.address ?? "",
    mailingAddress: c.mailingAddress,
  };
}

function toUiChapter(
  row: ChapterRow,
  leadership: ChapterLeadership[],
  subChapterIds: string[],
): Chapter {
  return {
    id: row.id,
    name: row.name,
    displayName: row.displayName,
    description: row.description ?? undefined,
    status: DB_TO_UI_STATUS[row.status as DbChapterStatus] ?? "pending",
    location: {
      address: row.address ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      country: row.country ?? "",
      postalCode: row.postalCode ?? "",
      coordinates:
        row.latitude !== null && row.longitude !== null
          ? { latitude: row.latitude, longitude: row.longitude }
          : undefined,
      timezone: row.timezone ?? "UTC",
      region: row.region ?? "",
    },
    leadership,
    memberCount: row.memberCount,
    establishedDate: row.establishedDate ?? row.createdAt,
    parentChapterId: row.parentChapterId ?? undefined,
    subChapterIds,
    contactInfo: toUiContactInfo(row.contactInfo),
    socialMedia: (row.socialMedia ?? {}) as ChapterSocialMedia,
    // Neutral placeholders until the metrics/events/finance tables land.
    metrics: {
      memberGrowthRate: 0,
      eventAttendanceRate: 0,
      financialHealth: "fair",
      engagementScore: 0,
      retentionRate: 0,
      newMembersThisMonth: 0,
      activeMembersThisMonth: 0,
      monthlyTrend: [],
    },
    events: [],
    finances: {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      budget: 0,
      budgetUtilization: 0,
      monthlyRevenue: [],
      monthlyExpenses: [],
    },
    settings: toUiSettings(row.settings),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export interface ChapterListFilters {
  /** Comma-separated UI status values, e.g. "active,pending". */
  status?: string;
  /** Comma-separated region names. */
  region?: string;
  /** Comma-separated country names. */
  country?: string;
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

function buildListWhere(filters: ChapterListFilters): SQL | undefined {
  const clauses: SQL[] = [];

  const statuses = csvValues(filters.status)
    ?.map((value) => UI_TO_DB_STATUS[value as ChapterStatus])
    .filter((value): value is DbChapterStatus => value !== undefined);
  if (statuses && statuses.length > 0) {
    clauses.push(inArray(chapter.status, statuses));
  }

  const regions = csvValues(filters.region);
  if (regions) clauses.push(inArray(chapter.region, regions));

  const countries = csvValues(filters.country);
  if (countries) clauses.push(inArray(chapter.country, countries));

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    const searchClause = or(
      ilike(chapter.name, term),
      ilike(chapter.displayName, term),
      ilike(chapter.city, term),
      ilike(chapter.region, term),
    );
    if (searchClause) clauses.push(searchClause);
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export async function listChapters(filters: ChapterListFilters = {}): Promise<Paginated<Chapter>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  const where = buildListWhere(filters);

  const [rows, totalRows] = await Promise.all([
    db.select().from(chapter).where(where).orderBy(asc(chapter.name)).limit(limit).offset(offset),
    db.select({ value: count() }).from(chapter).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;

  // One batched roster fetch for the page; the dashboard filters and
  // overview cards both read leadership off the listed chapters.
  let membersByChapter = new Map<string, ChapterMemberRow[]>();
  if (rows.length > 0) {
    const memberRows = await db
      .select()
      .from(chapterMember)
      .where(
        inArray(
          chapterMember.chapterId,
          rows.map((row) => row.id),
        ),
      );
    for (const memberRow of memberRows) {
      const bucket = membersByChapter.get(memberRow.chapterId);
      if (bucket) bucket.push(memberRow);
      else membersByChapter.set(memberRow.chapterId, [memberRow]);
    }
  }

  const items = rows.map((row) =>
    toUiChapter(row, (membersByChapter.get(row.id) ?? []).map(toUiLeadership), []),
  );

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

export async function getChapter(id: string): Promise<Chapter | null> {
  const row = await db.select().from(chapter).where(eq(chapter.id, id)).limit(1);
  if (row.length === 0) return null;

  const [memberRows, subRows] = await Promise.all([
    db
      .select()
      .from(chapterMember)
      .where(eq(chapterMember.chapterId, id))
      .orderBy(asc(chapterMember.role), asc(chapterMember.name)),
    db
      .select({ id: chapter.id })
      .from(chapter)
      .where(eq(chapter.parentChapterId, id))
      .orderBy(asc(chapter.name)),
  ]);

  return toUiChapter(
    row[0],
    memberRows.map(toUiLeadership),
    subRows.map((sub) => sub.id),
  );
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

async function assertParentExists(parentChapterId: string, selfId?: string): Promise<void> {
  if (selfId !== undefined && parentChapterId === selfId) {
    throw new ChapterServiceError(
      problem("validation-error", 422, "Validation failed", "A chapter cannot be its own parent", {
        errors: [{ field: "parentChapterId", message: "A chapter cannot be its own parent" }],
      }),
    );
  }
  const parentRows = await db
    .select({ id: chapter.id })
    .from(chapter)
    .where(eq(chapter.id, parentChapterId))
    .limit(1);
  if (parentRows.length === 0) {
    throw new ChapterServiceError(
      problem("validation-error", 422, "Validation failed", "Unknown parent chapter", {
        errors: [{ field: "parentChapterId", message: "Parent chapter does not exist" }],
      }),
    );
  }
}

function toInsertValues(input: CreateChapterInput, actor: string) {
  return {
    name: input.name,
    displayName: input.displayName,
    description: input.description,
    status: UI_TO_DB_STATUS[input.status],
    address: input.location.address,
    city: input.location.city,
    state: input.location.state,
    country: input.location.country,
    postalCode: input.location.postalCode,
    latitude: input.location.coordinates?.latitude,
    longitude: input.location.coordinates?.longitude,
    timezone: input.location.timezone,
    region: input.location.region,
    memberCount: input.memberCount ?? 0,
    establishedDate: input.establishedDate,
    parentChapterId: input.parentChapterId,
    contactInfo: input.contactInfo,
    socialMedia: input.socialMedia,
    settings: input.settings,
    createdBy: actor,
  };
}

export async function createChapter(input: CreateChapterInput, actor: string): Promise<Chapter> {
  if (input.parentChapterId) {
    await assertParentExists(input.parentChapterId);
  }

  let row: ChapterRow;
  try {
    [row] = await db.insert(chapter).values(toInsertValues(input, actor)).returning();
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new ChapterServiceError(
        problems.conflict(`A chapter named "${input.name}" already exists`),
      );
    }
    throw error;
  }
  return toUiChapter(row, [], []);
}

export async function updateChapter(
  id: string,
  input: UpdateChapterInput,
  actor: string,
): Promise<Chapter> {
  const existing = await db.select().from(chapter).where(eq(chapter.id, id)).limit(1);
  if (existing.length === 0) {
    throw new ChapterServiceError(problems.notFound("Chapter not found"));
  }

  if (input.parentChapterId) {
    await assertParentExists(input.parentChapterId, id);
  }

  const patch: Partial<typeof chapter.$inferInsert> = { updatedBy: actor };
  if (input.name !== undefined) patch.name = input.name;
  if (input.displayName !== undefined) patch.displayName = input.displayName;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = UI_TO_DB_STATUS[input.status];
  if (input.location !== undefined) {
    patch.address = input.location.address;
    patch.city = input.location.city;
    patch.state = input.location.state;
    patch.country = input.location.country;
    patch.postalCode = input.location.postalCode;
    patch.latitude = input.location.coordinates?.latitude;
    patch.longitude = input.location.coordinates?.longitude;
    patch.timezone = input.location.timezone;
    patch.region = input.location.region;
  }
  if (input.memberCount !== undefined) patch.memberCount = input.memberCount;
  if (input.establishedDate !== undefined) patch.establishedDate = input.establishedDate;
  if (input.parentChapterId !== undefined) patch.parentChapterId = input.parentChapterId;
  if (input.contactInfo !== undefined) patch.contactInfo = input.contactInfo;
  if (input.socialMedia !== undefined) patch.socialMedia = input.socialMedia;
  if (input.settings !== undefined) patch.settings = input.settings;

  try {
    await db.update(chapter).set(patch).where(eq(chapter.id, id));
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new ChapterServiceError(
        problems.conflict(`A chapter named "${input.name ?? existing[0].name}" already exists`),
      );
    }
    throw error;
  }

  const updated = await getChapter(id);
  if (!updated) {
    throw new ChapterServiceError(problems.notFound("Chapter not found"));
  }
  return updated;
}

export async function deleteChapter(id: string): Promise<boolean> {
  const deleted = await db.delete(chapter).where(eq(chapter.id, id)).returning({ id: chapter.id });
  return deleted.length > 0;
}
