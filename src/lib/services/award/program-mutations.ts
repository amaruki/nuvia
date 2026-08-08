import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { awardProgram } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import type { AwardProgram } from "@/types/award.types";
import { AwardServiceError, pgErrorCode, UNIQUE_VIOLATION } from "./errors";
import { UI_TO_DB_CATEGORY, UI_TO_DB_PROGRAM_STATUS } from "./mapping";
import { toUiProgram } from "./mappers";
import type { CreateAwardProgramInput, UpdateAwardProgramInput } from "./schemas";
import { getAwardProgram } from "./program-queries";

export async function assertProgramExists(programId: string): Promise<void> {
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

export async function createAwardProgram(
  input: CreateAwardProgramInput,
  actor: string,
): Promise<AwardProgram> {
  let row: typeof awardProgram.$inferSelect;
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
