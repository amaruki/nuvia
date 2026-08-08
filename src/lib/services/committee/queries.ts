import { and, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { committee, committeeMember } from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import type {
  Committee,
  CommitteeAuthorityLevel,
  CommitteeRole,
  CommitteeStatus,
  CommitteeType,
} from "@/types/committee";
import { loadCommitteeParts } from "./batch-loaders";
import { UUID_RE } from "./errors";
import { toCommitteeDto } from "./mappers";

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
