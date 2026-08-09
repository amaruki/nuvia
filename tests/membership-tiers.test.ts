/**
 * UI-02 — The membership tiers page must run on the real finance endpoints.
 *
 * The page used to render a hard-coded `tiersData` array and its Save/Delete
 * buttons only logged to the console. These tests drive the route handlers
 * the wired page calls:
 *
 *   - GET    /api/v1/finance/tiers (+includeInactive) — now also returns
 *     real per-tier member counts (no fabricated "2,954 members (+12%)")
 *   - POST   /api/v1/finance/tiers
 *   - PATCH  /api/v1/finance/tiers/[id]
 *   - DELETE /api/v1/finance/tiers/[id]
 *
 * and assert persistence plus honest ACTIVE-subscription counts.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { membershipSubscription, membershipTier, user } from "@/db/schema";
import { GET as listTiersRoute, POST as createTierRoute } from "@/app/api/v1/finance/tiers/route";
import {
  DELETE as deleteTierRoute,
  GET as getTierRoute,
  PATCH as updateTierRoute,
} from "@/app/api/v1/finance/tiers/[id]/route";
import { createSubscription } from "@/lib/services/subscription.service";

import { buildRequest, ctx, parseEnvelope, createFixtures } from "./workspaces-api/fixtures";

const API = "http://localhost:3000/api/v1/finance/tiers";
const fixtures = createFixtures();
const { RUN_ID, signUpWithRole } = fixtures;

const createdTierIds: string[] = [];
const createdSubscriptionIds: string[] = [];
const createdUserIds: string[] = [];

const state = {
  adminCookie: "",
  adminId: "",
  memberCookie: "",
  memberId: "",
  tierId: "",
  tierName: `ui02-tier-${RUN_ID}`,
};

interface TierDto {
  id: string;
  name: string;
  displayName: string;
  price: string;
  billingCycle: string;
  isActive: boolean;
}

interface TierListData {
  tiers: TierDto[];
  total: number;
  memberCounts?: Record<string, number>;
  totalActiveMembers?: number;
}

afterAll(async () => {
  if (createdSubscriptionIds.length > 0) {
    await db
      .delete(membershipSubscription)
      .where(inArray(membershipSubscription.id, createdSubscriptionIds));
  }
  if (createdTierIds.length > 0) {
    await db.delete(membershipTier).where(inArray(membershipTier.id, createdTierIds));
  }
  if (createdUserIds.length > 0) {
    await db.delete(user).where(inArray(user.id, createdUserIds));
  }
});

async function seedUsers() {
  if (state.adminCookie) return;
  const admin = await signUpWithRole(`fin-admin-${RUN_ID}`, "admin");
  const member = await signUpWithRole(`fin-member-${RUN_ID}`, "member");
  state.adminCookie = admin.cookie;
  state.adminId = admin.userId;
  state.memberCookie = member.cookie;
  state.memberId = member.userId;
  createdUserIds.push(admin.userId, member.userId);
}

async function listTiers(cookie: string, includeInactive = false) {
  const qs = includeInactive ? "?includeInactive=true" : "";
  const res = await listTiersRoute(buildRequest(`${API}${qs}`, { cookie }));
  const envelope = await parseEnvelope(res);
  const data: TierListData = envelope.data;
  return { res, data };
}

describe("UI-02 membership tiers page backend", () => {
  test("unauthenticated tier listing is rejected", async () => {
    const res = await listTiersRoute(buildRequest(API));
    expect(res.status).toBe(401);
  });

  test("member without finance:read cannot list tiers", async () => {
    await seedUsers();
    const res = await listTiersRoute(buildRequest(API, { cookie: state.memberCookie }));
    expect(res.status).toBe(403);
  });

  test("admin creates a tier with the body the tier form sends", async () => {
    await seedUsers();
    const res = await createTierRoute(
      buildRequest(API, {
        method: "POST",
        cookie: state.adminCookie,
        body: {
          name: state.tierName,
          displayName: `UI-02 Tier ${RUN_ID}`,
          description: "Tier created through the wired tiers page.",
          price: "49.00",
          billingCycle: "monthly",
          features: ["Event registration"],
          benefits: ["Monthly newsletter"],
          color: "#6366f1",
          sortOrder: 10,
        },
      }),
    );
    expect(res.status).toBe(201);
    const envelope = await parseEnvelope(res);
    const created: { tier: TierDto } = envelope.data;
    expect(created.tier.id).toBeString();
    expect(created.tier.name).toBe(state.tierName);
    expect(created.tier.price).toBe("49.00");
    state.tierId = created.tier.id;
    createdTierIds.push(created.tier.id);

    const [row] = await db.select().from(membershipTier).where(eq(membershipTier.id, state.tierId));
    expect(row?.name).toBe(state.tierName);
    expect(row?.price).toBe("49.00");
  });

  test("tier listing exposes real member counts (no fabricated stats)", async () => {
    await seedUsers();
    const { res, data } = await listTiers(state.adminCookie, true);
    expect(res.status).toBe(200);

    // New contract for the tiers page: counts derived from ACTIVE
    // subscriptions, never invented in the UI.
    expect(data.memberCounts).toBeDefined();
    expect(typeof data.totalActiveMembers).toBe("number");
    expect(data.memberCounts?.[state.tierId] ?? 0).toBe(0);

    const tier = data.tiers.find((t) => t.id === state.tierId);
    expect(tier).toBeDefined();
  });

  test("member counts track real ACTIVE subscriptions", async () => {
    await seedUsers();
    const { subscription } = await createSubscription(
      { userId: state.memberId, tierId: state.tierId },
      { actorId: state.adminId },
    );
    createdSubscriptionIds.push(subscription.id);
    expect(subscription.status).toBe("ACTIVE");

    const { data } = await listTiers(state.adminCookie, true);
    expect(data.memberCounts?.[state.tierId]).toBe(1);
    expect(data.totalActiveMembers).toBeGreaterThanOrEqual(1);
  });

  test("admin updates the tier price and the change persists", async () => {
    await seedUsers();
    const res = await updateTierRoute(
      buildRequest(`${API}/${state.tierId}`, {
        method: "PATCH",
        cookie: state.adminCookie,
        body: { price: "59.00", displayName: `UI-02 Tier Updated ${RUN_ID}` },
      }),
      ctx({ id: state.tierId }),
    );
    expect(res.status).toBe(200);

    const read = await getTierRoute(
      buildRequest(`${API}/${state.tierId}`, { cookie: state.adminCookie }),
      ctx({ id: state.tierId }),
    );
    const envelope = await parseEnvelope(read);
    const fetched: { tier: TierDto } = envelope.data;
    expect(fetched.tier.price).toBe("59.00");
    expect(fetched.tier.displayName).toBe(`UI-02 Tier Updated ${RUN_ID}`);
  });

  test("member without finance:update cannot edit tiers", async () => {
    await seedUsers();
    const res = await updateTierRoute(
      buildRequest(`${API}/${state.tierId}`, {
        method: "PATCH",
        cookie: state.memberCookie,
        body: { price: "0.01" },
      }),
      ctx({ id: state.tierId }),
    );
    expect(res.status).toBe(403);
  });

  test("delete is refused while subscriptions reference the tier", async () => {
    await seedUsers();
    const res = await deleteTierRoute(
      buildRequest(`${API}/${state.tierId}`, {
        method: "DELETE",
        cookie: state.adminCookie,
      }),
      ctx({ id: state.tierId }),
    );
    expect(res.status).toBe(409);
  });

  test("admin deletes the tier once its subscriptions are gone", async () => {
    await seedUsers();
    await db
      .delete(membershipSubscription)
      .where(inArray(membershipSubscription.id, createdSubscriptionIds));
    createdSubscriptionIds.length = 0;

    const res = await deleteTierRoute(
      buildRequest(`${API}/${state.tierId}`, {
        method: "DELETE",
        cookie: state.adminCookie,
      }),
      ctx({ id: state.tierId }),
    );
    expect(res.status).toBe(200);

    const rows = await db.select().from(membershipTier).where(eq(membershipTier.id, state.tierId));
    expect(rows.length).toBe(0);
  });
});
