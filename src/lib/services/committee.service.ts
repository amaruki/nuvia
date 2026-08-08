/**
 * Committees service — the single DB access layer for the committees module
 * (backlog D2). Every /api/v1/committees/** route handler goes through here.
 *
 * Errors are thrown as NotFoundError / BusinessLogicError (src/lib/errors.ts)
 * and mapped to RFC 9457 problems by src/app/api/v1/committees/_lib.ts —
 * the same split the finance services use.
 *
 * The wire shape is the UI contract from src/types/committee.types.ts:
 * charter/meetings/metrics travel as jsonb columns and are normalized on
 * read; leadership and members share the committee_members table and are
 * split by role on read.
 */

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { committee, committeeMember } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import type {
  Committee,
  CommitteeActionItem,
  CommitteeAuthorityLevel,
  CommitteeCharter,
  CommitteeLeadership,
  CommitteeMeeting,
  CommitteeMember,
  CommitteeMetrics,
  CommitteeMonthlyTrend,
  CommitteeRole,
  CommitteeStatus,
  CommitteeType,
} from "@/types/committee.types";

// ---------------------------------------------------------------------------
// Validation schemas (mirror src/components/committees/add-committee-form.tsx)
// ---------------------------------------------------------------------------

export const COMMITTEE_STATUSES = ["active", "inactive", "pending", "suspended"] as const;
export const COMMITTEE_TYPES = [
  "executive",
  "functional",
  "special_interest",
  "ad_hoc",
  "standing",
] as const;
export const COMMITTEE_AUTHORITY_LEVELS = [
  "advisory",
  "operational",
  "strategic",
  "executive",
] as const;
export const COMMITTEE_ROLES = [
  "chair",
  "co_chair",
  "secretary",
  "treasurer",
  "member",
  "advisor",
] as const;

const optionalUrl = z.union([z.string().url().max(2048), z.literal("")]).optional();

export const committeeTermLimitsSchema = z.object({
  chairTerm: z.number().int().min(1).max(60),
  memberTerm: z.number().int().min(1).max(60),
  maxTerms: z.number().int().min(1).max(10),
});

export const committeeCharterInputSchema = z.object({
  missionStatement: z.string().min(10).max(500),
  responsibilities: z.array(z.string().min(5)).min(1),
  authorityLevel: z.enum(COMMITTEE_AUTHORITY_LEVELS),
  decisionMakingProcess: z.string().min(10).max(500),
  reportingStructure: z.string().min(10).max(500),
  termLimits: committeeTermLimitsSchema.optional(),
});

export const committeeContactInfoInputSchema = z.object({
  email: z.string().email().max(320),
  phone: z.string().max(50).optional(),
  meetingLocation: z.string().max(255).optional(),
  virtualMeetingLink: optionalUrl,
  website: optionalUrl,
});

export const createCommitteeSchema = z.object({
  name: z.string().min(3).max(50),
  displayName: z.string().min(3).max(100),
  description: z.string().optional(),
  purpose: z.string().min(10).max(500),
  status: z.enum(COMMITTEE_STATUSES).default("pending"),
  type: z.enum(COMMITTEE_TYPES).default("functional"),
  parentCommitteeId: z.union([z.string().uuid(), z.literal("")]).optional(),
  charter: committeeCharterInputSchema,
  contactInfo: committeeContactInfoInputSchema,
});
export type CreateCommitteeInput = z.infer<typeof createCommitteeSchema>;

export const updateCommitteeSchema = z
  .object({
    name: z.string().min(3).max(50),
    displayName: z.string().min(3).max(100),
    description: z.string().optional(),
    purpose: z.string().min(10).max(500),
    status: z.enum(COMMITTEE_STATUSES),
    type: z.enum(COMMITTEE_TYPES),
    parentCommitteeId: z
      .union([z.string().uuid(), z.literal("")])
      .nullable()
      .optional(),
    charter: committeeCharterInputSchema,
    contactInfo: committeeContactInfoInputSchema,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one committee field must be provided",
  });
export type UpdateCommitteeInput = z.infer<typeof updateCommitteeSchema>;

// ---------------------------------------------------------------------------
// DB error mapping (mirrors membership-tier.service.ts)
// ---------------------------------------------------------------------------

const UNIQUE_VIOLATION = "23505";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pgErrorCode(error: unknown): string | null {
  // drizzle wraps the driver error in DrizzleQueryError, so walk the cause
  // chain until a postgres error code surfaces.
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== null && typeof current === "object"; depth += 1) {
    if ("code" in current && typeof current.code === "string") return current.code;
    current = "cause" in current ? current.cause : null;
  }
  return null;
}

