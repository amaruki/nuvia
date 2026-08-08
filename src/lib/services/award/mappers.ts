import type { awardNomination, awardProgram } from "@/db/schema";
import type { AwardNomination, AwardProgram } from "@/types/award.types";
import { DB_TO_UI_CATEGORY, DB_TO_UI_NOMINATION_STATUS, DB_TO_UI_PROGRAM_STATUS } from "./mapping";

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

export type AwardProgramRow = typeof awardProgram.$inferSelect;
export type AwardNominationRow = typeof awardNomination.$inferSelect;

export function toUiProgram(row: AwardProgramRow, nominationCount: number): AwardProgram {
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

export function toUiNomination(row: AwardNominationRow, programName: string): AwardNomination {
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
