import { and, asc, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { awardNomination, awardProgram } from "@/db/schema";
import type { AwardCategory, AwardProgram, AwardProgramStatus } from "@/types/award.types";
import {
  UI_TO_DB_CATEGORY,
  UI_TO_DB_PROGRAM_STATUS,
  type DbAwardCategory,
  type DbAwardProgramStatus,
} from "./mapping";
import { toUiProgram } from "./mappers";
import { csvValues, paginate, type AwardProgramListFilters, type Paginated } from "./query-helpers";

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

export async function getAwardProgram(id: string): Promise<AwardProgram | null> {
  const rows = await db.select().from(awardProgram).where(eq(awardProgram.id, id)).limit(1);
  if (rows.length === 0) return null;

  const counts = await nominationCountsByProgram([rows[0].id]);
  return toUiProgram(rows[0], counts[rows[0].id] ?? 0);
}