function throwUniqueNameViolation(name: string): never {
  throw new BusinessLogicError(
    `A committee named "${name}" already exists`,
    "COMMITTEE_NAME_TAKEN",
  );
}

type CommitteeRow = typeof committee.$inferSelect;
type MemberRow = typeof committeeMember.$inferSelect;

// ---------------------------------------------------------------------------
// Row → DTO mapping (jsonb normalization)
// ---------------------------------------------------------------------------

/** Roles rendered in the leadership section; the rest are regular members. */
const LEADERSHIP_ROLES: Record<string, true> = {
  chair: true,
  co_chair: true,
  secretary: true,
  treasurer: true,
  advisor: true,
};

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function toCharter(raw: unknown, row: CommitteeRow): CommitteeCharter {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const approvalDate = toDate(source.approvalDate) ?? row.createdAt;
  const lastReviewed = toDate(source.lastReviewed) ?? row.updatedAt;
  const nextReviewDefault = new Date(lastReviewed.getTime());
  nextReviewDefault.setFullYear(nextReviewDefault.getFullYear() + 1);
  const nextReview = toDate(source.nextReview) ?? nextReviewDefault;
  const termLimitsSource =
    source.termLimits && typeof source.termLimits === "object"
      ? (source.termLimits as Record<string, unknown>)
      : null;
  return {
    missionStatement: typeof source.missionStatement === "string" ? source.missionStatement : "",
    responsibilities: toStringArray(source.responsibilities),
    authorityLevel: (typeof source.authorityLevel === "string" &&
    (COMMITTEE_AUTHORITY_LEVELS as readonly string[]).includes(source.authorityLevel)
      ? source.authorityLevel
      : row.authorityLevel) as CommitteeAuthorityLevel,
    decisionMakingProcess:
      typeof source.decisionMakingProcess === "string" ? source.decisionMakingProcess : "",
    reportingStructure:
      typeof source.reportingStructure === "string" ? source.reportingStructure : "",
    ...(termLimitsSource
      ? {
          termLimits: {
            chairTerm: toNumber(termLimitsSource.chairTerm, 12),
            memberTerm: toNumber(termLimitsSource.memberTerm, 12),
            maxTerms: toNumber(termLimitsSource.maxTerms, 2),
          },
        }
      : {}),
    approvalDate,
    lastReviewed,
    nextReview,
  };
}

function toActionItem(raw: unknown, meetingIndex: number, itemIndex: number): CommitteeActionItem {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const status = ["pending", "in_progress", "completed", "overdue"].includes(
    source.status as string,
  )
    ? (source.status as CommitteeActionItem["status"])
    : "pending";
  const priority = ["low", "medium", "high"].includes(source.priority as string)
    ? (source.priority as CommitteeActionItem["priority"])
    : "medium";
  return {
    id: typeof source.id === "string" ? source.id : `action_${meetingIndex}_${itemIndex}`,
    description: typeof source.description === "string" ? source.description : "",
    assignedTo: typeof source.assignedTo === "string" ? source.assignedTo : "",
    dueDate: toDate(source.dueDate) ?? new Date(0),
    status,
    priority,
  };
}

function toMeetings(raw: unknown): CommitteeMeeting[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, index): CommitteeMeeting => {
    const source = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
    return {
      id: typeof source.id === "string" ? source.id : `meeting_${index}`,
      title: typeof source.title === "string" ? source.title : "Committee meeting",
      date: toDate(source.date) ?? new Date(0),
      duration: toNumber(source.duration, 0),
      location: typeof source.location === "string" ? source.location : "",
      isVirtual: source.isVirtual === true,
      attendanceCount: toNumber(source.attendanceCount, 0),
      agenda: toStringArray(source.agenda),
      ...(typeof source.minutes === "string" && source.minutes.length > 0
        ? { minutes: source.minutes }
        : {}),
      actionItems: (Array.isArray(source.actionItems) ? source.actionItems : []).map((item, i) =>
        toActionItem(item, index, i),
      ),
    };
  });
}

