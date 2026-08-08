/**
 * B1 — Members API: listMembers derived status matches the A3 derivation.
 * Part of the split members suite in tests/members-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { listMembers } from "@/lib/services/member.service";
import type { MemberStatus } from "@/lib/services/membership-status.service";
import { createFixtures } from "./fixtures";

const { COHORT, TIER_NAME, seedCohort, cleanup } = createFixtures();

/** The A3 (ADR-0014) expectation for each fixture, asserted below. */
const expectedStatus: Record<string, MemberStatus> = {
  active: "active", // ACTIVE inside the paid period
  gracecancel: "in_grace", // CANCELED but paid through the period
  lapsedcancel: "expired", // CANCELED and the paid period is over
  pastduefresh: "in_grace", // PAST_DUE inside the retry grace window
  pastdueold: "expired", // PAST_DUE past the retry grace window
  trial: "trialing", // TRIALING inside the trial window
  paused: "paused", // PAUSED
  nosub: "none", // no subscription row at all
  renewed: "active", // newest subscription is ACTIVE; older CANCELED one loses
};

beforeAll(seedCohort);

afterAll(cleanup);

describe("listMembers — derived status matches the A3 derivation", () => {
  test("every fixture derives its ADR-0014 status; soft-deleted users are excluded", async () => {
    const result = await listMembers({
      page: 1,
      limit: 100,
      search: COHORT,
      sortBy: "username",
      sortOrder: "asc",
    });

    expect(result.total).toBe(9);
    expect(result.totalPages).toBe(1);
    expect(result.members).toHaveLength(9);

    for (const member of result.members) {
      const slug = member.username.replace(`${COHORT}-`, "");
      expect(expectedStatus[slug]).toBeDefined();
      expect(member.memberStatus).toBe(expectedStatus[slug]);
    }
    expect(result.members.some((member) => member.username.endsWith("-deleted"))).toBe(false);
  });

  test("list items expose the newest subscription with its tier name", async () => {
    const result = await listMembers({
      page: 1,
      limit: 100,
      search: `${COHORT}-active`,
    });
    expect(result.total).toBe(1);

    const [member] = result.members;
    expect(member.subscription).not.toBeNull();
    expect(member.subscription?.status).toBe("ACTIVE");
    expect(member.subscription?.tierName).toBe(TIER_NAME);
    expect(member.email).toBe(`${COHORT}-active@example.test`);
  });

  test("users without a subscription list with subscription null and status none", async () => {
    const result = await listMembers({
      page: 1,
      limit: 100,
      search: `${COHORT}-nosub`,
    });
    expect(result.total).toBe(1);
    expect(result.members[0].memberStatus).toBe("none");
    expect(result.members[0].subscription).toBeNull();
  });

  test("a renewed user's listing uses the newest subscription", async () => {
    const result = await listMembers({
      page: 1,
      limit: 100,
      search: `${COHORT}-renewed`,
    });
    expect(result.total).toBe(1);
    expect(result.members[0].memberStatus).toBe("active");
    expect(result.members[0].subscription?.status).toBe("ACTIVE");
  });
});
