import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { awardNomination, user } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import type { AwardNomination } from "@/types/award.types";
import { AwardServiceError } from "./errors";
import { UI_TO_DB_NOMINATION_STATUS } from "./mapping";
import { getAwardNomination } from "./nomination-queries";
import { assertProgramExists } from "./program-mutations";
import type { CreateAwardNominationInput, UpdateAwardNominationInput } from "./schemas";

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