function toMonthlyTrend(raw: unknown): CommitteeMonthlyTrend[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry): CommitteeMonthlyTrend => {
    const source = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
    return {
      month: typeof source.month === "string" ? source.month : "",
      memberCount: toNumber(source.memberCount, 0),
      meetingCount: toNumber(source.meetingCount, 0),
      attendanceRate: toNumber(source.attendanceRate, 0),
      goalsCompleted: toNumber(source.goalsCompleted, 0),
      deliverablesCompleted: toNumber(source.deliverablesCompleted, 0),
    };
  });
}

function toMetrics(raw: unknown, memberRows: MemberRow[]): CommitteeMetrics {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    memberCount: memberRows.length,
    activeMembersCount: memberRows.filter((member) => member.isActive).length,
    meetingAttendanceRate: toNumber(source.meetingAttendanceRate, 0),
    goalCompletionRate: toNumber(source.goalCompletionRate, 0),
    deliverablesCount: toNumber(source.deliverablesCount, 0),
    impactScore: toNumber(source.impactScore, 0),
    satisfactionScore: toNumber(source.satisfactionScore, 0),
    monthlyTrend: toMonthlyTrend(source.monthlyTrend),
  };
}

function toLeadership(row: MemberRow): CommitteeLeadership {
  return {
    id: row.id,
    userId: row.userId ?? "",
    name: row.name,
    email: row.email,
    role: row.role as CommitteeRole,
    title: row.title ?? "",
    startDate: row.joinedAt,
    ...(row.endedAt ? { endDate: row.endedAt } : {}),
    isActive: row.isActive,
    ...(row.responsibilities.length > 0 ? { responsibilities: row.responsibilities } : {}),
  };
}

function toMember(row: MemberRow): CommitteeMember {
  return {
    id: row.id,
    userId: row.userId ?? "",
    name: row.name,
    email: row.email,
    joinDate: row.joinedAt,
    ...(row.endedAt ? { endDate: row.endedAt } : {}),
    isActive: row.isActive,
    ...(row.expertise.length > 0 ? { expertise: row.expertise } : {}),
    contributionLevel:
      row.contributionLevel === "high" ||
      row.contributionLevel === "medium" ||
      row.contributionLevel === "low"
        ? row.contributionLevel
        : "medium",
  };
}

function toCommitteeDto(
  row: CommitteeRow,
  memberRows: MemberRow[],
  subCommitteeIds: string[],
): Committee {
  return {
    id: row.id,
    name: row.name,
    displayName: row.displayName,
    ...(row.description ? { description: row.description } : {}),
    purpose: row.purpose,
    status: row.status as CommitteeStatus,
    type: row.type as CommitteeType,
    charter: toCharter(row.charter, row),
    leadership: memberRows.filter((m) => m.role in LEADERSHIP_ROLES).map(toLeadership),
    members: memberRows.filter((m) => !(m.role in LEADERSHIP_ROLES)).map(toMember),
    ...(row.parentCommitteeId ? { parentCommitteeId: row.parentCommitteeId } : {}),
    subCommitteeIds,
    contactInfo: {
      email: row.contactEmail,
      ...(row.contactPhone ? { phone: row.contactPhone } : {}),
      ...(row.meetingLocation ? { meetingLocation: row.meetingLocation } : {}),
      ...(row.virtualMeetingLink ? { virtualMeetingLink: row.virtualMeetingLink } : {}),
      ...(row.website ? { website: row.website } : {}),
    },
    metrics: toMetrics(row.metrics, memberRows),
    meetings: toMeetings(row.meetings),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    ...(row.updatedBy ? { updatedBy: row.updatedBy } : {}),
  };
}

// ---------------------------------------------------------------------------
// Batch loaders
// ---------------------------------------------------------------------------

