/**
 * Membership tier CRUD over the real `membership_tiers` table (backlog C2).
 *
 * Amounts are numeric(10,2) string mode end to end — the zod schemas
 * (src/lib/validation/finance.validation.ts) only accept string decimals.
 * Deleting a tier that subscriptions or transactions still reference is
 * refused; deactivate it (`isActive: false`) instead.
 */

import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipTier, type MembershipTier } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import type { CreateTierInput, UpdateTierInput } from "@/lib/validation/finance.validation";

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

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

/** Tiers ordered for display; inactive tiers only on request. */
export async function listTiers(
  options: { includeInactive?: boolean } = {},
): Promise<MembershipTier[]> {
  return db.query.membershipTier.findMany({
    where: options.includeInactive ? undefined : eq(membershipTier.isActive, true),
    orderBy: [asc(membershipTier.sortOrder), asc(membershipTier.price)],
  });
}

export async function getTier(id: string): Promise<MembershipTier> {
  const tier = await db.query.membershipTier.findFirst({
    where: eq(membershipTier.id, id),
  });

  if (!tier) throw new NotFoundError("MembershipTier", id);
  return tier;
}

export async function createTier(input: CreateTierInput): Promise<MembershipTier> {
  try {
    // Mirror the zod defaults so direct callers (not routed through the
    // createTierSchema) never hit the notNull jsonb/boolean/integer columns.
    const [tier] = await db
      .insert(membershipTier)
      .values({
        ...input,
        features: input.features ?? [],
        benefits: input.benefits ?? [],
        permissions: input.permissions ?? [],
        isDefault: input.isDefault ?? false,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
        trialDays: input.trialDays ?? 0,
      })
      .returning();
    return tier;
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new BusinessLogicError(
        "A membership tier with that name already exists",
        "TIER_NAME_TAKEN",
      );
    }
    throw error;
  }
}

export async function updateTier(id: string, input: UpdateTierInput): Promise<MembershipTier> {
  await getTier(id);

  try {
    // undefined keys are skipped by drizzle's .set(); explicit nulls clear.
    const [tier] = await db
      .update(membershipTier)
      .set({ ...input })
      .where(eq(membershipTier.id, id))
      .returning();
    return tier;
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new BusinessLogicError(
        "A membership tier with that name already exists",
        "TIER_NAME_TAKEN",
      );
    }
    throw error;
  }
}

export async function deleteTier(id: string): Promise<void> {
  await getTier(id);

  try {
    await db.delete(membershipTier).where(eq(membershipTier.id, id));
  } catch (error) {
    if (pgErrorCode(error) === FOREIGN_KEY_VIOLATION) {
      throw new BusinessLogicError(
        "Tier still has subscriptions or transactions; deactivate it instead of deleting",
        "TIER_IN_USE",
      );
    }
    throw error;
  }
}
