/**
 * Member award nominations (backlog UI-36) — the ring-1 write path that
 * lets signed-in members nominate on OPEN programs.
 *
 * Deliberately NOT built on `createAwardNomination` (the admin mutation):
 * members do not hold `awards:create`, must not be able to set review
 * status or nominator identity, and the admin API contract stays untouched.
 *
 * Documented policies:
 *  - Nominations are accepted ONLY while the program is OPEN and inside
 *    its configured open/close date window. DRAFT/CLOSED/ARCHIVED (or an
 *    OPEN program whose window has passed) get a 409.
 *  - One nomination per member per program; duplicates get a 409.
 *  - Nominator name/email are forced from the session user; nominations
 *    always start PENDING.
 *  - `listOpenAwardPrograms` is a ring-safe projection: no admin-only
 *    fields (nominationCount, createdBy, updatedBy) are exposed.
 */

import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db/client";
import { awardNomination, awardProgram, user } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import type { AwardCategory, AwardNomination } from "@/types/award.types";
import { AwardServiceError, pgErrorCode, UNIQUE_VIOLATION } from "./errors";
import { DB_TO_UI_CATEGORY } from "./mapping";
import { toUiNomination, type AwardProgramRow } from "./mappers";
import type { SubmitMemberNominationInput } from "./schemas";

/** Ring-safe shape of a program currently accepting nominations. */
export interface OpenAwardProgram {
  id: string;
  name: string;
  description?: string;
  category: AwardCategory;
  status: "open";
  criteria: string[];
  /** Nomination window opens (inclusive). */
  openDate?: Date;
  /** Nomination deadline (inclusive). */
  closeDate?: Date;
  /** Date the award is conferred. */
  awardDate?: Date;
}

function toOpenAwardProgram(row: AwardProgramRow): OpenAwardProgram {
  return {
    id: row.id,
    name: row.name,
    ...(row.description !== null ? { description: row.description } : {}),
    category: DB_TO_UI_CATEGORY[row.category],
    status: "open",
    // jsonb criteria arrives as unknown — narrow to string[] with checked filters.
    criteria: Array.isArray(row.criteria)
      ? row.criteria.filter((item): item is string => typeof item === "string")
      : [],
    ...(row.openDate ? { openDate: row.openDate } : {}),
    ...(row.closeDate ? { closeDate: row.closeDate } : {}),
    ...(row.awardDate ? { awardDate: row.awardDate } : {}),
  };
}

/**
 * Programs a member can nominate for RIGHT NOW: status OPEN and inside the
 * configured window. An OPEN program whose close date has passed cannot
 * accept nominations, so listing it would be dishonest — it stays out.
 */
export async function listOpenAwardPrograms(): Promise<OpenAwardProgram[]> {
  const now = new Date();
  const rows = await db
    .select()
    .from(awardProgram)
    .where(
      and(
        eq(awardProgram.status, "OPEN"),
        or(isNull(awardProgram.openDate), lte(awardProgram.openDate, now)),
        or(isNull(awardProgram.closeDate), gte(awardProgram.closeDate, now)),
      ),
    )
    .orderBy(awardProgram.name);

  return rows.map(toOpenAwardProgram);
}

export async function submitMemberNomination(
  userId: string,
  input: SubmitMemberNominationInput,
): Promise<AwardNomination> {
  const programs = await db
    .select()
    .from(awardProgram)
    .where(eq(awardProgram.id, input.programId))
    .limit(1);
  if (programs.length === 0) {
    throw new AwardServiceError(problems.notFound("Award program not found"));
  }
  const program = programs[0];

  if (program.status !== "OPEN") {
    throw new AwardServiceError(
      problem(
        "conflict",
        409,
        "Nominations are not open",
        `This award program is ${program.status.toLowerCase()}; nominations are only accepted while it is open.`,
      ),
    );
  }

  const now = new Date();
  if (program.openDate && program.openDate > now) {
    throw new AwardServiceError(
      problem(
        "conflict",
        409,
        "Nominations have not opened yet",
        "The nomination window for this award program has not opened yet.",
      ),
    );
  }
  if (program.closeDate && program.closeDate < now) {
    throw new AwardServiceError(
      problem(
        "conflict",
        409,
        "The nomination window has closed",
        "The nomination deadline for this award program has passed.",
      ),
    );
  }

  // One nomination per member per program.
  const duplicates = await db
    .select({ id: awardNomination.id })
    .from(awardNomination)
    .where(and(eq(awardNomination.programId, input.programId), eq(awardNomination.userId, userId)))
    .limit(1);
  if (duplicates.length > 0) {
    throw new AwardServiceError(
      problem(
        "conflict",
        409,
        "Duplicate nomination",
        "You have already nominated for this award program.",
      ),
    );
  }

  // Nominator identity comes from the session user — never the request body.
  const users = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (users.length === 0) {
    throw new AwardServiceError(problems.authenticationRequired());
  }
  const nominatorName = users[0].name ?? users[0].email;

  try {
    const [row] = await db
      .insert(awardNomination)
      .values({
        programId: input.programId,
        userId,
        nomineeName: input.nomineeName,
        nomineeEmail: input.nomineeEmail,
        nominatorName,
        nominatorEmail: users[0].email,
        status: "PENDING",
        statement: input.statement ?? null,
        createdBy: users[0].email,
      })
      .returning();
    return toUiNomination(row, program.name);
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new AwardServiceError(
        problem(
          "conflict",
          409,
          "Duplicate nomination",
          "You have already nominated for this award program.",
        ),
      );
    }
    throw new AwardServiceError(problems.internalError("Could not create the nomination"));
  }
}

/** The caller's own nominations, newest first — ring-1 scoping by userId. */
export async function listOwnNominations(userId: string): Promise<AwardNomination[]> {
  const rows = await db
    .select({ nomination: awardNomination, programName: awardProgram.name })
    .from(awardNomination)
    .innerJoin(awardProgram, eq(awardNomination.programId, awardProgram.id))
    .where(eq(awardNomination.userId, userId))
    .orderBy(desc(awardNomination.createdAt));

  return rows.map((row) => toUiNomination(row.nomination, row.programName));
}