async function loadCommitteeParts(committeeIds: string[]): Promise<{
  membersByCommittee: Map<string, MemberRow[]>;
  subCommitteeIdsByCommittee: Map<string, string[]>;
}> {
  const membersByCommittee = new Map<string, MemberRow[]>();
  const subCommitteeIdsByCommittee = new Map<string, string[]>();
  if (committeeIds.length === 0) return { membersByCommittee, subCommitteeIdsByCommittee };

  const memberRows = await db
    .select()
    .from(committeeMember)
    .where(inArray(committeeMember.committeeId, committeeIds))
    .orderBy(asc(committeeMember.joinedAt), asc(committeeMember.id));
  for (const row of memberRows) {
    const list = membersByCommittee.get(row.committeeId) ?? [];
    list.push(row);
    membersByCommittee.set(row.committeeId, list);
  }

  const childRows = await db
    .select({ id: committee.id, parentCommitteeId: committee.parentCommitteeId })
    .from(committee)
    .where(inArray(committee.parentCommitteeId, committeeIds));
  for (const row of childRows) {
    if (!row.parentCommitteeId) continue;
    const list = subCommitteeIdsByCommittee.get(row.parentCommitteeId) ?? [];
    list.push(row.id);
    subCommitteeIdsByCommittee.set(row.parentCommitteeId, list);
  }

  return { membersByCommittee, subCommitteeIdsByCommittee };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface CommitteeListFilters {
  status?: CommitteeStatus[];
  type?: CommitteeType[];
  authorityLevel?: CommitteeAuthorityLevel[];
  leadershipRole?: CommitteeRole[];
  search?: string;
  memberCountMin?: number;
  memberCountMax?: number;
  page?: number;
  limit?: number;
}

export interface CommitteeListResult {
  items: Committee[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function paginate(page?: number, limit?: number): { page: number; limit: number; offset: number } {
  const safePage = page !== undefined && Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit =
    limit !== undefined && Number.isFinite(limit) && limit > 0
      ? Math.min(Math.floor(limit), MAX_LIMIT)
      : DEFAULT_LIMIT;
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

/** Correlated member count; the memberCountMin/Max filters compare against it. */
function memberCountColumn(): SQL<number> {
  return sql`(select count(*) from ${committeeMember} where ${committeeMember.committeeId} = ${committee.id})`;
}

export async function listCommittees(
  filters: CommitteeListFilters = {},
): Promise<CommitteeListResult> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);

  const conditions: SQL[] = [];
  if (filters.status && filters.status.length > 0) {
    conditions.push(inArray(committee.status, filters.status));
  }
  if (filters.type && filters.type.length > 0) {
    conditions.push(inArray(committee.type, filters.type));
  }
  if (filters.authorityLevel && filters.authorityLevel.length > 0) {
    conditions.push(inArray(committee.authorityLevel, filters.authorityLevel));
  }
  if (filters.leadershipRole && filters.leadershipRole.length > 0) {
    conditions.push(sql`exists (
      select 1 from ${committeeMember}
      where ${committeeMember.committeeId} = ${committee.id}
        and ${inArray(committeeMember.role, [...filters.leadershipRole])}
        and ${committeeMember.isActive}
    )`);
  }
  if (filters.search) {
    const needle = `%${filters.search}%`;
    conditions.push(or(ilike(committee.displayName, needle), ilike(committee.purpose, needle))!);
  }
  if (filters.memberCountMin !== undefined) {
    conditions.push(gte(memberCountColumn(), filters.memberCountMin));
  }
  if (filters.memberCountMax !== undefined) {
    conditions.push(lte(memberCountColumn(), filters.memberCountMax));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db.select({ value: count() }).from(committee).where(where);
  const total = totalRow?.value ?? 0;

  const rows = await db
    .select()
    .from(committee)
    .where(where)
    .orderBy(desc(committee.createdAt), desc(committee.id))
    .limit(limit)
    .offset(offset);

  const parts = await loadCommitteeParts(rows.map((row) => row.id));

  return {
    items: rows.map((row) =>
      toCommitteeDto(
        row,
        parts.membersByCommittee.get(row.id) ?? [],
        parts.subCommitteeIdsByCommittee.get(row.id) ?? [],
      ),
    ),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getCommittee(id: string): Promise<Committee> {
  if (!UUID_RE.test(id)) throw new NotFoundError("Committee", id);
  const [row] = await db.select().from(committee).where(eq(committee.id, id)).limit(1);
  if (!row) throw new NotFoundError("Committee", id);
  const parts = await loadCommitteeParts([id]);
  return toCommitteeDto(
    row,
    parts.membersByCommittee.get(id) ?? [],
    parts.subCommitteeIdsByCommittee.get(id) ?? [],
  );
}

/** Charter input → jsonb column; review dates are managed server-side. */
function charterToJsonb(
  input: CreateCommitteeInput["charter"],
  now: Date,
): Record<string, unknown> {
  const nextReview = new Date(now.getTime());
  nextReview.setFullYear(nextReview.getFullYear() + 1);
  return {
    missionStatement: input.missionStatement,
    responsibilities: input.responsibilities,
    authorityLevel: input.authorityLevel,
    decisionMakingProcess: input.decisionMakingProcess,
    reportingStructure: input.reportingStructure,
    ...(input.termLimits ? { termLimits: input.termLimits } : {}),
    approvalDate: now.toISOString(),
    lastReviewed: now.toISOString(),
    nextReview: nextReview.toISOString(),
  };
}

function blankToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value.trim() === "" ? null : value;
}

async function assertCommitteeExists(id: string, notFoundCode: string): Promise<void> {
  const [existing] = await db
    .select({ id: committee.id })
    .from(committee)
    .where(eq(committee.id, id))
    .limit(1);
  if (!existing) {
    throw new BusinessLogicError("Parent committee does not exist", notFoundCode);
  }
}

export async function createCommittee(
  input: CreateCommitteeInput,
  actorId: string,
): Promise<Committee> {
  const parentId = input.parentCommitteeId || null;
  if (parentId) await assertCommitteeExists(parentId, "COMMITTEE_PARENT_NOT_FOUND");

  const now = new Date();
  let row: CommitteeRow;
  try {
    [row] = await db
      .insert(committee)
      .values({
        name: input.name,
        displayName: input.displayName,
        description: blankToNull(input.description),
        purpose: input.purpose,
        status: input.status,
        type: input.type,
        authorityLevel: input.charter.authorityLevel,
        charter: charterToJsonb(input.charter, now),
        contactEmail: input.contactInfo.email,
        contactPhone: blankToNull(input.contactInfo.phone),
        meetingLocation: blankToNull(input.contactInfo.meetingLocation),
        virtualMeetingLink: blankToNull(input.contactInfo.virtualMeetingLink),
        website: blankToNull(input.contactInfo.website),
        parentCommitteeId: parentId,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) throwUniqueNameViolation(input.name);
    throw error;
  }
  return toCommitteeDto(row, [], []);
}

export async function updateCommittee(
  id: string,
  input: UpdateCommitteeInput,
  actorId: string,
): Promise<Committee> {
  if (!UUID_RE.test(id)) throw new NotFoundError("Committee", id);
  const [existing] = await db.select().from(committee).where(eq(committee.id, id)).limit(1);
  if (!existing) throw new NotFoundError("Committee", id);

  const set: Partial<typeof committee.$inferInsert> = { updatedBy: actorId };

  if (input.name !== undefined) set.name = input.name;
  if (input.displayName !== undefined) set.displayName = input.displayName;
  if (input.description !== undefined) set.description = blankToNull(input.description);
  if (input.purpose !== undefined) set.purpose = input.purpose;
  if (input.status !== undefined) set.status = input.status;
  if (input.type !== undefined) set.type = input.type;

  if ("parentCommitteeId" in input) {
    const parentId = input.parentCommitteeId || null;
    if (parentId === id) {
      throw new BusinessLogicError("A committee cannot be its own parent", "COMMITTEE_PARENT_SELF");
    }
    if (parentId) await assertCommitteeExists(parentId, "COMMITTEE_PARENT_NOT_FOUND");
    set.parentCommitteeId = parentId;
  }

  if (input.charter !== undefined) {
    const previous = (
      existing.charter && typeof existing.charter === "object" ? existing.charter : {}
    ) as Record<string, unknown>;
    const now = new Date();
    const approvalDate =
      typeof previous.approvalDate === "string" ? previous.approvalDate : now.toISOString();
    set.authorityLevel = input.charter.authorityLevel;
    set.charter = { ...charterToJsonb(input.charter, now), approvalDate };
  }

  if (input.contactInfo !== undefined) {
    set.contactEmail = input.contactInfo.email;
    set.contactPhone = blankToNull(input.contactInfo.phone);
    set.meetingLocation = blankToNull(input.contactInfo.meetingLocation);
    set.virtualMeetingLink = blankToNull(input.contactInfo.virtualMeetingLink);
    set.website = blankToNull(input.contactInfo.website);
  }

  let row: CommitteeRow;
  try {
    [row] = await db.update(committee).set(set).where(eq(committee.id, id)).returning();
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throwUniqueNameViolation(input.name ?? existing.name);
    }
    throw error;
  }

  const parts = await loadCommitteeParts([id]);
  return toCommitteeDto(
    row,
    parts.membersByCommittee.get(id) ?? [],
    parts.subCommitteeIdsByCommittee.get(id) ?? [],
  );
}

export async function deleteCommittee(id: string): Promise<boolean> {
  if (!UUID_RE.test(id)) return false;
  const [deleted] = await db
    .delete(committee)
    .where(eq(committee.id, id))
    .returning({ id: committee.id });
  return deleted !== undefined;
}
