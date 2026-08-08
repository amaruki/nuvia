/**
 * B1 — Members API: listMembers search, role and status filters.
 * Part of the split members suite in tests/members-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { listMembers } from "@/lib/services/member.service";
import type { MemberStatus } from "@/lib/services/membership-status.service";
import { createFixtures } from "./fixtures";

const { COHORT, seedCohort, cleanup } = createFixtures();

beforeAll(seedCohort);

afterAll(cleanup);

describe("listMembers — search, role and status filters", () => {
  test("search matches name fragments", async () => {
    const result = await listMembers({
      page: 1,
      limit: 100,
      search: `B1 ${COHORT}`,
    });
    expect(result.total).toBe(9);
  });

  test("search matches email fragments", async () => {
    const result = await listMembers({
      page: 1,
      limit: 100,
      search: `${COHORT}-active@`,
    });
    expect(result.total).toBe(1);
    expect(result.members[0].username).toBe(`${COHORT}-active`);
  });

  test("role filter narrows to matching roles", async () => {
    const userOnly = await listMembers({
      page: 1,
      limit: 100,
      search: COHORT,
      roles: ["user"],
    });
    expect(userOnly.total).toBe(1);
    expect(userOnly.members[0].username).toBe(`${COHORT}-nosub`);

    const memberAndUser = await listMembers({
      page: 1,
      limit: 100,
      search: COHORT,
      roles: ["member", "user"],
    });
    expect(memberAndUser.total).toBe(9);

    const admins = await listMembers({
      page: 1,
      limit: 100,
      search: COHORT,
      roles: ["admin"],
    });
    expect(admins.total).toBe(0);
  });

  test("memberStatus filter is evaluated on the derived status", async () => {
    const cases: Array<[MemberStatus[], string[]]> = [
      [["active"], ["active", "renewed"]],
      [["in_grace"], ["gracecancel", "pastduefresh"]],
      [["expired"], ["lapsedcancel", "pastdueold"]],
      [["trialing"], ["trial"]],
      [["paused"], ["paused"]],
      [["none"], ["nosub"]],
      [
        ["active", "trialing"],
        ["active", "renewed", "trial"],
      ],
    ];

    for (const [statuses, slugs] of cases) {
      const result = await listMembers({
        page: 1,
        limit: 100,
        search: COHORT,
        memberStatuses: statuses,
      });
      expect(result.total).toBe(slugs.length);
      const got = result.members.map((member) => member.username.replace(`${COHORT}-`, "")).sort();
      expect(got).toEqual([...slugs].sort());
    }
  });

  test("memberStatus filter pages correctly", async () => {
    const pageOne = await listMembers({
      page: 1,
      limit: 1,
      search: COHORT,
      memberStatuses: ["active"],
      sortBy: "username",
      sortOrder: "asc",
    });
    expect(pageOne.total).toBe(2);
    expect(pageOne.totalPages).toBe(2);
    expect(pageOne.members).toHaveLength(1);

    const pageTwo = await listMembers({
      page: 2,
      limit: 1,
      search: COHORT,
      memberStatuses: ["active"],
      sortBy: "username",
      sortOrder: "asc",
    });
    expect(pageTwo.members).toHaveLength(1);
    expect(pageTwo.members[0].id).not.toBe(pageOne.members[0].id);
  });
});
