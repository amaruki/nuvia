import { and, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { awardNomination, awardProgram } from "@/db/schema";
import type { AwardNomination, AwardNominationStatus } from "@/types/award.types";
import { UI_TO_DB_NOMINATION_STATUS, type DbAwardNominationStatus } from "./mapping";
import { toUiNomination } from "./mappers";
import {
  csvValues,
  paginate,
  type AwardNominationListFilters,
  type Paginated,
} from "./query-helpers";

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
