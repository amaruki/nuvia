/**
 * Shared fixture for the C2 suite split out of tests/subscription-lifecycle.test.ts.
 * Each test file owns one createFixture() instance, so cleanup registries never
 * leak between files sharing bun's single module cache; unique suffixes keep
 * concurrent runs from colliding.
 */

import { expect } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipTier, user } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import { GatewayError } from "@/lib/payments/gateway";
import type { ActorContext } from "@/lib/services/subscription.service";

export const DAY = 86_400_000;

export const suffix = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const actor: ActorContext = { actorId: "system:c2-lifecycle-test" };

export async function readRole(userId: string): Promise<string | undefined> {
  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { role: true },
  });
  return row?.role;
}

export async function expectRejects(
  fn: () => Promise<unknown>,
  code?: string,
  errorClass:
    | typeof BusinessLogicError
    | typeof NotFoundError
    | typeof GatewayError = BusinessLogicError,
): Promise<void> {
  const err: unknown = await fn().catch((e: unknown) => e);
  expect(err).toBeInstanceOf(errorClass);
  if (code !== undefined && err instanceof BusinessLogicError) {
    expect(err.code).toBe(code);
  }
}

export function createFixture() {
  const createdUserIds: string[] = [];
  const createdTierIds: string[] = [];

  async function createTestUser(role = "user"): Promise<string> {
    const stamp = suffix();
    const [row] = await db
      .insert(user)
      .values({
        username: `c2-${stamp}`,
        email: `c2-${stamp}@example.test`,
        name: "C2 Lifecycle Test",
        role,
        emailVerified: false,
      })
      .returning({ id: user.id });

    createdUserIds.push(row.id);
    return row.id;
  }

  function trackTier(tierId: string): void {
    createdTierIds.push(tierId);
  }

  async function cleanup(): Promise<void> {
    // Subscriptions and auth logs cascade off the user rows; tiers are removed
    // last, once nothing references them anymore.
    for (const id of createdUserIds) {
      await db.delete(user).where(eq(user.id, id));
    }
    for (const id of createdTierIds) {
      await db.delete(membershipTier).where(eq(membershipTier.id, id));
    }
  }

  return { createTestUser, trackTier, cleanup };
}
