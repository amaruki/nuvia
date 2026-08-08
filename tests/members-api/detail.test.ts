/**
 * B1 — Members API: getMemberDetail user block, derived status, history.
 * Part of the split members suite in tests/members-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { NotFoundError } from "@/lib/errors";
import { getMemberDetail } from "@/lib/services/member.service";
import { createFixtures } from "./fixtures";

const { COHORT, TIER_NAME, ids, seedCohort, cleanup } = createFixtures();

beforeAll(seedCohort);

afterAll(cleanup);

describe("getMemberDetail — user block, derived status, subscription history", () => {
  test("renewed member: history is newest-first and status comes from the newest row", async () => {
    const detail = await getMemberDetail(ids.renewed);

    expect(detail.user.id).toBe(ids.renewed);
    expect(detail.user.email).toBe(`${COHORT}-renewed@example.test`);
    expect(detail.user.role).toBe("member");
    expect(detail.memberStatus).toBe("active");

    expect(detail.subscriptionHistory).toHaveLength(2);
    expect(detail.subscriptionHistory[0].status).toBe("ACTIVE");
    expect(detail.subscriptionHistory[1].status).toBe("CANCELED");
    expect(detail.currentSubscription?.id).toBe(detail.subscriptionHistory[0].id);
    expect(detail.subscriptionHistory[0].tierName).toBe(TIER_NAME);
  });

  test("user without subscriptions: none status, empty history", async () => {
    const detail = await getMemberDetail(ids.nosub);
    expect(detail.memberStatus).toBe("none");
    expect(detail.currentSubscription).toBeNull();
    expect(detail.subscriptionHistory).toEqual([]);
  });

  test("canceled-but-paid-through member derives in_grace", async () => {
    const detail = await getMemberDetail(ids.gracecancel);
    expect(detail.memberStatus).toBe("in_grace");
    expect(detail.currentSubscription?.status).toBe("CANCELED");
  });

  test("unknown user id throws NotFoundError", async () => {
    await expect(getMemberDetail(crypto.randomUUID())).rejects.toBeInstanceOf(NotFoundError);
  });

  test("soft-deleted user throws NotFoundError", async () => {
    await expect(getMemberDetail(ids.deleted)).rejects.toBeInstanceOf(NotFoundError);
  });
});
