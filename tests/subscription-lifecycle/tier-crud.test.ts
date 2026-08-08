/**
 * Backlog C2 split — tier CRUD round-trip with string-mode numeric(10,2)
 * amounts against the real membership_tiers table, plus the zod validation
 * boundaries.
 *
 * Every row this file creates is removed in afterAll; names carry a unique
 * suffix so runs never collide.
 */

import { afterAll, describe, expect, test } from "bun:test";
import { NotFoundError } from "@/lib/errors";
import {
  createTier,
  deleteTier,
  getTier,
  listTiers,
  updateTier,
} from "@/lib/services/membership-tier.service";
import { createTierSchema, updateTierSchema } from "@/lib/validation/finance.validation";
import { createFixture, expectRejects, suffix } from "./helpers";

const fixture = createFixture();

afterAll(async () => {
  await fixture.cleanup();
});

describe("membership tier CRUD — real membership_tiers table", () => {
  let crudTierId: string;
  const crudTierName = `c2-crud-${suffix()}`;

  test("create stores the string-mode price and returns the full row", async () => {
    const tier = await createTier({
      name: crudTierName,
      displayName: "C2 CRUD Tier",
      description: "lifecycle test tier",
      price: "49.99",
      billingCycle: "monthly",
      features: ["voting"],
      trialDays: 14,
      sortOrder: 5,
    });

    fixture.trackTier(tier.id);
    crudTierId = tier.id;

    expect(tier.price).toBe("49.99");
    expect(tier.billingCycle).toBe("monthly");
    expect(tier.trialDays).toBe(14);
    expect(tier.features).toEqual(["voting"]);
    expect(tier.benefits).toEqual([]);
    expect(tier.isActive).toBe(true);
  });

  test("read and list return the created tier", async () => {
    const fetched = await getTier(crudTierId);
    expect(fetched.name).toBe(crudTierName);

    const listed = await listTiers();
    expect(listed.some((tier) => tier.id === crudTierId)).toBe(true);
  });

  test("update changes only the provided fields", async () => {
    const updated = await updateTier(crudTierId, { price: "59.50" });
    expect(updated.price).toBe("59.50");
    expect(updated.displayName).toBe("C2 CRUD Tier");

    const refetched = await getTier(crudTierId);
    expect(refetched.price).toBe("59.50");
  });

  test("duplicate tier names are rejected", async () => {
    await expectRejects(
      () =>
        createTier({
          name: crudTierName,
          displayName: "Dup",
          price: "1.00",
          billingCycle: "monthly",
        }),
      "TIER_NAME_TAKEN",
    );
  });

  test("zod accepts string decimals only — numeric(10,2) string mode", () => {
    const base = {
      name: `zod-${suffix()}`,
      displayName: "Zod Tier",
      billingCycle: "monthly" as const,
    };

    expect(createTierSchema.safeParse({ ...base, price: 49.99 }).success).toBe(false);
    expect(createTierSchema.safeParse({ ...base, price: "49.999" }).success).toBe(false);
    expect(createTierSchema.safeParse({ ...base, price: "-5.00" }).success).toBe(false);
    expect(createTierSchema.safeParse({ ...base, price: "123456789.00" }).success).toBe(false);
    expect(createTierSchema.safeParse({ ...base, price: "99999999.99" }).success).toBe(true);
    expect(createTierSchema.safeParse({ ...base, price: "0" }).success).toBe(true);
  });

  test("update schema rejects an empty body", () => {
    expect(updateTierSchema.safeParse({}).success).toBe(false);
    expect(updateTierSchema.safeParse({ price: "1.00" }).success).toBe(true);
  });

  test("delete removes an unused tier", async () => {
    const throwaway = await createTier({
      name: `c2-throwaway-${suffix()}`,
      displayName: "Throwaway",
      price: "1.00",
      billingCycle: "monthly",
    });

    await deleteTier(throwaway.id);
    await expectRejects(() => getTier(throwaway.id), undefined, NotFoundError);
  });

  test("unknown tier ids are NotFound", async () => {
    await expectRejects(() => getTier(crypto.randomUUID()), undefined, NotFoundError);
  });
});
