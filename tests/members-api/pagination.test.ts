/**
 * B1 — Members API: listMembers pagination, limit clamping, sort order.
 * Part of the split members suite in tests/members-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { listMembers } from "@/lib/services/member.service";
import { createFixtures } from "./fixtures";

const { COHORT, seedCohort, cleanup } = createFixtures();

beforeAll(seedCohort);

afterAll(cleanup);

describe("listMembers — pagination", () => {
  test("limit/page slice the cohort without overlap or gaps", async () => {
    const pageOne = await listMembers({
      page: 1,
      limit: 4,
      search: COHORT,
      sortBy: "username",
      sortOrder: "asc",
    });
    const pageTwo = await listMembers({
      page: 2,
      limit: 4,
      search: COHORT,
      sortBy: "username",
      sortOrder: "asc",
    });
    const pageThree = await listMembers({
      page: 3,
      limit: 4,
      search: COHORT,
      sortBy: "username",
      sortOrder: "asc",
    });

    expect(pageOne.total).toBe(9);
    expect(pageOne.totalPages).toBe(3);
    expect(pageOne.members).toHaveLength(4);
    expect(pageTwo.members).toHaveLength(4);
    expect(pageThree.members).toHaveLength(1);

    const idsAcrossPages = [...pageOne.members, ...pageTwo.members, ...pageThree.members].map(
      (member) => member.id,
    );
    expect(new Set(idsAcrossPages).size).toBe(9);
  });

  test("limit clamps to 100 and invalid pagination falls back to defaults", async () => {
    const clamped = await listMembers({ page: 1, limit: 500, search: COHORT });
    expect(clamped.limit).toBe(100);

    const invalid = await listMembers({
      page: Number.NaN,
      limit: Number.NaN,
      search: COHORT,
    });
    expect(invalid.page).toBe(1);
    expect(invalid.limit).toBe(20);
  });

  test("sort direction changes ordering", async () => {
    const asc = await listMembers({
      page: 1,
      limit: 100,
      search: COHORT,
      sortBy: "username",
      sortOrder: "asc",
    });
    const desc = await listMembers({
      page: 1,
      limit: 100,
      search: COHORT,
      sortBy: "username",
      sortOrder: "desc",
    });
    expect(asc.members[0].id).toBe(desc.members[desc.members.length - 1].id);
  });
});
